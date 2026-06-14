/**
 * XMCE Compliance Engine (LEG3ND) — shared enum tuples + label maps + small
 * helpers for the compliance authoring + findings surfaces. Pattern mirrors
 * `src/lib/marketplace.ts` / `src/lib/connecteam.ts`: enum tuples `as const`
 * → derived union types → label maps + a couple of pure helpers.
 *
 * XMCE = the compliance engine: author `compliance_rules`, then run checks
 * (`compliance_runs`) that emit `compliance_findings`. The execution itself
 * is a stub server action — this lib is the canonical taxonomy both the rule
 * authoring UI and the findings dashboard read from.
 */

// ============================================================
// Severity — fixed taxonomy (NOT a lifecycle)
// ============================================================
export const COMPLIANCE_SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
export type ComplianceSeverity = (typeof COMPLIANCE_SEVERITIES)[number];

export const SEVERITY_LABELS: Record<ComplianceSeverity, string> = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Badge tone token per severity — feeds <Badge variant>. */
export const SEVERITY_TONES: Record<ComplianceSeverity, "muted" | "info" | "warning" | "error"> = {
  info: "muted",
  low: "info",
  medium: "info",
  high: "warning",
  critical: "error",
};

/** Rank for sorting findings most-severe-first. */
export const SEVERITY_RANK: Record<ComplianceSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

// ============================================================
// Rule lifecycle — cyclical operational state
// ============================================================
export const COMPLIANCE_RULE_STATES = ["draft", "active", "retired"] as const;
export type ComplianceRuleState = (typeof COMPLIANCE_RULE_STATES)[number];

export const RULE_STATE_LABELS: Record<ComplianceRuleState, string> = {
  draft: "Draft",
  active: "Active",
  retired: "Retired",
};

// ============================================================
// Run lifecycle — cyclical operational state
// ============================================================
export const COMPLIANCE_RUN_STATES = ["queued", "running", "passed", "failed", "error"] as const;
export type ComplianceRunState = (typeof COMPLIANCE_RUN_STATES)[number];

export const RUN_STATE_LABELS: Record<ComplianceRunState, string> = {
  queued: "Queued",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
  error: "Error",
};

export const RUN_STATE_TONES: Record<ComplianceRunState, "muted" | "info" | "success" | "warning" | "error"> = {
  queued: "muted",
  running: "info",
  passed: "success",
  failed: "warning",
  error: "error",
};

/** Terminal run states the stub engine writes once a run settles. */
export const TERMINAL_RUN_STATES: ReadonlySet<ComplianceRunState> = new Set(["passed", "failed", "error"]);

// ============================================================
// Finding lifecycle — cyclical operational state
// ============================================================
export const COMPLIANCE_FINDING_STATES = ["open", "acknowledged", "resolved", "waived"] as const;
export type ComplianceFindingState = (typeof COMPLIANCE_FINDING_STATES)[number];

export const FINDING_STATE_LABELS: Record<ComplianceFindingState, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  waived: "Waived",
};

export const FINDING_STATE_TONES: Record<ComplianceFindingState, "muted" | "info" | "success" | "error"> = {
  open: "error",
  acknowledged: "info",
  resolved: "success",
  waived: "muted",
};

/** A finding is "outstanding" until resolved or waived. */
export function isFindingOutstanding(state: ComplianceFindingState): boolean {
  return state === "open" || state === "acknowledged";
}

// ============================================================
// Scope discriminator (free-form; common kinds enumerated for the picker)
// ============================================================
export const COMPLIANCE_SCOPE_KINDS = ["org", "project"] as const;
export type ComplianceScopeKind = (typeof COMPLIANCE_SCOPE_KINDS)[number];

export const SCOPE_KIND_LABELS: Record<ComplianceScopeKind, string> = {
  org: "Organization",
  project: "Project",
};

// ============================================================
// Run summary — the JSONB report the stub engine records on each run
// ============================================================
export type ComplianceRunSummary = {
  rules_evaluated: number;
  findings_total: number;
  by_severity: Partial<Record<ComplianceSeverity, number>>;
  generated_at: string;
};

/** Roll a finding list up into the summary JSONB shape persisted on a run. */
export function summarizeFindings(
  findings: Array<{ severity: ComplianceSeverity }>,
  rulesEvaluated: number,
): ComplianceRunSummary {
  const bySeverity: Partial<Record<ComplianceSeverity, number>> = {};
  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  }
  return {
    rules_evaluated: rulesEvaluated,
    findings_total: findings.length,
    by_severity: bySeverity,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Derive the terminal run state from a finding set: a run with any
 * high/critical finding "fails"; any lesser findings still "fail" the
 * gate but softly; zero findings "passes". The stub engine uses this so the
 * dashboard reads believably without a real rules interpreter.
 */
export function deriveRunState(findings: Array<{ severity: ComplianceSeverity }>): ComplianceRunState {
  return findings.length === 0 ? "passed" : "failed";
}
