import { z } from "zod";

/**
 * Geotagging for field photo capture — the wire contract between the kit's
 * `FileField` and the server actions that persist what it captured.
 *
 * **Why the fix is taken at shutter rather than read from EXIF.** Browsers
 * strip EXIF from `capture=` inputs on most platforms, and our own downscale
 * pass (`lib/mobile/image.ts`) re-encodes through a canvas, which drops
 * metadata regardless. Reading `navigator.geolocation` at pick time is both
 * more reliable and reuses the geolocation path already hardened for clock
 * punches (`lib/geo/position.ts`).
 *
 * **What the fix therefore means.** It is attested by the device at capture
 * time, not welded into the image bytes. It says "this crew member's phone
 * reported this position when they attached this photo" — not "this
 * photograph was taken here". That is a claim by an authenticated user,
 * which is exactly what every other field on an incident report already is.
 * Anyone treating these coordinates as forensic proof should read
 * `accuracy_m` first.
 *
 * **Why it travels as a sibling FormData key.** `toFormData` appends a
 * multi-file field as repeated `photo` keys, so there is nowhere to hang
 * per-file metadata on the file itself (FormData sends bytes, name and type
 * — custom File properties do not survive). The fixes ride alongside as a
 * single JSON string under `{fieldId}__geo`, index-aligned with the files.
 */

/** Sibling FormData key carrying the fixes for a photo field. */
export const geoKeyFor = (fieldId: string) => `${fieldId}__geo`;

export type PhotoFix = {
  lat: number;
  lng: number;
  /** Fix radius in metres (68% confidence). Null when the device declined to
   *  report one. This is what separates a 5m rooftop fix from a 2km tower
   *  triangulation, so it is persisted rather than discarded. */
  accuracyM: number | null;
  capturedAt: string;
};

const PhotoFixSchema = z
  .object({
    // Reject out-of-range junk rather than storing an impossible coordinate
    // that a map would silently render somewhere in the ocean.
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().nonnegative().nullable().catch(null),
    capturedAt: z.string().datetime(),
  })
  .nullable();

const PhotoFixArraySchema = z.array(PhotoFixSchema);

/**
 * Parse the `{fieldId}__geo` sibling into a per-file array of fixes,
 * normalised to exactly `count` entries.
 *
 * Every failure mode degrades to "no fix" rather than throwing: a photo with
 * an unparseable geotag is still evidence, and a crew member must never lose
 * an incident report because their coordinates were malformed. The
 * length-normalisation matters — a short or long array (a client bug, a
 * replayed draft) would otherwise shift coordinates onto the wrong photo,
 * which is worse than having none.
 */
export function parsePhotoFixes(raw: FormDataEntryValue | null | undefined, count: number): (PhotoFix | null)[] {
  const empty = () => Array.from({ length: count }, () => null);
  if (typeof raw !== "string" || !raw) return empty();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty();
  }

  const result = PhotoFixArraySchema.safeParse(parsed);
  if (!result.success) return empty();

  return Array.from({ length: count }, (_, i) => result.data[i] ?? null);
}

/**
 * A photo as stored on a record: where the bytes live, plus where and when
 * the device said they were captured.
 *
 * This is the shape written into the `incidents.photos` jsonb. It supersedes
 * the bare `string[]` of paths that the mobile actions wrote — nothing read
 * that column, so there is no legacy shape to migrate, but readers should
 * still tolerate both (see `normalisePhotoRef`).
 */
export type PhotoRef = {
  path: string;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  capturedAt: string | null;
  caption?: string;
};

/**
 * Coerce whatever is in a `photos` jsonb column into `PhotoRef`s.
 *
 * Three shapes exist in the wild and a reviewer surface must render all of
 * them rather than crash on the oldest: bare path strings (what the mobile
 * actions wrote before geotagging), `{path, caption}` objects (what
 * `/api/v1/incidents` writes), and full `PhotoRef`s (current). Unknown junk
 * is dropped rather than rendered as a broken tile.
 */
export function normalisePhotoRef(value: unknown): PhotoRef | null {
  if (typeof value === "string") {
    return value ? { path: value, lat: null, lng: null, accuracyM: null, capturedAt: null } : null;
  }
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.path !== "string" || !v.path) return null;
  return {
    path: v.path,
    lat: typeof v.lat === "number" ? v.lat : null,
    lng: typeof v.lng === "number" ? v.lng : null,
    accuracyM: typeof v.accuracyM === "number" ? v.accuracyM : null,
    capturedAt: typeof v.capturedAt === "string" ? v.capturedAt : null,
    ...(typeof v.caption === "string" ? { caption: v.caption } : {}),
  };
}

export function normalisePhotoRefs(value: unknown): PhotoRef[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalisePhotoRef).filter((p): p is PhotoRef => p !== null);
}
