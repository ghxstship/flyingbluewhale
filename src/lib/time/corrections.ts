/**
 * Time-correction canon — enums, labels, and the transition guard.
 *
 * Client-safe: no server APIs, no DB access, no "server-only" import (the
 * /m/clock request island imports the labels). Mirrors the shape of
 * `src/lib/db/timesheets.ts`.
 */

export const CORRECTION_KINDS = [
  "edit_in",
  "edit_out",
  "edit_both",
  "missing_entry",
  "delete_entry",
  "zone_override",
] as const;
export type CorrectionKind = (typeof CORRECTION_KINDS)[number];

export const CORRECTION_KIND_LABEL: Record<CorrectionKind, string> = {
  edit_in: "Wrong clock-in time",
  edit_out: "Wrong clock-out time",
  edit_both: "Both times wrong",
  missing_entry: "Missing shift",
  delete_entry: "Shouldn't be here",
  zone_override: "Wrong location",
};

/** Kinds that need no existing entry — the worker never punched at all. */
export const ENTRY_LESS_KINDS = ["missing_entry"] as const satisfies readonly CorrectionKind[];

export const CORRECTION_STATES = ["requested", "approved", "denied", "applied", "withdrawn"] as const;
export type CorrectionState = (typeof CORRECTION_STATES)[number];

export const CORRECTION_STATE_LABEL: Record<CorrectionState, string> = {
  requested: "Waiting on your supervisor",
  approved: "Approved",
  denied: "Denied",
  applied: "Applied",
  withdrawn: "Withdrawn",
};

/** States a request can still move out of — the queue's working set. */
export const OPEN_CORRECTION_STATES = ["requested"] as const satisfies readonly CorrectionState[];

export const CORRECTION_DECISIONS = ["approved", "denied"] as const;
export type CorrectionDecision = (typeof CORRECTION_DECISIONS)[number];

/**
 * Legal transitions.
 *
 * `approved -> applied` is a separate step on purpose: approving is a
 * decision, applying is a database write that can still fail (the
 * posted-sheet lock, a concurrent edit). Collapsing them would report
 * success for a change that never landed.
 */
export const NEXT_CORRECTION_STATES: Record<CorrectionState, readonly CorrectionState[]> = {
  requested: ["approved", "denied", "withdrawn"],
  approved: ["applied"],
  denied: [],
  applied: [],
  withdrawn: [],
};

export function canTransitionCorrection(from: CorrectionState, to: CorrectionState): boolean {
  return NEXT_CORRECTION_STATES[from].includes(to);
}

/** The DB enforces this too (`reason` CHECK); keep the numbers in step. */
export const MIN_CORRECTION_REASON = 10;

export function isUsableCorrectionReason(reason: string | null | undefined): boolean {
  return typeof reason === "string" && reason.trim().length >= MIN_CORRECTION_REASON;
}

/** Which proposed timestamps a kind actually requires. */
export function requiredProposals(kind: CorrectionKind): { start: boolean; end: boolean } {
  switch (kind) {
    case "edit_in":
      return { start: true, end: false };
    case "edit_out":
      return { start: false, end: true };
    case "edit_both":
    case "missing_entry":
      return { start: true, end: true };
    case "delete_entry":
    case "zone_override":
      return { start: false, end: false };
  }
}

export type CorrectionShapeError =
  | "reason_too_short"
  | "missing_entry_needs_start"
  | "kind_needs_entry"
  | "needs_proposed_start"
  | "needs_proposed_end"
  | "end_before_start";

/**
 * Validate a request's shape before it reaches the DB, so the worker gets
 * a sentence instead of a constraint name. The DB constraints remain the
 * real guarantee — this is for the message, not the safety.
 */
export function validateCorrectionShape(input: {
  kind: CorrectionKind;
  timeEntryId: string | null;
  reason: string;
  proposedStartedAt?: string | null;
  proposedEndedAt?: string | null;
}): CorrectionShapeError | null {
  if (!isUsableCorrectionReason(input.reason)) return "reason_too_short";

  const entryLess = (ENTRY_LESS_KINDS as readonly CorrectionKind[]).includes(input.kind);
  if (entryLess && !input.proposedStartedAt) return "missing_entry_needs_start";
  if (!entryLess && !input.timeEntryId) return "kind_needs_entry";

  const need = requiredProposals(input.kind);
  if (need.start && !input.proposedStartedAt) return "needs_proposed_start";
  if (need.end && !input.proposedEndedAt) return "needs_proposed_end";

  if (input.proposedStartedAt && input.proposedEndedAt) {
    if (new Date(input.proposedEndedAt).getTime() <= new Date(input.proposedStartedAt).getTime()) {
      return "end_before_start";
    }
  }
  return null;
}

export const CORRECTION_SHAPE_MESSAGE: Record<CorrectionShapeError, string> = {
  reason_too_short: "Tell your supervisor what happened, in a sentence or so.",
  missing_entry_needs_start: "Say when the shift started.",
  kind_needs_entry: "Pick the shift you're correcting.",
  needs_proposed_start: "Say what the start time should be.",
  needs_proposed_end: "Say what the end time should be.",
  end_before_start: "The end time has to come after the start time.",
};
