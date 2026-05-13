/**
 * CHARTHOUSE state machine — protocol §5.
 *
 * Mirrors the canonical transitions enforced by the
 * public.charthouse_transition_state RPC defined in 0057_charthouse_v1.sql.
 * Use this client-side to gate transition buttons and surface
 * human-readable transition labels.
 */

import type { CharthouseDocumentState, CharthouseTransition } from "./types";

export const STATE_LABEL: Record<CharthouseDocumentState, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  issued: "Issued · IFC",
  superseded: "Superseded",
  as_built: "As-Built",
};

/** Badge tone keyed to current shell-design tones used across console surfaces. */
export const STATE_TONE: Record<CharthouseDocumentState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  in_review: "warning",
  approved: "info",
  issued: "success",
  superseded: "muted",
  as_built: "info",
};

export const TRANSITION_LABEL: Record<CharthouseTransition, string> = {
  submit: "Submit for Review",
  approve: "Approve",
  reject: "Reject",
  revise: "Send Back to Draft",
  issue: "Issue (IFC)",
  supersede: "Supersede",
  field_change: "Field Change → As-Built",
};

/** Which transitions are legally callable from a given state. */
export function transitionsFromState(s: CharthouseDocumentState): CharthouseTransition[] {
  switch (s) {
    case "draft":
      return ["submit"];
    case "in_review":
      return ["approve", "reject", "revise"];
    case "approved":
      return ["issue", "revise"];
    case "issued":
      return ["supersede", "field_change"];
    case "superseded":
    case "as_built":
      return [];
  }
}

/** Compute the state that results from applying a transition. */
export function nextState(
  current: CharthouseDocumentState,
  transition: CharthouseTransition,
): CharthouseDocumentState | null {
  if (!transitionsFromState(current).includes(transition)) return null;
  switch (transition) {
    case "submit":
      return "in_review";
    case "approve":
      return "approved";
    case "reject":
    case "revise":
      return "draft";
    case "issue":
      return "issued";
    case "supersede":
      return "superseded";
    case "field_change":
      return "as_built";
  }
}
