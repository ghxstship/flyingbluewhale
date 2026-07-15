import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveZoneForPunch } from "@/lib/workforce";

/** /api/v1/time/clock — the free personal time-clock punch (COMPVSS
 * /m/clock + /m/punch). Distinct from /api/v1/shifts/checkin, which drives
 * a scheduled shift's attendance FSM: this endpoint opens/closes a bare
 * `time_entries` row for the signed-in user with no shift required.
 *
 * Queueable: listed in the service worker's QUEUEABLE_ENDPOINTS so an
 * offline punch is buffered in IndexedDB and replayed on reconnect. The
 * optional `at` carries the true capture moment for late replays; `lat` /
 * `lng` (when the device grants geolocation) drive `resolveZoneForPunch`
 * zone classification, recorded as `geofence_state` + `zone_id` on the
 * entry.
 */

const PostSchema = z.object({
  action: z.enum(["clock_in", "clock_out"]),
  // Strict ISO datetime; past timestamps allowed (offline replay).
  at: z.string().datetime({ offset: true }).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

type Zone = { id: string; name: string | null; center_lat: number; center_lng: number; radius_m: number };

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  // A punch can be late (offline replay) but never ahead of the server
  // clock by more than 15 min of skew.
  if (input.at && new Date(input.at).getTime() > Date.now() + 15 * 60_000) {
    return apiError("bad_request", "Punch timestamp is in the future");
  }

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "time:write");
    if (denial) return denial;
    const supabase = await createClient();
    const nowIso = input.at ?? new Date().toISOString();

    // The user's currently-open entry (if any) decides both directions.
    const { data: open, error: readErr } = await supabase
      .from("time_entries")
      .select("id, started_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readErr) return apiError("internal", readErr.message);

    if (input.action === "clock_in") {
      // 409 is terminal for the offline queue (a duplicate replayed punch
      // is dropped rather than retried forever).
      if (open) return apiError("conflict", "You're already clocked in.");

      // Zone classification mirrors /api/v1/shifts/checkin — one shared
      // resolver: containment beats proximity, and an org with no zones
      // (or a GPS-less punch) records 'unknown' rather than 'outside'.
      const punch =
        typeof input.lat === "number" && typeof input.lng === "number"
          ? { lat: input.lat, lng: input.lng }
          : null;
      const { data: zones } = punch
        ? await supabase
            .from("time_clock_zones")
            .select("id, name, center_lat, center_lng, radius_m")
            .eq("org_id", session.orgId)
            .eq("lifecycle_state", "active")
            .is("deleted_at", null)
        : { data: [] };
      const resolved = resolveZoneForPunch(punch, (zones ?? []) as Zone[]);

      const { data: entry, error } = await supabase
        .from("time_entries")
        .insert({
          org_id: session.orgId,
          user_id: session.userId,
          started_at: nowIso,
          activity_category: "shift",
          zone_id: resolved.zone?.id ?? null,
          punch_lat: input.lat ?? null,
          punch_lng: input.lng ?? null,
          geofence_state: resolved.state,
        })
        .select("id, started_at")
        .maybeSingle();
      if (error) return apiError("internal", error.message);
      return apiOk({
        action: "clock_in" as const,
        entry,
        geofenceState: resolved.state,
        zoneName: resolved.zone?.name ?? null,
      });
    }

    // clock_out. duration_minutes is derived by the
    // tg_compute_time_entry_duration trigger, whose contract is explicit:
    // "Do not set duration_minutes explicitly when ended_at is present."
    // Writing it here duplicated the trigger's arithmetic and would drift
    // from it the moment either side changed.
    if (!open) return apiError("conflict", "You're not clocked in.");
    const { data: entry, error } = await supabase
      .from("time_entries")
      .update({ ended_at: nowIso })
      .eq("id", open.id as string)
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .select("id, started_at, ended_at, duration_minutes")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    return apiOk({ action: "clock_out" as const, entry, geofenceState: null, zoneName: null });
  });
}
