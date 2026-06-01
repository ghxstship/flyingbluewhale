import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { classifyPunch } from "@/lib/connecteam";

/**
 * POST /api/v1/time-clock/auto-clockout
 *
 * Called by the COMPVSS client when background geofence monitoring
 * detects the user has left the zone while clocked in.
 *
 * Only fires if the zone has auto_clockout_on_exit = true.
 * Closes the open time_entry with clock_out_at = now() and a
 * geofence_state = 'outside' record.
 *
 * Mirrors Connecteam's Feb 2026 "auto clock-out from geofence for NFC clock-ins".
 */

const Schema = z.object({
  time_entry_id: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(req: Request) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Fetch the open time entry + its zone
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, user_id, clock_out_at, zone_id")
    .eq("id", input.time_entry_id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!entry) return apiError("not_found", "Time entry not found");
  if (entry.clock_out_at) return apiOk({ skipped: true, reason: "already_clocked_out" });
  if (!entry.zone_id) return apiOk({ skipped: true, reason: "no_zone" });

  const { data: zone } = await supabase
    .from("time_clock_zones")
    .select("id, center_lat, center_lng, radius_m, auto_clockout_on_exit")
    .eq("id", entry.zone_id)
    .maybeSingle();

  if (!zone) return apiOk({ skipped: true, reason: "zone_not_found" });
  if (!zone.auto_clockout_on_exit) return apiOk({ skipped: true, reason: "auto_clockout_disabled" });

  const state = classifyPunch(
    { lat: input.lat, lng: input.lng },
    { center_lat: zone.center_lat, center_lng: zone.center_lng, radius_m: zone.radius_m },
  );

  if (state !== "outside") return apiOk({ skipped: true, reason: "still_inside_geofence" });

  const { data: updated, error } = await supabase
    .from("time_entries")
    .update({
      clock_out_at: new Date().toISOString(),
      clock_out_lat: input.lat,
      clock_out_lng: input.lng,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.time_entry_id)
    .select()
    .single();

  if (error) return apiError("internal", error.message);
  return apiOk({ clocked_out: true, time_entry: updated });
}
