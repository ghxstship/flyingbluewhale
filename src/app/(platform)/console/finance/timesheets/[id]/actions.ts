"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  TIMESHEET_DECISIONS,
  DECISION_TARGET_STATE,
  canDecide,
  type TimesheetState,
} from "@/lib/db/timesheets";

export type State = { error?: string } | null;

const Schema = z.object({
  decision: z.enum(TIMESHEET_DECISIONS),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

/**
 * Manager+ approval transition for a timesheet. Validates the decision is
 * legal for the sheet's current `state`, writes an append-only
 * `timesheet_approvals` audit row, then advances `timesheets.state` to the
 * decision's target. RLS additionally gates both writes to org managers.
 */
export async function decideTimesheet(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers can review timesheets." };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick a valid decision." };
  const { decision } = parsed.data;
  const notes = parsed.data.notes || null;

  const supabase = await createClient();

  // Load the current sheet (org-scoped) to validate the transition is legal
  // before we touch anything — a stale tab can't post an illegal jump.
  const { data: sheet, error: loadErr } = await supabase
    .from("timesheets")
    .select("id, state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (loadErr) return { error: "Could not load timesheet." };
  if (!sheet) return { error: "Timesheet not found." };

  const currentState = sheet.state as TimesheetState;
  if (!canDecide(currentState, decision)) {
    return { error: `Cannot ${decision} a timesheet that is "${currentState}".` };
  }

  // Resolve the approver's party row (timesheet_approvals.approver_party_id
  // is NOT NULL and FKs to parties). Parties are org-scoped, keyed off the
  // signed-in auth user.
  const { data: approver } = await supabase
    .from("parties")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("auth_user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!approver) {
    return { error: "Your account is not linked to a party record in this organization." };
  }

  const { error: insErr } = await supabase.from("timesheet_approvals").insert({
    timesheet_id: id,
    approver_party_id: approver.id,
    decision,
    notes,
  });
  if (insErr) return { error: `Could not record decision: ${insErr.message}` };

  const target = DECISION_TARGET_STATE[decision];
  const { error: updErr } = await supabase
    .from("timesheets")
    .update({ state: target })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (updErr) return { error: `Could not update timesheet state: ${updErr.message}` };

  revalidatePath(`/console/finance/timesheets/${id}`);
  revalidatePath("/console/finance/timesheets");
  return null;
}
