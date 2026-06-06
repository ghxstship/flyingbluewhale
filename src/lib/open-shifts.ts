/**
 * Open Shift Marketplace — internal gig pool helpers.
 * Schema anchored to migration 20260606100001_competitive_features.sql.
 * Pattern matches src/lib/connecteam.ts and src/lib/marketplace.ts.
 */

export const LISTING_STATES = ["open", "filled", "cancelled"] as const;
export type ListingState = (typeof LISTING_STATES)[number];

export const CLAIM_STATES = ["pending", "approved", "declined", "withdrawn"] as const;
export type ClaimState = (typeof CLAIM_STATES)[number];

export const MEAL_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "afternoon_tea",
  "snack",
  "all_day",
] as const;
export type MealCategory = (typeof MEAL_CATEGORIES)[number];

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  afternoon_tea: "Afternoon Tea",
  snack: "Snack",
  all_day: "All Day",
};

export const DIGITAL_CREDENTIAL_TYPES = [
  "credential_assignment",
  "access_pass",
  "training_completion",
  "certification",
  "general",
] as const;
export type DigitalCredentialType = (typeof DIGITAL_CREDENTIAL_TYPES)[number];

export const CREDENTIAL_TYPE_LABELS: Record<DigitalCredentialType, string> = {
  credential_assignment: "Credential",
  access_pass: "Access Pass",
  training_completion: "Training Certificate",
  certification: "Certification",
  general: "Pass",
};

/** Tone map for listing_state badges. */
export const LISTING_STATE_TONE: Record<ListingState, "info" | "success" | "muted" | "error"> = {
  open: "info",
  filled: "success",
  cancelled: "muted",
};

/** Tone map for claim_state badges. */
export const CLAIM_STATE_TONE: Record<ClaimState, "info" | "success" | "muted" | "error"> = {
  pending: "info",
  approved: "success",
  declined: "muted",
  withdrawn: "muted",
};

/** Format a pay rate for display. Returns "—" when null. */
export function formatPayRate(cents: number | null | undefined, currency = "USD"): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Shift window label: "Fri Jun 6 · 08:00–16:00". */
export function formatShiftWindow(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateLabel = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const startTime = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const endTime = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateLabel} · ${startTime}–${endTime}`;
}
