"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { applyRecipientDelivery, type AdvanceContact } from "@/lib/db/advance-packets";
import { getSubmissionSchema } from "@/lib/advancing/submission-schemas";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Recipient portal actions (kit 27, Phase 3 — submissions).
 *
 * Recipients are external counterparties with no account: their unique
 * portal token IS the credential, so every action re-resolves the token
 * server-side through the service-role client (never trusts client ids)
 * and scopes each write to the resolved recipient's own rows.
 */

export type PortalState = { error?: string; ok?: true } | null;

type ResolvedRecipient = {
  id: string;
  org_id: string;
  audience_id: string | null;
  delivery_state: string;
  contact: AdvanceContact;
  packet_id: string;
};

async function resolveRecipient(svc: LooseSupabase, token: string): Promise<ResolvedRecipient | null> {
  if (!token || token.length < 16) return null;
  const { data } = (await svc
    .from("advance_send_recipients")
    .select("id, org_id, audience_id, delivery_state, contact, advance_send_batches!inner(packet_id)")
    .eq("portal_token", token)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data:
      | (Omit<ResolvedRecipient, "packet_id"> & { advance_send_batches: { packet_id: string } | null })
      | null;
  };
  if (!data?.advance_send_batches) return null;
  return {
    id: data.id,
    org_id: data.org_id,
    audience_id: data.audience_id,
    delivery_state: data.delivery_state,
    contact: data.contact,
    packet_id: data.advance_send_batches.packet_id,
  };
}

async function guardSection(
  svc: LooseSupabase,
  recipient: ResolvedRecipient,
  sectionId: string,
): Promise<{ id: string; submission_schema_key: string | null } | null> {
  const { data } = (await svc
    .from("advance_packet_sections")
    .select("id, submission_schema_key")
    .eq("id", sectionId)
    .eq("packet_id", recipient.packet_id)
    .is("deleted_at", null)
    .maybeSingle()) as { data: { id: string; submission_schema_key: string | null } | null };
  return data;
}

/** Add one structured row to the recipient's draft submission for a section. */
export async function addSubmissionRowAction(
  slug: string,
  token: string,
  sectionId: string,
  _: PortalState,
  fd: FormData,
): Promise<PortalState> {
  if (!isServiceClientAvailable()) return { error: "Submissions are unavailable right now" };
  const svc = createServiceClient() as unknown as LooseSupabase;
  const recipient = await resolveRecipient(svc, token);
  if (!recipient) return { error: "This advance link is no longer valid" };
  const section = await guardSection(svc, recipient, sectionId);
  if (!section) return { error: "Section not found" };
  const schema = getSubmissionSchema(section.submission_schema_key);
  if (!schema) return { error: "This section does not take structured rows" };

  const row: Record<string, unknown> = {};
  for (const column of schema.columns) {
    const raw = fd.get(column.key);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (column.required && !value) return { error: `${column.label} is required` };
    if (!value) continue;
    row[column.key] = column.kind === "number" ? Number(value) : value;
  }
  if (Object.keys(row).length === 0) return { error: "Fill in at least one field" };

  const { data: existing } = (await svc
    .from("advance_submissions")
    .select("id, rows, submission_state")
    .eq("recipient_id", recipient.id)
    .eq("section_id", section.id)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data: { id: string; rows: Array<Record<string, unknown>>; submission_state: string } | null;
  };

  if (existing) {
    if (existing.submission_state === "accepted") return { error: "This section is already accepted" };
    // Line-item adds/changes after initial submission are the normal case
    // (the CMR adds/changes thread) — appending re-opens a returned draft.
    const nextRows = [...(existing.rows ?? []), row];
    const patch: Record<string, unknown> = { rows: nextRows };
    if (existing.submission_state === "returned") patch.submission_state = "draft";
    const { error } = (await svc
      .from("advance_submissions")
      .update(patch)
      .eq("id", existing.id)) as { error: { message: string } | null };
    if (error) return { error: error.message };
  } else {
    const { error } = (await svc.from("advance_submissions").insert({
      org_id: recipient.org_id,
      recipient_id: recipient.id,
      section_id: section.id,
      schema_key: schema.key,
      rows: [row],
    })) as { error: { message: string } | null };
    if (error) return { error: error.message };
  }

  await applyRecipientDelivery(svc, recipient.id, "started", { reason: "first submission row" });
  revalidatePath(`/p/${slug}/advancing`);
  return { ok: true };
}

/** Mark a section's draft as submitted; advance the funnel when all required sections are in. */
export async function submitSectionAction(slug: string, token: string, sectionId: string): Promise<void> {
  if (!isServiceClientAvailable()) return;
  const svc = createServiceClient() as unknown as LooseSupabase;
  const recipient = await resolveRecipient(svc, token);
  if (!recipient) return;
  const section = await guardSection(svc, recipient, sectionId);
  if (!section) return;

  const { data: submission } = (await svc
    .from("advance_submissions")
    .select("id, submission_state")
    .eq("recipient_id", recipient.id)
    .eq("section_id", section.id)
    .is("deleted_at", null)
    .maybeSingle()) as { data: { id: string; submission_state: string } | null };
  if (!submission || (submission.submission_state !== "draft" && submission.submission_state !== "returned")) return;

  // soft-delete-exempt: state-guarded transition update returning id, not a read
  const { data: updated } = (await svc
    .from("advance_submissions")
    .update({ submission_state: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", submission.id)
    .eq("submission_state", submission.submission_state)
    .select("id")) as { data: Array<{ id: string }> | null };
  if (!updated || updated.length === 0) return;
  await svc.from("advance_submission_state_transitions").insert({
    org_id: recipient.org_id,
    submission_id: submission.id,
    from_state: submission.submission_state,
    to_state: "submitted",
    reason: "portal submit",
  });

  // All required assigned sections submitted → the recipient is submitted.
  let allDone = true;
  if (recipient.audience_id) {
    const { data: required } = (await svc
      .from("advance_section_assignments")
      .select("section_id")
      .eq("audience_id", recipient.audience_id)
      .eq("requirement", "required")
      .is("deleted_at", null)) as { data: Array<{ section_id: string }> | null };
    const requiredIds = (required ?? []).map((r) => r.section_id);
    if (requiredIds.length > 0) {
      const { data: done } = (await svc
        .from("advance_submissions")
        .select("section_id")
        .eq("recipient_id", recipient.id)
        .in("section_id", requiredIds)
        .in("submission_state", ["submitted", "accepted"])
        .is("deleted_at", null)) as { data: Array<{ section_id: string }> | null };
      const doneIds = new Set((done ?? []).map((d) => d.section_id));
      allDone = requiredIds.every((id) => doneIds.has(id));
    }
  }
  if (allDone) {
    await applyRecipientDelivery(svc, recipient.id, "submitted", { reason: "all required sections submitted" });
  }
  revalidatePath(`/p/${slug}/advancing`);
}
