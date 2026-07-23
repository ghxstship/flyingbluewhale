"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { filesFrom, fixesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";

/**
 * Camera-first capture → daily-log filing (T1-5, CompanyCam mechanic).
 *
 * A capture is a daily-log photo whose project was chosen by the geofence
 * resolver instead of a form. Storage path is EXACTLY the existing daily-log
 * pipeline: the `procore-parity` bucket via `uploadFieldPhotos` (caller's
 * client, RLS-gated) + a `daily_log_photos` row on today's log for the
 * project — so the console's daily-log surfaces see captures with zero new
 * read paths.
 *
 * Unlike `saveDailyLog` this NEVER upserts the log's scalar fields — a
 * capture must not clobber the weather/notes a foreman already wrote. It
 * finds today's log or inserts a bare draft.
 */

export type CaptureFileState = {
  error?: string;
  ok?: {
    photoId: string;
    dailyLogId: string;
    projectId: string;
  };
} | null;

const FileInput = z.object({
  projectId: z.string().uuid(),
});

/** Same bucket + layout the daily-log form writes. */
const DAILY_LOG_PHOTO_BUCKET = "procore-parity";

async function ensureTodayLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  projectId: string,
): Promise<{ id: string } | { error: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .eq("log_date", today)
    .maybeSingle();
  if (existing?.id) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("daily_logs")
    .insert({
      org_id: orgId,
      project_id: projectId,
      log_date: today,
      log_state: "draft",
      created_by: userId,
    })
    .select("id")
    .maybeSingle();
  if (error || !created?.id) return { error: error?.message ?? "Could not open today's log." };
  return { id: created.id };
}

/**
 * File one captured photo to a project's daily log for today.
 * FormData: `projectId`, `photo` (single file), `photo__geo` (capture fix).
 */
export async function fileCapturePhoto(_prev: CaptureFileState, fd: FormData): Promise<CaptureFileState> {
  const session = await requireSession();
  const parsed = FileInput.safeParse({ projectId: fd.get("projectId") });
  if (!parsed.success) return { error: "Pick a project." };
  const { projectId } = parsed.data;

  const photos = filesFrom(fd, "photo");
  if (!photos.length) return { error: "No photo to file." };

  const supabase = await createClient();

  // Org boundary: the destination project must be the caller's.
  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!proj) return { error: "That project is not in your organization." };

  const log = await ensureTodayLog(supabase, session.orgId, session.userId, projectId);
  if ("error" in log) return { error: log.error };

  const upload = await uploadFieldPhotos(
    supabase,
    DAILY_LOG_PHOTO_BUCKET,
    session.orgId,
    session.userId,
    photos.slice(0, 1),
    fixesFrom(fd, "photo", 1),
  );
  const ref = upload.refs[0];
  if (!ref) return { error: upload.error ?? "The photo could not be uploaded." };

  const { data: photoRow, error: insErr } = await supabase
    .from("daily_log_photos")
    .insert({
      org_id: session.orgId,
      daily_log_id: log.id,
      file_path: ref.path,
      taken_by: session.userId,
      lat: ref.lat,
      lng: ref.lng,
      accuracy_m: ref.accuracyM,
    })
    .select("id")
    .maybeSingle();
  if (insErr || !photoRow?.id) return { error: insErr?.message ?? "The photo could not be attached." };

  revalidatePath("/m/daily-log");
  return { ok: { photoId: photoRow.id, dailyLogId: log.id, projectId } };
}

export type PhotoNoteState = { error?: string; ok?: { noteId: string } } | null;

const NoteInput = z.object({
  note: z.string().max(2000).optional(),
  projectId: z.string().uuid().optional().or(z.literal("")),
  locationId: z.string().uuid().optional().or(z.literal("")),
});

/**
 * File one captured photo as a STANDALONE geotagged photo note
 * (`field_photo_notes`) — the "Photo note" destination. Project/location are
 * the geofence resolver's auto-filing and stay optional: a note shot outside
 * every fence is still worth keeping.
 * FormData: `photo` + `photo__geo`, optional `note`, `projectId`, `locationId`.
 */
export async function filePhotoNote(_prev: PhotoNoteState, fd: FormData): Promise<PhotoNoteState> {
  const session = await requireSession();
  const parsed = NoteInput.safeParse({
    note: fd.get("note") ?? undefined,
    projectId: fd.get("projectId") ?? "",
    locationId: fd.get("locationId") ?? "",
  });
  if (!parsed.success) return { error: "Could not read the note." };
  const v = parsed.data;

  const photos = filesFrom(fd, "photo");
  if (!photos.length) return { error: "No photo to file." };

  const supabase = await createClient();

  // Org boundary on the auto-filed refs; a foreign id degrades to null
  // rather than failing the note (the photo matters more than the link).
  let projectId: string | null = null;
  if (v.projectId) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("id", v.projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    projectId = proj?.id ?? null;
  }
  let locationId: string | null = null;
  if (v.locationId) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id")
      .eq("id", v.locationId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    locationId = loc?.id ?? null;
  }

  const upload = await uploadFieldPhotos(
    supabase,
    DAILY_LOG_PHOTO_BUCKET,
    session.orgId,
    session.userId,
    photos.slice(0, 1),
    fixesFrom(fd, "photo", 1),
  );
  const ref = upload.refs[0];
  if (!ref) return { error: upload.error ?? "The photo could not be uploaded." };

  const { data: row, error } = await supabase
    .from("field_photo_notes")
    .insert({
      org_id: session.orgId,
      project_id: projectId,
      location_id: locationId,
      created_by: session.userId,
      file_path: ref.path,
      note: v.note?.trim() || null,
      lat: ref.lat,
      lng: ref.lng,
      accuracy_m: ref.accuracyM,
      captured_at: ref.capturedAt ?? new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();
  if (error || !row?.id) return { error: error?.message ?? "The note could not be saved." };

  revalidatePath("/m/photos");
  return { ok: { noteId: row.id } };
}

export type CaptureReassignState = { error?: string; ok?: { projectId: string } } | null;

const ReassignInput = z.object({
  photoId: z.string().uuid(),
  projectId: z.string().uuid(),
});

/**
 * Undo-style reassign: move an already-filed capture to another project's
 * daily log for today. The bytes stay put — only the `daily_log_photos`
 * row re-homes.
 */
export async function reassignCapturePhoto(_prev: CaptureReassignState, fd: FormData): Promise<CaptureReassignState> {
  const session = await requireSession();
  const parsed = ReassignInput.safeParse({ photoId: fd.get("photoId"), projectId: fd.get("projectId") });
  if (!parsed.success) return { error: "Pick a project." };
  const { photoId, projectId } = parsed.data;

  const supabase = await createClient();

  const { data: photo } = await supabase
    .from("daily_log_photos")
    .select("id")
    .eq("id", photoId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!photo) return { error: "That photo is not in your organization." };

  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!proj) return { error: "That project is not in your organization." };

  const log = await ensureTodayLog(supabase, session.orgId, session.userId, projectId);
  if ("error" in log) return { error: log.error };

  // RLS can silently no-op an update — read the row back rather than trust
  // the absence of an error (chat-membership lesson).
  const { error: updErr } = await supabase
    .from("daily_log_photos")
    .update({ daily_log_id: log.id })
    .eq("id", photoId)
    .eq("org_id", session.orgId);
  if (updErr) return { error: updErr.message };
  const { data: after } = await supabase
    .from("daily_log_photos")
    .select("daily_log_id")
    .eq("id", photoId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (after?.daily_log_id !== log.id) return { error: "The photo could not be moved." };

  revalidatePath("/m/daily-log");
  return { ok: { projectId } };
}
