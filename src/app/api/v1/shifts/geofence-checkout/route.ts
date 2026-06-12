import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classifyPunch } from "@/lib/connecteam";

// Called by the COMPVSS field PWA when a worker's device detects they have
// exited the geofence of their active time_clock_zone and the zone has
// auto_checkout_enabled = true. The delay (auto_checkout_delay_min) is
// enforced client-side by the PWA — this endpoint records the clock-out.
//
// Also supports NFC tap clock-out (clock_out_method = 'nfc_tap').

const Schema = z.object({
  time_entry_id: z.string().uuid(),
  clock_out_method: z.enum(["geofence_exit", "nfc_tap", "manual"]).default("geofence_exit"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Fetch the time entry — must belong to the caller and be open (no clock_out_at).
  const { data: entry, error: fetchErr } = await supabase
    .from("time_entries")
    .select("id, user_id, org_id, clocked_out_at, shift_id")
    .eq("id", input.time_entry_id)
    .single();

  if (fetchErr || !entry) return apiError("not_found", "Time entry not found");
  if (entry.user_id !== session.userId) return apiError("forbidden", "Cannot clock out another user");
  if (entry.org_id !== session.orgId) return apiError("forbidden", "Cross-org access denied");
  if (entry.clocked_out_at) return apiError("conflict", "Entry already clocked out");

  // If lat/lng provided, validate against the zone for audit purposes.
  let geofence_state = "unknown";
  if (input.lat !== undefined && input.lng !== undefined && entry.shift_id) {
    const { data: zone } = await supabase
      .from("time_clock_zones")
      .select("center_lat, center_lng, radius_m")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (zone) {
      const punch = { lat: input.lat, lng: input.lng };
      geofence_state = classifyPunch(punch, {
        center_lat: zone.center_lat,
        center_lng: zone.center_lng,
        radius_m: zone.radius_m,
      });
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from("time_entries")
    .update({
      clocked_out_at: new Date().toISOString(),
      clock_out_method: input.clock_out_method,
      clock_out_lat: input.lat ?? null,
      clock_out_lng: input.lng ?? null,
    })
    .eq("id", input.time_entry_id)
    .select()
    .single();

  if (updateErr) return apiError("internal", updateErr.message);

  return apiOk({ time_entry: updated, geofence_state });
}
