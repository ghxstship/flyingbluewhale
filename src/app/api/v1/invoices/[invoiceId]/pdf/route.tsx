import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { InvoicePdf } from "@/lib/pdf/invoice";
import { loadInvoiceArtifact } from "@/lib/documents/sources/invoice";
import { getRequestT } from "@/lib/i18n/request";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

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

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ invoiceId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "invoice-pdf"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Invoice PDF rate limit reached");
  const { invoiceId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ invoiceId });
  if (!parsed.success) return apiError("bad_request", "Invalid invoice id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Shared loader — the same fetch the kit documents resolver uses, so the PDF
  // and the `/api/v1/documents/invoice` HTML artifact can't drift. RLS on
  // invoices enforces the org boundary.
  const loaded = await loadInvoiceArtifact(supabase, session.orgId, parsed.data.invoiceId);
  if (!loaded) return apiError("not_found", "Invoice not found");
  const { invoice, lineItems, org, client, project } = loaded;

  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client, project });
  const { t } = await getRequestT();

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <InvoicePdf
          brand={brand}
          t={t}
          invoice={{
            number: invoice.number,
            title: invoice.title ?? null,
            currency: invoice.currency ?? "USD",
            amount_cents: Number(invoice.amount_cents),
            issued_at: invoice.issued_at ?? null,
            due_at: invoice.due_at ?? null,
            paid_at: invoice.paid_at ?? null,
            status: invoice.invoice_state ?? "issued",
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
    log.error("invoice.pdf.compile_failed", {
      invoice_id: invoice.id,
      err: e instanceof Error ? e.message : String(e),
    });
    return apiError("internal", "Failed to render invoice PDF");
  }
}
