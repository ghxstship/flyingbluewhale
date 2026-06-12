/**
 * ATLVS Intelligence — types and helpers for the operational AI agent layer.
 *
 * Three modes, mirroring LASSO Intelligence / Teambridge Ponder:
 *   Ask   — natural-language query over live operational data, answer + citations
 *   Act   — multi-step workflow execution with a human-confirmation step
 *   Alert — proactive monitoring rule definition and fire-log
 *
 * No heavy dependencies here — just types and pure helpers that both the
 * API route and the UI can import without pulling in server-only code.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mode & session types
// ─────────────────────────────────────────────────────────────────────────────

export const INTELLIGENCE_MODES = ["ask", "act", "alert_setup"] as const;
export type IntelligenceMode = (typeof INTELLIGENCE_MODES)[number];

export const INTELLIGENCE_MODE_LABEL: Record<IntelligenceMode, string> = {
  ask: "Ask",
  act: "Act",
  alert_setup: "Set Alert",
};

// ─────────────────────────────────────────────────────────────────────────────
// Ask-mode: source citations
// ─────────────────────────────────────────────────────────────────────────────

export type SourceCitation = {
  table: string;
  id: string;
  label: string;
  href?: string; // optional deep-link into the console
};

export type AskResponse = {
  answer: string;
  citations: SourceCitation[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Act-mode: action plan + execution manifest
// ─────────────────────────────────────────────────────────────────────────────

export const ACT_STEP_KINDS = [
  "create_event",
  "staff_roster",
  "send_invite",
  "generate_cost_summary",
  "transition_state",
  "send_notification",
  "update_record",
  "create_shift",
] as const;
export type ActStepKind = (typeof ACT_STEP_KINDS)[number];

export type ActStep = {
  kind: ActStepKind;
  label: string;
  // payload is kind-specific; validated server-side before execution
  payload: Record<string, unknown>;
  reversible: boolean;
};

export type ActResponse = {
  plan: ActStep[];
  // confirmed is false until the operator approves the plan
  confirmed: boolean;
  executed_at?: string; // ISO timestamp set after execution
};

// ─────────────────────────────────────────────────────────────────────────────
// Alert-mode: condition kinds and cadence
// ─────────────────────────────────────────────────────────────────────────────

export const ALERT_CONDITION_KINDS = [
  "crew_coverage_gap",
  "credential_expiry",
  "budget_overrun",
  "assignment_unconfirmed",
  "shift_unfilled",
  "induction_expired",
  "asset_unavailable",
  "invoice_overdue",
] as const;
export type AlertConditionKind = (typeof ALERT_CONDITION_KINDS)[number];

export const ALERT_CONDITION_LABEL: Record<AlertConditionKind, string> = {
  crew_coverage_gap: "Crew coverage gap",
  credential_expiry: "Credential expiring",
  budget_overrun: "Budget overrun",
  assignment_unconfirmed: "Unconfirmed assignments",
  shift_unfilled: "Unfilled shifts",
  induction_expired: "Induction expired",
  asset_unavailable: "Asset unavailable",
  invoice_overdue: "Invoice overdue",
};

export const ALERT_CADENCES = ["realtime", "hourly", "daily", "weekly"] as const;
export type AlertCadence = (typeof ALERT_CADENCES)[number];

export const ALERT_CADENCE_LABEL: Record<AlertCadence, string> = {
  realtime: "Real-time",
  hourly: "Hourly digest",
  daily: "Daily digest",
  weekly: "Weekly digest",
};

// ─────────────────────────────────────────────────────────────────────────────
// Suggested prompts — surfaced in the Ask UI to onboard users
// ─────────────────────────────────────────────────────────────────────────────

export const SUGGESTED_ASK_PROMPTS = [
  "What crew is unconfirmed for this week?",
  "Show budget vs actual across active projects",
  "Which credentials are expiring in the next 14 days?",
  "Summarise open assignments for Project Alpha",
  "Which shifts are unfilled for this weekend?",
  "How many inductions are overdue?",
  "What are the three largest open invoices?",
] as const;

export const SUGGESTED_ACT_PROMPTS = [
  "Staff the load-in roster for Saturday with available crew",
  "Send invites to all unconfirmed crew on Project Alpha",
  "Generate a cost summary for last month's events",
  "Create load-in, show, and load-out shifts for Sunday's event",
] as const;
