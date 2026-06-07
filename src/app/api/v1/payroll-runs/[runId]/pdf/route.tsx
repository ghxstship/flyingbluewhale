import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { WH347Pdf } from "@/lib/pdf/certified-payroll";
import { getRequestT } from "@/lib/i18n/request";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const ParamsSchema = z.object({ runId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "payroll-pdf"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Payroll PDF rate limit reached");

  const { runId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ runId });
  if (!parsed.success) return apiError("bad_request", "Invalid payroll-run id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;

  const { data: run } = await loose
    .from("payroll_runs")
    .select(
      "id, org_id, project_id, week_ending, pay_period_start, pay_period_end, state_code, agency_report_type, certified_at, submitted_at, total_hours, total_gross, total_fringes, notes, certified_by",
    )
    .eq("id", parsed.data.runId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!run) return apiError("not_found", "Payroll run not found");

  type RunRow = {
    id: string;
    project_id: string;
    week_ending: string;
    pay_period_start: string;
    pay_period_end: string;
    state_code: string | null;
    agency_report_type: "wh_347" | "ca_dir" | "ny_pwa" | "wa_lni" | "state_other" | "none";
    certified_at: string | null;
    submitted_at: string | null;
    total_hours: number;
    total_gross: number;
    total_fringes: number;
    notes: string | null;
    certified_by: string | null;
  };
  const r = run as RunRow;

  const [{ data: lines }, { data: org }, { data: project }, { data: certifier }] = await Promise.all([
    loose
      .from("payroll_run_lines")
      .select(
        "worker_name, user_id, ssn_last_4, classification, hours_by_day, hours_st, hours_ot, hours_dt, rate_st, gross, fringes_cash, fringes_to_plans, deductions, net",
      )
      .eq("payroll_run_id", r.id)
      .order("classification", { ascending: true }),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
    loose.from("projects").select("name, address").eq("id", r.project_id).maybeSingle(),
    r.certified_by
      ? loose.from("users").select("name, title").eq("id", r.certified_by).maybeSingle()
      : Promise.resolve({ data: null as { name: string | null; title: string | null } | null }),
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
    gross: number;
    fringes_cash: number;
    fringes_to_plans: number;
    deductions: Record<string, number> | null;
    net: number;
  };
  const linesArr = (lines ?? []) as LineRow[];

  const brand = resolvePdfBrand({ org, client: null });
  const { t } = await getRequestT();
  const proj = project as { name: string; address: string | null };

  // Resolve worker_name when only user_id present.
  const missingUserIds = linesArr.filter((l) => !l.worker_name && l.user_id).map((l) => l.user_id as string);
  let userNameMap = new Map<string, string>();
  if (missingUserIds.length > 0) {
    const { data: users } = await loose.from("users").select("id, name, email").in("id", missingUserIds);
    for (const u of (users ?? []) as { id: string; name: string | null; email: string | null }[]) {
      userNameMap.set(u.id, u.name ?? u.email ?? "Worker");
    }
  }

  const pdfLines = linesArr.map((l) => ({
    worker_name: l.worker_name ?? (l.user_id ? (userNameMap.get(l.user_id) ?? "Worker") : "Worker"),
    ssn_last_4: l.ssn_last_4,
    classification: l.classification,
    hours_by_day: Array.isArray(l.hours_by_day) ? l.hours_by_day.map(Number) : [0, 0, 0, 0, 0, 0, 0],
    hours_st: Number(l.hours_st),
    hours_ot: Number(l.hours_ot),
    hours_dt: Number(l.hours_dt),
    rate_st: Number(l.rate_st),
    gross: Number(l.gross),
    fringes_cash: Number(l.fringes_cash),
    fringes_to_plans: Number(l.fringes_to_plans),
    deductions: (l.deductions ?? {}) as Record<string, number>,
    net: Number(l.net),
  }));

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <WH347Pdf
          brand={brand}
          t={t}
          payroll={{
            week_ending: r.week_ending,
            pay_period_start: r.pay_period_start,
            pay_period_end: r.pay_period_end,
            state_code: r.state_code,
            agency_report_type: r.agency_report_type,
            submitted_at: r.submitted_at,
            certified_at: r.certified_at,
            total_hours: Number(r.total_hours),
            total_gross: Number(r.total_gross),
            total_fringes: Number(r.total_fringes),
            notes: r.notes,
          }}
          project={{ name: proj.name, address: proj.address ?? null }}
          contractor={{ name: (org as { name: string }).name, address: null }}
          certifiedBy={certifier ? { name: certifier.name ?? null, title: certifier.title ?? null } : null}
          lines={pdfLines}
        />
      ),
      bucket: "proposals",
      path: `payroll-runs/${session.orgId}/${r.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `certified-payroll-${r.week_ending}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("payroll.pdf.compile_failed", {
      payroll_run_id: r.id,
      err: e instanceof Error ? e.message : String(e),
    });
    return apiError("internal", "Failed to render certified-payroll PDF");
  }
}
