import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { httpFetch } from "@/lib/http";
import { withIdempotency } from "@/lib/idempotency";

const Schema = z.object({
  invoiceId: z.string().uuid(),
});

async function handler(req: Request) {
  if (!env.STRIPE_SECRET_KEY) return apiError("internal", "STRIPE_SECRET_KEY is not configured");
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("org_id", session.orgId)
      .eq("id", input.invoiceId)
      .maybeSingle();
    if (!invoice) return apiError("not_found", "Invoice not found");

    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", invoice.currency.toLowerCase());
    form.set("line_items[0][price_data][product_data][name]", `Invoice ${invoice.number}`);
    form.set("line_items[0][price_data][unit_amount]", invoice.amount_cents.toString());
    form.set("success_url", `${appUrl}/console/finance/invoices/${invoice.id}?paid=1`);
    form.set("cancel_url", `${appUrl}/console/finance/invoices/${invoice.id}?cancelled=1`);
    form.set("metadata[invoice_id]", invoice.id);

    const res = await httpFetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      timeoutMs: 10000,
    });
    if (!res.ok) return apiError("internal", `Stripe checkout: ${await res.text()}`);
    const s = (await res.json()) as { id: string; url: string; payment_intent?: string };

    if (s.payment_intent) {
      await supabase
        .from("invoices")
        .update({ stripe_payment_intent: s.payment_intent, status: "sent" })
        .eq("id", invoice.id)
        .eq("org_id", session.orgId);
    }

    return apiOk({ checkoutUrl: s.url, sessionId: s.id });
  });
}

export const POST = withIdempotency(handler as (req: import("next/server").NextRequest) => Promise<Response>);
