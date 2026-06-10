import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  OfferLetter,
  OfferLetterResolved,
  OfferLetterActivity,
  CrewMemberOption,
  OrgRoleOption,
  VenueOption,
  RateCardOption,
} from "./types";

// ── ADMIN READS (org-scoped, RLS-gated) ─────────────────────────────────────

export async function listOfferLetters(orgId: string, projectId?: string): Promise<OfferLetterResolved[]> {
  const supabase = await createClient();
  let q = supabase.from("offer_letters_resolved").select("*").eq("org_id", orgId);
  if (projectId) q = q.eq("project_id", projectId);
  // View rows are generated all-nullable + Json — shape to the app contract.
  const { data } = await q.order("recipient_name", { ascending: true }).returns<OfferLetterResolved[]>();
  return data ?? [];
}

/** Returns the *raw* row + resolved view in parallel. Admin needs both — the
 * raw FK columns for the editor, and the resolved view for the preview. */
export async function getOfferLetter(
  orgId: string,
  id: string,
): Promise<{ raw: OfferLetter; resolved: OfferLetterResolved } | null> {
  const supabase = await createClient();
  // JSONB columns (schedule_items, onboarding_items, snapshot, …) carry typed
  // shapes the generated client can only express as Json — shape explicitly.
  const [{ data: raw }, { data: resolved }] = await Promise.all([
    supabase.from("offer_letters").select("*").eq("org_id", orgId).eq("id", id).returns<OfferLetter[]>().maybeSingle(),
    supabase
      .from("offer_letters_resolved")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", id)
      .returns<OfferLetterResolved[]>()
      .maybeSingle(),
  ]);
  if (!raw || !resolved) return null;
  return { raw, resolved };
}

export async function listOfferLetterActivity(orgId: string, letterId: string): Promise<OfferLetterActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offer_letter_activity")
    .select("*")
    .eq("org_id", orgId)
    .eq("offer_letter_id", letterId)
    .order("occurred_at", { ascending: false })
    // `meta` is JSONB with a typed shape — shape the rows to the app contract.
    .returns<OfferLetterActivity[]>();
  return data ?? [];
}

// ── PICKER OPTIONS (for admin FK selectors) ─────────────────────────────────

export async function listCrewMembers(orgId: string): Promise<CrewMemberOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crew_members")
    .select("id,name,email,phone,role")
    .eq("org_id", orgId)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function listOrgRoles(orgId: string): Promise<OrgRoleOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_roles")
    .select("id,slug,label,department")
    .eq("org_id", orgId)
    .order("label", { ascending: true });
  return data ?? [];
}

export async function listVenues(orgId: string, projectId: string): Promise<VenueOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venues")
    .select("id,name,locations(city)")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("name", { ascending: true })
    // venues.location_id → locations FK is not in the generated relationship
    // metadata, so the embed can't be inferred — shape explicitly.
    .returns<Array<{ id: string; name: string; locations: { city: string | null } | null }>>();
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, city: r.locations?.city ?? null }));
}

export async function listRateCardItems(orgId: string, catalog = "crew_day_rates"): Promise<RateCardOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rate_card_items")
    .select("id,sku,name,unit_price_cents")
    .eq("org_id", orgId)
    .eq("catalog", catalog)
    .eq("active", true)
    .order("name", { ascending: true });
  return data ?? [];
}

// ── PUBLIC ACCESS (RPCs returning JSONB — snapshot or resolved) ─────────────
//
// These RPCs are SECURITY DEFINER token-gated functions. EXECUTE was revoked
// from anon/authenticated/public to keep the auto-exposed PostgREST surface
// minimal — only service_role can call them now. The token+code parameters
// remain the only authorization the functions trust internally; the service
// client just gives us a callable surface that doesn't leak the function to
// the public API.

export async function getOfferLetterByToken(token: string, code: string): Promise<OfferLetterResolved | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_offer_letter_by_token", {
    p_token: token,
    p_code: code,
  });
  if (error || !data) return null;
  // RPC declares `Returns: Json` — the JSONB payload is a resolved letter.
  return data as OfferLetterResolved;
}

export async function recordOfferLetterView(token: string, code: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("record_offer_letter_view", { p_token: token, p_code: code });
}

export async function acceptOfferLetterByToken(
  token: string,
  code: string,
  signature: string,
  ip: string | null,
  userAgent: string | null,
): Promise<OfferLetterResolved> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_offer_letter", {
    p_token: token,
    p_code: code,
    p_signature: signature,
    p_ip: ip,
    p_user_agent: userAgent ?? "",
  });
  if (error) throw new Error(error.message);
  // RPC declares `Returns: Json` — the JSONB payload is a resolved letter.
  return data as OfferLetterResolved;
}

export async function declineOfferLetterByToken(
  token: string,
  code: string,
  reason: string,
): Promise<OfferLetterResolved> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decline_offer_letter", {
    p_token: token,
    p_code: code,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  // RPC declares `Returns: Json` — the JSONB payload is a resolved letter.
  return data as OfferLetterResolved;
}
