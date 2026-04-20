import { apiError, apiOk } from "@/lib/api";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { verifyStripeWebhook } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

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
    try { event = JSON.parse(rawBody) as StripeEvent; }
    catch { return apiError("bad_request", "Invalid JSON body"); }
  }

  // Replay protection (H2-05 / IK-028). Stripe redelivers until it gets a 2xx,
  // and a single delivery may be queued-and-retried from multiple regions.
  // Insert the event id first; ON CONFLICT DO NOTHING means the second call
  // returns zero rows and we acknowledge without re-running side effects.
  try {
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
    try { supabase = createServiceClient(); } catch { supabase = null; }
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
      default:
        break;
    }
    return apiOk({ received: true, type: event.type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook handler failed";
    return apiError("internal", msg);
  }
}
