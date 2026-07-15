import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ExportLine, PayrollRunBundle } from "./providers/types";

type Db = Awaited<ReturnType<typeof createClient>>;

/**
 * Read a payroll run into the provider-agnostic bundle every driver
 * consumes. This is the ONE read a driver gets — no driver queries the
 * database itself, which is what keeps "a first-party connector is an
 * ordinary client" true rather than aspirational.
 *
 * `hr_worker_links` is resolved per provider, so the same run exports with
 * ADP ids for ADP and Gusto ids for Gusto. A worker with no link surfaces
 * as `externalEmployeeId: null` and `validateBundle` refuses the export —
 * deliberately, rather than guessing an id or silently dropping the line.
 */
export async function loadPayrollRunBundle(
  supabase: Db,
  orgId: string,
  runId: string,
  provider: string,
): Promise<PayrollRunBundle | null> {
  const { data: run } = await supabase
    .from("payroll_runs")
    .select("id, org_id, project_id, week_ending, pay_period_start, pay_period_end")
    .eq("id", runId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!run) return null;

  const [{ data: org }, { data: project }, { data: lineRows }] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    run.project_id
      ? supabase.from("projects").select("name").eq("id", run.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("payroll_run_lines")
      .select("id, user_id, worker_name, classification, hours_st, hours_ot, hours_dt, earning_code_id")
      .eq("org_id", orgId)
      .eq("payroll_run_id", runId),
  ]);

  type Row = {
    id: string;
    user_id: string | null;
    worker_name: string | null;
    classification: string;
    hours_st: number;
    hours_ot: number;
    hours_dt: number;
    earning_code_id: string | null;
  };
  const rows = (lineRows ?? []) as unknown as Row[];

  // Resolve earning codes and the workers' external ids in two batched
  // reads rather than per line.
  const codeIds = [...new Set(rows.map((r) => r.earning_code_id).filter((x): x is string => !!x))];
  const codeById = new Map<string, string>();
  if (codeIds.length) {
    const { data: codes } = await supabase.from("earning_codes").select("id, code").in("id", codeIds);
    for (const c of (codes ?? []) as Array<{ id: string; code: string }>) codeById.set(c.id, c.code);
  }

  const userIds = [...new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x))];
  const partyByUser = new Map<string, string>();
  const externalByParty = new Map<string, string>();
  if (userIds.length) {
    const { data: parties } = await supabase
      .from("parties")
      .select("id, auth_user_id")
      .eq("org_id", orgId)
      .in("auth_user_id", userIds)
      .is("deleted_at", null);
    const partyIds: string[] = [];
    for (const p of (parties ?? []) as Array<{ id: string; auth_user_id: string | null }>) {
      if (p.auth_user_id) partyByUser.set(p.auth_user_id, p.id);
      partyIds.push(p.id);
    }
    if (partyIds.length) {
      const { data: links } = await supabase
        .from("hr_worker_links")
        .select("party_id, external_employee_id")
        .eq("org_id", orgId)
        .eq("provider", provider)
        .eq("link_state", "active")
        .in("party_id", partyIds);
      for (const l of (links ?? []) as Array<{ party_id: string; external_employee_id: string }>) {
        externalByParty.set(l.party_id, l.external_employee_id);
      }
    }
  }

  // One export line per non-zero hour bucket. A payroll_run_lines row can
  // carry ST + OT + DT together; providers import hours-by-code, so the
  // buckets split here. A zero bucket is omitted rather than exported as a
  // paid-nothing record.
  const lines: ExportLine[] = [];
  for (const r of rows) {
    const partyId = r.user_id ? (partyByUser.get(r.user_id) ?? "") : "";
    const worker = {
      partyId,
      userId: r.user_id,
      name: r.worker_name,
      externalEmployeeId: partyId ? (externalByParty.get(partyId) ?? null) : null,
    };
    const fallbackCode = r.earning_code_id ? codeById.get(r.earning_code_id) : undefined;
    const buckets: Array<[string, number]> = [
      [fallbackCode ?? "REG", Number(r.hours_st)],
      ["OT", Number(r.hours_ot)],
      ["DT", Number(r.hours_dt)],
    ];
    for (const [code, hours] of buckets) {
      if (!(hours > 0)) continue;
      lines.push({
        id: r.id,
        worker,
        earningCode: code,
        hours,
        classification: r.classification,
        costCenter: null,
      });
    }
  }

  return {
    runId: run.id,
    orgId,
    orgName: (org as { name: string } | null)?.name ?? "",
    projectName: (project as { name: string } | null)?.name ?? null,
    periodStart: run.pay_period_start,
    periodEnd: run.pay_period_end,
    weekEnding: run.week_ending,
    lines,
  };
}
