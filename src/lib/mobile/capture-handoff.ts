"use client";

/**
 * Capture → form attach handoff (T1-5 expansion, destination "Attach to…").
 *
 * A `File` cannot cross a client navigation, so the Capture screen stages
 * the shot in the EXISTING offline photo-blob store (IndexedDB,
 * `lib/offline/photo-blobs`) under a well-known ref, deep-links the target
 * form with `?photo=<ref>`, and the form's photo section collects it on
 * mount. The blob-store metas (filename/type/geotag) ride sessionStorage —
 * same tab, same session, exactly the handoff lifetime.
 *
 * CONVERGENCE NOTE (T1-1 coordination): the shared photo-outbox API being
 * built there is described as `enqueuePhoto(surfaceKey, recordRef, blob,
 * meta)`. This module is shaped to map onto it (`stage` ≈ enqueue with
 * surfaceKey "attach", ref ≈ recordRef) — but the attach flow additionally
 * needs READ-BACK + CONSUME semantics (`takeStagedCapture`), which an
 * enqueue-only signature does not provide. Flagging the mismatch rather
 * than blocking: when T1-1 lands a dequeue/read API, swap the storage calls
 * here and delete the sessionStorage sidecar.
 */

import type { PhotoFix } from "@/lib/mobile/photo-geo";
import { dropPhotos, putPhotos, readPhotos, type PhotoMeta } from "@/lib/offline/photo-blobs";

/** Query param the target forms read. */
export const ATTACH_PARAM = "photo";

const META_KEY_PREFIX = "atlvs.capture.attach.";
const REF_PREFIX = "attach-";

export type StagedCapture = { file: File; fix: PhotoFix | null };

/** Park one captured photo for a form to collect. Returns the `?photo=` ref. */
export async function stageCaptureForAttach(file: File, fix: PhotoFix | null): Promise<string> {
  const ref = `${REF_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const metas = await putPhotos(ref, [file], [fix]);
  try {
    sessionStorage.setItem(META_KEY_PREFIX + ref, JSON.stringify(metas));
  } catch {
    // Session storage blocked — drop the bytes too so nothing is orphaned,
    // and let the caller fall back to filing without the handoff.
    await dropPhotos(ref);
    throw new Error("attach handoff unavailable");
  }
  return ref;
}

/**
 * Collect (and consume) a staged capture. Returns null for an unknown,
 * expired, or already-taken ref — the form simply renders empty-handed,
 * which is the pre-handoff behavior.
 */
export async function takeStagedCapture(ref: string | null | undefined): Promise<StagedCapture | null> {
  if (!ref || !ref.startsWith(REF_PREFIX)) return null;
  let metas: PhotoMeta[] = [];
  try {
    const raw = sessionStorage.getItem(META_KEY_PREFIX + ref);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) metas = parsed as PhotoMeta[];
  } catch {
    return null;
  }
  try {
    const files = await readPhotos(ref, metas);
    const file = files[0];
    if (!file) return null;
    return { file, fix: metas[0]?.fix ?? null };
  } catch {
    return null;
  } finally {
    // Consume regardless of outcome — a ref is single-use.
    sessionStorage.removeItem(META_KEY_PREFIX + ref);
    void dropPhotos(ref);
  }
}
