"use client";

import type { PhotoFix } from "@/lib/mobile/photo-geo";
import {
  dropPhotos,
  hasPhoto,
  putPhotos,
  readPhotos,
  type PhotoMeta,
} from "./photo-blobs";

/**
 * Shared photo outbox (T1-1) — the daily-log photo sidecar generalized so
 * ANY field surface (incidents, lost & found, handover, custody notes) can
 * park capture bytes for an offline submission and have the app-level
 * drainer replay them, without inventing a parallel byte store.
 *
 * Same design as the sidecar it wraps (`photo-blobs.ts`): the localStorage
 * queue (`queue.ts`) stays the single source of ordering + durability; the
 * queued item's JSON payload carries a small manifest (`PhotoOutboxMeta[]`);
 * the bytes live in the ONE IndexedDB store, keyed by the queue item's id.
 * The surface key is recorded on each meta so states and audits can say
 * which intake a queued photo belongs to — it does not change the storage
 * key, because the queue item id is already surface-scoped by construction
 * (`<kind>-<ts>-<rand>`).
 *
 * Budget, persistence, and the ArrayBuffer-vs-Blob rationale are all the
 * sidecar's — see photo-blobs.ts. `PhotoBudgetExceededError` propagates so
 * a caller can tell the crew member the truth instead of overclaiming.
 */

/** Manifest entry embedded in the queued payload — everything a replay needs
 *  to find + name the bytes, never the bytes themselves. */
export type PhotoOutboxMeta = PhotoMeta & {
  /** Which intake queued it ("incident", "lost-found", "handover", …). */
  surface: string;
};

/** Per-photo state, derived from the store itself — never fabricated. */
export type QueuedPhotoState = "queued" | "missing";

/**
 * Park a submission's photos and return the manifest to embed in its queued
 * payload. `recordRef` is the queue item's id (the same id passed to
 * `enqueue`), which keeps the orphan sweep's identity model intact.
 * Throws (budget / blocked IndexedDB) — the caller must surface it.
 */
export async function enqueuePhotoBatch(
  surfaceKey: string,
  recordRef: string,
  files: File[],
  fixes: (PhotoFix | null)[],
): Promise<PhotoOutboxMeta[]> {
  const metas = await putPhotos(recordRef, files, fixes);
  return metas.map((m) => ({ ...m, surface: surfaceKey }));
}

/**
 * Park ONE photo behind whatever `recordRef` already holds. Prefer
 * `enqueuePhotoBatch` when the whole set is known (one budget check, one
 * manifest); this exists for incremental capture paths (custody notes).
 */
export async function enqueuePhoto(
  surfaceKey: string,
  recordRef: string,
  blob: Blob,
  meta: { filename?: string; contentType?: string; fix?: PhotoFix | null } = {},
): Promise<PhotoOutboxMeta> {
  // Find the next free index so a second single-photo enqueue can't clobber
  // the first — keys are `${recordRef}#${n}`.
  let n = 0;
  while (await hasPhoto(recordRef, n)) n += 1;
  const file =
    blob instanceof File
      ? blob
      : new File([blob], meta.filename ?? `photo-${n}.jpg`, { type: meta.contentType ?? (blob.type || "image/jpeg") });
  const [stored] = await putPhotos(recordRef, [file], [meta.fix ?? null], undefined, n);
  return { ...(stored as PhotoMeta), surface: surfaceKey };
}

/** Rebuild the Files for a queued submission. Missing bytes yield no File
 *  (the record itself is still worth replaying). */
export function readPhotoBatch(recordRef: string, metas: PhotoOutboxMeta[] | PhotoMeta[]): Promise<File[]> {
  return readPhotos(recordRef, metas);
}

/** Delete every queued photo for a submission — call when its queue row is
 *  gone (replayed, or terminally failed and explicitly discarded). */
export function dropPhotoBatch(recordRef: string): Promise<void> {
  return dropPhotos(recordRef);
}

/** Per-photo state for a queued submission — read from the store, so a
 *  surface can only ever claim bytes that are really there. */
export async function photoStates(
  recordRef: string,
  metas: PhotoOutboxMeta[] | PhotoMeta[],
): Promise<{ meta: PhotoMeta; state: QueuedPhotoState }[]> {
  const out: { meta: PhotoMeta; state: QueuedPhotoState }[] = [];
  for (const meta of metas) {
    out.push({ meta, state: (await hasPhoto(recordRef, meta.n)) ? "queued" : "missing" });
  }
  return out;
}
