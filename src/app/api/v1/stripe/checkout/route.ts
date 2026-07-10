import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { httpFetch } from "@/lib/http";
import { withIdempotency } from "@/lib/idempotency";
import { urlFor } from "@/lib/urls";

const Schema = z.object({
  invoiceId: z.string().uuid(),
  // Portal payer flow (C-07): when set, success/cancel return to the client
  // portal's invoice list instead of the operator console.
  portalSlug: z
    .string()
    .regex(/^[a-z0-9-]{1,64}$/)
    .optional(),
});

async function handler(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    // Creating a Stripe checkout is a billing action — controller/owner/admin
    // only... with one carve-out: a payer settling an invoice issued TO them.
    // Without `invoices:write`, the caller falls into payer mode — they can
    // only start checkout on an RLS-readable, open, outbound (AR) invoice.
    // Gate BEFORE the Stripe env check so an unprivileged caller never gets
    // to probe whether secrets are configured on invoices they can't see.
    const denial = assertCapability(session, "invoices:write");
    const payerMode = denial !== null;
    if (!env.STRIPE_SECRET_KEY) return apiError("service_unavailable", "STRIPE_SECRET_KEY is not configured");
    const supabase = await createClient();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("org_id", session.orgId)
      .eq("id", input.invoiceId)
      .maybeSingle();
    if (!invoice) return apiError("not_found", "Invoice not found");
    if (payerMode && (invoice.source !== "ar" || !["sent", "overdue"].includes(invoice.invoice_state))) {
      // Payers can settle open receivables only — drafts, AP payables, and
      // settled invoices still require the billing capability.
      return denial!;
    }

    const returnBase = input.portalSlug
      ? { shell: "portal" as const, path: `/${input.portalSlug}/client/invoices` }
      : { shell: "platform" as const, path: `/finance/invoices/${invoice.id}` };

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", invoice.currency.toLowerCase());
    form.set("line_items[0][price_data][product_data][name]", `Invoice ${invoice.number}`);
    form.set("line_items[0][price_data][unit_amount]", invoice.amount_cents.toString());
    form.set("success_url", urlFor(returnBase.shell, `${returnBase.path}?paid=1`));
    form.set("cancel_url", urlFor(returnBase.shell, `${returnBase.path}?cancelled=1`));
    form.set("metadata[invoice_id]", invoice.id);

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
    const s = (await res.json()) as { id: string; url: string; payment_intent?: string };

    if (s.payment_intent && !payerMode) {
      // (Payer mode skips this write: the invoice is already sent/overdue and
      // the payer's RLS band couldn't update it anyway — the webhook records
      // the payment intent when the payment lands.)
      // Conditional update — never regress an already-paid invoice back to
      // "sent". The webhook handler may have flipped it to paid between
      // our checkout-session create and this update; without the guard we
      // would silently un-pay it on the next checkout link the operator
      // generates.
      await supabase
        .from("invoices")
        .update({ stripe_payment_intent: s.payment_intent, invoice_state: "sent" })
        .eq("id", invoice.id)
        .eq("org_id", session.orgId)
        .neq("invoice_state", "paid");
    }

    return apiOk({ checkoutUrl: s.url, sessionId: s.id });
  });
}

export const POST = withIdempotency(handler as (req: import("next/server").NextRequest) => Promise<Response>);
