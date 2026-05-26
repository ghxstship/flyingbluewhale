import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { AiaPayAppPdf } from "@/lib/pdf/aia-pay-app";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * GET /api/v1/pay-apps/[payAppId]/pdf
 *
 * Renders the pay-app as a faithful AIA G702 (Application & Certificate)
 * + G703 (Continuation Sheet) PDF and 302-redirects to a short-lived
 * signed URL. Re-compiles on every hit today; conditional-compile by
 * `payment_applications.updated_at` is a follow-up.
 *
 * RLS: org_id scoping enforced via the typed Supabase client + the
 * payment_applications RLS policies.
 */

const ParamsSchema = z.object({ payAppId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ payAppId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "pay-app-pdf"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Pay-app PDF rate limit reached");

  const { payAppId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ payAppId });
  if (!parsed.success) return apiError("bad_request", "Invalid pay-app id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  // LooseSupabase because the new round-40 columns (aia_form_version,
  // stored_materials_amount, retainage_pct, architect_certification_*) are
  // not yet in the typed client.
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: payApp } = await supabase
    .from("payment_applications")
    .select(
      "id, org_id, project_id, purchase_order_id, vendor_id, application_number, period_start, period_end, status, retention_pct, total_completed_cents, total_retention_cents, total_previously_paid_cents, total_due_cents, submitted_at, approved_at, paid_at, notes, aia_form_version, stored_materials_amount, prior_period_billed, architect_certification_at, architect_certification_by, requires_lien_waiver_from_subs",
    )
    .eq("id", parsed.data.payAppId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!payApp) return apiError("not_found", "Pay-app not found");
  type PayAppRow = {
    id: string;
    org_id: string;
    project_id: string;
    purchase_order_id: string;
    vendor_id: string | null;
    application_number: number;
    period_start: string;
    period_end: string;
    status: string;
    retention_pct: number;
    total_completed_cents: number;
    total_retention_cents: number;
    total_previously_paid_cents: number;
    total_due_cents: number;
    submitted_at: string | null;
    approved_at: string | null;
    paid_at: string | null;
    notes: string | null;
    aia_form_version: "1992" | "2017" | null;
    stored_materials_amount: number | null;
    prior_period_billed: number | null;
    architect_certification_at: string | null;
    architect_certification_by: string | null;
    requires_lien_waiver_from_subs: boolean;
  };
  const pa = payApp as PayAppRow;

  // Fetch related rows in parallel.
  const [
    { data: lines },
    { data: org },
    { data: project },
    { data: vendor },
    { data: po },
    { data: architect },
    { data: poLineItems },
  ] = await Promise.all([
    supabase
      .from("payment_application_lines")
      .select(
        "id, po_line_item_id, scheduled_value_cents, pct_complete_to_date, pct_complete_this_period, completed_to_date_cents, this_period_cents, retention_cents, notes",
      )
      .eq("payment_application_id", pa.id)
      .order("created_at", { ascending: true }),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
    supabase.from("projects").select("name, address").eq("id", pa.project_id).maybeSingle(),
    pa.vendor_id
      ? supabase.from("vendors").select("name, address").eq("id", pa.vendor_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string; address: string | null } | null }),
    supabase.from("purchase_orders").select("number, title").eq("id", pa.purchase_order_id).maybeSingle(),
    pa.architect_certification_by
      ? supabase.from("users").select("name, title").eq("id", pa.architect_certification_by).maybeSingle()
      : Promise.resolve({ data: null as { name: string | null; title: string | null } | null }),
    // PO line items so we can label each G703 row with the original SOV item.
    supabase.from("po_line_items").select("id, description, position").eq("purchase_order_id", pa.purchase_order_id),
  ]);

  if (!org) return apiError("internal", "Missing organization row");
  if (!project) return apiError("internal", "Missing project row");

  type PoLine = { id: string; description: string; position: number };
  type PayLine = {
    id: string;
    po_line_item_id: string;
    scheduled_value_cents: number;
    pct_complete_to_date: number;
    pct_complete_this_period: number;
    completed_to_date_cents: number;
    this_period_cents: number;
    retention_cents: number;
    notes: string | null;
  };

  const poLineMap = new Map<string, PoLine>();
  for (const l of (poLineItems ?? []) as PoLine[]) poLineMap.set(l.id, l);

  // Derive the revised contract sum from the pay-app lines (sum of
  // scheduled_value). Change orders = sum(scheduled_value) − original_contract.
  // Original contract is the PO total; if missing, fall back to sum.
  let contractSumCents = 0;
  const linesArr = (lines ?? []) as PayLine[];
  const totalScheduled = linesArr.reduce((s, l) => s + Number(l.scheduled_value_cents), 0);
  contractSumCents = totalScheduled;
  const changeOrdersCents = 0;
  const revisedContractCents = contractSumCents + changeOrdersCents;
  const storedCentsTotal = Number(pa.stored_materials_amount ?? 0) * 100; // header-level stored materials in dollars

  // brand resolver expects client row; PO-side contracts use vendor, so pass null.
  const brand = resolvePdfBrand({ org, client: null });

  // Build the G703 line array outside the JSX prop to keep the prop tree
  // shallow + the TS parser happy.
  const pdfLines = linesArr.map((l, i) => {
    const poLine = poLineMap.get(l.po_line_item_id);
    const completed = Number(l.completed_to_date_cents);
    const scheduled = Number(l.scheduled_value_cents);
    return {
      item_no: poLine?.position ?? i + 1,
      description: poLine?.description ?? l.notes ?? "(unnamed line)",
      scheduled_value_cents: scheduled,
      pct_complete_to_date: Number(l.pct_complete_to_date),
      pct_complete_this_period: Number(l.pct_complete_this_period),
      completed_to_date_cents: completed,
      this_period_cents: Number(l.this_period_cents),
      // Per-line stored materials not yet in the schema; header-level only.
      stored_materials_cents: 0,
      retention_cents: Number(l.retention_cents),
      balance_to_finish_cents: scheduled - completed,
    };
  });

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <AiaPayAppPdf
          brand={brand}
          payApp={{
            application_number: pa.application_number,
            aia_form_version: pa.aia_form_version,
            period_start: pa.period_start,
            period_end: pa.period_end,
            status: pa.status,
            submitted_at: pa.submitted_at,
            approved_at: pa.approved_at,
            paid_at: pa.paid_at,
            architect_certification_at: pa.architect_certification_at,
            notes: pa.notes,
            contract_sum_cents: contractSumCents,
            change_orders_cents: changeOrdersCents,
            revised_contract_sum_cents: revisedContractCents,
            total_completed_cents: Number(pa.total_completed_cents),
            stored_materials_cents: storedCentsTotal,
            retention_pct: Number(pa.retention_pct),
            total_retention_cents: Number(pa.total_retention_cents),
            total_previously_paid_cents: Number(pa.total_previously_paid_cents),
            total_due_cents: Number(pa.total_due_cents),
          }}
          project={{ name: project.name, address: project.address ?? null }}
          vendor={vendor ? { name: vendor.name, address: vendor.address ?? null } : null}
          purchaseOrder={po ? { number: po.number ?? null, title: po.title ?? null } : null}
          architectCertifiedBy={architect ? { name: architect.name ?? null, title: architect.title ?? null } : null}
          lines={pdfLines}
        />
      ),
      bucket: "proposals",
      path: `pay-apps/${session.orgId}/${pa.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `pay-app-${String(pa.application_number).padStart(4, "0")}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("pay_app.pdf.compile_failed", {
      pay_app_id: pa.id,
      err: e instanceof Error ? e.message : String(e),
    });
    return apiError("internal", "Failed to render pay-app PDF");
  }
}
