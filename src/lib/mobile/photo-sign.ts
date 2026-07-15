import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalisePhotoRefs, type PhotoRef } from "./photo-geo";

/**
 * Turn stored `PhotoRef`s into URLs a browser can actually render.
 *
 * Every photo bucket except `branding` is private, so a stored path is not
 * viewable without signing. That is the step it is easy to skip, and skipping
 * it has a specific failure mode this codebase has now hit twice: photos are
 * captured, uploaded, and stored, and no surface ever shows them. Capturing
 * evidence nobody can look at is the same failure as not capturing it, one
 * step later.
 *
 * Signed through the CALLER's client, not the service role: the
 * `storage_org_scoped_read` policy already lets a member read objects under
 * their own org's prefix, so RLS stays the gate and a bug here can't leak
 * across tenants.
 *
 * Best-effort per photo. One unreachable object must not blank an entire
 * incident report or handover — a null `url` renders as a placeholder tile
 * beside the geotag, which is strictly more than nothing.
 */

/** Long enough to read a record, short enough that a copied URL isn't a
 *  durable leak. */
const SIGN_TTL_SECONDS = 600;

export type SignedPhoto = PhotoRef & { url: string | null };

export async function signPhotoRefs(
  supabase: SupabaseClient,
  bucket: string,
  photos: unknown,
  ttlSeconds = SIGN_TTL_SECONDS,
): Promise<SignedPhoto[]> {
  const refs = normalisePhotoRefs(photos);
  if (refs.length === 0) return [];
  try {
    return await Promise.all(
      refs.map(async (p) => {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(p.path, ttlSeconds);
        return { ...p, url: data?.signedUrl ?? null };
      }),
    );
  } catch {
    // Storage unreachable or misconfigured — still return the refs so the
    // caller can render the geotags and the count.
    return refs.map((p) => ({ ...p, url: null }));
  }
}

/**
 * Sign a batch of rows' photos in one pass.
 *
 * A list surface (handovers, listings) would otherwise sign per row inside a
 * render loop and serialise the round-trips.
 */
export async function signPhotoRefsFor<T extends { id: string }>(
  supabase: SupabaseClient,
  bucket: string,
  rows: T[],
  pick: (row: T) => unknown,
  ttlSeconds = SIGN_TTL_SECONDS,
): Promise<Map<string, SignedPhoto[]>> {
  const entries = await Promise.all(
    rows.map(async (r) => [r.id, await signPhotoRefs(supabase, bucket, pick(r), ttlSeconds)] as const),
  );
  return new Map(entries.filter(([, photos]) => photos.length > 0));
}
