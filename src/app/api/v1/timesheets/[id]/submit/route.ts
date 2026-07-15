import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { assertCapability, isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canSubmit, type TimesheetState } from "@/lib/db/timesheets";

/**
 * POST /api/v1/timesheets/{id}/submit — the worker hands their sheet in.
 *
 * This is the move that made the timesheet lifecycle reachable at all.
 * `ALLOWED_DECISIONS.open = []` and nothing anywhere submitted, so every
 * compiled sheet sat in `open` forever and the portal's promise ("once a
 * pay period is compiled and submitted, it shows here with its review
 * state") was unkeepable.
 *
 * Submitting is the WORKER's act, not a manager decision — which is why it
 * lives here rather than in `decideTimesheet`. A manager may submit on a
 * worker's behalf (someone has to, when a worker leaves mid-period).
 *
 * A sheet with pending corrections cannot be submitted: handing in hours
 * you have already disputed asks the approver to bless two answers at once.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "time:write");
    if (denial) return denial;

    const supabase = await createClient();

    const { data: sheet, error: loadErr } = await supabase
      .from("timesheets")
      .select("id, state, party_id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (loadErr) return apiError("internal", loadErr.message);
    if (!sheet) return apiError("not_found", "Timesheet not found");

    const state = sheet.state as TimesheetState;
    if (!canSubmit(state)) {
      return apiError("conflict", `A "${state}" timesheet can't be submitted.`);
    }

    // Own sheet, or a manager acting for someone who can't.
    const { data: party } = await supabase
      .from("parties")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("auth_user_id", session.userId)
      .is("deleted_at", null)
      .maybeSingle();
    const isOwn = !!party && party.id === sheet.party_id;
    if (!isOwn && !isManagerPlus(session)) {
      return apiError("forbidden", "You can only submit your own timesheet.");
    }

    const { count: pending } = await supabase
      .from("time_entry_corrections")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("timesheet_id", id)
      .eq("correction_state", "requested");
    if ((pending ?? 0) > 0) {
      return apiError(
        "conflict",
        `This timesheet has ${pending} correction${pending === 1 ? "" : "s"} waiting on a decision. Those have to be settled before it's handed in.`,
      );
    }

    // Predicated on the state we validated — a stale tab can't submit twice
    // or race a manager's decision.
    const { data: moved, error: updErr } = await supabase
      .from("timesheets")
      .update({ state: "submitted", submitted_at: new Date().toISOString(), submitted_by: session.userId })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .eq("state", state)
      .select("id, state, submitted_at, total_minutes, billable_minutes")
      .maybeSingle();
    if (updErr) return apiError("internal", updErr.message);
    if (!moved) return apiError("conflict", "This timesheet changed while you were looking at it. Refresh and retry.");

    return apiOk({ timesheet: moved });
  });
}
