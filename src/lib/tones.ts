/**
 * Canonical state → badge-tone maps (audit CN-1/2/3/7).
 *
 * Single source of truth for coloring lifecycle/state enums across all
 * three shells. Before this file, ~144 pages hand-rolled local
 * `*_TONE: Record<string, ...>` maps with diverging choices (`draft`
 * info-vs-muted, `pending` muted-vs-info, `approved` success-vs-info).
 *
 * Canon decisions
 *  - `draft` = muted, `pending` = muted (StatusBadge's existing choices
 *    kept as canon), `approved` = success, `active` = success.
 *  - Fulfillment arc (shared `fulfillment_state` enum on `deliverables`
 *    + `assignments`): briefed/draft muted · submitted/in_review info ·
 *    approved/issued/delivered/redeemed success · revision_requested
 *    warning · rejected/voided/expired error · transferred info ·
 *    returned muted.
 *  - Values use <Badge> vocabulary (`error`, not StatusChip's `danger`;
 *    StatusChip accepts `error` as an alias since CN-8).
 *
 * Use `toneFor(state)` for generic lookups (falls back to "default"),
 * or import a specific map when you want exhaustive typing.
 *
 * SSOT note (plumb-line DUP-2): this file is the SINGLE owner of state→tone.
 * `src/lib/marketplace.ts#STATUS_TONE` is a re-export of `STATE_TONE` below —
 * the marketplace-specific keys live here (see the "marketplace" block in
 * DOCUMENT_STATE_TONE) so the generic resolver and the marketplace surfaces can
 * never disagree on a shared state (they previously diverged on
 * `closed`/`complete`/`responded`).
 */

import type { BadgeVariant } from "@/components/ui/Badge";
import type { FulfillmentState } from "@/lib/db/assignments";

/** The subset of Badge variants used for state coloring. */
export type StateTone = Extract<BadgeVariant, "default" | "muted" | "info" | "success" | "warning" | "error">;

/**
 * fulfillment_state enum — exhaustive (typed against the canonical
 * FulfillmentState union from src/lib/db/assignments.ts; the type-only
 * import keeps this file safe for client components).
 */
export const FULFILLMENT_TONE: Record<FulfillmentState, StateTone> = {
  briefed: "muted",
  draft: "muted",
  submitted: "info",
  in_review: "info",
  revision_requested: "warning",
  approved: "success",
  rejected: "error",
  delivered: "success",
  issued: "success",
  transferred: "info",
  redeemed: "success",
  expired: "error",
  voided: "error",
  returned: "muted",
};

/**
 * Generic document/record lifecycle vocabulary — the shared superset of
 * the hand-rolled maps this file replaced. Keys already present in the
 * old StatusBadge MAP keep their original tone (that map was the de
 * facto canon); the rest follow majority vote across the migrated maps.
 */
export const DOCUMENT_STATE_TONE: Record<string, StateTone> = {
  // ── neutral / not started ──
  draft: "muted",
  drafted: "muted",
  pending: "muted",
  queued: "muted",
  not_started: "muted",
  proposed: "muted",
  planning: "muted",
  invited: "muted",
  acquired: "muted",
  withdrawn: "muted",
  archived: "muted",
  retired: "muted",
  dormant: "muted",
  skipped: "muted",
  excused: "muted",
  abandoned: "muted",
  unknown: "muted",
  none: "muted",
  no_bid: "muted",
  waived: "muted",
  todo: "muted",
  // ── in flight ──
  new: "info",
  open: "warning",
  active: "success",
  live: "success",
  submitted: "info",
  sent: "info",
  requested: "info",
  applied: "info",
  filed: "info",
  in_progress: "info",
  in_review: "info",
  in_transit: "info",
  review: "info",
  reviewing: "info",
  scheduled: "info",
  running: "info",
  processing: "info",
  monitoring: "info",
  investigating: "info",
  triage: "info",
  acknowledged: "info",
  responded: "success",
  viewed: "info",
  verified: "info",
  matched: "info",
  reserved: "info",
  checked_out: "info",
  awaiting_signatures: "info",
  superseded: "info",
  ready_for_review: "info",
  uploaded: "info",
  in_use: "info",
  normal: "info",
  info: "info",
  // ── needs attention ──
  paused: "warning",
  revision_requested: "warning",
  blocked: "warning",
  delayed: "warning",
  on_hold: "warning",
  hold: "warning",
  standby: "warning",
  flagged: "warning",
  expiring: "warning",
  expiring_soon: "warning",
  suspended: "warning",
  at_risk: "warning",
  late: "warning",
  maintenance: "warning",
  in_maintenance: "warning",
  under_review: "warning",
  negotiation: "warning",
  countered: "warning",
  revise_resubmit: "warning",
  partially_signed: "warning",
  on_break: "warning",
  warning: "warning",
  warn: "warning",
  // ── good outcomes ──
  approved: "success",
  approved_with_comments: "success",
  accepted: "success",
  certified: "success",
  conducted: "success",
  confirmed: "success",
  awarded: "success",
  delivered: "success",
  fulfilled: "success",
  completed: "success",
  done: "success",
  resolved: "success",
  published: "success",
  paid: "success",
  passed: "success",
  signed: "success",
  granted: "success",
  connected: "success",
  renewed: "success",
  released: "success",
  promoted: "success",
  converted: "success",
  attended: "success",
  answered: "success",
  arrived: "success",
  departed: "success",
  checked_in: "success",
  scanned: "success",
  ready: "success",
  available: "success",
  won: "success",
  ok: "success",
  success: "success",
  // ── bad outcomes ──
  rejected: "error",
  declined: "error",
  denied: "error",
  cancelled: "error",
  failed: "error",
  voided: "error",
  void: "error",
  overdue: "error",
  expired: "error",
  terminated: "error",
  escalated: "error",
  disputed: "error",
  lost: "error",
  no_show: "error",
  urgent: "error",
  error: "error",
  // ── terminal / neutral close ──
  complete: "success",
  closed: "muted",
  // ── marketplace-specific keys (folded in from marketplace.ts#STATUS_TONE,
  //    plumb-line DUP-2 — this file is now their single owner) ──
  reviewed: "info",
  phone: "warning",
  booked: "success",
  pass: "muted",
  shortlisted: "warning",
  contracted: "success",
  reconciling: "warning",
  final: "success",
  routing: "info",
  announce: "muted",
  presale_start: "info",
  presale_end: "info",
  onsale: "success",
  sold_out: "success",
  press_embargo: "warning",
};

/** Severity grading (incidents, risks, annotations, threats). */
export const SEVERITY_TONE: Record<string, StateTone> = {
  info: "info",
  advisory: "info",
  warn: "warning",
  low: "muted",
  minor: "info",
  near_miss: "warning",
  medium: "warning",
  moderate: "warning",
  major: "warning",
  high: "error",
  severe: "error",
  critical: "error",
  fatal: "error",
  fatality: "error",
  emergency: "error",
};

/** Priority grading (tasks, action items, requests). */
export const PRIORITY_TONE: Record<string, StateTone> = {
  low: "muted",
  normal: "info",
  medium: "warning",
  high: "warning",
  urgent: "error",
  critical: "error",
  immediate: "error",
};

/**
 * Merged lookup table — fulfillment vocabulary wins on shared keys. This is the
 * single source of truth every shell resolves against; `marketplace.ts`
 * re-exports it as `STATUS_TONE`.
 */
export const STATE_TONE: Record<string, StateTone> = {
  ...DOCUMENT_STATE_TONE,
  ...FULFILLMENT_TONE,
};

/**
 * Back-compat alias. The marketplace map is no longer a separate authoring
 * site — it is exactly `STATE_TONE`.
 */
export const MARKETPLACE_STATUS_TONE = STATE_TONE;

/**
 * Resolve a state/status string to its canonical Badge tone.
 * Unknown keys fall back to "default" (never throws).
 */
export function toneFor(state: string | null | undefined): StateTone {
  if (!state) return "default";
  return STATE_TONE[state] ?? "default";
}
