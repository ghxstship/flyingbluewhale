import "server-only";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import type { CompensationBasis, OfferLetter, OfferLetterStatus } from "./types";

/** Fields the roster assign flow (kit 30) supplies when creating a letter. */
export type CreateOfferLetterInput = {
  project_id: string;
  crew_member_id: string;
  role_id: string;
  reports_to_crew_member_id?: string | null;
  rate_card_item_id?: string | null;
  compensation_basis?: CompensationBasis;
  onsite_start_date?: string | null;
  onsite_end_date?: string | null;
  expectations_override?: string | null;
  created_by?: string | null;
};

/**
 * Kit 30 (additive) — the canonical CREATE path for offer letters. Before
 * this the table was seeded out-of-band; the project-roster Assign drawer is
 * the first in-app author. Employer/classification default from
 * org_offer_letter_settings (falling back to the schema's most common
 * pairing), the access code comes from the same RPC the rotate flow uses,
 * and the letter lands in `draft` so the existing send flow stays the one
 * state machine.
 */
export async function createOfferLetter(
  orgId: string,
  input: CreateOfferLetterInput,
  actorLabel?: string,
): Promise<OfferLetter> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("org_offer_letter_settings")
    .select("default_employer, default_classification")
    .eq("org_id", orgId)
    .maybeSingle();

  const { data: code, error: codeError } = await supabase.rpc("generate_offer_access_code");
  if (codeError) throw new Error(codeError.message);

  const { data, error } = await supabase
    .from("offer_letters")
    .insert({
      org_id: orgId,
      project_id: input.project_id,
      crew_member_id: input.crew_member_id,
      role_id: input.role_id,
      reports_to_crew_member_id: input.reports_to_crew_member_id ?? null,
      rate_card_item_id: input.rate_card_item_id ?? null,
      compensation_basis: input.compensation_basis ?? "tbd",
      onsite_start_date: input.onsite_start_date ?? null,
      onsite_end_date: input.onsite_end_date ?? null,
      expectations_override: input.expectations_override ?? null,
      created_by: input.created_by ?? null,
      access_code: code as unknown as string,
      employer: settings?.default_employer ?? "ghxstship",
      classification: settings?.default_classification ?? "1099",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const letter = data as unknown as OfferLetter;
  await logActivity(orgId, letter.id, "created", "Letter created from the project roster.", actorLabel);
  return letter;
}

/**
 * Kit 30 (additive) — repoint the reporting edge on a person's live letters
 * for one project. Deliberately NOT routed through `updateOfferLetter`: that
 * helper hard-guards `letter_state = 'draft'`, while the reporting line is an
 * operational edge the org restructures after signature (the reporting-tree
 * surface exists precisely for that). Only `reports_to_crew_member_id`
 * moves; every touched letter gets an activity row.
 */
export async function setOfferLetterReportsTo(
  orgId: string,
  projectId: string,
  crewMemberIds: string[],
  reportsToCrewMemberId: string | null,
  actorLabel?: string,
): Promise<number> {
  if (crewMemberIds.length === 0) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer_letters")
    .update({ reports_to_crew_member_id: reportsToCrewMemberId })
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .in("crew_member_id", crewMemberIds)
    .in("letter_state", ["draft", "sent", "viewed", "accepted", "countersigned", "active"])
    .select("id");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ id: string }>;
  await Promise.all(
    rows.map((r) =>
      logActivity(
        orgId,
        r.id,
        "reports_to_updated",
        reportsToCrewMemberId ? "Reporting line updated from the project roster." : "Reporting line cleared.",
        actorLabel,
      ),
    ),
  );
  return rows.length;
}

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
    | "travel_in_date"
    | "onsite_start_date"
    | "onsite_end_date"
    | "travel_out_date"
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
  // .select("id") so we can detect when the .eq("letter_state", "draft") guard
  // matched no rows (caller tried to edit a non-draft letter). Without
  // this we silently no-op AND log the edit as if it succeeded — a
  // misleading audit trail.
  const { data, error } = await supabase
    .from("offer_letters")
    .update(patch)
    .eq("org_id", orgId)
    .eq("id", id)
    .eq("letter_state", "draft")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Letter not found or no longer in draft state");
  await logActivity(orgId, id, "edited", "Letter draft edited.");
}

export async function markOfferLetterSent(orgId: string, id: string, actorLabel: string): Promise<OfferLetter> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer_letters")
    .update({ letter_state: "sent" satisfies OfferLetterStatus, sent_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id)
    .eq("letter_state", "draft") // only drafts can be sent
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
    .select("letter_state")
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
    .update({ letter_state: "withdrawn" satisfies OfferLetterStatus, withdrawn_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id)
    .in("letter_state", ["draft", "sent"])
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Cannot withdraw a signed/active letter — use void/supersede instead");
  }
  await logActivity(orgId, id, "withdrawn", "Letter withdrawn — public link disabled.", actorLabel);
  await logDocumentTransition(orgId, id, prior.letter_state, "withdrawn", actorLabel);
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
    from_state: fromStatus,
    to_state: toStatus,
    reason: actorLabel ? `By ${actorLabel}` : null,
  });
  if (error) {
    // Non-fatal — offer_letter_activity remains the legacy log of record.
    log.warn("offer_letter.state_transitions_insert_failed", { err: error.message });
  }
}
