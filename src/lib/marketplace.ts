/**
 * Marketplace helpers — shared between console (org-side), marketing
 * (public-discovery), and /me (applicant/candidate side). Schema-anchored
 * to migration 0002_marketplace_canon.sql.
 */

export const RFQ_VISIBILITIES = ["private", "network", "public"] as const;
export type RfqVisibility = (typeof RFQ_VISIBILITIES)[number];

export const MARKETPLACE_KINDS = ["rfq", "gig", "talent_call", "audition"] as const;
export type MarketplaceKind = (typeof MARKETPLACE_KINDS)[number];

export const TALENT_RIDER_KINDS = ["tech", "hospitality", "input_list"] as const;
export type TalentRiderKind = (typeof TALENT_RIDER_KINDS)[number];

export const JOB_POSTING_STATUSES = ["draft", "published", "closed", "archived"] as const;
export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number];

export const JOB_POSTING_TYPES = ["single", "tour", "recurring"] as const;
export type JobPostingType = (typeof JOB_POSTING_TYPES)[number];

export const JOB_APPLICATION_STATUSES = ["new", "reviewed", "phone", "booked", "hold", "pass", "withdrawn"] as const;
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export const OPEN_CALL_STATUSES = ["draft", "published", "closed", "awarded", "cancelled"] as const;
export type OpenCallStatus = (typeof OPEN_CALL_STATUSES)[number];

export const SUBMISSION_STATUSES = ["submitted", "shortlisted", "rejected", "awarded", "withdrawn"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const TALENT_OFFER_STATUSES = [
  "draft",
  "sent",
  "countered",
  "accepted",
  "contracted",
  "declined",
  "cancelled",
] as const;
export type TalentOfferStatus = (typeof TALENT_OFFER_STATUSES)[number];

export const REVIEW_TRANSACTIONS = [
  "rfq",
  "purchase_order",
  "job_application",
  "talent_offer",
  "open_call_submission",
  "project",
] as const;

export const REVIEW_SUBJECTS = ["vendor", "talent", "crew", "org", "user"] as const;

/**
 * Slug a free-form title for a public marketplace surface.
 *  - lowercase, ASCII alphanumerics + hyphens
 *  - collapses runs of separators
 *  - trims to 60 chars (the snapshot constraint allows up to 80)
 *  - falls back to "untitled" so the unique-slug rotator below has something to extend
 */
export function slugify(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii || "untitled";
}

/**
 * Format a fee range for display. Returns en-dash when both bounds present,
 * "from" prefix when only min, "up to" when only max, "—" when neither.
 */
export function formatFeeRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  currency = "USD",
  locale = "en-US",
): string {
  const fmt = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  const lo = typeof minCents === "number" ? minCents : null;
  const hi = typeof maxCents === "number" ? maxCents : null;
  if (lo !== null && hi !== null) return lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`;
  if (lo !== null) return `from ${fmt(lo)}`;
  if (hi !== null) return `up to ${fmt(hi)}`;
  return "—";
}

// 0003 BOOKING CANON — Prism.fm parity helpers.

export const DEAL_TYPES = ["flat", "door", "versus", "tiered", "flat_plus", "vs_plus_walk"] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export const SETTLEMENT_STATUSES = ["draft", "reconciling", "final", "disputed"] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const TICKETING_PROVIDERS = ["etix", "dice", "tixr", "eventbrite", "seetickets", "axs", "manual"] as const;
export type TicketingProvider = (typeof TICKETING_PROVIDERS)[number];

export const TOUR_STATUSES = ["planning", "routing", "confirmed", "complete", "cancelled"] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];

export const EVENT_MILESTONE_KINDS = [
  "announce",
  "presale_start",
  "presale_end",
  "onsale",
  "sold_out",
  "press_embargo",
] as const;
export type EventMilestoneKind = (typeof EVENT_MILESTONE_KINDS)[number];

/**
 * Compute break-even attendance for an offer:
 *   guarantee + estimated expenses, divided by avg ticket price (NBOR).
 * Returns null if the inputs are insufficient.
 */
export function computeBreakEven(args: {
  guaranteeCents?: number | null;
  expenseCents?: number | null;
  avgTicketCents?: number | null;
  taxRateBps?: number;
  ccFeeRateBps?: number;
}): number | null {
  const { guaranteeCents, expenseCents, avgTicketCents } = args;
  const taxRateBps = args.taxRateBps ?? 0;
  const ccFeeRateBps = args.ccFeeRateBps ?? 0;
  if (!avgTicketCents || avgTicketCents <= 0) return null;
  const fixed = (guaranteeCents ?? 0) + (expenseCents ?? 0);
  if (fixed <= 0) return 0;
  // Each ticket nets price × (1 - tax - ccFee) toward NBOR.
  const netPerTicket = avgTicketCents * (1 - (taxRateBps + ccFeeRateBps) / 10_000);
  if (netPerTicket <= 0) return null;
  return Math.ceil(fixed / netPerTicket);
}

/** Tone mapping for status badges across marketplace surfaces. */
export const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  // shared
  draft: "muted",
  archived: "muted",
  cancelled: "error",
  declined: "error",
  rejected: "error",
  withdrawn: "muted",
  // job posting
  published: "success",
  closed: "muted",
  // applications
  new: "info",
  reviewed: "info",
  phone: "warning",
  booked: "success",
  hold: "warning",
  pass: "muted",
  // submissions
  submitted: "info",
  shortlisted: "warning",
  awarded: "success",
  // offers
  sent: "info",
  countered: "warning",
  accepted: "success",
  contracted: "success",
  // 0003 booking canon
  reconciling: "warning",
  final: "success",
  disputed: "error",
  planning: "muted",
  routing: "info",
  confirmed: "success",
  complete: "success",
  // milestone kinds (light-touch labeling)
  announce: "muted",
  presale_start: "info",
  presale_end: "info",
  onsale: "success",
  sold_out: "success",
  press_embargo: "warning",
};

// ---------------------------------------------------------------------------
// At-Risk Offer Detection (Instawork predictive no-show detection parity)
// ---------------------------------------------------------------------------

export type OfferRiskLevel = "low" | "medium" | "high";

export type OfferRiskScore = {
  level: OfferRiskLevel;
  score: number;
  flags: string[];
};

type ScoredOffer = {
  status: string;
  accepted_at?: string | null;
  contracted_at?: string | null;
  deposit_pct?: number | null;
  fee_cents?: number | null;
  version?: number | null;
  performance_date?: string | null;
  sent_at?: string | null;
};

/**
 * Score a talent offer for no-show / cancellation risk.
 * Returns a 0–100 score and a list of human-readable flag strings.
 * Used by the marketplace offers list to surface a risk badge.
 *
 * Scoring is heuristic (no ML needed at this volume). Each factor adds
 * a fixed delta; the sum is capped at 100. Levels: low < 25, medium < 55, high ≥ 55.
 */
export function scoreOfferRisk(offer: ScoredOffer): OfferRiskScore {
  const flags: string[] = [];
  let score = 0;

  // Offer sent but not yet responded to in > 5 days
  if (offer.status === "sent" && offer.sent_at) {
    const sentMs = Date.now() - new Date(offer.sent_at).getTime();
    const sentDays = sentMs / (1000 * 60 * 60 * 24);
    if (sentDays > 5) {
      score += 20;
      flags.push(`Unresponded for ${Math.floor(sentDays)} days`);
    }
  }

  // Accepted but no contract (contracted_at is null)
  if (offer.status === "accepted" && !offer.contracted_at) {
    score += 25;
    flags.push("Accepted with no signed contract");
  }

  // Late acceptance: < 72h before performance date
  if (offer.accepted_at && offer.performance_date) {
    const hoursUntil =
      (new Date(offer.performance_date).getTime() - new Date(offer.accepted_at).getTime()) / (1000 * 60 * 60);
    if (hoursUntil < 72) {
      score += 30;
      flags.push(`Accepted ${Math.floor(hoursUntil)}h before performance`);
    }
  }

  // Zero or missing deposit
  if (offer.deposit_pct != null && offer.deposit_pct === 0) {
    score += 20;
    flags.push("No deposit charged");
  }

  // High fee with no contract (> $5k without signed agreement)
  if ((offer.fee_cents ?? 0) > 500_000 && !offer.contracted_at) {
    score += 15;
    flags.push("High-value offer without signed contract");
  }

  // Countered version with reduced deposit (version > 1, deposit < 30%)
  if ((offer.version ?? 1) > 1 && (offer.deposit_pct ?? 60) < 30) {
    score += 10;
    flags.push("Counter-offered with reduced deposit");
  }

  const capped = Math.min(score, 100);
  const level: OfferRiskLevel = capped >= 55 ? "high" : capped >= 25 ? "medium" : "low";

  return { level, score: capped, flags };
}
