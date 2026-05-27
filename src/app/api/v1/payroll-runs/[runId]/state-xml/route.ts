import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { renderCertifiedPayrollXml } from "@/lib/payroll/state-xml";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const ParamsSchema = z.object({ runId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "payroll-xml"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Payroll XML rate limit reached");

  const { runId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ runId });
  if (!parsed.success) return apiError("bad_request", "Invalid payroll-run id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: run } = await supabase
    .from("payroll_runs")
    .select(
      "id, project_id, week_ending, pay_period_start, pay_period_end, agency_report_type, total_gross, total_fringes",
    )
    .eq("id", parsed.data.runId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  type RunRow = {
    id: string;
    project_id: string;
    week_ending: string;
    pay_period_start: string;
    pay_period_end: string;
    agency_report_type: "wh_347" | "ca_dir" | "ny_pwa" | "wa_lni" | "state_other" | "none";
    total_gross: number;
    total_fringes: number;
  };
  const r = run as RunRow | null;
  if (!r) return apiError("not_found", "Payroll run not found");
  if (r.agency_report_type !== "ca_dir" && r.agency_report_type !== "ny_pwa" && r.agency_report_type !== "wa_lni") {
    return apiError(
      "bad_request",
      `Agency report type "${r.agency_report_type}" is not a state XML format. WH-347 uses /pdf, not /state-xml.`,
    );
  }

  const [{ data: lines }, { data: org }, { data: project }] = await Promise.all([
    supabase
      .from("payroll_run_lines")
      .select(
        "worker_name, user_id, ssn_last_4, classification, hours_by_day, hours_st, hours_ot, hours_dt, rate_st, rate_ot, rate_dt, gross, fringes_cash, fringes_to_plans, deductions, net",
      )
      .eq("payroll_run_id", r.id),
    supabase.from("orgs").select("name").eq("id", session.orgId).maybeSingle(),
    supabase.from("projects").select("name, address").eq("id", r.project_id).maybeSingle(),
  ]);

  if (!org) return apiError("internal", "Missing organization row");
  if (!project) return apiError("internal", "Missing project row");

  type LineRow = {
    worker_name: string | null;
    user_id: string | null;
    ssn_last_4: string | null;
    classification: string;
    hours_by_day: number[];
    hours_st: number;
    hours_ot: number;
    hours_dt: number;
    rate_st: number;
    rate_ot: number | null;
    rate_dt: number | null;
    gross: number;
    fringes_cash: number;
    fringes_to_plans: number;
    deductions: Record<string, number> | null;
    net: number;
  };
  const linesArr = (lines ?? []) as LineRow[];
  const proj = project as { name: string; address: string | null };

  // Hydrate worker_name from user_id where missing.
  const missingIds = linesArr.filter((l) => !l.worker_name && l.user_id).map((l) => l.user_id as string);
  const nameMap = new Map<string, string>();
  if (missingIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", missingIds);
    for (const u of (users ?? []) as { id: string; name: string | null; email: string | null }[]) {
      nameMap.set(u.id, u.name ?? u.email ?? "Worker");
    }
  }

  let xml: string;
  try {
    xml = renderCertifiedPayrollXml({
      agency: r.agency_report_type,
      org_name: (org as { name: string }).name,
      contractor: { name: (org as { name: string }).name },
      project: { name: proj.name, address: proj.address ?? undefined },
      payroll: {
        week_ending: r.week_ending,
        pay_period_start: r.pay_period_start,
        pay_period_end: r.pay_period_end,
      },
      workers: linesArr.map((l) => ({
        full_name: l.worker_name ?? (l.user_id ? (nameMap.get(l.user_id) ?? "Worker") : "Worker"),
        ssn_last_4: l.ssn_last_4,
        classification: l.classification,
        hours_by_day: Array.isArray(l.hours_by_day) ? l.hours_by_day.map(Number) : [0, 0, 0, 0, 0, 0, 0],
        hours_st: Number(l.hours_st),
        hours_ot: Number(l.hours_ot),
        hours_dt: Number(l.hours_dt),
        rate_st: Number(l.rate_st),
        rate_ot: l.rate_ot != null ? Number(l.rate_ot) : undefined,
        rate_dt: l.rate_dt != null ? Number(l.rate_dt) : undefined,
        gross: Number(l.gross),
        fringes_cash: Number(l.fringes_cash),
        fringes_to_plans: Number(l.fringes_to_plans),
        deductions: (l.deductions ?? {}) as Record<string, number>,
        net: Number(l.net),
      })),
    });
  } catch (e) {
    log.error("payroll.state_xml_failed", { err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Could not render state XML");
  }

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="certified-payroll-${r.agency_report_type}-${r.week_ending}.xml"`,
    },
  });
}
