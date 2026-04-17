import { apiError, apiOk } from "@/lib/api";
import { env } from "@/lib/env";
import { verifyStripeWebhook } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

type StripeEventData = { object: { metadata?: Record<string, string>; id?: string; amount?: number; status?: string } };

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: { type: string; data: StripeEventData; id: string } | null = null;
  if (env.STRIPE_WEBHOOK_SECRET) {
    const v = await verifyStripeWebhook(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!v) return apiError("unauthorized", "Invalid Stripe signature");
    event = v as { type: string; data: StripeEventData; id: string };
  } else {
    // Dev mode: allow unsigned posts so manual testing still works.
    try { event = JSON.parse(rawBody) as { type: string; data: StripeEventData; id: string }; }
    catch { return apiError("bad_request", "Invalid JSON body"); }
  }

  try {
    let supabase: ReturnType<typeof createServiceClient> | null = null;
    try { supabase = createServiceClient(); } catch { supabase = null; }
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        if (pi?.id && supabase) {
          await supabase
            .from("invoices")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("stripe_payment_intent", pi.id);
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
