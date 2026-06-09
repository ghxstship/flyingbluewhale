"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

const Schema = z.object({
  label: z.string().min(1).max(200),
  doc_kind: z.enum(["id", "license", "tax", "contract", "medical", "other"]),
});

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB — covers a passport scan, PDF contract, etc.

export async function uploadPersonalDoc(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isServiceClientAvailable()) redirect("/m/docs?error=upload-unavailable");

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/m/docs/new?error=missing-file");
  const f = file as File;
  if (f.size > MAX_SIZE_BYTES) redirect("/m/docs/new?error=too-large");

  const parsed = Schema.safeParse({ label: fd.get("label"), doc_kind: fd.get("doc_kind") });
  if (!parsed.success) redirect("/m/docs/new?error=invalid");

  // Path is {org_id}/{user_id}/{timestamp}-{sanitized-filename}. Matches
  // migration 0045 storage RLS (path[1] must be a member-org). The
  // service-role client bypasses RLS, but we still maintain the layout
  // so a future migration can flip the bucket to user-uploads and the
  // path layout will already comply.
  const safeName = (f.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const storagePath = `${session.orgId}/${session.userId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await f.arrayBuffer());

  const service = createServiceClient();
  const { error: uploadErr } = await service.storage.from("personal-documents").upload(storagePath, buffer, {
    contentType: f.type || "application/octet-stream",
    cacheControl: "private, max-age=0",
    upsert: false,
  });
  if (uploadErr) redirect("/m/docs/new?error=upload-failed");

  const supabase = await createClient();
  const { error } = await supabase.from("personal_documents").insert({
    org_id: session.orgId,
    user_id: session.userId,
    label: parsed.data!.label,
    doc_kind: parsed.data!.doc_kind,
    storage_path: storagePath,
    mime_type: f.type || null,
    size_bytes: f.size,
  });
  if (error) throw new Error(`Could not save document record: ${error.message}`);

  revalidatePath("/m/docs");
  redirect("/m/docs");
}

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
