import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export type PhotoUploadResult = { paths: string[]; error?: string };

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
 */
export async function uploadFieldPhotos(
  supabase: SupabaseClient,
  bucket: string,
  orgId: string,
  userId: string,
  files: File[],
): Promise<PhotoUploadResult> {
  const usable = files.filter((f) => f && f.size > 0).slice(0, MAX_FILES);
  if (!usable.length) return { paths: [] };

  const paths: string[] = [];
  const failed: string[] = [];
  const stamp = Date.now();

  for (const [i, file] of usable.entries()) {
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
    else paths.push(path);
  }

  if (failed.length) {
    return {
      paths,
      error: `${failed.length} of ${usable.length} photo${usable.length > 1 ? "s" : ""} could not be uploaded.`,
    };
  }
  return { paths };
}

/** Pull `File`s off a FormData key that the kit FileField serialised. */
export function filesFrom(fd: FormData, key: string): File[] {
  return fd.getAll(key).filter((v): v is File => v instanceof File && v.size > 0);
}
