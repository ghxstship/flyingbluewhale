/**
 * Goals / OKRs (coverage gap CV9).
 *
 * Single helper file for the goals + key_results module (migration
 * PENDING_goals_okrs). Org-scoped objectives with measurable key results.
 * Pattern matches `src/lib/legend_resources.ts`: enum tuples `as const` →
 * derived types → label maps + small pure helpers.
 *
 * Row shapes are hand-written until the typed Database is regenerated
 * post-apply; reads/writes go through the LooseSupabase cast meanwhile.
 */

// ============================================================
// Goal lifecycle (cyclical operational → `goal_state`)
// ============================================================
export const GOAL_STATES = ["draft", "active", "achieved", "missed", "archived"] as const;
export type GoalState = (typeof GOAL_STATES)[number];

export const GOAL_STATE_LABELS: Record<GoalState, string> = {
  draft: "Draft",
  active: "Active",
  achieved: "Achieved",
  missed: "Missed",
  archived: "Archived",
};

// ============================================================
// Key-result health (cyclical operational → `kr_state`)
// ============================================================
export const KR_STATES = ["on_track", "at_risk", "off_track", "done"] as const;
export type KrState = (typeof KR_STATES)[number];

export const KR_STATE_LABELS: Record<KrState, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  done: "Done",
};

// ============================================================
// Row shapes (hand-written until types regen — LooseSupabase reads)
// ============================================================
export type Goal = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  period: string | null;
  goal_state: GoalState;
  created_at: string;
  updated_at: string;
};

export type KeyResult = {
  id: string;
  org_id: string;
  goal_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  kr_state: KrState;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Helpers
// ============================================================

/** Per-KR progress as a 0–1 fraction (current / target), clamped to [0,1].
 *  A non-positive target is treated as already met when current > 0, else 0. */
export function krProgress(kr: Pick<KeyResult, "target_value" | "current_value">): number {
  const target = Number(kr.target_value) || 0;
  const current = Number(kr.current_value) || 0;
  if (target <= 0) return current > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, current / target));
}

/** Goal rollup: the mean of its key results' progress fractions (0–1).
 *  A goal with no key results rolls up to 0. */
export function goalProgress(keyResults: Array<Pick<KeyResult, "target_value" | "current_value">>): number {
  if (keyResults.length === 0) return 0;
  const sum = keyResults.reduce((acc, kr) => acc + krProgress(kr), 0);
  return sum / keyResults.length;
}

/** Format a 0–1 fraction as a whole-percent string, e.g. 0.42 → "42%". */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
