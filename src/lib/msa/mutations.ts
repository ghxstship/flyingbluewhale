import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExhibitBOtherClient, ExhibitCCapitalItem, IndependentContractorMsaResolved } from "./types";

// ── ADMIN MUTATIONS (org-scoped, RLS-gated) ─────────────────────────────────

/** Create a new draft MSA for a crew member. Issues a public_token + access_code
 *  and snapshots the org's current default_terms + governing law so the
 *  contractor sees the exact text they're signing (frozen at draft time, not
 *  re-pulled at sign time). Caller verifies no active MSA already exists. */
export async function createMsaDraft(orgId: string, crewMemberId: string): Promise<string> {
  const supabase = await createClient();

  // Snapshot terms + governing law at draft time so the contractor reviews
  // exactly what they will sign.
  const { data: settings } = await supabase
    .from("org_offer_letter_settings")
    .select("default_terms, default_governing_law")
    .eq("org_id", orgId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("independent_contractor_msas")
    .insert({
      org_id: orgId,
      crew_member_id: crewMemberId,
      msa_status: "draft",
      body_snapshot: (settings as { default_terms?: string } | null)?.default_terms ?? null,
      governing_law_snapshot: (settings as { default_governing_law?: string } | null)?.default_governing_law ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

/** Flip status from draft → sent (after admin reviews + emails the link). */
export async function markMsaSent(orgId: string, msaId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("independent_contractor_msas")
    .update({ msa_status: "sent", sent_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", msaId)
    .eq("msa_status", "draft");
  if (error) throw new Error(error.message);
}

export async function revokeMsa(orgId: string, msaId: string, reason: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("independent_contractor_msas")
    .update({
      msa_status: "revoked",
      revoked_at: new Date().toISOString(),
      revoke_reason: reason,
    })
    .eq("org_id", orgId)
    .eq("id", msaId);
  if (error) throw new Error(error.message);
}

// ── PUBLIC SIGNING (SECURITY DEFINER RPC) ───────────────────────────────────

export async function signMsaByToken(
  token: string,
  code: string,
  signature: string,
  exhibitB: ExhibitBOtherClient[],
  exhibitC: ExhibitCCapitalItem[],
  nscb: { license: string | null; classification: string | null; monetaryLimitCents: number | null },
  ip: string | null,
  userAgent: string | null,
): Promise<IndependentContractorMsaResolved> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sign_msa", {
    p_token: token,
    p_code: code,
    p_signature: signature,
    p_exhibit_b: exhibitB,
    p_exhibit_c: exhibitC,
    // RPC generated types declare these as non-null; the underlying SQL
    // function tolerates nulls (NSCB only applies to Nevada engagements).
    // Cast to satisfy the type signature without losing the nullable intent.
    p_nscb_license: nscb.license as string,
    p_nscb_classification: nscb.classification as string,
    p_nscb_monetary_limit_cents: nscb.monetaryLimitCents as number,
    p_ip: ip,
    p_user_agent: userAgent ?? "",
  });
  if (error) throw new Error(error.message);
  return data as unknown as IndependentContractorMsaResolved;
}
