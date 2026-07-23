/**
 * Venue-geofence auto-filing — the pure half (T1-5, CompanyCam mechanic).
 *
 * A crew member shoots first; this module answers "which venue circle is the
 * phone standing in?" so the capture surface can file the photo without a
 * picker. Client-safe by design: the device fix only exists in the browser,
 * so the match runs there against fences the server page already fetched —
 * which also means it keeps working offline from the last-loaded fence set.
 *
 * The server half (fence fetch + fence→project resolution) lives in
 * `src/lib/db/venue-geofences.ts` (`server-only`).
 *
 * Distance math is `metersBetween` from `src/lib/workforce.ts` — the same
 * haversine the clock-punch zones use. One geodesic in the codebase.
 */

import { metersBetween } from "@/lib/workforce";

/** A capture-ready fence: the circle plus what filing inside it means. */
export type CaptureFence = {
  id: string;
  /** Operator label, falling back to the location name upstream. */
  label: string;
  locationId: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  /** Projects a photo inside this circle could belong to, resolved
   *  server-side (explicit override first, then venue/event linkage). */
  projects: CaptureProject[];
};

export type CaptureProject = { id: string; name: string };

export type FenceMatch = {
  fence: CaptureFence;
  /** Metres from the fix to the fence centre. */
  distanceM: number;
};

/**
 * All fences containing the fix, nearest-first.
 *
 * Containment is generous by the fix's own accuracy radius: a 40 m fix
 * standing 20 m outside a circle is very plausibly inside it, and a photo
 * filed to the adjacent venue is exactly the failure this feature exists to
 * remove — the ambiguity picker handles the rest. Accuracy is capped so a
 * 2 km cell-tower triangulation cannot "contain" every fence in the city.
 */
export const MAX_ACCURACY_SLOP_M = 150;

export function matchGeofences(
  position: { lat: number; lng: number; accuracyM?: number | null } | null,
  fences: CaptureFence[],
): FenceMatch[] {
  if (!position) return [];
  const slop = Math.min(Math.max(position.accuracyM ?? 0, 0), MAX_ACCURACY_SLOP_M);
  return fences
    .map((fence) => ({
      fence,
      distanceM: metersBetween(
        { lat: position.lat, lng: position.lng },
        { lat: fence.centerLat, lng: fence.centerLng },
      ),
    }))
    .filter((m) => m.distanceM <= m.fence.radiusM + slop)
    .sort((a, b) => a.distanceM - b.distanceM);
}

/**
 * Collapse fence matches into the distinct projects a capture could file to,
 * preserving nearest-first order. Two overlapping circles pointing at the
 * same project are ONE destination — the picker must not ask a crew member
 * to choose between two names for the same show.
 */
export function candidateProjects(matches: FenceMatch[]): CaptureProject[] {
  const seen = new Set<string>();
  const out: CaptureProject[] = [];
  for (const m of matches) {
    for (const p of m.fence.projects) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export type CaptureResolution =
  | { kind: "auto"; project: CaptureProject; fence: CaptureFence; locationId: string }
  | { kind: "ambiguous"; projects: CaptureProject[] }
  | { kind: "none" };

/**
 * The whole decision in one call: exactly one candidate project → auto-file;
 * two or more → ambiguity picker; zero (no fix, no fences, or fences with no
 * linked project) → manual picker.
 */
export function resolveCapture(
  position: { lat: number; lng: number; accuracyM?: number | null } | null,
  fences: CaptureFence[],
): CaptureResolution {
  const matches = matchGeofences(position, fences);
  const projects = candidateProjects(matches);
  const sole = projects.length === 1 ? projects[0] : undefined;
  if (sole) {
    // The nearest fence that actually carries the winning project — for the
    // "filed via <fence>" chip and the locationId on the record. By
    // construction (candidateProjects only emits projects present on a
    // matched fence) this find always hits.
    const winner = matches.find((m) => m.fence.projects.some((p) => p.id === sole.id));
    if (winner) return { kind: "auto", project: sole, fence: winner.fence, locationId: winner.fence.locationId };
  }
  if (projects.length > 1) return { kind: "ambiguous", projects };
  return { kind: "none" };
}
