import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OfferLetter, OfferLetterStatus } from "./types";

/** Editable FK columns + per-letter overrides (NOT the joined display fields). */
type UpdatePayload = Partial<
  Pick<
    OfferLetter,
    | "crew_member_id"
    | "role_id"
    | "reports_to_crew_member_id"
    | "venue_id"
    | "employer"
    | "classification"
    | "rate_card_item_id"
    | "per_diem_rate_card_item_id"
    | "compensation_basis"
    | "override_amount_cents"
    | "override_per_diem_cents"
    | "engagement_start"
    | "engagement_end"
    | "travel_provided"
    | "lodging_provided"
    | "meals_provided"
    | "extra_inclusions"
    | "expectations_override"
    | "terms_override"
  >
>;

export async function updateOfferLetter(orgId: string, id: string, patch: UpdatePayload): Promise<void> {
  const supabase = await createClient();
  // .select("id") so we can detect when the .eq("status", "draft") guard
  // matched no rows (caller tried to edit a non-draft letter). Without
  // this we silently no-op AND log the edit as if it succeeded — a
  // misleading audit trail.
  const { data, error } = await supabase
    .from("offer_letters")
    .update(patch)
    .eq("org_id", orgId)
    .eq("id", id)
    .eq("status", "draft")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Letter not found or no longer in draft state");
  await logActivity(orgId, id, "edited", "Letter draft edited.");
}

export async function markOfferLetterSent(orgId: string, id: string, actorLabel: string): Promise<OfferLetter> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer_letters")
    .update({ status: "sent" satisfies OfferLetterStatus, sent_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id)
    .eq("status", "draft") // only drafts can be sent
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Letter not found or not in draft state");
  await logActivity(orgId, id, "sent", "Letter marked as sent — public link active. Snapshot frozen.", actorLabel);
  await logDocumentTransition(orgId, id, "draft", "sent", actorLabel);
  return data as unknown as OfferLetter;
}

export async function withdrawOfferLetter(orgId: string, id: string, actorLabel: string): Promise<void> {
  const supabase = await createClient();
  // Read prior status so the transition log captures from_state correctly.
  const { data: prior } = await supabase
    .from("offer_letters")
    .select("status")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (!prior) throw new Error("Letter not found");
  // Hard guard: only draft + sent letters can be withdrawn. Once a
  // letter is signed (countersigned, active, etc.) it has legal force
  // and "withdrawn" is the wrong terminal state — those need
  // void/supersede semantics, which the canonical flow handles separately.
  // The .in() filter is the conditional update; .select() proves it landed.
  const { data: updated, error } = await supabase
    .from("offer_letters")
    .update({ status: "withdrawn" satisfies OfferLetterStatus, withdrawn_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id)
    .in("status", ["draft", "sent"])
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Cannot withdraw a signed/active letter — use void/supersede instead");
  }
  await logActivity(orgId, id, "withdrawn", "Letter withdrawn — public link disabled.", actorLabel);
  await logDocumentTransition(orgId, id, prior.status, "withdrawn", actorLabel);
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

/**
 * LDP §6 Engagement-Document Lifecycle — append a typed row to the
 * polymorphic document_state_transitions log. Best-effort; a log failure
 * does NOT block the underlying state change (which is captured by the
 * legacy offer_letter_activity table above).
 */
async function logDocumentTransition(
  orgId: string,
  letterId: string,
  fromStatus: string | null,
  toStatus: string,
  actorLabel?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("document_state_transitions").insert({
    org_id: orgId,
    document_kind: "offer_letter",
    document_id: letterId,
    from_status: fromStatus,
    to_status: toStatus,
    reason: actorLabel ? `By ${actorLabel}` : null,
  });
  if (error) {
    // Non-fatal — offer_letter_activity remains the legacy log of record.
    console.warn(`document_state_transitions insert failed: ${error.message}`);
  }
}
