/**
 * LEG3ND compliance / recert matrix vocabulary. The credential lifecycle is
 * `accreditation_state` (LDP cyclical) and each value carries a semantic
 * tone — the recert matrix colors cells from this map (NOT a generic
 * DataView). Backed by migration 20260623150020_legend_certifications.
 */
import type { StateTone } from "@/lib/tones";

export const ACCREDITATION_STATES = ["pending", "valid", "expiring", "expired", "suspended", "revoked"] as const;
export type AccreditationState = (typeof ACCREDITATION_STATES)[number];

export const ACCREDITATION_STATE_LABELS: Record<AccreditationState, string> = {
  pending: "Pending",
  valid: "Valid",
  expiring: "Expiring soon",
  expired: "Expired",
  suspended: "Suspended",
  revoked: "Revoked",
};

/**
 * Tone per credential state — the matrix paints from these. Mapped onto the
 * StatusBadge tone vocabulary so it routes through the semantic token ramp.
 */
export const ACCREDITATION_STATE_TONES: Record<AccreditationState, StateTone> = {
  pending: "muted",
  valid: "success",
  expiring: "warning",
  expired: "error",
  suspended: "warning",
  revoked: "error",
};

export const RECERT_STATES = ["requested", "in_review", "approved", "rejected", "completed"] as const;
export type RecertState = (typeof RECERT_STATES)[number];

export const RECERT_STATE_LABELS: Record<RecertState, string> = {
  requested: "Requested",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export const CERTIFICATION_STATES = ["active", "archived"] as const;
export type CertificationState = (typeof CERTIFICATION_STATES)[number];

export type Certification = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string | null;
  validity_months: number | null;
  recert_window_days: number;
  certification_state: CertificationState;
};

export type CertificationHolder = {
  id: string;
  org_id: string;
  certification_id: string;
  user_id: string;
  source_course_id: string | null;
  issued_at: string;
  expires_on: string | null;
  last_recert_at: string | null;
  next_recert_due: string | null;
  accreditation_state: AccreditationState;
};

/**
 * Derive the display state from raw dates — a holder marked `valid` whose
 * `expires_on` falls inside the recert window reads as `expiring`, and one
 * past expiry reads as `expired`. Suspended/revoked/pending are terminal
 * and pass through unchanged. `now` is injected so callers stay pure /
 * deterministic (no Date.now in shared libs).
 */
export function effectiveAccreditationState(
  holder: Pick<CertificationHolder, "accreditation_state" | "expires_on">,
  recertWindowDays: number,
  now: Date,
): AccreditationState {
  if (holder.accreditation_state === "suspended" || holder.accreditation_state === "revoked" || holder.accreditation_state === "pending") {
    return holder.accreditation_state;
  }
  if (!holder.expires_on) return "valid";
  const expiry = new Date(holder.expires_on + "T00:00:00Z").getTime();
  const nowMs = now.getTime();
  if (nowMs >= expiry) return "expired";
  const windowMs = recertWindowDays * 24 * 60 * 60 * 1000;
  if (expiry - nowMs <= windowMs) return "expiring";
  return "valid";
}
