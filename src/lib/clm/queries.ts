import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { formatMoney } from "@/lib/i18n/format";

/**
 * Contracts / CLM shared types + read helpers.
 *
 * The `contracts` table is org-scoped + soft-deletable (org_id, deleted_at).
 * Its child tables (contract_versions / milestones / obligations / signatures
 * / parties / terms) carry NO org_id — they're scoped transitively through
 * contract_id. Every read here is gated on a contract the caller already
 * proved org-ownership of (via getOrgScoped("contracts", ...)), so the
 * child reads filter on contract_id alone.
 */

// ── Enum vocabularies (real DB labels) ──────────────────────────────────
// `contracts.kind` is the `uct_kind` enum; `contracts.state` is `uct_state`;
// `contracts.billing_method` is `contract_billing_method`.
export const CONTRACT_KINDS = [
  "sponsor_deal",
  "vendor_sow",
  "master_services",
  "talent_booking",
  "employment_equivalent",
  "ip_license",
  "partnership",
  "nda",
  "vendor_prequal",
  "rental_agreement",
  "venue_agreement",
  "other",
] as const;
export type ContractKind = (typeof CONTRACT_KINDS)[number];

export const CONTRACT_STATES = [
  "draft",
  "in_review",
  "negotiation",
  "awaiting_signatures",
  "active",
  "expiring",
  "expired",
  "terminated",
  "renewed",
  "archived",
] as const;
export type ContractState = (typeof CONTRACT_STATES)[number];

export const CONTRACT_BILLING_METHODS = [
  "lump_sum",
  "time_and_materials",
  "cost_plus_fee",
  "cost_plus_gmp",
  "unit_price",
  "milestone",
] as const;
export type ContractBillingMethod = (typeof CONTRACT_BILLING_METHODS)[number];

// ── Row shapes (only the columns these surfaces read) ───────────────────
export type ContractRow = {
  id: string;
  org_id: string;
  project_id: string | null;
  kind: ContractKind;
  number: string;
  title: string;
  state: ContractState;
  start_at: string | null;
  end_at: string | null;
  auto_renew: boolean;
  renewal_window_days: number | null;
  total_value_minor: number | null;
  total_value_currency: string | null;
  billing_method: ContractBillingMethod | null;
  counterparty_name: string | null;
  counterparty_email: string | null;
  vendor_id: string | null;
  client_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type ContractVersionRow = {
  id: string;
  contract_id: string;
  version: number;
  prior_version_id: string | null;
  redline_summary: string | null;
  created_at: string;
};

export type ContractMilestoneRow = {
  id: string;
  contract_id: string;
  label: string;
  due_at: string | null;
  trigger_kind: string;
  payment_amount_minor: number | null;
  payment_currency: string | null;
  invoice_kind: string | null;
  state: string;
  satisfied_at: string | null;
};

export type ContractObligationRow = {
  id: string;
  contract_id: string;
  ob_kind: string;
  description: string;
  recurring: boolean;
  due_at: string | null;
  state: string;
};

export type ContractSignatureRow = {
  id: string;
  contract_id: string;
  version_id: string;
  signer_party_id: string;
  signing_role: string;
  state: string;
  signature_method: string;
  signed_at: string | null;
};

export type ContractPartyRow = {
  id: string;
  contract_id: string;
  party_id: string;
  role: string;
  signing_capacity: string | null;
};

export type ContractTermRow = {
  id: string;
  contract_id: string;
  term_kind: string;
  description: string;
  active: boolean;
};

// Loosely-typed client for the child tables — these aren't org-scoped, so
// they don't ride the typed `listOrgScoped` helper. RLS is the real gate.
async function loose(): Promise<LooseSupabase> {
  const supabase = await createClient();
  return supabase as unknown as LooseSupabase;
}

export async function listVersions(contractId: string): Promise<ContractVersionRow[]> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_versions")
    .select("id, contract_id, version, prior_version_id, redline_summary, created_at")
    .eq("contract_id", contractId)
    .order("version", { ascending: false });
  return (data ?? []) as ContractVersionRow[];
}

export async function listMilestones(contractId: string): Promise<ContractMilestoneRow[]> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_milestones")
    .select(
      "id, contract_id, label, due_at, trigger_kind, payment_amount_minor, payment_currency, invoice_kind, state, satisfied_at",
    )
    .eq("contract_id", contractId)
    .order("due_at", { ascending: true });
  return (data ?? []) as ContractMilestoneRow[];
}

export async function listObligations(contractId: string): Promise<ContractObligationRow[]> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_obligations")
    .select("id, contract_id, ob_kind, description, recurring, due_at, state")
    .eq("contract_id", contractId)
    .order("due_at", { ascending: true });
  return (data ?? []) as ContractObligationRow[];
}

export async function listSignatures(contractId: string): Promise<ContractSignatureRow[]> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_signatures")
    .select("id, contract_id, version_id, signer_party_id, signing_role, state, signature_method, signed_at")
    .eq("contract_id", contractId);
  return (data ?? []) as ContractSignatureRow[];
}

export async function listParties(contractId: string): Promise<ContractPartyRow[]> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_parties")
    .select("id, contract_id, party_id, role, signing_capacity")
    .eq("contract_id", contractId);
  return (data ?? []) as ContractPartyRow[];
}

export async function listTerms(contractId: string): Promise<ContractTermRow[]> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_terms")
    .select("id, contract_id, term_kind, description, active")
    .eq("contract_id", contractId);
  return (data ?? []) as ContractTermRow[];
}

/** Largest existing version number for a contract, or 0 if none. */
export async function maxVersion(contractId: string): Promise<number> {
  const sb = await loose();
  const { data } = await sb
    .from("contract_versions")
    .select("version")
    .eq("contract_id", contractId)
    .order("version", { ascending: false })
    .limit(1);
  const rows = (data ?? []) as Array<{ version: number }>;
  return rows[0]?.version ?? 0;
}

const KIND_LABELS: Record<ContractKind, string> = {
  sponsor_deal: "Sponsor Deal",
  vendor_sow: "Vendor SOW",
  master_services: "Master Services",
  talent_booking: "Talent Booking",
  employment_equivalent: "Employment-Equivalent",
  ip_license: "IP License",
  partnership: "Partnership",
  nda: "NDA",
  vendor_prequal: "Vendor Prequal",
  rental_agreement: "Rental Agreement",
  venue_agreement: "Venue Agreement",
  other: "Other",
};
export function contractKindLabel(kind: string): string {
  return KIND_LABELS[kind as ContractKind] ?? kind;
}

const BILLING_LABELS: Record<ContractBillingMethod, string> = {
  lump_sum: "Lump Sum",
  time_and_materials: "Time & Materials",
  cost_plus_fee: "Cost Plus Fee",
  cost_plus_gmp: "Cost Plus GMP",
  unit_price: "Unit Price",
  milestone: "Milestone",
};
export function contractBillingLabel(method: string): string {
  return BILLING_LABELS[method as ContractBillingMethod] ?? method;
}

/** Minor units (cents) → display dollars string. */
export function formatMinor(minor: number | null, currency: string | null): string {
  if (minor == null) return "—";
  return formatMoney(minor, currency ?? "USD");
}
