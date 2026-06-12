/**
 * Talent Intelligence scoring — computes per-worker performance scores from
 * operational signals and ranks crew members for smart assignment recommendations.
 *
 * Mirrors Nowsta's Talent Intelligence (multi-variable candidate ranking by
 * skills, certifications, availability, and performance history) and
 * Rosterfy's automated workforce ranking.
 *
 * Score kinds (matching the crew_score_kind DB enum):
 *   reliability    — on-time rate, no-show rate, cancellation rate
 *   quality        — assignment completion rate, supervisor ratings
 *   safety         — incident involvement rate, induction compliance rate
 *   communication  — response time to invites, chat activity
 *   composite      — weighted average of the four above
 */

export const SCORE_KINDS = ["reliability", "quality", "safety", "communication", "composite"] as const;
export type ScoreKind = (typeof SCORE_KINDS)[number];

export const SCORE_KIND_LABEL: Record<ScoreKind, string> = {
  reliability: "Reliability",
  quality: "Quality",
  safety: "Safety",
  communication: "Communication",
  composite: "Overall",
};

export const SCORE_KIND_DESCRIPTION: Record<ScoreKind, string> = {
  reliability: "On-time arrival, no-show, and cancellation rates.",
  quality: "Assignment completion and supervisor rating signals.",
  safety: "Incident record and induction compliance.",
  communication: "Response time to shift invites and engagement.",
  composite: "Weighted composite across all four dimensions.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Composite weights — tune to match org priorities
// ─────────────────────────────────────────────────────────────────────────────

const COMPOSITE_WEIGHTS: Record<Exclude<ScoreKind, "composite">, number> = {
  reliability: 0.40,
  quality: 0.30,
  safety: 0.20,
  communication: 0.10,
};

// ─────────────────────────────────────────────────────────────────────────────
// Signal inputs (computed by DB queries in the API layer)
// ─────────────────────────────────────────────────────────────────────────────

export type ReliabilitySignals = {
  total_shifts: number;
  on_time_count: number;    // clocked in within 5 min of shift start
  no_show_count: number;
  cancellation_count: number;
};

export type QualitySignals = {
  total_assignments: number;
  completed_count: number;  // fulfillment_state = 'delivered' or 'redeemed'
  supervisor_rating_sum: number;
  supervisor_rating_count: number;
};

export type SafetySignals = {
  incident_involvement_count: number;
  total_shifts: number;
  inductions_required: number;
  inductions_completed: number;
};

export type CommunicationSignals = {
  invites_sent: number;
  invites_responded_within_24h: number;
};

export type ScoringInputs = {
  reliability?: ReliabilitySignals;
  quality?: QualitySignals;
  safety?: SafetySignals;
  communication?: CommunicationSignals;
};

export type ScoreResult = {
  score: number;          // 0–100
  sample_count: number;
  component_json: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Score computation helpers
// ─────────────────────────────────────────────────────────────────────────────

export function computeReliabilityScore(s: ReliabilitySignals): ScoreResult {
  if (s.total_shifts === 0) return { score: 50, sample_count: 0, component_json: {} };
  const on_time_pct = s.on_time_count / s.total_shifts;
  const no_show_pct = s.no_show_count / s.total_shifts;
  const cancel_pct = s.cancellation_count / s.total_shifts;
  // Penalise no-shows (2×) more heavily than cancellations
  const raw = on_time_pct - no_show_pct * 2 - cancel_pct;
  const score = Math.min(100, Math.max(0, Math.round(raw * 100)));
  return {
    score,
    sample_count: s.total_shifts,
    component_json: { on_time_pct: round2(on_time_pct), no_show_pct: round2(no_show_pct), cancel_pct: round2(cancel_pct) },
  };
}

export function computeQualityScore(s: QualitySignals): ScoreResult {
  if (s.total_assignments === 0) return { score: 50, sample_count: 0, component_json: {} };
  const completion_rate = s.completed_count / s.total_assignments;
  const avg_rating = s.supervisor_rating_count > 0
    ? s.supervisor_rating_sum / s.supervisor_rating_count / 5  // normalise 1–5 to 0–1
    : 0.7; // prior when no ratings
  const score = Math.min(100, Math.max(0, Math.round((completion_rate * 0.6 + avg_rating * 0.4) * 100)));
  return {
    score,
    sample_count: s.total_assignments,
    component_json: { completion_rate: round2(completion_rate), avg_rating: round2(avg_rating * 5) },
  };
}

export function computeSafetyScore(s: SafetySignals): ScoreResult {
  const incident_rate = s.total_shifts > 0 ? s.incident_involvement_count / s.total_shifts : 0;
  const induction_compliance = s.inductions_required > 0
    ? s.inductions_completed / s.inductions_required
    : 1;
  // 70% induction compliance + 30% clean incident record
  const score = Math.min(100, Math.max(0, Math.round((induction_compliance * 0.7 + (1 - Math.min(incident_rate * 5, 1)) * 0.3) * 100)));
  return {
    score,
    sample_count: s.total_shifts,
    component_json: { incident_rate: round2(incident_rate), induction_compliance: round2(induction_compliance) },
  };
}

export function computeCommunicationScore(s: CommunicationSignals): ScoreResult {
  if (s.invites_sent === 0) return { score: 50, sample_count: 0, component_json: {} };
  const response_rate = s.invites_responded_within_24h / s.invites_sent;
  const score = Math.min(100, Math.max(0, Math.round(response_rate * 100)));
  return {
    score,
    sample_count: s.invites_sent,
    component_json: { response_rate: round2(response_rate) },
  };
}

export function computeCompositeScore(
  scores: Partial<Record<Exclude<ScoreKind, "composite">, number>>,
): ScoreResult {
  let weighted = 0;
  let totalWeight = 0;
  for (const [kind, weight] of Object.entries(COMPOSITE_WEIGHTS) as [Exclude<ScoreKind, "composite">, number][]) {
    const s = scores[kind];
    if (s !== undefined) {
      weighted += s * weight;
      totalWeight += weight;
    }
  }
  const score = totalWeight > 0 ? Math.round(weighted / totalWeight) : 50;
  return {
    score,
    sample_count: 0,
    component_json: scores as Record<string, unknown>,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation ranking — sorts candidate crew members by composite score
// for a given shift, applying availability and credential filters first.
// ─────────────────────────────────────────────────────────────────────────────

export type CrewCandidate = {
  crew_member_id: string;
  composite_score?: number;   // 0–100, undefined = no history yet
  is_available: boolean;
  holds_required_credentials: boolean;
  days_since_last_worked?: number;
};

export type RankedCandidate = CrewCandidate & {
  rank_score: number;
  rank_reason: string;
};

export function rankCandidates(candidates: CrewCandidate[]): RankedCandidate[] {
  return candidates
    .filter((c) => c.is_available && c.holds_required_credentials)
    .map((c): RankedCandidate => {
      const perf = c.composite_score ?? 50;
      // Slight freshness bonus: favour workers who haven't worked recently
      // (tired crew = safety risk), but don't penalise regular contributors
      const freshness = c.days_since_last_worked !== undefined
        ? Math.min(c.days_since_last_worked / 7, 1) * 5  // up to +5 pts
        : 0;
      const rank_score = perf + freshness;
      const rank_reason = c.composite_score !== undefined
        ? `Score ${perf}/100`
        : "No history — default score";
      return { ...c, rank_score, rank_reason };
    })
    .sort((a, b) => b.rank_score - a.rank_score);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Score band label for UI display. */
export function scoreBand(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "green" };
  if (score >= 75) return { label: "Good", color: "blue" };
  if (score >= 60) return { label: "Fair", color: "yellow" };
  return { label: "Needs attention", color: "red" };
}
