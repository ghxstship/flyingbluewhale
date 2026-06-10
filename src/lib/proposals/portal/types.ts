// ============================================================================
// PROPOSAL CLIENT PORTAL — TYPES
// ----------------------------------------------------------------------------
// Mirrors the migration in 20260430_000033_proposal_portal.sql. Server reads
// shape rows into these. Components receive plain JS-friendly variants.
// ============================================================================

export type PhaseStatus = "locked" | "active" | "in_review" | "approved" | "complete";

export type PhaseState = {
  id: string;
  proposal_id: string;
  org_id: string;
  phase_num: number;
  phase_key: string;
  phase_name: string;
  phase_state: PhaseStatus;
  started_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GateItem = {
  id: string;
  phase_state_id: string;
  proposal_id: string;
  org_id: string;
  ordinal: number;
  label: string;
  is_done: boolean;
  done_at: string | null;
  done_by: string | null;
};

export type ChangeOrderState =
  | "draft"
  | "requested"
  | "priced"
  | "client_review"
  | "approved"
  | "rejected"
  | "withdrawn";

export type ChangeOrder = {
  id: string;
  proposal_id: string;
  org_id: string;
  number: number;
  title: string;
  body: string | null;
  delta_cents: number | null;
  state: ChangeOrderState;
  requested_by: string | null;
  requested_label: string | null;
  priced_at: string | null;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RevisionState = "open" | "client_review" | "approved" | "changes_requested" | "rejected" | "withdrawn";

export type RevisionRound = {
  id: string;
  proposal_id: string;
  org_id: string;
  target_kind: "proposal" | "phase" | "change_order" | "asset";
  target_id: string | null;
  round_num: number;
  title: string;
  summary: string | null;
  state: RevisionState;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Revision = {
  id: string;
  round_id: string;
  proposal_id: string;
  ordinal: number;
  label: string;
  note: string | null;
  file_path: string | null;
  preview_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type ApprovalState = "pending" | "signed" | "declined" | "expired";

export type Approval = {
  id: string;
  proposal_id: string;
  org_id: string;
  kind: string;
  target_id: string | null;
  title: string;
  body: string | null;
  state: ApprovalState;
  due_at: string | null;
  signed_at: string | null;
  signed_by: string | null;
  signed_label: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalFile = {
  id: string;
  proposal_id: string;
  org_id: string;
  category: "proposal" | "sow" | "invoice" | "proof" | "condition_report" | "contract" | "other";
  name: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ActivityEntry = {
  id: string;
  proposal_id: string;
  org_id: string;
  kind: string;
  actor_id: string | null;
  actor_label: string | null;
  target_kind: string | null;
  target_id: string | null;
  summary: string;
  meta: Record<string, unknown>;
  occurred_at: string;
};

export type PhaseWithGates = PhaseState & { gateItems: GateItem[] };

export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  locked: "Locked",
  active: "In Progress",
  in_review: "Client Review",
  approved: "Approved",
  complete: "Complete",
};

export const PHASE_STATUS_TONE: Record<PhaseStatus, "muted" | "info" | "warning" | "success"> = {
  locked: "muted",
  active: "info",
  in_review: "warning",
  approved: "success",
  complete: "success",
};

export const CO_STATE_LABEL: Record<ChangeOrderState, string> = {
  draft: "Draft",
  requested: "Requested",
  priced: "Priced — awaiting decision",
  client_review: "Client Review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const CO_STATE_VARIANT: Record<
  ChangeOrderState,
  "default" | "info" | "warning" | "success" | "error" | "muted"
> = {
  draft: "muted",
  requested: "info",
  priced: "warning",
  client_review: "warning",
  approved: "success",
  rejected: "error",
  withdrawn: "muted",
};

export const REV_STATE_LABEL: Record<RevisionState, string> = {
  open: "Open",
  client_review: "Client Review",
  approved: "Approved",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const REV_STATE_VARIANT: Record<RevisionState, "default" | "info" | "warning" | "success" | "error" | "muted"> =
  {
    open: "info",
    client_review: "warning",
    approved: "success",
    changes_requested: "warning",
    rejected: "error",
    withdrawn: "muted",
  };

export const APPROVAL_STATE_LABEL: Record<ApprovalState, string> = {
  pending: "Pending Signature",
  signed: "Signed",
  declined: "Declined",
  expired: "Expired",
};

export const APPROVAL_STATE_VARIANT: Record<
  ApprovalState,
  "default" | "info" | "warning" | "success" | "error" | "muted"
> = {
  pending: "warning",
  signed: "success",
  declined: "error",
  expired: "muted",
};
