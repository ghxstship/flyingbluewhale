"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notify, type NotifyEvent } from "@/lib/notify";
import {
  TIMESHEET_DECISIONS,
  DECISION_TARGET_STATE,
  canDecide,
  type TimesheetDecision,
  type TimesheetState,
} from "@/lib/db/timesheets";

export type State = { error?: string } | null;

const Schema = z.object({
  decision: z.enum(TIMESHEET_DECISIONS),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

/**
 * Manager+ approval transition for a timesheet. Validates the decision is
 * legal for the sheet's current `state`, refuses self-approval, claims the
 * transition with a state-predicated update, then writes an append-only
 * `timesheet_approvals` audit row. RLS additionally gates both writes to
 * org managers.
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
    .select("id, state, party_id")
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

  // Separation of duties: a manager cannot bless their own hours. Nothing
  // prevented this before — the manager band could approve the very sheet
  // that pays them.
  if (sheet.party_id && sheet.party_id === approver.id) {
    return { error: "You can't review your own timesheet. Another manager has to decide this one." };
  }

  // Claim the transition first, predicated on the state we validated
  // against. Without the `.eq("state", currentState)` guard two managers
  // deciding concurrently both pass `canDecide` on a stale read and the
  // last write wins, silently discarding the other's decision — the exact
  // race UNDECIDED_SWAP_STATES warns about in src/lib/workforce.ts.
  //
  // Claim-before-audit ordering matters: the audit insert used to run
  // first, so a losing racer left behind a `timesheet_approvals` row for a
  // decision that never took effect. Only the racer that actually moves
  // the state records one.
  const target = DECISION_TARGET_STATE[decision];
  const { data: moved, error: updErr } = await supabase
    .from("timesheets")
    .update({ state: target })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("state", currentState)
    .select("id")
    .maybeSingle();
  if (updErr) return { error: `Could not update timesheet state: ${updErr.message}` };
  if (!moved) {
    return { error: "This timesheet was decided by someone else. Refresh and review the current state." };
  }

  const { error: insErr } = await supabase.from("timesheet_approvals").insert({
    timesheet_id: id,
    approver_party_id: approver.id,
    decision,
    notes,
  });
  // The state has already moved; surface the audit failure rather than
  // reporting a clean success. Closing this window entirely needs both
  // writes in one transaction (a SECURITY DEFINER RPC) — tracked with the
  // approval-engine consolidation, not worth a schema change here.
  if (insErr) return { error: `Decision applied but the audit row failed to record: ${insErr.message}` };

  // Fan out the decision. `timesheet.approved` is the hook an external
  // payroll connector subscribes to rather than polling for postable sheets
  // — the whole point of the open surface is that a third party can build
  // what a native connector would.
  const EVENT: Record<TimesheetDecision, NotifyEvent> = {
    approved: "timesheet.approved",
    rejected: "timesheet.rejected",
    // A return is a rejection from the worker's point of view: their sheet
    // came back. No separate event until someone needs to tell them apart.
    returned: "timesheet.rejected",
  };
  // timesheets key on party_id, notifications on auth user — and no FK is
  // registered between them, so this is a lookup rather than an embed.
  // Gating on deleted_at would silently drop the decision notice for anyone
  // archived between filing and approval.
  const { data: worker } = await supabase
    // soft-delete-exempt: one party by id, to route a notification.
    .from("parties")
    .select("auth_user_id")
    .eq("id", sheet.party_id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  await notify({
    orgId: session.orgId,
    userId: worker?.auth_user_id ?? null,
    eventType: EVENT[decision],
    title: `Timesheet ${decision === "returned" ? "returned for changes" : decision}`,
    body: notes,
    href: `/studio/finance/timesheets/${id}`,
    data: { targetTable: "timesheets", targetId: id, decision },
  });

  revalidatePath(`/studio/finance/timesheets/${id}`);
  revalidatePath("/studio/finance/timesheets");
  return null;
}
