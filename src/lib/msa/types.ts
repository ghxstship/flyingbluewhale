// ============================================================================
// INDEPENDENT CONTRACTOR MSA — TYPES
// One MSA per (org, crew_member). Holds the Nevada IC compliance language
// (Recitals, Relationship of the Parties, T&C, Governing Law, Exhibits B/C).
// Engagement letters reference it by link.
// ============================================================================

export type MsaStatus = "draft" | "sent" | "viewed" | "signed" | "revoked" | "superseded";

export type ExhibitBOtherClient = {
  client: string;
  project: string;
  dates: string;
};

export type ExhibitCCapitalItem = {
  label: string;
  description: string;
};

export type IndependentContractorMsa = {
  id: string;
  org_id: string;
  crew_member_id: string;
  public_token: string;
  access_code: string;
  token_expires_at: string | null;
  msa_state: MsaStatus;
  version: number;
  body_snapshot: string | null;
  governing_law_snapshot: string | null;
  exhibit_b_other_clients: ExhibitBOtherClient[];
  exhibit_c_capital_items: ExhibitCCapitalItem[];
  nscb_license_number: string | null;
  nscb_classification: string | null;
  nscb_monetary_limit_cents: number | null;
  sent_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  signed_at: string | null;
  signed_signature: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  superseded_at: string | null;
  superseded_by_msa_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IndependentContractorMsaResolved = IndependentContractorMsa & {
  crew_member_name: string;
  crew_member_email: string | null;
  crew_member_phone: string | null;
  crew_member_role: string | null;
  org_name: string;
};

export type CrewMemberActiveMsa = {
  msa_id: string;
  msa_state: MsaStatus;
  signed_at: string | null;
  version: number;
  public_token: string;
};

export const MSA_STATUS_LABEL: Record<MsaStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  revoked: "Revoked",
  superseded: "Superseded",
};

export const MSA_STATUS_VARIANT: Record<MsaStatus, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  sent: "info",
  viewed: "warning",
  signed: "success",
  revoked: "error",
  superseded: "muted",
};
