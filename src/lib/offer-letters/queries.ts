import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OfferLetter, OfferLetterActivity } from "./types";

export async function listOfferLetters(orgId: string, projectId?: string): Promise<OfferLetter[]> {
  const supabase = await createClient();
  let q = supabase.from("offer_letters").select("*").eq("org_id", orgId);
  if (projectId) q = q.eq("project_id", projectId);
  const { data } = await q.order("recipient_name", { ascending: true });
  return ((data ?? []) as unknown as OfferLetter[]) ?? [];
}

export async function getOfferLetter(orgId: string, id: string): Promise<OfferLetter | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("offer_letters").select("*").eq("org_id", orgId).eq("id", id).maybeSingle();
  return (data as unknown as OfferLetter) ?? null;
}

export async function listOfferLetterActivity(orgId: string, letterId: string): Promise<OfferLetterActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offer_letter_activity")
    .select("*")
    .eq("org_id", orgId)
    .eq("offer_letter_id", letterId)
    .order("occurred_at", { ascending: false });
  return ((data ?? []) as unknown as OfferLetterActivity[]) ?? [];
}

/**
 * Public read — used by the /offer/[token] route. Resolves a letter by its
 * public token + access code, bypassing org-member RLS via a SECURITY DEFINER
 * RPC. Returns null when the token/code combo is invalid, expired, or
 * the letter has been withdrawn.
 */
export async function getOfferLetterByToken(token: string, code: string): Promise<OfferLetter | null> {
  // Use the service client so the anon role is not subject to org-member RLS.
  // The RPC itself enforces token + access code matching.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_offer_letter_by_token", {
    p_token: token,
    p_code: code,
  });
  if (error || !data) return null;
  // RPC returns offer_letters composite type. When the underlying row is missing
  // (invalid token, withdrawn, expired) plpgsql `return null` still emits a row
  // of all-NULL fields rather than a SQL NULL — so we must check the primary
  // key explicitly before treating the row as a real letter.
  const row = data as unknown as OfferLetter & { id: string | null };
  if (!row.id) return null;
  return row as OfferLetter;
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
): Promise<OfferLetter> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_offer_letter", {
    p_token: token,
    p_code: code,
    p_signature: signature,
    p_ip: ip,
    p_user_agent: userAgent ?? "",
  });
  if (error) throw new Error(error.message);
  const row = data as unknown as OfferLetter & { id: string | null };
  if (!row?.id) throw new Error("Letter not found or no longer accepting signatures");
  return row as OfferLetter;
}

export async function declineOfferLetterByToken(token: string, code: string, reason: string): Promise<OfferLetter> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decline_offer_letter", {
    p_token: token,
    p_code: code,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  const row = data as unknown as OfferLetter & { id: string | null };
  if (!row?.id) throw new Error("Letter not found");
  return row as OfferLetter;
}
