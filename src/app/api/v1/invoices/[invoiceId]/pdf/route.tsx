import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { InvoicePdf } from "@/lib/pdf/invoice";
import { log } from "@/lib/log";

/**
 * GET /api/v1/invoices/[invoiceId]/pdf
 *
 * Renders the invoice as a PDF and 302-redirects to a short-lived signed
 * URL in the `proposals` bucket (we reuse that bucket for all
 * client-facing financial docs rather than add a 6th). The PDF is
 * re-compiled on every hit today — H2 follow-up should add a
 * conditional-compile based on `invoices.updated_at`.
 *
 * RLS: `withAuth` + session.orgId scoping ensures a caller can only
 * download invoices for their own org. Portal client users reach this
 * route via `/p/[slug]/client/invoices` and already satisfy
 * `is_org_member` on the linked project → org chain.
 */

const ParamsSchema = z.object({ invoiceId: z.string().uuid() });

const dynamic = "force-dynamic";
export { dynamic };

export async function GET(_req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ invoiceId });
  if (!parsed.success) return apiError("bad_request", "Invalid invoice id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Single joined read — RLS on invoices enforces the org boundary.
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, org_id, project_id, client_id, number, title, currency, amount_cents, status, issued_at, due_at, paid_at, stripe_payment_intent, notes",
    )
    .eq("id", parsed.data.invoiceId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (error) return apiError("internal", error.message);
  if (!invoice) return apiError("not_found", "Invoice not found");

  const [{ data: lineItems }, { data: org }, { data: client }] = await Promise.all([
    supabase
      .from("invoice_line_items")
      .select("description, quantity, unit_price_cents, position")
      .eq("invoice_id", parsed.data.invoiceId)
      .order("position", { ascending: true }),
    supabase
      .from("orgs")
      .select("name, name_override, logo_url, branding")
      .eq("id", session.orgId)
      .maybeSingle(),
    invoice.client_id
      ? supabase
          .from("clients")
          .select("name")
          .eq("id", invoice.client_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: client ?? null });

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <InvoicePdf
          brand={brand}
          invoice={{
            number: invoice.number,
            title: invoice.title ?? null,
            currency: invoice.currency,
            amount_cents: Number(invoice.amount_cents),
            issued_at: invoice.issued_at ?? null,
            due_at: invoice.due_at ?? null,
            paid_at: invoice.paid_at ?? null,
            status: invoice.status ?? "issued",
            notes: invoice.notes ?? null,
          }}
          lineItems={(lineItems ?? []).map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unit_price_cents: Number(li.unit_price_cents),
          }))}
        />
      ),
      bucket: "proposals",
      path: `invoices/${session.orgId}/${invoice.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `invoice-${invoice.number}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("invoice.pdf.compile_failed", { invoice_id: invoice.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render invoice PDF");
  }
}
