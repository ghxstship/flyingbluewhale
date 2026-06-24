import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classifyPunch } from "@/lib/workforce";

/** /api/v1/shifts/checkin — COMPVSS shift T&A (WF-197).
 *
 * Drives two side-effects:
 *   1. Updates the schedule shift's attendance FSM (scheduled →
 *      checked_in → on_break/checked_out).
 *   2. On `check_in` opens a `time_entries` row stamped with the punch
 *      lat/lng + classified zone. On `check_out` closes the open row.
 *      The geofence classification is informational — we don't block
 *      `check_in` on an outside-the-zone punch; instead the row carries
 *      `geofence_state='outside'` and admins can audit. */

const PostSchema = z.object({
  shiftId: z.string().uuid(),
  action: z.enum(["check_in", "check_out", "break_start", "break_end"]),
  // Strict ISO datetime — a free-form string surfaced as a Postgres cast
  // 500. Past timestamps stay allowed (the offline punch queue replays
  // punches captured hours earlier); the future clamp lives in POST.
  at: z.string().datetime({ offset: true }).optional(),
  // Optional GPS punch. Browsers without geolocation permission (or
  // desktop test) send neither — we record geofence_state='unknown'.
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

type Attendance = "scheduled" | "checked_in" | "on_break" | "checked_out";
type Action = "check_in" | "check_out" | "break_start" | "break_end";

const REQUIRED_FROM: Record<Action, readonly Attendance[]> = {
  check_in: ["scheduled"],
  break_start: ["checked_in"],
  break_end: ["on_break"],
  check_out: ["checked_in", "on_break"],
};

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  // Future-date clamp: a punch can be late (offline replay) but never
  // ahead of the server clock by more than 15 min of skew.
  if (input.at && new Date(input.at).getTime() > Date.now() + 15 * 60_000) {
    return apiError("bad_request", "Punch timestamp is in the future");
  }

  return withAuth(async (session) => {
    const supabase = await createClient();

    const { data: row, error: readErr } = await supabase
      .from("shifts")
      .select("id, attendance, venue_id, workforce_member_id")
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (readErr) return apiError("internal", readErr.message);
    if (!row) return apiError("not_found", "Shift not found");
    const shift = row as {
      id: string;
      attendance: Attendance;
      venue_id: string | null;
      workforce_member_id: string | null;
    };
    const current = shift.attendance ?? "scheduled";
    const allowedFrom = REQUIRED_FROM[input.action];
    if (!allowedFrom.includes(current)) {
      return apiError(
        "conflict",
        `Cannot ${input.action} from ${current}. Allowed prior states: ${allowedFrom.join(", ")}`,
      );
    }

    const nowIso = input.at ?? new Date().toISOString();
    const patch: Record<string, string | null> = {};

    if (input.action === "check_in") {
      patch.checked_in_at = nowIso;
      patch.attendance = "checked_in";
    } else if (input.action === "check_out") {
      patch.checked_out_at = nowIso;
      patch.attendance = "checked_out";
    } else if (input.action === "break_start") {
      patch.attendance = "on_break";
    } else {
      patch.attendance = "checked_in";
    }

    const { data, error } = await supabase
      .from("shifts")
      .update(patch as never)
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .eq("attendance", current as "scheduled")
      .select("id, attendance, checked_in_at, checked_out_at")
      .maybeSingle();

    if (error) return apiError("internal", error.message);
    if (!data) {
      return apiError("conflict", "Shift attendance changed concurrently — refresh and retry");
    }

    // Time-entries side-effect — open on check_in, close on check_out.
    // No project_id linkage here yet (shifts.venue_id maps to a venue,
    // not a project). Admins can attribute via the timesheet view.
    if (input.action === "check_in") {
      // Resolve a zone: pick the nearest active zone in the org. If
      // lat/lng absent we still create the time_entry with
      // geofence_state='unknown' so we have an audit trail.
      let zoneId: string | null = null;
      let geoState: "inside" | "outside" | "unknown" = "unknown";
      if (typeof input.lat === "number" && typeof input.lng === "number") {
        const { data: zones } = await supabase
          .from("time_clock_zones")
          .select("id, center_lat, center_lng, radius_m")
          .eq("org_id", session.orgId)
          .eq("lifecycle_state", "active")
          .is("deleted_at", null);
        const candidates = (zones ?? []) as Array<{
          id: string;
          center_lat: number;
          center_lng: number;
          radius_m: number;
        }>;
        for (const z of candidates) {
          const state = classifyPunch(
            { lat: input.lat, lng: input.lng },
            {
              center_lat: z.center_lat,
              center_lng: z.center_lng,
              radius_m: z.radius_m,
            },
          );
          if (state === "inside") {
            zoneId = z.id;
            geoState = "inside";
            break;
          }
        }
        // If we didn't land inside any active zone, leave zoneId null
        // and tag as outside (we have GPS but it's not in any zone).
        if (geoState !== "inside") geoState = "outside";
      }
      await supabase.from("time_entries").insert({
        org_id: session.orgId,
        user_id: session.userId,
        shift_id: shift.id,
        started_at: nowIso,
        billable: true,
        description: "Shift punch",
        zone_id: zoneId,
        punch_lat: input.lat ?? null,
        punch_lng: input.lng ?? null,
        geofence_state: geoState,
      });
    } else if (input.action === "check_out") {
      // Close the open time_entries row for this shift (ended_at is null).
      const { data: open } = await supabase
        .from("time_entries")
        .select("id")
        .eq("org_id", session.orgId)
        .eq("user_id", session.userId)
        .eq("shift_id", shift.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (open) {
        // duration_minutes is derived by the existing
        // tg_compute_time_entry_duration trigger.
        await supabase
          .from("time_entries")
          .update({ ended_at: nowIso })
          .eq("id", (open as { id: string }).id);
      }
    }

    return apiOk({ shift: data });
  });
}
