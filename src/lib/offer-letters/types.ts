// ============================================================================
// OFFER LETTERS — TYPES
// Mirrors the schema in 20260430_000035_offer_letters_3nf_rewrite.sql
// ----------------------------------------------------------------------------
// `OfferLetter`         = one row in the `offer_letters` table (FK columns only)
// `OfferLetterResolved` = one row in `offer_letters_resolved` view (joined)
// `OfferLetterSnapshot` = the JSONB snapshot stored after status leaves draft
// ============================================================================

export type OfferLetterStatus = "draft" | "sent" | "viewed" | "accepted" | "declined" | "withdrawn" | "expired";

export type OfferLetterEmployer = "ghxstship" | "five_senses" | "joint";
export type OfferLetterClassification = "w2" | "1099" | "agency" | "intern";
export type CompensationBasis = "per_day" | "per_show_day" | "flat_fee" | "hourly" | "tbd";

/** Per-day call-sheet entry (schedule_items jsonb element). */
export type ScheduleItem = {
  date: string; // YYYY-MM-DD
  day_label: string; // "Fri · Show Day 1"
  call_time: string; // "16:00" or "—"
  wrap_time: string; // "00:00" or "—"
  location: string;
  activities: string[];
  notes?: string;
};

/** Onboarding checklist entry (onboarding_items jsonb element). */
export type OnboardingItem = {
  key: string;
  label: string;
  required: boolean;
  order: number;
  /** Optional single helper link rendered as "open ↗" badge. */
  link?: string;
  /** Optional multi-link list rendered as labeled "open ↗" badges. Overrides `link` when present. */
  links?: { label: string; url: string }[];
  /** Optional helper text rendered as muted small line under the label. */
  note?: string;
};

/** Raw row in offer_letters — only FKs + lifecycle, no resolved data. */
export type OfferLetter = {
  id: string;
  org_id: string;
  project_id: string;
  crew_member_id: string;
  role_id: string;
  reports_to_crew_member_id: string | null;
  venue_id: string | null;
  employer: OfferLetterEmployer;
  classification: OfferLetterClassification;
  rate_card_item_id: string | null;
  per_diem_rate_card_item_id: string | null;
  compensation_basis: CompensationBasis;
  override_amount_cents: number | null;
  override_per_diem_cents: number | null;
  travel_in_date: string | null;
  onsite_start_date: string | null;
  onsite_end_date: string | null;
  travel_out_date: string | null;
  travel_provided: boolean | null;
  lodging_provided: boolean | null;
  meals_provided: boolean | null;
  extra_inclusions: string[];
  expectations_override: string | null;
  terms_override: string | null;
  schedule_items: ScheduleItem[];
  onboarding_items: OnboardingItem[];
  public_token: string;
  access_code: string;
  token_expires_at: string | null;
  status: OfferLetterStatus;
  sent_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  accepted_at: string | null;
  accepted_signature: string | null;
  accepted_ip: string | null;
  accepted_user_agent: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  withdrawn_at: string | null;
  snapshot: OfferLetterResolved | null;
  snapshot_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Resolved view row — all SSOT joins applied. The app reads this. */
export type OfferLetterResolved = OfferLetter & {
  // crew_members (recipient)
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string | null;
  recipient_user_id: string | null;
  // org_roles
  role_title: string;
  role_slug: string;
  role_department: string | null;
  role_description: string | null;
  role_responsibilities: string[];
  // crew_members (reports to)
  reports_to_name: string | null;
  reports_to_email: string | null;
  reports_to_phone: string | null;
  reports_to_role: string | null;
  // venues + locations
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_region: string | null;
  venue_country: string | null;
  // projects
  project_name: string;
  project_slug: string;
  project_start_date: string | null;
  project_end_date: string | null;
  // rate_card_items
  rate_unit_price_cents: number | null;
  rate_name: string | null;
  rate_sku: string | null;
  per_diem_unit_price_cents: number | null;
  per_diem_sku: string | null;
  // effective (override → canonical) — 4-date engagement window
  effective_onsite_start: string | null;
  effective_onsite_end: string | null;
  /** @deprecated alias for effective_onsite_start */
  effective_start: string | null;
  /** @deprecated alias for effective_onsite_end */
  effective_end: string | null;
  engagement_days: number;
  effective_travel_provided: boolean;
  effective_lodging_provided: boolean;
  effective_meals_provided: boolean;
  effective_terms: string;
  effective_governing_law: string;
  effective_payment_schedule: string;
  effective_confidentiality: boolean;
  effective_inclusions: string[];
  effective_inclusions_footnote: string | null;
  effective_expectations: string;
  effective_compensation_cents: number;
  effective_per_diem_cents: number;
  effective_onboarding_items: OnboardingItem[];
  guide_url: string | null;
  // signing authority (org_offer_letter_settings → crew_members)
  signing_authority_name: string | null;
  signing_authority_email: string | null;
  signing_authority_phone: string | null;
  signing_authority_title: string | null;
};

export type OfferLetterActivity = {
  id: string;
  offer_letter_id: string;
  org_id: string;
  kind: string;
  actor_user_id: string | null;
  actor_label: string | null;
  summary: string;
  meta: Record<string, unknown>;
  occurred_at: string;
};

// ── Picker option types (FK selector dropdowns in admin) ─────────────────────
export type CrewMemberOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
};

export type OrgRoleOption = {
  id: string;
  slug: string;
  label: string;
  department: string | null;
};

export type VenueOption = {
  id: string;
  name: string;
  city: string | null;
};

export type RateCardOption = {
  id: string;
  sku: string;
  name: string;
  unit_price_cents: number;
};

// ── Display labels ──────────────────────────────────────────────────────────
export const STATUS_LABEL: Record<OfferLetterStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export const STATUS_VARIANT: Record<OfferLetterStatus, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  sent: "info",
  viewed: "warning",
  accepted: "success",
  declined: "error",
  withdrawn: "muted",
  expired: "muted",
};

export const EMPLOYER_LABEL: Record<OfferLetterEmployer, string> = {
  ghxstship: "GHXSTSHIP Industries LLC",
  five_senses: "Five Senses Group",
  joint: "GHXSTSHIP Industries LLC × Five Senses Group",
};

export const EMPLOYER_SHORT: Record<OfferLetterEmployer, string> = {
  ghxstship: "GHXSTSHIP",
  five_senses: "Five Senses",
  joint: "GHXSTSHIP × Five Senses",
};

export const CLASSIFICATION_LABEL: Record<OfferLetterClassification, string> = {
  w2: "W-2 Employee",
  "1099": "1099 Independent Contractor",
  agency: "Agency Loan-Out",
  intern: "Intern",
};

export const BASIS_LABEL: Record<CompensationBasis, string> = {
  per_day: "Per Day",
  per_show_day: "Per Show Day",
  flat_fee: "Flat Project Fee",
  hourly: "Hourly",
  tbd: "To Be Confirmed",
};

// ── Nevada IC Compliance — Risk Tier Map ────────────────────────────────────
// Mirrors the SCXEDC26-NV-IC-LETTERS-v1.md template package.
// Roles in tiers 3 + 4 trigger an Eligibility Prerequisite call-out in §7 of
// the letter and require stricter Exhibits B/C documentation (12-month
// trailing client history vs. 24-month).

export type EligibilityTier =
  | "tier_1_executive" // Producer / Project Director — fee-based creative direction
  | "tier_2_specialty" // Production Manager / Project Coordinator — established practice required
  | "tier_3_trade" // Certified equipment ops + Chapter 624 trades — NSCB / OSHA gating
  | "tier_4_high_risk"; // General labor / PA Guest / PA Merch — very-high misclassification risk

export const TIER_LABEL: Record<EligibilityTier, string> = {
  tier_1_executive: "Executive — Fee-Based Creative Direction",
  tier_2_specialty: "Specialty — Established Practice Required",
  tier_3_trade: "Trade — NSCB / OSHA Gating Applies",
  tier_4_high_risk: "High Misclassification Risk — Eligibility Prerequisite",
};

/** Resolve a role slug to its Nevada IC eligibility tier. Unknown roles
 *  default to tier_2_specialty (the safest non-trade middle path). */
export function tierForRoleSlug(slug: string | null | undefined): EligibilityTier {
  if (!slug) return "tier_2_specialty";
  if (slug === "producer" || slug === "executive-producer" || slug.startsWith("project-director")) {
    return "tier_1_executive";
  }
  if (slug === "production-manager" || slug === "production-manager-fb" || slug.startsWith("project-coordinator")) {
    return "tier_2_specialty";
  }
  if (
    slug === "production-crew-heavy" ||
    slug === "production-crew-carpentry-av" ||
    slug === "production-crew-electrical" ||
    slug === "production-crew-rigging" ||
    slug === "production-crew-steel" ||
    slug.startsWith("production-crew-")
  ) {
    return "tier_3_trade";
  }
  if (
    slug === "production-crew-general-labor" ||
    slug.startsWith("production-assistant") ||
    slug.startsWith("brand-ambassador")
  ) {
    return "tier_4_high_risk";
  }
  return "tier_2_specialty";
}

/** Trade-scope routing — these slugs touch NRS Chapter 624 (NSCB licensure). */
export function isChapter624Trade(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return (
    slug === "production-crew-carpentry-av" || // C-3
    slug === "production-crew-electrical" || // C-2
    slug === "production-crew-rigging" || // A-14 / C-14
    slug === "production-crew-steel" ||
    slug === "production-crew-painting" || // C-4
    slug === "production-crew-signs" // C-6
  );
}
