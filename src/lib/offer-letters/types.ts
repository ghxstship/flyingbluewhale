// ============================================================================
// OFFER LETTERS — TYPES
// Mirrors the schema in 20260430_000034_offer_letters.sql
// ============================================================================

export type OfferLetterStatus = "draft" | "sent" | "viewed" | "accepted" | "declined" | "withdrawn" | "expired";

export type OfferLetterEmployer = "ghxstship" | "five_senses" | "joint";

export type OfferLetterClassification = "w2" | "1099" | "agency" | "intern";

export type CompensationBasis = "flat_fee" | "per_day" | "hourly" | "tbd";

export type OfferLetter = {
  id: string;
  org_id: string;
  project_id: string | null;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string | null;
  role_title: string;
  department: string | null;
  employer: OfferLetterEmployer;
  classification: OfferLetterClassification;
  reports_to_name: string | null;
  reports_to_email: string | null;
  work_location: string | null;
  engagement_start: string | null;
  engagement_end: string | null;
  compensation_cents: number;
  compensation_basis: CompensationBasis;
  compensation_label: string | null;
  payment_schedule: string | null;
  per_diem_cents: number;
  travel_provided: boolean;
  lodging_provided: boolean;
  meals_provided: boolean;
  inclusions: string[];
  expectations: string | null;
  terms: string | null;
  governing_law: string;
  confidentiality: boolean;
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
  pdf_storage_path: string | null;
  brand_logo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OfferLetterActivity = {
  id: string;
  offer_letter_id: string;
  org_id: string;
  kind: string;
  actor_id: string | null;
  actor_label: string | null;
  summary: string;
  meta: Record<string, unknown>;
  occurred_at: string;
};

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
  flat_fee: "Flat Project Fee",
  per_day: "Per Day",
  hourly: "Hourly",
  tbd: "To Be Confirmed",
};
