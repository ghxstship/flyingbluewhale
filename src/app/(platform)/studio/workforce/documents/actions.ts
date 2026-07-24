"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { actionErrorMessage } from "@/lib/errors";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

/**
 * Workforce Documents review actions — the office half of the
 * personal-documents verification loop. Field uploads land in
 * `pending_review`; this is where the manager band flips them to
 * `verified`/`rejected`.
 *
 * Authorization is triple-layered: `isManagerPlus` here (readable error), the
 * manager-band RLS UPDATE policy on `personal_documents`, and the
 * `tg_personal_documents_verification_guard` trigger (owners can't self-verify
 * even through a crafted PostgREST call). The read-back on update catches the
 * silent no-op an RLS-filtered UPDATE produces.
 */

export type ReviewState = { error?: string; ok?: true } | null;

const IdSchema = z.object({ id: z.string().uuid() });
const RejectSchema = z.object({ id: z.string().uuid(), reason: z.string().min(1).max(500) });

export async function verifyPersonalDocAction(input: { id: string }): Promise<ReviewState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.verify-documents", "Only manager+ can verify documents") };
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("personal_documents")
    .update({
      verification_state: "verified",
      verified_by: session.userId,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: actionErrorMessage("not-found.document", "Document not found.") };

  revalidatePath("/studio/workforce/documents");
  return { ok: true };
}

export async function rejectPersonalDocAction(input: { id: string; reason: string }): Promise<ReviewState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.reject-documents", "Only manager+ can reject documents") };
  const parsed = RejectSchema.safeParse(input);
  if (!parsed.success) return { error: actionErrorMessage("give-the-person-a-reason-they-can-act-on", "Give the person a reason they can act on") };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("personal_documents")
    .update({
      verification_state: "rejected",
      verified_by: session.userId,
      verified_at: new Date().toISOString(),
      rejection_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: actionErrorMessage("not-found.document", "Document not found.") };

  revalidatePath("/studio/workforce/documents");
  return { ok: true };
}

/**
 * Manager view of the file under review. The row read runs on the caller's
 * client (manager-band RLS SELECT), so a non-manager gets null before the
 * service client ever signs anything.
 */
export async function signWorkforceDocUrl(input: { id: string }): Promise<string | null> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return null;
  if (!isServiceClientAvailable()) return null;
  const parsed = IdSchema.safeParse(input);
  if (!parsed.success) return null;

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("personal_documents")
    .select("storage_path")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return null;

  const service = createServiceClient();
  const { data: signed } = await service.storage
    .from("personal-documents")
    .createSignedUrl((doc as { storage_path: string }).storage_path, 300);
  return signed?.signedUrl ?? null;
}
