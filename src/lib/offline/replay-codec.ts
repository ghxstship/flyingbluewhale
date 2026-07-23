"use client";

import { geoKeyFor } from "@/lib/mobile/photo-geo";
import type { PhotoMeta } from "./photo-blobs";

/**
 * Wire format for app-layer queue replays (T1-1).
 *
 * A queued server-action submission is a flat `Record<string, string>` of the
 * form's scalar fields plus sidecar bookkeeping under underscore-prefixed
 * keys (stripped before the FormData is rebuilt, so the action never sees
 * them as fields). This module is the ONE place that format lives — the
 * submit hook writes it, the replayer registry reads it, and neither can
 * drift from the other. Deliberately free of server-action imports so tests
 * and the drainer core can use it without dragging server modules in.
 */

/** Queue kinds the app-level drainer replays via a registered server-action
 *  replayer. Values are the `queue.ts` kind channels — also the surface key
 *  recorded on queued photos. `chat:<roomId>` rides a prefix replayer and is
 *  not enumerable here. */
export const REPLAY_KINDS = {
  dailyLog: "daily-log",
  incident: "incident",
  incidentQuick: "incident-quick",
  lostFound: "lost-found",
  handover: "handover",
} as const;

export type ReplayKind = (typeof REPLAY_KINDS)[keyof typeof REPLAY_KINDS];

/** Sidecar keys smuggled through the queued payload (same convention the
 *  daily-log form established — see DailyLogForm). */
export const PHOTOS_KEY = "__photos";
export const ITEM_ID_KEY = "__itemId";

/**
 * Client-generated idempotency ref, passed through as a normal form field.
 * Every action Zod-parses a known subset of scalars, so today the field is
 * carried but ignored; when the backing tables grow a `client_ref` column
 * the actions can dedupe a replay whose first attempt landed but whose
 * response was lost. Sent on the LIVE submit too, with the same id the
 * queued replay would use.
 */
export const CLIENT_REF_FIELD = "clientRef";

/** A malformed manifest degrades to "no photos" rather than throwing
 *  mid-replay and wedging the queue behind one bad row. */
export function parsePhotoMetas(raw: string | undefined): PhotoMeta[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PhotoMeta[]) : [];
  } catch {
    return [];
  }
}

/**
 * Extract the queueable scalar payload from a submit's FormData: every
 * string field except the photo geotag sibling (rebuilt from the manifest at
 * replay so it can never desync from the recovered files). Files are NOT
 * here — bytes travel through the photo outbox.
 */
export function scalarPayloadFromFormData(fd: FormData, photoField?: string): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    if (photoField && k === geoKeyFor(photoField)) continue;
    payload[k] = String(v);
  }
  return payload;
}

/**
 * Rebuild the FormData a queued payload described: scalars minus the sidecar
 * keys, plus the recovered photo Files under `photoField` with their fixes
 * re-serialized index-aligned (only for the files that actually came back —
 * a missing blob must not shift coordinates onto the wrong image).
 */
export function buildReplayFormData(
  payload: Record<string, string>,
  photos: File[],
  metas: PhotoMeta[],
  photoField = "photo",
): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (k === PHOTOS_KEY || k === ITEM_ID_KEY) continue;
    fd.set(k, v);
  }
  for (const f of photos) fd.append(photoField, f);
  if (photos.length) {
    fd.set(geoKeyFor(photoField), JSON.stringify(metas.slice(0, photos.length).map((m) => m.fix)));
  }
  return fd;
}
