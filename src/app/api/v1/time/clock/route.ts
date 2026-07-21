import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { ensureMyPartyId } from "@/lib/db/parties";
import { createClient } from "@/lib/supabase/server";
import { blockMessage, evaluatePunch } from "@/lib/time/policy";
import { loadPunchPolicyContext } from "@/lib/time/server";
import { resolveZoneForPunch } from "@/lib/workforce";

/** /api/v1/time/clock — the free personal time-clock punch (COMPVSS
 * /m/clock). Distinct from /api/v1/shifts/checkin, which drives
 * a scheduled shift's attendance FSM: this endpoint opens/closes a bare
 * `time_entries` row for the signed-in user with no shift required.
 *
 * Queueable: listed in the service worker's QUEUEABLE_ENDPOINTS so an
 * offline punch is buffered in IndexedDB and replayed on reconnect. The
 * optional `at` carries the true capture moment for late replays.
 *
 * Geofence policy (Phase 1) is enforced HERE, never on the client: the
 * client's cached policy only decides what prompt the worker sees, and
 * `lat`/`lng`/`accuracy` are self-reported by an untrusted device. The
 * server re-resolves the zone and re-runs `evaluatePunch` on every punch,
 * including every offline replay. Default policy is `record_only`, i.e.
 * classification stays informational until an org opts in.
 */

const PostSchema = z.object({
  action: z.enum(["clock_in", "clock_out", "break_start", "break_end"]),
  // Strict ISO datetime; past timestamps allowed (offline replay).
  at: z.string().datetime({ offset: true }).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  /** GeolocationCoordinates.accuracy, metres. Drives the accuracy gate. */
  accuracy: z.number().min(0).max(100_000).optional(),
  /** Worker's justification for punching outside a blocking zone. Its
   *  presence converts a refusal into an accepted, quarantined punch. */
  overrideReason: z.string().min(1).max(500).optional(),
  /** Set by the service worker when replaying a queued punch. A replay is
   *  never refused — see the isReplay branch in evaluatePunch. */
  replay: z.boolean().optional(),
});

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

    const fix =
      typeof input.lat === "number" && typeof input.lng === "number"
        ? { lat: input.lat, lng: input.lng, accuracyM: input.accuracy ?? null }
        : null;

    // The user's currently-open entry (if any) decides both directions.
    const { data: open, error: readErr } = await supabase
      .from("time_entries")
      .select("id, started_at, break_open_at, break_minutes")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      // Task-timer entries (activity_category='task') are NOT shift punches —
      // exclude them so an open task timer never reads as "clocked in".
      .neq("activity_category", "task")
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readErr) return apiError("internal", readErr.message);

    if (input.action === "clock_in") {
      // 409 is terminal for the offline queue (a duplicate replayed punch
      // is dropped rather than retried forever).
      if (open) return apiError("conflict", "You're already clocked in.");

      const { settings, zones } = await loadPunchPolicyContext(supabase, session.orgId);
      const verdict = evaluatePunch({
        fix,
        zones,
        settings,
        overrideReason: input.overrideReason,
        isReplay: input.replay === true,
      });

      // Get-or-create the puncher's party NOW, not at compile time:
      // compile_timesheets keys sheets on parties(auth_user_id, org_id), so a
      // worker with no party row punches into a void — their entries close but
      // never gather into a submittable sheet, and /m/timesheets reads as
      // "not linked to a worker record". A punch is a write path, and write
      // paths get-or-create (src/lib/db/parties.ts canon). Best-effort: a
      // party failure must never refuse the punch itself.
      await ensureMyPartyId(session.orgId, session.userId, session.email);

      if (verdict.outcome === "block") {
        // 422, NOT 409 — the outbox drops 409 terminally as a dedupe, so a
        // policy refusal must be distinguishable from a duplicate.
        return apiError("unprocessable", blockMessage(verdict), {
          code: "geofence_blocked",
          geofenceState: verdict.geofenceState,
          policy: verdict.policy,
          distanceM: verdict.distanceM,
          nearestZone: verdict.nearestZoneId
            ? { id: verdict.nearestZoneId, name: verdict.nearestZoneName }
            : null,
          overrideAvailable: verdict.overrideAvailable,
        });
      }

      const { data: entry, error } = await supabase
        .from("time_entries")
        .insert({
          org_id: session.orgId,
          user_id: session.userId,
          started_at: nowIso,
          activity_category: "shift",
          zone_id: verdict.zoneId,
          punch_lat: input.lat ?? null,
          punch_lng: input.lng ?? null,
          punch_accuracy_m: input.accuracy ?? null,
          geofence_state: verdict.geofenceState,
          enforcement_state: verdict.enforcementState,
          // Why the row is flagged, in the worker's words where they gave
          // them. `reason` alone can't say "Gate 3 was closed".
          enforcement_reason:
            verdict.enforcementState === "clean" ? null : (input.overrideReason?.trim() ?? verdict.reason),
          source_channel: input.replay === true ? "offline_replay" : "app",
        })
        .select("id, started_at")
        .maybeSingle();
      if (error) return apiError("internal", error.message);
      return apiOk({
        action: "clock_in" as const,
        entry,
        geofenceState: verdict.geofenceState,
        zoneName: verdict.zoneName,
        enforcementState: verdict.enforcementState,
        reason: verdict.reason,
      });
    }

    // Break punches operate WITHIN an open clock-in — no geofence policy
    // (the worker is already on-site and clocked in). break_minutes accrues
    // the paused span so net worked = duration_minutes - break_minutes.
    // Conflicts are terminal (409) so a duplicate offline replay is dropped
    // by the outbox rather than double-counting break time.
    if (input.action === "break_start") {
      if (!open) return apiError("conflict", "You're not clocked in.");
      if (open.break_open_at) return apiError("conflict", "You're already on a break.");
      const { data: entry, error } = await supabase
        .from("time_entries")
        .update({ break_open_at: nowIso })
        .eq("id", open.id as string)
        .eq("org_id", session.orgId)
        .eq("user_id", session.userId)
        .select("id, break_open_at, break_minutes")
        .maybeSingle();
      if (error) return apiError("internal", error.message);
      return apiOk({ action: "break_start" as const, entry });
    }

    if (input.action === "break_end") {
      if (!open) return apiError("conflict", "You're not clocked in.");
      if (!open.break_open_at) return apiError("conflict", "You're not on a break.");
      const elapsedMin = Math.max(
        0,
        Math.round((new Date(nowIso).getTime() - new Date(open.break_open_at as string).getTime()) / 60_000),
      );
      const { data: entry, error } = await supabase
        .from("time_entries")
        .update({ break_open_at: null, break_minutes: (open.break_minutes ?? 0) + elapsedMin })
        .eq("id", open.id as string)
        .eq("org_id", session.orgId)
        .eq("user_id", session.userId)
        .select("id, break_open_at, break_minutes")
        .maybeSingle();
      if (error) return apiError("internal", error.message);
      return apiOk({ action: "break_end" as const, entry, breakMinutes: entry?.break_minutes ?? null });
    }

    // clock_out. duration_minutes is derived by the
    // tg_compute_time_entry_duration trigger, whose contract is explicit:
    // "Do not set duration_minutes explicitly when ended_at is present."
    // Writing it here duplicated the trigger's arithmetic and would drift
    // from it the moment either side changed.
    if (!open) return apiError("conflict", "You're not clocked in.");

    // The departure fix is recorded, never enforced: refusing a clock-out
    // would strand a worker on the clock, which is worse than the problem
    // it solves. Classification here feeds the manager's review and the
    // "leaving site -> clock out?" nudge.
    const zones = fix ? (await loadPunchPolicyContext(supabase, session.orgId)).zones : [];
    const outResolution = resolveZoneForPunch(fix, zones);

    // Clocking out mid-break folds the open break span into break_minutes and
    // clears it — otherwise break_open_at would strand and the final break go
    // uncounted.
    const breakClose = open.break_open_at
      ? {
          break_open_at: null,
          break_minutes:
            (open.break_minutes ?? 0) +
            Math.max(
              0,
              Math.round((new Date(nowIso).getTime() - new Date(open.break_open_at as string).getTime()) / 60_000),
            ),
        }
      : {};

    const { data: entry, error } = await supabase
      .from("time_entries")
      .update({
        ended_at: nowIso,
        punch_out_lat: input.lat ?? null,
        punch_out_lng: input.lng ?? null,
        punch_out_accuracy_m: input.accuracy ?? null,
        geofence_out_state: outResolution.state,
        zone_out_id: outResolution.zone?.id ?? null,
        ...breakClose,
      })
      .eq("id", open.id as string)
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .select("id, started_at, ended_at, duration_minutes")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    return apiOk({
      action: "clock_out" as const,
      entry,
      geofenceState: outResolution.state,
      zoneName: outResolution.zone?.name ?? null,
    });
  });
}
