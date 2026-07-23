import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  matchGeofences,
  resolveCapture,
  type CaptureFence,
  type CaptureProject,
} from "@/lib/mobile/geofence-file";

/**
 * Venue-geofence auto-filing — the server half (T1-5).
 *
 * Turns `venue_geofences` rows into capture-ready fences: each circle plus
 * the ACTIVE projects a photo inside it could belong to. Resolution order
 * per fence:
 *
 *   1. `venue_geofences.project_id` — the explicit active-event override.
 *   2. `venues.location_id` linkage — venues standing at the fence's
 *      location that belong to an active project.
 *   3. `events.location_id` — events scheduled at the location whose window
 *      overlaps today (a one-day show at a venue nobody modelled in
 *      `venues`).
 *
 * Only ACTIVE (`project_state = 'active'`, not soft-deleted) projects
 * qualify as filing destinations — auto-filing into a closed show is worse
 * than asking.
 */

type FenceRow = {
  id: string;
  location_id: string;
  project_id: string | null;
  label: string | null;
  center_lat: number;
  center_lng: number;
  radius_m: number;
};

export async function listCaptureFences(orgId: string): Promise<CaptureFence[]> {
  const supabase = await createClient();

  const { data: fenceRows } = await supabase
    .from("venue_geofences")
    .select("id, location_id, project_id, label, center_lat, center_lng, radius_m")
    .eq("org_id", orgId)
    .eq("active", true);
  const fences = (fenceRows ?? []) as FenceRow[];
  if (!fences.length) return [];

  const locationIds = [...new Set(fences.map((f) => f.location_id))];

  // Location names (fence label fallback) + the two derived linkages.
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [{ data: locRows }, { data: venueRows }, { data: eventRows }] = await Promise.all([
    supabase.from("locations").select("id, name").eq("org_id", orgId).in("id", locationIds),
    supabase
      .from("venues")
      .select("location_id, project_id")
      .eq("org_id", orgId)
      .in("location_id", locationIds)
      .not("project_id", "is", null),
    supabase
      .from("events")
      .select("location_id, project_id")
      .eq("org_id", orgId)
      .in("location_id", locationIds)
      .not("project_id", "is", null)
      .lt("starts_at", dayEnd.toISOString())
      .gt("ends_at", dayStart.toISOString()),
  ]);

  const locationName = new Map((locRows ?? []).map((l) => [l.id as string, (l.name as string) ?? ""]));

  // location_id -> candidate project ids, venue linkage before event linkage.
  const derived = new Map<string, string[]>();
  const push = (locationId: string, projectId: string) => {
    const list = derived.get(locationId) ?? [];
    if (!list.includes(projectId)) list.push(projectId);
    derived.set(locationId, list);
  };
  for (const v of venueRows ?? []) push(v.location_id as string, v.project_id as string);
  for (const e of eventRows ?? []) if (e.location_id) push(e.location_id as string, e.project_id as string);

  // One project fetch for everything referenced; the active filter happens here.
  const allIds = [
    ...new Set([...fences.flatMap((f) => (f.project_id ? [f.project_id] : [])), ...[...derived.values()].flat()]),
  ];
  const projectById = new Map<string, CaptureProject>();
  if (allIds.length) {
    const { data: projRows } = await supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .in("id", allIds);
    for (const p of projRows ?? []) projectById.set(p.id as string, { id: p.id as string, name: (p.name as string) ?? "" });
  }

  return fences.map((f) => {
    const ordered: string[] = [
      ...(f.project_id ? [f.project_id] : []),
      ...(derived.get(f.location_id) ?? []),
    ];
    const seen = new Set<string>();
    const projects: CaptureProject[] = [];
    for (const id of ordered) {
      const p = projectById.get(id);
      if (!p || seen.has(id)) continue;
      seen.add(id);
      projects.push(p);
    }
    return {
      id: f.id,
      label: f.label || locationName.get(f.location_id) || "",
      locationId: f.location_id,
      centerLat: Number(f.center_lat),
      centerLng: Number(f.center_lng),
      radiusM: Number(f.radius_m),
      projects,
    };
  });
}

/**
 * Server-side one-shot resolution: position → the filing destination.
 * `projectId` is set only on an unambiguous match; `locationId` names the
 * containing fence's venue either way (nearest-first when several contain).
 */
export async function resolveCapturePosition(
  orgId: string,
  position: { lat: number; lng: number; accuracyM?: number | null },
): Promise<{ projectId?: string; locationId?: string }> {
  const fences = await listCaptureFences(orgId);
  const resolution = resolveCapture(position, fences);
  if (resolution.kind === "auto") {
    return { projectId: resolution.project.id, locationId: resolution.locationId };
  }
  const nearest = matchGeofences(position, fences)[0];
  return nearest ? { locationId: nearest.fence.locationId } : {};
}
