import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { IndependentContractorMsa, IndependentContractorMsaResolved, CrewMemberActiveMsa } from "./types";

// ── ADMIN READS (org-scoped, RLS-gated) ─────────────────────────────────────

export async function listMsas(orgId: string): Promise<IndependentContractorMsaResolved[]> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("independent_contractor_msas_resolved")
    .select("*")
    .eq("org_id", orgId)
    .order("crew_member_name", { ascending: true });
  return ((data ?? []) as unknown as IndependentContractorMsaResolved[]) ?? [];
}

export async function getMsa(
  orgId: string,
  id: string,
): Promise<{ raw: IndependentContractorMsa; resolved: IndependentContractorMsaResolved } | null> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const [{ data: raw }, { data: resolved }] = await Promise.all([
    supabase.from("independent_contractor_msas").select("*").eq("org_id", orgId).eq("id", id).maybeSingle(),
    supabase.from("independent_contractor_msas_resolved").select("*").eq("org_id", orgId).eq("id", id).maybeSingle(),
  ]);
  if (!raw || !resolved) return null;
  return {
    raw: raw as unknown as IndependentContractorMsa,
    resolved: resolved as unknown as IndependentContractorMsaResolved,
  };
}

/** Returns the active signed MSA for a crew member (if any), used to gate
 *  offer-letter sends and render footer references. */
export async function getActiveMsaForCrew(crewMemberId: string): Promise<CrewMemberActiveMsa | null> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase.rpc("crew_member_active_msa", { p_crew_member_id: crewMemberId });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as unknown as CrewMemberActiveMsa;
}

// ── PUBLIC ACCESS (token-gated RPCs) ────────────────────────────────────────

export async function getMsaByToken(token: string, code: string): Promise<IndependentContractorMsaResolved | null> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase.rpc("get_msa_by_token", { p_token: token, p_code: code });
  if (error || !data) return null;
  return data as unknown as IndependentContractorMsaResolved;
}

export async function recordMsaView(token: string, code: string): Promise<void> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase.rpc("record_msa_view", { p_token: token, p_code: code });
}
