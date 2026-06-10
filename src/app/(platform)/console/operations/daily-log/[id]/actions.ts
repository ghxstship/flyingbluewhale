"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

// Reuse the same bucket as the project-photos uploader. Both surfaces
// are "field documentation against a project" so co-location is correct;
// adding a dedicated bucket would require migration churn for org-folder
// storage policy (0045) without a meaningful security boundary.
const PHOTO_BUCKET = "procore-parity";
const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

function safePhotoFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "photo";
}

type DailyLogStatus = "draft" | "submitted" | "approved";

// Daily-log FSM: draft → submitted → approved. Approved is terminal —
// double-approving would clobber the original approver attribution +
// timestamp.
const DAILY_LOG_TRANSITIONS: Record<DailyLogStatus, readonly DailyLogStatus[]> = {
  draft: ["submitted"],
  submitted: ["approved"],
  approved: [],
};

export async function transitionDailyLog(id: string, to: "submitted" | "approved"): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("daily_logs")
    .select("log_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Daily log not found");
  const current = (row as { log_state: DailyLogStatus }).log_state;
  const allowed = DAILY_LOG_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { log_state: to };
  if (to === "submitted") {
    patch.submitted_by = session.userId;
    patch.submitted_at = now;
  }
  if (to === "approved") {
    patch.approved_by = session.userId;
    patch.approved_at = now;
  }
  const { data: updated, error } = await supabase
    .from("daily_logs")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("log_state", current as "draft")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Daily log status changed concurrently — refresh and retry");
  }
  revalidatePath(`/console/operations/daily-log/${id}`);
  revalidatePath("/console/operations/daily-log");
}

const UploadPhotoSchema = z.object({
  dailyLogId: z.string().uuid(),
  caption: z.string().trim().max(280).optional().or(z.literal("")),
});

// Returns void to be usable as a bare `<form action>` — errors are
// logged for ops to debug rather than surfaced inline. A future
// useActionState refactor (client form shell) would let us surface
// validation errors; not in scope for this orphan-exposure pass.
export async function uploadDailyLogPhoto(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = UploadPhotoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    log.warn("daily_log_photo.invalid_input", { issues: parsed.error.issues.map((i) => i.message) });
    return;
  }
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_PHOTO_BYTES) {
    log.warn("daily_log_photo.too_large", { bytes: file.size, dailyLogId: parsed.data.dailyLogId });
    return;
  }
  if (file.type && !ALLOWED_PHOTO_MIME.has(file.type)) {
    log.warn("daily_log_photo.bad_mime", { type: file.type, dailyLogId: parsed.data.dailyLogId });
    return;
  }

  const supabase = await createClient();
  const { data: dailyLog } = await supabase
    .from("daily_logs")
    .select("id, project_id")
    .eq("id", parsed.data.dailyLogId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!dailyLog) return;

  // Org-folder-scoped path: storage policy 0045 enforces that the
  // first segment of any uploaded object must be a member org of the
  // caller. daily-log/<logId>/ inside the org prefix scopes per log.
  const path = `${session.orgId}/daily-log/${parsed.data.dailyLogId}/${Date.now()}-${safePhotoFilename(file.name)}`;
  const buf = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) {
    log.warn("daily_log_photo.upload_failed", { path, err: upErr.message });
    return;
  }

  const { error: insErr } = await supabase.from("daily_log_photos").insert({
    org_id: session.orgId,
    daily_log_id: parsed.data.dailyLogId,
    file_path: path,
    caption: parsed.data.caption?.trim() || null,
    taken_by: session.userId,
  });
  if (insErr) {
    // Roll back the upload so we don't orphan bytes when the DB insert
    // fails (typically RLS or NOT NULL surprise on a future column).
    const { error: rmErr } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    if (rmErr) log.warn("daily_log_photo.cleanup_failed", { path, err: rmErr.message });
    log.warn("daily_log_photo.insert_failed", { err: insErr.message });
    return;
  }

  revalidatePath(`/console/operations/daily-log/${parsed.data.dailyLogId}`);
}

const DeletePhotoSchema = z.object({
  dailyLogId: z.string().uuid(),
  photoId: z.string().uuid(),
});

export async function deleteDailyLogPhoto(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = DeletePhotoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("daily_log_photos")
    .select("id, file_path")
    .eq("id", parsed.data.photoId)
    .eq("daily_log_id", parsed.data.dailyLogId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!photo) return;

  const { error: rmErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([(photo as { file_path: string }).file_path]);
  if (rmErr) log.warn("daily_log_photo.storage_remove_failed", { err: rmErr.message });
  // Drop the row even if storage cleanup failed — orphaned bytes are
  // cheap, orphaned UI rows pointing at deleted bytes look broken.
  const { error: deleteError } = await supabase
    .from("daily_log_photos")
    .delete()
    .eq("id", parsed.data.photoId)
    .eq("daily_log_id", parsed.data.dailyLogId)
    .eq("org_id", session.orgId);
  if (deleteError) throw new Error(`Could not delete daily log photo: ${deleteError.message}`);

  revalidatePath(`/console/operations/daily-log/${parsed.data.dailyLogId}`);
}
