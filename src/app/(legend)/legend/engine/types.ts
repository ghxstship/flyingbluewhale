import type {
  ComplianceFindingState,
  ComplianceRuleState,
  ComplianceRunState,
  ComplianceSeverity,
} from "@/lib/xmce_engine";

/**
 * Hand-written row shapes for the XMCE compliance tables. The typed Supabase
 * client won't know these until `database.types.ts` is regenerated, so the
 * routes read via `LooseSupabase` and cast results to these — mirrors the
 * procurement vendor-onboarding pattern.
 */
export type ComplianceRuleRow = {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description: string | null;
  severity: ComplianceSeverity;
  category: string | null;
  rule_state: ComplianceRuleState;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ComplianceRunRow = {
  id: string;
  org_id: string;
  scope_kind: string;
  scope_ref: string | null;
  run_state: ComplianceRunState;
  summary: Record<string, unknown> | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplianceFindingRow = {
  id: string;
  org_id: string;
  run_id: string;
  rule_id: string;
  finding_state: ComplianceFindingState;
  severity: ComplianceSeverity;
  detail: string | null;
  entity_ref: string | null;
  created_at: string;
  updated_at: string;
};
