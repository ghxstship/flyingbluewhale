/**
 * Scheduling Policy Builder — types, validation helpers, and enforcement logic.
 *
 * Analogous to Teambridge's Policy Builder (Oct 2025) and Rosterfy's compliance
 * checkpoints. Policies define rules the scheduling engine checks before
 * committing a shift assignment.
 *
 * Enforcement modes:
 *   warn  — flag the violation but allow the booking
 *   block — prevent the booking until the violation is resolved
 */

// ─────────────────────────────────────────────────────────────────────────────
// Policy kinds and their rule shapes
// ─────────────────────────────────────────────────────────────────────────────

export const POLICY_KINDS = [
  "shift_limit",
  "min_rest",
  "credential_required",
  "union_rule",
  "max_consecutive_days",
  "overtime_threshold",
  "custom",
] as const;
export type PolicyKind = (typeof POLICY_KINDS)[number];

export const POLICY_KIND_LABEL: Record<PolicyKind, string> = {
  shift_limit: "Shift length limit",
  min_rest: "Minimum rest between shifts",
  credential_required: "Credential requirement",
  union_rule: "Union / collective agreement rule",
  max_consecutive_days: "Maximum consecutive working days",
  overtime_threshold: "Overtime threshold",
  custom: "Custom rule",
};

export const POLICY_KIND_DESCRIPTION: Record<PolicyKind, string> = {
  shift_limit: "Cap the number of hours any worker can be scheduled in a day or week.",
  min_rest: "Enforce a minimum rest period between the end of one shift and the start of the next.",
  credential_required: "Require a specific credential type before a worker can be assigned.",
  union_rule: "Encode union or collective agreement scheduling constraints.",
  max_consecutive_days: "Prevent workers from being scheduled beyond a consecutive-day limit.",
  overtime_threshold: "Warn or block when a worker's scheduled hours exceed the overtime threshold.",
  custom: "Define a free-form JSON rule evaluated by the automation engine.",
};

export const ENFORCEMENT_MODES = ["warn", "block"] as const;
export type EnforcementMode = (typeof ENFORCEMENT_MODES)[number];

export const POLICY_SCOPES = ["org", "project", "role", "location"] as const;
export type PolicyScope = (typeof POLICY_SCOPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Typed rule shapes per kind
// ─────────────────────────────────────────────────────────────────────────────

export type ShiftLimitRules = {
  max_hours_per_day?: number;  // e.g. 10
  max_hours_per_week?: number; // e.g. 60
};

export type MinRestRules = {
  min_rest_hours: number; // e.g. 8 (hours between shifts)
};

export type CredentialRequiredRules = {
  credential_type: string;           // matches credentials.credential_type
  expiry_buffer_days?: number;       // reject if expires within N days
};

export type UnionRuleRules = {
  union_code: string;
  description: string;
  max_hours_per_call?: number;
  meal_penalty_after_hours?: number;
};

export type MaxConsecutiveDaysRules = {
  max_days: number; // e.g. 6
};

export type OvertimeThresholdRules = {
  weekly_regular_hours: number; // e.g. 40
  daily_regular_hours?: number; // e.g. 8
};

// ─────────────────────────────────────────────────────────────────────────────
// Violation shape returned by the enforcement check
-- ─────────────────────────────────────────────────────────────────────────────

export type PolicyViolation = {
  policy_id: string;
  policy_name: string;
  kind: PolicyKind;
  enforcement_mode: EnforcementMode;
  message: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Default rules per kind — used to pre-fill the policy form
// ─────────────────────────────────────────────────────────────────────────────

export const POLICY_DEFAULT_RULES: Record<PolicyKind, Record<string, unknown>> = {
  shift_limit: { max_hours_per_day: 10, max_hours_per_week: 60 },
  min_rest: { min_rest_hours: 8 },
  credential_required: { credential_type: "", expiry_buffer_days: 7 },
  union_rule: { union_code: "", description: "", max_hours_per_call: 10 },
  max_consecutive_days: { max_days: 6 },
  overtime_threshold: { weekly_regular_hours: 40, daily_regular_hours: 8 },
  custom: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Client-side enforcement check — validates a proposed shift assignment against
// a list of policies. Returns blocking violations and warnings separately so
// the UI can gate the confirm button on blocks and surface warnings inline.
// ─────────────────────────────────────────────────────────────────────────────

export type ShiftProposal = {
  starts_at: Date;
  ends_at: Date;
  crew_member_id: string;
  // hours already worked this week by this crew member
  weekly_hours_so_far?: number;
  // ISO timestamp of their last shift end
  last_shift_ended_at?: string;
  // consecutive days worked heading into this shift
  consecutive_days?: number;
  // credentials the crew member holds
  held_credential_types?: string[];
};

export function evaluatePolicies(
  proposal: ShiftProposal,
  policies: Array<{
    id: string;
    name: string;
    policy_kind: PolicyKind;
    rules: Record<string, unknown>;
    enforcement_mode: EnforcementMode;
  }>,
): { blocks: PolicyViolation[]; warnings: PolicyViolation[] } {
  const blocks: PolicyViolation[] = [];
  const warnings: PolicyViolation[] = [];

  const shiftHours =
    (proposal.ends_at.getTime() - proposal.starts_at.getTime()) / 3_600_000;

  for (const policy of policies) {
    const v: Omit<PolicyViolation, "message"> = {
      policy_id: policy.id,
      policy_name: policy.name,
      kind: policy.policy_kind,
      enforcement_mode: policy.enforcement_mode,
    };

    let violation: PolicyViolation | null = null;

    if (policy.policy_kind === "shift_limit") {
      const r = policy.rules as ShiftLimitRules;
      if (r.max_hours_per_day && shiftHours > r.max_hours_per_day) {
        violation = { ...v, message: `Shift is ${shiftHours.toFixed(1)}h — exceeds the ${r.max_hours_per_day}h daily limit.` };
      } else if (r.max_hours_per_week && proposal.weekly_hours_so_far !== undefined) {
        const total = proposal.weekly_hours_so_far + shiftHours;
        if (total > r.max_hours_per_week) {
          violation = { ...v, message: `Worker would reach ${total.toFixed(1)}h this week — exceeds the ${r.max_hours_per_week}h weekly limit.` };
        }
      }
    } else if (policy.policy_kind === "min_rest") {
      const r = policy.rules as MinRestRules;
      if (proposal.last_shift_ended_at) {
        const restHours =
          (proposal.starts_at.getTime() - new Date(proposal.last_shift_ended_at).getTime()) / 3_600_000;
        if (restHours < r.min_rest_hours) {
          violation = { ...v, message: `Only ${restHours.toFixed(1)}h rest since last shift — minimum is ${r.min_rest_hours}h.` };
        }
      }
    } else if (policy.policy_kind === "credential_required") {
      const r = policy.rules as CredentialRequiredRules;
      if (proposal.held_credential_types && !proposal.held_credential_types.includes(r.credential_type)) {
        violation = { ...v, message: `Credential "${r.credential_type}" is required for this assignment.` };
      }
    } else if (policy.policy_kind === "max_consecutive_days") {
      const r = policy.rules as MaxConsecutiveDaysRules;
      if (proposal.consecutive_days !== undefined && proposal.consecutive_days >= r.max_days) {
        violation = { ...v, message: `Worker has already worked ${proposal.consecutive_days} consecutive days — maximum is ${r.max_days}.` };
      }
    } else if (policy.policy_kind === "overtime_threshold") {
      const r = policy.rules as OvertimeThresholdRules;
      if (proposal.weekly_hours_so_far !== undefined) {
        const total = proposal.weekly_hours_so_far + shiftHours;
        if (total > r.weekly_regular_hours) {
          violation = { ...v, message: `Worker would be in overtime (${total.toFixed(1)}h this week — regular limit: ${r.weekly_regular_hours}h).` };
        }
      }
    }

    if (violation) {
      if (policy.enforcement_mode === "block") {
        blocks.push(violation);
      } else {
        warnings.push(violation);
      }
    }
  }

  return { blocks, warnings };
}
