import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { geoKeyFor, parsePhotoFixes, type PhotoFix, type PhotoRef } from "./photo-geo";

/**
 * Field photo upload — the server half of the capture layer.
 *
 * Uploads go through the CALLER'S client, not the service role: the
 * `storage_org_scoped_upload` policy already allows an authenticated member
 * to write into `incident-photos` when the first path segment is their
 * org_id, so RLS stays the gate and we don't hand a field form the
 * service key.
 *
 * Path layout is `{org_id}/{user_id}/{ts}-{n}-{safe-name}`, matching the
 * policy's `storage.foldername(name)[1] = org_id` check and the layout the
 * personal-documents uploader already uses.
 */

const MAX_BYTES = 10 * 1024 * 1024; // post-downscale backstop
const MAX_FILES = 10;

export type PhotoUploadResult = {
  /** Storage paths of everything that landed, in order. */
  paths: string[];
  /** The same uploads carrying their capture geotag, for callers persisting
   *  to a column that can hold one. */
  refs: PhotoRef[];
  error?: string;
};

function safeName(name: string): string {
  return (name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/**
 * Upload up to MAX_FILES images and return their storage paths, in order.
 *
 * Partial failure is reported rather than swallowed: a worker who attached
 * four photos to an injury report needs to know if only three landed. The
 * caller decides whether that blocks the submit — for incidents it must not
 * (the report matters more than the attachment), so it surfaces as a
 * warning alongside a successful insert.
 *
 * `fixes` is the per-file capture geotag, index-aligned with `files` (see
 * `parsePhotoFixes`). It is paired with its file BEFORE any filtering, so an
 * oversized or failed photo cannot shift the remaining coordinates onto the
 * wrong images — that would silently place an incident at a location nobody
 * photographed, which is worse than having no geotag at all.
 */
export async function uploadFieldPhotos(
  supabase: SupabaseClient,
  bucket: string,
  orgId: string,
  userId: string,
  files: File[],
  fixes: (PhotoFix | null)[] = [],
): Promise<PhotoUploadResult> {
  // Pair before filtering — index alignment must survive every drop below.
  const usable = files
    .map((file, i) => ({ file, fix: fixes[i] ?? null }))
    .filter(({ file }) => file && file.size > 0)
    .slice(0, MAX_FILES);
  if (!usable.length) return { paths: [], refs: [] };

  const refs: PhotoRef[] = [];
  const failed: string[] = [];
  const stamp = Date.now();

  for (const [i, { file, fix }] of usable.entries()) {
    if (file.size > MAX_BYTES) {
      failed.push(file.name);
      continue;
    }
    const path = `${orgId}/${userId}/${stamp}-${i}-${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      cacheControl: "private, max-age=0",
      upsert: false,
    });
    if (error) failed.push(file.name);
    else
      refs.push({
        path,
        lat: fix?.lat ?? null,
        lng: fix?.lng ?? null,
        accuracyM: fix?.accuracyM ?? null,
        capturedAt: fix?.capturedAt ?? null,
      });
  }

  const paths = refs.map((r) => r.path);

  if (failed.length) {
    return {
      paths,
      refs,
      error: `${failed.length} of ${usable.length} photo${usable.length > 1 ? "s" : ""} could not be uploaded.`,
    };
  }
  return { paths, refs };
}

/** Pull `File`s off a FormData key that the kit FileField serialised. */
export function filesFrom(fd: FormData, key: string): File[] {
  return fd.getAll(key).filter((v): v is File => v instanceof File && v.size > 0);
}

/**
 * Pull the capture geotags the kit FileField sent alongside `key`, normalised
 * to one entry per file. Pass the result straight to `uploadFieldPhotos`.
 */
export function fixesFrom(fd: FormData, key: string, count: number): (PhotoFix | null)[] {
  return parsePhotoFixes(fd.get(geoKeyFor(key)), count);
}
