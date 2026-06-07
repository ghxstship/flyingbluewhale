import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { WipReportPdf } from "@/lib/pdf/wip-report";
import { getRequestT } from "@/lib/i18n/request";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * GET /api/v1/wip/snapshot-pdf?date=YYYY-MM-DD
 *
 * Renders the org-wide WIP report for a given snapshot date (defaults to
 * the latest snapshot in the system). Returns a 302 to a 60s signed URL.
 */

const QuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "wip-pdf"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "WIP report rate limit reached");

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ date: url.searchParams.get("date") ?? undefined });
  if (!parsed.success) return apiError("bad_request", "Invalid date");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;

  // Resolve snapshot date — explicit query param or the most-recent snapshot
  // in the org.
  let snapshotDate = parsed.data.date ?? "";
  if (!snapshotDate) {
    const { data: latest } = await loose
      .from("wip_snapshots")
      .select("snapshot_date")
      .eq("org_id", session.orgId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    snapshotDate = (latest as { snapshot_date: string } | null)?.snapshot_date ?? new Date().toISOString().slice(0, 10);
  }

  const [{ data: rows }, { data: org }] = await Promise.all([
    loose
      .from("wip_snapshots")
      .select(
        "project_id, contract_amount, approved_change_orders, revised_contract_amount, costs_to_date, estimated_cost_to_complete, estimated_at_completion, percent_complete, earned_revenue, billed_to_date, over_under_billed, bonded, surety_carrier, project:project_id(name)",
      )
      .eq("org_id", session.orgId)
      .eq("snapshot_date", snapshotDate),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  type SnapshotRow = {
    project_id: string;
    contract_amount: number;
    approved_change_orders: number;
    revised_contract_amount: number;
    costs_to_date: number;
    estimated_cost_to_complete: number;
    estimated_at_completion: number;
    percent_complete: number;
    earned_revenue: number;
    billed_to_date: number;
    over_under_billed: number;
    bonded: boolean;
    surety_carrier: string | null;
    project: { name: string | null } | null;
  };
  const data = (rows ?? []) as unknown as SnapshotRow[];

  if (data.length === 0) {
    return apiError("not_found", `No WIP snapshots found for ${snapshotDate}`);
  }

  const brand = resolvePdfBrand({ org, client: null });
  const { t } = await getRequestT();

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <WipReportPdf
          brand={brand}
          t={t}
          snapshot_date={snapshotDate}
          org_name={(org as { name: string }).name}
          rows={data.map((r) => ({
            project_name: r.project?.name ?? "(unnamed project)",
            contract_amount: Number(r.contract_amount),
            approved_change_orders: Number(r.approved_change_orders),
            revised_contract_amount: Number(r.revised_contract_amount),
            costs_to_date: Number(r.costs_to_date),
            percent_complete: Number(r.percent_complete),
            earned_revenue: Number(r.earned_revenue),
            billed_to_date: Number(r.billed_to_date),
            over_under_billed: Number(r.over_under_billed),
            estimated_at_completion: Number(r.estimated_at_completion),
            estimated_cost_to_complete: Number(r.estimated_cost_to_complete),
            bonded: r.bonded,
            surety_carrier: r.surety_carrier,
          }))}
        />
      ),
      bucket: "proposals",
      path: `wip/${session.orgId}/${snapshotDate}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `wip-${snapshotDate}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("wip.pdf.compile_failed", {
      snapshot_date: snapshotDate,
      err: e instanceof Error ? e.message : String(e),
    });
    return apiError("internal", "Failed to render WIP report");
  }
}
