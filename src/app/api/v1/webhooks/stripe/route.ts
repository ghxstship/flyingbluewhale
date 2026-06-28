import { apiError, apiOk } from "@/lib/api";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { verifyStripeWebhook } from "@/lib/stripe";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

type StripeEventData = {
  object: { metadata?: Record<string, string>; id?: string; amount?: number; invoice_state?: string };
};
type StripeEvent = { type: string; data: StripeEventData; id: string; livemode?: boolean };

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: StripeEvent | null = null;
  if (env.STRIPE_WEBHOOK_SECRET) {
    const v = await verifyStripeWebhook(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!v) return apiError("unauthorized", "Invalid Stripe signature");
    event = v as StripeEvent;
  } else if (process.env.NODE_ENV === "production") {
    // Fail CLOSED in production: a missing STRIPE_WEBHOOK_SECRET must never
    // turn this into an open mutation endpoint (forged payment_intent.succeeded
    // would flip invoices to paid). 503 makes the misconfiguration loud —
    // Stripe retries until the env var is fixed.
    log.error("stripe.webhook.secret_missing_in_production", {});
    return apiError("service_unavailable", "Webhook signature verification is not configured.");
  } else {
    // Dev mode only: allow unsigned posts so manual testing still works.
    try {
      event = JSON.parse(rawBody) as StripeEvent;
    } catch {
      return apiError("bad_request", "Invalid JSON body");
    }
  }

  // Replay protection (H2-05 / IK-028). Stripe redelivers until it gets a 2xx,
  // and a single delivery may be queued-and-retried from multiple regions.
  // Insert the event id first; ON CONFLICT DO NOTHING means the second call
  // returns zero rows and we acknowledge without re-running side effects.
  try {
    if (!isServiceClientAvailable()) {
      return apiError(
        "service_unavailable",
        "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
      );
    }
    const svc = createServiceClient();
    const { data: inserted, error: insErr } = await svc
      .from("stripe_events")
      .insert({
        event_id: event.id,
        type: event.type,
        livemode: event.livemode ?? false,
      })
      .select("event_id")
      .maybeSingle();
    if (insErr && !/duplicate key/i.test(insErr.message)) {
      // If the dedup write itself fails, log and continue — we'd rather
      // risk rare double-processing than drop a real delivery.
      log.warn("stripe.webhook.dedup_write_failed", { event_id: event.id, err: insErr.message });
    }
    if (!inserted) {
      log.info("stripe.webhook.replay", { event_id: event.id, type: event.type });
      return apiOk({ received: true, type: event.type, replay: true });
    }
  } catch (e) {
    // Service client unavailable (env missing in dev). Fall through — no
    // dedup in that mode, which is acceptable for local manual testing.
    log.warn("stripe.webhook.dedup_unavailable", { err: e instanceof Error ? e.message : String(e) });
  }

  try {
    let supabase: ReturnType<typeof createServiceClient> | null = null;
    try {
      supabase = createServiceClient();
    } catch {
      supabase = null;
    }
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        if (pi?.id && supabase) {
          // Conditional update: only mark paid if the invoice is still
          // unpaid. Stripe redelivers events on 2xx delays + a manual
          // /studio mark-paid can race the webhook; without this guard
          // the second update silently runs and notify() double-fires
          // (users get two "Invoice paid" notifications). The outer
          // stripe_events dedup catches identical event_id replays but
          // not these distinct-event-same-state cases.
          const { data: paid } = await supabase
            .from("invoices")
            .update({ invoice_state: "paid", paid_at: new Date().toISOString() })
            .eq("stripe_payment_intent", pi.id)
            .neq("invoice_state", "paid")
            .select("id, org_id, number, title, amount_cents, created_by")
            .maybeSingle();
          if (paid) {
            const { notify } = await import("@/lib/notify");
            await notify({
              orgId: paid.org_id,
              userId: paid.created_by,
              eventType: "invoice.paid",
              title: `Invoice ${paid.number ?? paid.id.slice(0, 8)} paid`,
              body: paid.title ?? undefined,
              href: `/studio/finance/invoices/${paid.id}`,
              data: { invoiceId: paid.id, amountCents: paid.amount_cents, stripePaymentIntent: pi.id },
            });
          }
        }
        break;
      }
      case "checkout.session.completed": {
        // GVTEWAY store checkout — convert the cart + decrement inventory.
        // Idempotent: the conditional cart_state flip only succeeds once, so
        // Stripe redeliveries never double-decrement.
        const obj = event.data.object as {
          metadata?: Record<string, string>;
          id?: string;
          payment_intent?: string;
          amount_total?: number;
          currency?: string;
        };

        // GVTEWAY first-party box-office checkout — fulfill the ticket order.
        // Idempotent: skip if the order is already paid OR tickets already
        // exist for it, so Stripe redeliveries never double-issue.
        const orderId = obj?.metadata?.order_id;
        if (orderId && supabase) {
          await fulfillBoxOfficeOrder(supabase, {
            orderId,
            eventListingId: obj?.metadata?.event_listing_id,
            itemsMeta: obj?.metadata?.items,
            amountTotal: obj?.amount_total,
            currency: obj?.currency,
            processorRef: obj?.payment_intent ?? obj?.id,
            eventId: event.id,
          });
        }

        // LEG3ND credit-pack checkout — fulfill the order + credit the ledger.
        // Idempotent: the conditional order_state flip only succeeds once, so
        // Stripe redeliveries never double-credit.
        const creditOrderId = obj?.metadata?.credit_order_id;
        if (creditOrderId && supabase) {
          // Atomic + idempotent: fulfill_credit_order validates the order is
          // unfulfilled, grants the ledger credit (keyed on the order so a
          // redelivery can't double-credit), and flips to fulfilled — all in
          // one transaction. Replaces the prior three-write sequence that lost
          // the customer's credit if it crashed between the paid-flip and the
          // ledger insert.
          const { data: result, error: fErr } = await supabase.rpc("fulfill_credit_order", {
            p_order_id: creditOrderId,
            p_event_id: event.id,
          });
          if (fErr) {
            log.warn("stripe.webhook.credit_fulfill_failed", { event_id: event.id, err: fErr.message });
          } else {
            log.info("stripe.webhook.credit_fulfilled", { event_id: event.id, result });
          }
        }

        const cartId = obj?.metadata?.store_cart_id;
        if (cartId && supabase) {
          // Atomic + idempotent: convert_store_cart flips the cart (only once)
          // and decrements every line item's inventory in one transaction with
          // a non-negative floor. Replaces the per-item read-modify-write loop
          // (lost-update race + partial-decrement on mid-loop crash).
          const { data: result, error: cErr } = await supabase.rpc("convert_store_cart", {
            p_cart_id: cartId,
            p_event_id: event.id,
          });
          if (cErr) {
            log.warn("stripe.webhook.cart_convert_failed", { event_id: event.id, err: cErr.message });
          } else {
            log.info("stripe.webhook.cart_converted", { event_id: event.id, result });
          }
        }
        break;
      }
      case "invoice.payment_succeeded":
      case "account.updated":
      case "payout.paid":
        break;
      // LDP §8 Subscription Lifecycle — Stripe-driven transitions.
      // Each branch advances the subscription state and writes a
      // subscription_state_transitions row keyed off the Stripe event id.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.paid":
      case "invoice.payment_failed": {
        const obj = event.data.object as { id?: string; subscription?: string; invoice_state?: string };
        const stripeSubId = obj?.subscription ?? obj?.id;
        if (stripeSubId && supabase) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id, org_id, state")
            .eq("stripe_subscription_id", stripeSubId)
            .maybeSingle();
          if (sub) {
            const targetState = mapStripeEventToSubscriptionState(event.type, obj?.invoice_state, sub.state);
            if (targetState && targetState !== sub.state) {
              const { transitionSubscription } = await import("@/lib/subscriptions");
              const result = await transitionSubscription({
                orgId: sub.org_id,
                subscriptionId: sub.id,
                to: targetState,
                reason: `Stripe ${event.type}`,
                stripeEventId: event.id,
                // No session in webhook context — the subscriptions table RLS
                // requires has_org_role for SELECT/UPDATE, so the transition
                // MUST run under the service client or it silently no-ops.
                db: supabase,
              });
              if (!result.ok) {
                log.warn("stripe.webhook.subscription_transition_failed", {
                  event_id: event.id,
                  type: event.type,
                  err: result.error,
                });
              }
            }
          }
        }
        break;
      }
      default:
        break;
    }
    return apiOk({ received: true, type: event.type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook handler failed";
    return apiError("internal", msg);
  }
}

type ServiceClient = ReturnType<typeof createServiceClient>;

type BoxOfficeFulfillment = {
  orderId: string;
  eventListingId: string | undefined;
  itemsMeta: string | undefined;
  amountTotal: number | undefined;
  currency: string | undefined;
  processorRef: string | undefined;
  eventId: string;
};

/**
 * Fulfill a GVTEWAY first-party box-office ticket order on
 * checkout.session.completed.
 *
 * Idempotency (two read-side guards, either one short-circuits a redelivery):
 *   1. The order must still be unpaid. If it is already 'paid', return.
 *   2. No event_tickets may already exist for the order_id. If any do, a prior
 *      delivery already issued them, so return.
 * Both are checked before any write, so Stripe at-least-once delivery can never
 * double-charge the ledger or double-issue passes. The final order flip is also
 * conditional (.neq order_state 'paid') as a third backstop against a racing
 * concurrent redelivery.
 */
async function fulfillBoxOfficeOrder(supabase: ServiceClient, f: BoxOfficeFulfillment): Promise<void> {
  const { data: order } = await supabase
    .from("revenue_orders")
    .select("id, org_id, currency, total_cents, order_state, event_listing_id, buyer_name, buyer_email")
    .eq("id", f.orderId)
    .maybeSingle();
  if (!order) {
    log.warn("stripe.webhook.box_office_order_missing", { event_id: f.eventId, order_id: f.orderId });
    return;
  }

  // Guard 1: already fulfilled.
  if (order.order_state === "paid") {
    log.info("stripe.webhook.box_office_replay", { event_id: f.eventId, order_id: f.orderId, reason: "paid" });
    return;
  }

  // Guard 2: tickets already issued for this order (covers a crash between the
  // ticket inserts and the order flip on a prior delivery).
  const { count: existingTickets } = await supabase
    .from("event_tickets")
    .select("id", { count: "exact", head: true })
    .eq("order_id", f.orderId);
  if ((existingTickets ?? 0) > 0) {
    log.info("stripe.webhook.box_office_replay", { event_id: f.eventId, order_id: f.orderId, reason: "tickets_exist" });
    return;
  }

  const listingId = order.event_listing_id ?? f.eventListingId ?? null;
  if (!listingId) {
    log.warn("stripe.webhook.box_office_no_listing", { event_id: f.eventId, order_id: f.orderId });
    return;
  }
  const currency = (f.currency ?? order.currency ?? "usd").toLowerCase();

  // Parse "<typeId:qty,...>" into per-type counts.
  const items = (f.itemsMeta ?? "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [typeId = "", qtyRaw = ""] = pair.split(":");
      const qty = Number.parseInt(qtyRaw, 10);
      return { typeId, qty: Number.isFinite(qty) ? Math.max(0, qty) : 0 };
    })
    .filter((i) => i.typeId && i.qty > 0);

  if (items.length === 0) {
    log.warn("stripe.webhook.box_office_no_items", { event_id: f.eventId, order_id: f.orderId });
  }

  // Issue one event_tickets row per quantity per ticket type.
  const ticketRows = items.flatMap((item) =>
    Array.from({ length: item.qty }, () => ({
      org_id: order.org_id,
      event_listing_id: listingId,
      ticket_type_id: item.typeId,
      order_id: f.orderId,
      holder_name: order.buyer_name,
      holder_email: order.buyer_email,
      code: `tix_${crypto.randomUUID()}`,
      ticket_state: "issued",
    })),
  );
  if (ticketRows.length > 0) {
    const { error: tErr } = await supabase.from("event_tickets").insert(ticketRows);
    if (tErr) {
      log.warn("stripe.webhook.box_office_ticket_insert_failed", { event_id: f.eventId, err: tErr.message });
      return; // leave the order pending so a Stripe retry can re-issue cleanly
    }
  }

  // Bump quantity_sold per ticket type by the issued qty.
  for (const item of items) {
    const { data: tt } = await supabase
      .from("event_ticket_types")
      .select("quantity_sold")
      .eq("id", item.typeId)
      .maybeSingle();
    if (tt) {
      await supabase
        .from("event_ticket_types")
        .update({ quantity_sold: (tt.quantity_sold ?? 0) + item.qty })
        .eq("id", item.typeId);
    }
  }

  // Ledger transaction — charge succeeded.
  const { error: txErr } = await supabase.from("revenue_transactions").insert({
    org_id: order.org_id,
    order_id: f.orderId,
    txn_kind: "charge",
    txn_state: "succeeded",
    amount_cents: f.amountTotal ?? order.total_cents,
    currency,
    processor: "stripe",
    processor_ref: f.processorRef ?? null,
  });
  if (txErr) {
    log.warn("stripe.webhook.box_office_txn_insert_failed", { event_id: f.eventId, err: txErr.message });
  }

  // Flip the order to paid LAST and conditionally, so a concurrent redelivery
  // that slipped past the read guards can't re-run the side effects.
  const { data: flipped } = await supabase
    .from("revenue_orders")
    .update({ order_state: "paid" })
    .eq("id", f.orderId)
    .neq("order_state", "paid")
    .select("id")
    .maybeSingle();
  log.info("stripe.webhook.box_office_fulfilled", {
    event_id: f.eventId,
    order_id: f.orderId,
    tickets_issued: ticketRows.length,
    flipped: Boolean(flipped),
  });
}

/**
 * Map a Stripe event + payload status to an LDP §8 subscription_state.
 * Returns null if the event doesn't imply a transition.
 *
 * Mapping per LDP §8 graph:
 *   customer.subscription.created → TRIAL or ACTIVE (depending on payload status)
 *   customer.subscription.updated → ACTIVE/RENEWED/LAPSED based on Stripe sub status
 *   customer.subscription.deleted → CHURNED
 *   invoice.paid                   → RENEWED (recurring renewal succeeded)
 *   invoice.payment_failed         → LAPSED
 */
function mapStripeEventToSubscriptionState(
  type: string,
  stripeStatus: string | undefined,
  current: string,
): "PROSPECT" | "TRIAL" | "ACTIVE" | "RENEWED" | "LAPSED" | "REACTIVATED" | "CHURNED" | "ARCHIVED" | null {
  if (type === "customer.subscription.deleted") return "CHURNED";
  if (type === "invoice.payment_failed") return "LAPSED";
  if (type === "invoice.paid") {
    if (current === "ACTIVE" || current === "RENEWED") return "RENEWED";
    if (current === "LAPSED") return "REACTIVATED";
    return "ACTIVE";
  }
  if (type === "customer.subscription.created") {
    return stripeStatus === "trialing" ? "TRIAL" : "ACTIVE";
  }
  if (type === "customer.subscription.updated") {
    if (stripeStatus === "active") return current === "LAPSED" ? "REACTIVATED" : "ACTIVE";
    if (stripeStatus === "trialing") return "TRIAL";
    if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "LAPSED";
    if (stripeStatus === "canceled" || stripeStatus === "incomplete_expired") return "CHURNED";
  }
  return null;
}
