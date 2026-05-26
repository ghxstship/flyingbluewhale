import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { fetchNwsWeather } from "@/lib/weather/nws";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/daily-logs/[id]/refresh-weather
 *
 * Pulls weather from NWS for the daily log's date + the project's
 * lat/lon. Writes back into daily_logs.weather_*. Idempotent — re-pulling
 * just overwrites the snapshot.
 */

const ParamsSchema = z.object({ id: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "weather-refresh"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Weather refresh rate limit reached");

  const { id } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ id });
  if (!parsed.success) return apiError("bad_request", "Invalid daily-log id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: log } = await supabase
    .from("daily_logs")
    .select("id, log_date, project_id, location_id")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  type LogRow = { id: string; log_date: string; project_id: string; location_id: string | null };
  const l = log as LogRow | null;
  if (!l) return apiError("not_found", "Daily log not found");

  // Try the log's location first; fall back to the project's primary
  // location. lat/lon come from public.locations.
  let lat: number | null = null;
  let lon: number | null = null;

  if (l.location_id) {
    const { data: loc } = await supabase
      .from("locations")
      .select("latitude, longitude")
      .eq("id", l.location_id)
      .maybeSingle();
    const r = loc as { latitude: number | null; longitude: number | null } | null;
    lat = r?.latitude ?? null;
    lon = r?.longitude ?? null;
  }

  if (lat == null || lon == null) {
    // Best-effort fallback: pick the first project venue with coords.
    const { data: venueRows } = await supabase
      .from("venues")
      .select("latitude, longitude")
      .eq("org_id", session.orgId)
      .not("latitude", "is", null)
      .limit(1);
    type Venue = { latitude: number | null; longitude: number | null };
    const v = (venueRows as Venue[] | null)?.[0];
    if (v) {
      lat = v.latitude;
      lon = v.longitude;
    }
  }

  if (lat == null || lon == null) {
    return apiError("bad_request", "No coordinates available for this log's location or any project venue.");
  }

  const snap = await fetchNwsWeather(lat, lon, l.log_date);
  if (!snap) {
    return apiError(
      "internal",
      "NWS unavailable for this location/date. NWS only covers US territory + forecast horizon ~7 days.",
    );
  }

  await supabase
    .from("daily_logs")
    .update({
      weather_temp_high_f: snap.temp_high_f,
      weather_temp_low_f: snap.temp_low_f,
      weather_precip_in: snap.precip_in,
      weather_wind_mph: snap.wind_mph,
      weather_conditions: snap.conditions,
      weather_source: snap.source,
      weather_pulled_at: snap.pulled_at,
    })
    .eq("id", l.id)
    .eq("org_id", session.orgId);

  return apiOk({ snapshot: snap });
}
