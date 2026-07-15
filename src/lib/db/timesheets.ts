// Pure timesheet canon (enums/labels/helpers) — client-safe, no server APIs
// or DB access here (queries live in the route actions). Must NOT import
// "server-only": the approval-control client island imports the labels/types.
import type { Database } from "@/lib/supabase/database.types";

/**
 * Timesheet approval canon — the `utt_timesheet_state` lifecycle plus the
 * manager-gated approval transitions surfaced at
 * `/studio/finance/timesheets/[id]`.
 *
 * The `timesheets.state` column is the LDP cyclical-operational state
 * (renamed-discipline compliant — never a bare `status`). Each manager
 * decision writes a `timesheet_approvals` row (append-only audit) AND
 * advances `timesheets.state` in one server action.
 */

export type TimesheetState = Database["public"]["Enums"]["utt_timesheet_state"];

/** Canonical lifecycle order — drives label maps + list filters. */
export const TIMESHEET_STATES = [
  "open",
  "submitted",
  "approved",
  "rejected",
  "posted",
  "archived",
] as const satisfies readonly TimesheetState[];

export const TIMESHEET_STATE_LABEL: Record<TimesheetState, string> = {
  open: "Open",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  posted: "Posted",
  archived: "Archived",
};

/**
 * Approval decisions recorded in `timesheet_approvals.decision`
 * (CHECK-constrained to these three). Each maps to a target state the
 * timesheet advances to when the decision is recorded.
 */
export type TimesheetDecision = "approved" | "rejected" | "returned";

export const TIMESHEET_DECISIONS = ["approved", "rejected", "returned"] as const satisfies readonly TimesheetDecision[];

/** Decision → the `utt_timesheet_state` the timesheet moves to. */
export const DECISION_TARGET_STATE: Record<TimesheetDecision, TimesheetState> = {
  approved: "approved",
  rejected: "rejected",
  returned: "open",
};

/**
 * Allowed manager DECISIONS per current state. A submitted sheet can be
 * approved / rejected / returned; an already-approved sheet can still be
 * returned (re-open) or rejected before posting. Terminal states
 * (posted / archived) accept no further approval decisions.
 *
 * `open: []` is correct and is NOT the lifecycle's dead end it looks like:
 * leaving `open` is a SUBMISSION, not a manager decision, so it lives in
 * `canSubmit` below rather than here. Until Phase 3 nothing submitted, which
 * is what made the lifecycle unreachable from its own initial state.
 */
export const ALLOWED_DECISIONS: Record<TimesheetState, readonly TimesheetDecision[]> = {
  open: [],
  submitted: ["approved", "rejected", "returned"],
  approved: ["rejected", "returned"],
  rejected: ["returned"],
  posted: [],
  archived: [],
};

export function canDecide(state: TimesheetState, decision: TimesheetDecision): boolean {
  return ALLOWED_DECISIONS[state].includes(decision);
}

/**
 * States a worker can submit from. `rejected` is included on purpose: a
 * rejected sheet the worker has since corrected must be re-submittable, or
 * the rejection is a dead end for them.
 */
export const SUBMITTABLE_STATES = ["open", "rejected"] as const satisfies readonly TimesheetState[];

export function canSubmit(state: TimesheetState): boolean {
  return (SUBMITTABLE_STATES as readonly TimesheetState[]).includes(state);
}

/** States an admin can post to payroll from. Approval is the gate. */
export const POSTABLE_STATES = ["approved"] as const satisfies readonly TimesheetState[];

export function canPost(state: TimesheetState): boolean {
  return (POSTABLE_STATES as readonly TimesheetState[]).includes(state);
}

export const TIMESHEET_DECISION_LABEL: Record<TimesheetDecision, string> = {
  approved: "Approve",
  rejected: "Reject",
  returned: "Return for changes",
};

/** Minutes → human "Xh Ym" / "Xh" / "Ym". */
export function formatMinutes(minutes: number | null | undefined): string {
  const m = Math.max(0, Math.round(minutes ?? 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h && rem) return `${h}h ${rem}m`;
  if (h) return `${h}h`;
  return `${rem}m`;
}
