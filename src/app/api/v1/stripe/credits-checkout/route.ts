import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { httpFetch } from "@/lib/http";
import { withIdempotency } from "@/lib/idempotency";
import { urlFor } from "@/lib/urls";

const Schema = z.object({
  creditProductId: z.string().uuid(),
});

/**
 * LEG3ND credit-pack checkout. Self-serve — any org member may buy credits
 * for themselves (no billing-admin capability), unlike the invoice checkout.
 * Records a pending `credit_orders` row, then creates a Stripe Checkout
 * session; the webhook flips the order to paid + credits the ledger.
 */
async function handler(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!env.STRIPE_SECRET_KEY) return apiError("service_unavailable", "STRIPE_SECRET_KEY is not configured");
    const supabase = (await createClient()) as unknown as LooseSupabase;

    const { data: product } = await supabase
      .from("credit_products")
      .select("id, name, credits, price_cents, currency, product_state")
      .eq("org_id", session.orgId)
      .eq("id", input.creditProductId)
      .eq("product_state", "active")
      .is("deleted_at", null)
      .maybeSingle();
    if (!product) return apiError("not_found", "Credit pack not found");

    const { data: order, error: orderErr } = await supabase
      .from("credit_orders")
      .insert({
        org_id: session.orgId,
        user_id: session.userId,
        credit_product_id: product.id,
        credits: product.credits,
        amount_cents: product.price_cents,
        currency: product.currency,
        order_state: "pending",
      })
      .select("id")
      .single();
    if (orderErr) return apiError("internal", orderErr.message);

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", String(product.currency).toLowerCase());
    form.set("line_items[0][price_data][product_data][name]", `${product.name} — ${product.credits} credits`);
    form.set("line_items[0][price_data][unit_amount]", String(product.price_cents));
    form.set("success_url", urlFor("legend", "/store?purchased=1"));
    form.set("cancel_url", urlFor("legend", "/store?cancelled=1"));
    form.set("metadata[credit_order_id]", order.id);
    form.set("metadata[org_id]", session.orgId);

    const res = await httpFetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      timeoutMs: 10000,
    });
    if (!res.ok) return apiError("internal", `Stripe checkout: ${await res.text()}`);
    const s = (await res.json()) as { id: string; url: string };

    await supabase.from("credit_orders").update({ stripe_session_id: s.id }).eq("id", order.id).eq("org_id", session.orgId);

    return apiOk({ checkoutUrl: s.url, sessionId: s.id });
  });
}

export const POST = withIdempotency(handler as (req: import("next/server").NextRequest) => Promise<Response>);
