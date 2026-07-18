import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import { evaluatePunch } from "@/lib/time/policy";
import { loadPunchPolicyContext } from "@/lib/time/server";
import { resolveZoneForPunch } from "@/lib/workforce";

/** /api/v1/shifts/checkin — COMPVSS shift T&A (WF-197).
 *
 * Drives two side-effects:
 *   1. Updates the schedule shift's attendance FSM (scheduled →
 *      checked_in → on_break/checked_out).
 *   2. On `check_in` opens a `time_entries` row stamped with the punch
 *      lat/lng + resolved zone (`resolveZoneForPunch`). On `check_out`
 *      closes the open row. The geofence classification is informational
 *      — we don't block `check_in` on an outside-the-zone punch; instead
 *      the row carries `geofence_state='outside'` and admins can audit. */

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
  /** GeolocationCoordinates.accuracy, metres. Lets the policy tell "not
   *  here" from "can't tell" instead of treating a vague fix as absence. */
  accuracy: z.number().min(0).max(100_000).optional(),
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
    // A shift punch opens/closes a time_entries row, so it carries the
    // same authority as POST /api/v1/time/clock and must assert the same
    // capability — this route previously gated on authentication alone.
    const denial = assertCapability(session, "time:write");
    if (denial) return denial;
    const supabase = await createClient();

    const { data: row, error: readErr } = await supabase
      .from("shifts")
      .select("id, attendance, venue_id, crew_member_id")
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (readErr) return apiError("internal", readErr.message);
    if (!row) return apiError("not_found", "Shift not found");
    const shift = row as {
      id: string;
      attendance: Attendance;
      venue_id: string | null;
      crew_member_id: string | null;
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
    const fix =
      typeof input.lat === "number" && typeof input.lng === "number"
        ? { lat: input.lat, lng: input.lng, accuracyM: input.accuracy ?? null }
        : null;
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
      // Same policy evaluation as /api/v1/time/clock — one decision
      // function, so a shift punch and a personal punch can never disagree
      // about whether a worker is on site. A GPS-less punch, or an org with
      // no zones configured, records 'unknown' so we still have a trail.
      //
      // NOTE: the shift attendance FSM has already advanced to checked_in
      // above, so a refusal here would strand the shift. This route
      // therefore records the verdict (including quarantine) but does not
      // refuse; the blocking prompt lives on the /m/clock path.
      const { settings, zones } = await loadPunchPolicyContext(supabase, session.orgId);
      const verdict = evaluatePunch({ fix, zones, settings });

      // The FSM has already advanced to checked_in, so a failed insert here
      // silently loses the shift's hours — capture + log it rather than
      // swallowing (found by the 2026-07-18 optimization re-audit). The
      // open-punch index is deliberately NON-unique (20260718130000) so a
      // concurrent personal punch can't collide with this shift entry.
      const { error: entryErr } = await supabase.from("time_entries").insert({
        org_id: session.orgId,
        user_id: session.userId,
        shift_id: shift.id,
        started_at: nowIso,
        billable: true,
        description: "Shift punch",
        zone_id: verdict.zoneId,
        punch_lat: input.lat ?? null,
        punch_lng: input.lng ?? null,
        punch_accuracy_m: input.accuracy ?? null,
        geofence_state: verdict.geofenceState,
        enforcement_state: verdict.enforcementState,
        enforcement_reason: verdict.enforcementState === "clean" ? null : verdict.reason,
      });
      if (entryErr) {
        log.error("shifts.checkin.time_entry_insert_failed", {
          shift_id: shift.id,
          user_id: session.userId,
          err: entryErr.message,
          code: entryErr.code,
        });
      }
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
        //
        // The departure fix is recorded, never enforced — refusing a
        // check-out would strand a worker on the clock, which is worse
        // than the problem it solves.
        const zones = fix ? (await loadPunchPolicyContext(supabase, session.orgId)).zones : [];
        const outResolution = resolveZoneForPunch(fix, zones);
        await supabase
          .from("time_entries")
          .update({
            ended_at: nowIso,
            punch_out_lat: input.lat ?? null,
            punch_out_lng: input.lng ?? null,
            punch_out_accuracy_m: input.accuracy ?? null,
            geofence_out_state: outResolution.state,
            zone_out_id: outResolution.zone?.id ?? null,
          })
          .eq("id", (open as { id: string }).id);
      }
    }

    return apiOk({ shift: data });
  });
}
