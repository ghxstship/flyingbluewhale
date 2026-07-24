"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

/**
 * Personal-document download signing.
 *
 * `uploadPersonalDoc` moved to `src/components/workforce/docs-action.ts` in
 * ADR-0008 Amendment 4 — the portal needed to upload too, and the write has
 * no field-capability dependency (the file input carries no `capture`), so
 * under the capability rule it belongs in both shells.
 *
 * The signer stays here: it is already reached cross-shell through
 * `DocDownloadLink`, which `DocsSurface` imports from this module no matter
 * which shell mounts it. Moving it would churn imports without changing a
 * boundary.
 */

const DownloadSchema = z.object({ id: z.string().uuid() });

export async function signDocumentUrl(input: { id: string }): Promise<string | null> {
  const session = await requireSession();
  if (!isServiceClientAvailable()) return null;
  const parsed = DownloadSchema.parse(input);
  const supabase = await createClient();

  // Self-owned docs only. RLS gates this too but the explicit check
  // returns null cleanly for UI fall-through.
  const { data: doc } = await supabase
    .from("personal_documents")
    .select("storage_path")
    .eq("id", parsed.id)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return null;

  const service = createServiceClient();
  const { data: signed } = await service.storage
    .from("personal-documents")
    .createSignedUrl((doc as { storage_path: string }).storage_path, 300);
  return signed?.signedUrl ?? null;
}

/**
 * Field deliverable (re)submission.
 *
 * The office briefs a doc-spec; the counterparty answers with a file. Until
 * now the answer could only travel through the portal — a crew member looking
 * at their own `revision_requested` rider on `/m/documents` had no way to
 * resubmit from the device in their hand. This closes that: same MIME
 * allowlist and org-prefixed `advancing`-bucket path as the portal upload,
 * same state machine (`draft`/`revision_requested` → `submitted`).
 *
 * Authorization is the deliverables RLS UPDATE policy verbatim: a non-manager
 * may write only their own row and only in `draft`/`revision_requested`. The
 * explicit checks below exist to return a readable error instead of the
 * silent no-op an RLS-filtered UPDATE produces — and the conditional
 * `.in("fulfillment_state", …)` + read-back guards the race where a reviewer
 * moved the row between our read and our write.
 */
const SubmitFileSchema = z.object({ id: z.string().uuid() });

// Mirror of the portal advancing allowlist: no active content (html/svg),
// nothing executable — these are served back via signed URLs.
const SUBMIT_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/zip",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
]);

export type SubmitFileState = { error?: string; ok?: true } | null;

export async function submitDeliverableFile(_prev: SubmitFileState, fd: FormData): Promise<SubmitFileState> {
  const session = await requireSession();
  const parsed = SubmitFileSchema.safeParse({ id: fd.get("id") });
  if (!parsed.success) return { error: "Invalid submission." };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to submit." };
  if (file.size > 25 * 1024 * 1024) return { error: "File exceeds 25MB." };
  const mime = (file.type || "").toLowerCase();
  if (mime && !SUBMIT_ALLOWED_MIME.has(mime)) return { error: `Unsupported file type: ${mime}` };

  const supabase = await createClient();
  const { data: deliv } = await supabase
    .from("deliverables")
    .select("id, org_id, project_id, type, fulfillment_state, submitted_by, version")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!deliv) return { error: "Document not found." };
  if (deliv.submitted_by !== session.userId) {
    return { error: "Only the original submitter can resubmit this document." };
  }
  if (deliv.fulfillment_state !== "draft" && deliv.fulfillment_state !== "revision_requested") {
    return { error: "This document is not open for submission." };
  }

  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${deliv.org_id}/${deliv.project_id}/${session.userId}/${Date.now()}-${deliv.type}.${ext}`;
  const { error: uploadErr } = await supabase.storage.from("advancing").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` };

  const { data: updated, error } = await supabase
    .from("deliverables")
    .update({
      file_path: path,
      fulfillment_state: "submitted",
      submitted_at: new Date().toISOString(),
      version: deliv.version + 1,
    })
    .eq("id", deliv.id)
    .is("deleted_at", null)
    .in("fulfillment_state", ["draft", "revision_requested"])
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "This document is not open for submission." };

  revalidatePath("/m/documents");
  return { ok: true };
}
