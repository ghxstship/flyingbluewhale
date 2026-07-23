"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const BUCKET = "procore-parity";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

const Schema = z.object({
  projectId: z.string().uuid("Pick a project"),
  album: z.string().max(80).optional(),
  caption: z.string().max(280).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  uploaded?: number;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

function safeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "photo";
}

export async function uploadPhotosAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    projectId: fd.get("projectId"),
    album: fd.get("album") || undefined,
    caption: fd.get("caption") || undefined,
  });
  if (!parsed.success) return formFail(parsed.error, fd);

  const files = fd.getAll("files").filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return { error: actionErrorMessage("pick-at-least-one-photo", "Pick at least one photo") };
  if (files.length > 20) return { error: actionErrorMessage("maximum-20-photos-per-upload", "Maximum 20 photos per upload") };
  for (const f of files) {
    if (f.size > MAX_BYTES) return { error: `${f.name} exceeds 25 MB` };
    if (f.type && !ALLOWED_MIME.has(f.type)) return { error: `${f.name}: unsupported type ${f.type}` };
  }

  const supabase = await createClient();

  // Verify the project belongs to the caller's org AND is not
  // soft-deleted before mounting any storage path. Without the
  // deleted_at filter, photos would upload successfully against a
  // deleted project, orphaning bytes that no console view surfaces.
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (projErr) return { error: projErr.message };
  if (!project) return { error: actionErrorMessage("not-found.project-2", "Project not found") };

  const stamp = Date.now();
  const rows: Array<{
    org_id: string;
    project_id: string;
    album: string | null;
    file_path: string;
    caption: string | null;
    taken_by: string;
  }> = [];
  const uploadedPaths: string[] = [];

  // Best-effort cleanup of any storage objects we wrote before hitting an
  // error. Without this, a 3rd-of-5 upload failure (or a DB insert
  // failure) orphans the first uploaded objects: bytes that nothing in
  // the app references but that still bill against storage.
  const cleanup = async (reason: string) => {
    if (uploadedPaths.length === 0) return;
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(uploadedPaths);
    if (rmErr) {
      // Don't surface the cleanup failure — the original error already
      // carries the user-facing message. Just log it.
      log.warn("photos.upload.cleanup_failed", { reason, paths: uploadedPaths.length, err: rmErr.message });
    }
  };

  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const path = `${session.orgId}/photos/${parsed.data.projectId}/${stamp}-${i}-${safeFilename(f.name)}`;
    const buf = await f.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: f.type || "application/octet-stream", upsert: false });
    if (upErr) {
      await cleanup(`upload_failed_${f.name}`);
      return { error: `Upload failed for ${f.name}: ${upErr.message}` };
    }
    uploadedPaths.push(path);
    rows.push({
      org_id: session.orgId,
      project_id: parsed.data.projectId,
      album: parsed.data.album?.trim() || null,
      file_path: path,
      caption: parsed.data.caption?.trim() || null,
      taken_by: session.userId,
    });
  }

  const { error: insErr } = await supabase.from("project_photos").insert(rows);
  if (insErr) {
    await cleanup("db_insert_failed");
    return { error: `DB insert failed: ${insErr.message}` };
  }

  revalidatePath("/studio/photos");
  redirect(
    parsed.data.album ? `/studio/photos?album=${encodeURIComponent(parsed.data.album.trim())}` : "/studio/photos",
  );
}
