import "server-only";

/**
 * Approvals Engine — shared enum tuples + label maps + read helpers.
 *
 * The five approval_* tables are text-but-state-machine-ish. The CHECK
 * constraints below are the SSOT (introspected from the live schema); these
 * tuples mirror them so the UI selects + zod enums can't drift.
 */

// approval_instances.state — NOT NULL, no default → callers must set
// 'initiated' on insert.
export const INSTANCE_STATES = [
  "initiated",
  "in_review",
  "escalated",
  "approved",
  "rejected",
  "returned",
  "closed",
  "cancelled",
] as const;
export type InstanceState = (typeof INSTANCE_STATES)[number];

/**
 * The states an instance is still awaiting a decision in — i.e. what
 * "pending approvals" actually means.
 *
 * There is NO `pending` state: the CHECK constraint doesn't allow it and
 * `routeToApprovals` inserts `initiated`. Three surfaces nonetheless
 * queried `.eq("state", "pending")` and so counted zero forever — the
 * approvals tile, the Home strip, and the nav badge were all structurally
 * empty. Filter on this tuple instead of inventing a state.
 */
export const OPEN_INSTANCE_STATES = [
  "initiated",
  "in_review",
  "escalated",
] as const satisfies readonly InstanceState[];

// approval_decisions.decision — note: NO "abstain"; the recusal value is
// "recused".
export const DECISION_KINDS = ["approved", "rejected", "returned", "recused"] as const;
export type DecisionKind = (typeof DECISION_KINDS)[number];
export const DECISION_LABEL: Record<DecisionKind, string> = {
  approved: "Approve",
  rejected: "Reject",
  returned: "Return for changes",
  recused: "Recuse",
};

// approval_steps.routing_kind
export const ROUTING_KINDS = ["sequential", "parallel_all", "parallel_any", "threshold", "conditional"] as const;
export type RoutingKind = (typeof ROUTING_KINDS)[number];
export const ROUTING_LABEL: Record<RoutingKind, string> = {
  sequential: "Sequential",
  parallel_all: "Parallel — all must approve",
  parallel_any: "Parallel — any approves",
  threshold: "Threshold (N of M)",
  conditional: "Conditional",
};

// approval_delegations.scope
export const DELEGATION_SCOPES = ["all", "policy", "subject_kind", "project"] as const;
export type DelegationScope = (typeof DELEGATION_SCOPES)[number];
export const DELEGATION_SCOPE_LABEL: Record<DelegationScope, string> = {
  all: "All approvals",
  policy: "A specific policy",
  subject_kind: "A subject kind",
  project: "A project",
};

/** Map a decision → the instance state it implies (best-effort transition). */
export function instanceStateForDecision(decision: DecisionKind): InstanceState | null {
  switch (decision) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "returned":
      return "returned";
    default:
      return null; // recused leaves the instance open
  }
}
