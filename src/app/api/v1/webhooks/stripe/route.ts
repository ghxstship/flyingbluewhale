import { apiError, apiOk } from "@/lib/api";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { verifyStripeWebhook } from "@/lib/stripe";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

type StripeEventData = { object: { metadata?: Record<string, string>; id?: string; amount?: number; status?: string } };
type StripeEvent = { type: string; data: StripeEventData; id: string; livemode?: boolean };

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: StripeEvent | null = null;
  if (env.STRIPE_WEBHOOK_SECRET) {
    const v = await verifyStripeWebhook(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!v) return apiError("unauthorized", "Invalid Stripe signature");
    event = v as StripeEvent;
  } else {
    // Dev mode: allow unsigned posts so manual testing still works.
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
          const { data: paid } = await supabase
            .from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("stripe_payment_intent", pi.id)
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
              href: `/console/finance/invoices/${paid.id}`,
              data: { invoiceId: paid.id, amountCents: paid.amount_cents, stripePaymentIntent: pi.id },
            });
          }
        }
        break;
      }
      case "checkout.session.completed":
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
        const obj = event.data.object as { id?: string; subscription?: string; status?: string };
        const stripeSubId = obj?.subscription ?? obj?.id;
        if (stripeSubId && supabase) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id, org_id, state")
            .eq("stripe_subscription_id", stripeSubId)
            .maybeSingle();
          if (sub) {
            const targetState = mapStripeEventToSubscriptionState(event.type, obj?.status, sub.state);
            if (targetState && targetState !== sub.state) {
              const { transitionSubscription } = await import("@/lib/subscriptions");
              const result = await transitionSubscription({
                orgId: sub.org_id,
                subscriptionId: sub.id,
                to: targetState,
                reason: `Stripe ${event.type}`,
                stripeEventId: event.id,
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
