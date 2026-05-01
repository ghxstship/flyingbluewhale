import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OfferLetter, OfferLetterStatus } from "./types";

type UpdatePayload = Partial<
  Pick<
    OfferLetter,
    | "recipient_name"
    | "recipient_email"
    | "recipient_phone"
    | "role_title"
    | "department"
    | "employer"
    | "classification"
    | "reports_to_name"
    | "reports_to_email"
    | "work_location"
    | "engagement_start"
    | "engagement_end"
    | "compensation_cents"
    | "compensation_basis"
    | "compensation_label"
    | "payment_schedule"
    | "per_diem_cents"
    | "travel_provided"
    | "lodging_provided"
    | "meals_provided"
    | "inclusions"
    | "expectations"
    | "terms"
    | "governing_law"
    | "confidentiality"
  >
>;

export async function updateOfferLetter(orgId: string, id: string, patch: UpdatePayload): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("offer_letters").update(patch).eq("org_id", orgId).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity(orgId, id, "edited", "Letter draft edited.");
}

export async function markOfferLetterSent(orgId: string, id: string, actorLabel: string): Promise<OfferLetter> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer_letters")
    .update({ status: "sent" satisfies OfferLetterStatus, sent_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Letter not found");
  await logActivity(orgId, id, "sent", "Letter marked as sent — public link active.", actorLabel);
  return data as unknown as OfferLetter;
}

export async function withdrawOfferLetter(orgId: string, id: string, actorLabel: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("offer_letters")
    .update({ status: "withdrawn" satisfies OfferLetterStatus, withdrawn_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity(orgId, id, "withdrawn", "Letter withdrawn — public link disabled.", actorLabel);
}

export async function rotateAccessCode(orgId: string, id: string, actorLabel: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_offer_access_code");
  if (error) throw new Error(error.message);
  const code = data as unknown as string;
  const { error: e2 } = await supabase
    .from("offer_letters")
    .update({ access_code: code })
    .eq("org_id", orgId)
    .eq("id", id);
  if (e2) throw new Error(e2.message);
  await logActivity(orgId, id, "code_rotated", "Access code rotated.", actorLabel);
  return code;
}

async function logActivity(orgId: string, letterId: string, kind: string, summary: string, actorLabel?: string) {
  const supabase = await createClient();
  await supabase.from("offer_letter_activity").insert({
    org_id: orgId,
    offer_letter_id: letterId,
    kind,
    actor_label: actorLabel ?? null,
    summary,
  });
}
