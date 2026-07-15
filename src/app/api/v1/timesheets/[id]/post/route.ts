import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { canPost, type TimesheetState } from "@/lib/db/timesheets";
import { buildPayrollLines, totalLineHours } from "@/lib/time/payroll-lines";
import { loadOrgTimeSettings } from "@/lib/time/server";
import { notifyOrgAdmins } from "@/lib/notify";

/**
 * POST /api/v1/timesheets/{id}/post — approved hours become payroll lines.
 *
 * The step that makes the spine reachable. `post_timesheet` and the
 * overtime split existed but nothing called them, so no `payroll_run_lines`
 * row was ever written by the app and the certified-payroll exporters kept
 * reading demo seed data.
 *
 * Splitting hours is the app's job, writing them is the RPC's: the route
 * computes the REG/OT/DT buckets from the sheet's entries under the org's
 * `ot_rule_set`, then hands them to `post_timesheet`, which gates on
 * `approved`, freezes the sheet, and replaces (never appends) that sheet's
 * lines so a retry can't double-pay.
 *
 * Admin band — approving hours and paying them are separate authorities.
 */

const PostSchema = z.object({
  payrollRunId: z.string().uuid(),
  /** IANA zone the worker's days are measured in. Wrong here means wrong
   *  daily-overtime boundaries under CA rules, so it is explicit rather
   *  than guessed from the server's clock. */
  timeZone: z.string().max(64).optional(),
  /** 0=Sunday … 6=Saturday. FLSA lets an employer designate any fixed day. */
  weekStartsOn: z.number().int().min(0).max(6).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "payroll:post");
    if (denial) return denial;

    const supabase = await createClient();

    const { data: sheet } = await supabase
      .from("timesheets")
      .select("id, state, party_id, period_start, period_end")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!sheet) return apiError("not_found", "Timesheet not found");

    // Re-checked in the RPC too; this is the friendlier message.
    if (!canPost(sheet.state as TimesheetState)) {
      return apiError("conflict", `Only an approved timesheet can be posted (this one is "${sheet.state}").`);
    }

    const { data: entries } = await supabase
      .from("time_entries")
      .select("id, started_at, duration_minutes, user_id")
      .eq("org_id", session.orgId)
      .eq("timesheet_id", id)
      .not("ended_at", "is", null);
    const rows = (entries ?? []) as Array<{
      id: string;
      started_at: string;
      duration_minutes: number | null;
      user_id: string | null;
    }>;
    if (rows.length === 0) {
      return apiError("conflict", "This timesheet has no closed entries to post.");
    }

    // The worker's identity for the line. timesheets key on party_id.
    const { data: party } = await supabase
      .from("parties")
      .select("id, display_name, auth_user_id")
      .eq("id", sheet.party_id)
      .eq("org_id", session.orgId)
      .maybeSingle();

    const settings = await loadOrgTimeSettings(supabase, session.orgId);

    const lines = buildPayrollLines({
      userId: party?.auth_user_id ?? rows[0]?.user_id ?? "",
      workerName: party?.display_name ?? null,
      entries: rows,
      ruleSet: settings.ot_rule_set,
      timeZone: input.timeZone,
      weekStartsOn: input.weekStartsOn,
    });
    if (lines.length === 0) {
      return apiError("conflict", "This timesheet has no payable hours.");
    }

    const db = supabase as unknown as LooseSupabase;
    const { data, error } = await db.rpc("post_timesheet", {
      p_timesheet_id: id,
      p_payroll_run_id: input.payrollRunId,
      p_lines: lines.map((l) => ({
        code: l.code,
        user_id: l.user_id,
        worker_name: l.worker_name,
        classification: l.classification,
        hours_st: l.hours_st,
        hours_ot: l.hours_ot,
        hours_dt: l.hours_dt,
        source_entry_ids: l.source_entry_ids,
      })),
    });

    if (error) {
      if (error.code === "42501") return apiError("forbidden", error.message);
      if (error.code === "55000") return apiError("conflict", error.message);
      if (error.code === "P0002") return apiError("not_found", error.message);
      return apiError("internal", error.message);
    }

    await notifyOrgAdmins({
      orgId: session.orgId,
      eventType: "timesheet.posted",
      title: "Timesheet posted to payroll",
      body: `${totalLineHours(lines)} h across ${lines.length} line${lines.length === 1 ? "" : "s"}`,
      href: `/studio/finance/payroll/${input.payrollRunId}`,
      data: { targetTable: "timesheets", targetId: id, payrollRunId: input.payrollRunId },
    });

    return apiOk({
      result: data,
      lines: lines.map((l) => ({ code: l.code, hours: l.hours_st + l.hours_ot + l.hours_dt })),
      totalHours: totalLineHours(lines),
      // Say which rules produced this split. An operator reconciling a
      // dispute needs to know whether OT was computed here or deferred.
      otRuleSet: settings.ot_rule_set,
    });
  });
}
