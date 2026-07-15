import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  CORRECTION_KINDS,
  CORRECTION_SHAPE_MESSAGE,
  validateCorrectionShape,
  type CorrectionKind,
} from "@/lib/time/corrections";

/**
 * /api/v1/time/corrections — worker-initiated time corrections.
 *
 * A request NEVER mutates the punch. It proposes a change that a manager
 * has to approve, and the applier (`apply_time_correction`) writes the
 * entry inside one transaction. This closes the gap where the crew
 * timesheet portal was read-only and a worker who clocked in wrong had no
 * path but to find a manager in person.
 *
 * Deliberately NOT queueable offline: a correction is considered, not
 * urgent, and the offline outbox drops 4xx terminally — a rejected
 * correction would vanish silently. Corrections fail loudly instead.
 *
 * Separation of duties is enforced three times over: here
 * (`requester_id` is forced to the session), in RLS (`tec_insert_self`),
 * and at the database (`tec_no_self_approval`). The route is the
 * friendliest layer, not the authoritative one.
 */

const PostSchema = z.object({
  timeEntryId: z.string().uuid().nullish(),
  kind: z.enum(CORRECTION_KINDS),
  reason: z.string().min(1).max(2000),
  proposedStartedAt: z.string().datetime({ offset: true }).nullish(),
  proposedEndedAt: z.string().datetime({ offset: true }).nullish(),
  proposedZoneId: z.string().uuid().nullish(),
});

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "time:write");
    if (denial) return denial;

    const shapeError = validateCorrectionShape({
      kind: input.kind as CorrectionKind,
      timeEntryId: input.timeEntryId ?? null,
      reason: input.reason,
      proposedStartedAt: input.proposedStartedAt ?? null,
      proposedEndedAt: input.proposedEndedAt ?? null,
    });
    if (shapeError) return apiError("bad_request", CORRECTION_SHAPE_MESSAGE[shapeError]);

    const supabase = await createClient();

    // Snapshot the entry being disputed so the request still reads
    // correctly once the entry moves on, and so a worker cannot file
    // against someone else's punch.
    let originalStartedAt: string | null = null;
    let originalEndedAt: string | null = null;
    let timesheetId: string | null = null;
    if (input.timeEntryId) {
      const { data: entry } = await supabase
        .from("time_entries")
        .select("id, user_id, started_at, ended_at, timesheet_id")
        .eq("id", input.timeEntryId)
        .eq("org_id", session.orgId)
        .maybeSingle();
      if (!entry) return apiError("not_found", "Time entry not found");
      if (entry.user_id !== session.userId) {
        // A manager who wants to change someone else's punch edits it
        // directly (audited); they don't file a request on their behalf.
        return apiError("forbidden", "You can only request corrections to your own time entries");
      }
      originalStartedAt = entry.started_at;
      originalEndedAt = entry.ended_at;
      timesheetId = entry.timesheet_id;
    }

    const { data, error } = await supabase
      .from("time_entry_corrections")
      .insert({
        org_id: session.orgId,
        time_entry_id: input.timeEntryId ?? null,
        timesheet_id: timesheetId,
        requester_id: session.userId,
        correction_kind: input.kind,
        original_started_at: originalStartedAt,
        original_ended_at: originalEndedAt,
        proposed_started_at: input.proposedStartedAt ?? null,
        proposed_ended_at: input.proposedEndedAt ?? null,
        proposed_zone_id: input.proposedZoneId ?? null,
        reason: input.reason.trim(),
      })
      .select("id, correction_kind, correction_state, reason, created_at")
      .maybeSingle();

    if (error) {
      // The partial unique index — one open request per entry.
      if (error.code === "23505") {
        return apiError("conflict", "You already have a pending request for this shift.");
      }
      return apiError("internal", error.message);
    }
    return apiCreated({ correction: data });
  });
}

/** Own requests; the manager band sees the whole org queue. */
export async function GET(req: NextRequest) {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "time:read");
    if (denial) return denial;

    const url = new URL(req.url);
    const state = url.searchParams.get("state");
    const supabase = await createClient();

    let query = supabase
      .from("time_entry_corrections")
      .select(
        "id, time_entry_id, timesheet_id, requester_id, correction_kind, correction_state, reason, original_started_at, original_ended_at, proposed_started_at, proposed_ended_at, decided_by, decided_at, decision_notes, applied_at, created_at",
      )
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(100);

    // RLS already scopes a member to their own rows; narrowing here keeps
    // the manager list from returning the whole org when they asked for
    // their own.
    if (!isManagerPlus(session) || url.searchParams.get("mine") === "1") {
      query = query.eq("requester_id", session.userId);
    }
    if (state) query = query.eq("correction_state", state);

    const { data, error } = await query;
    if (error) return apiError("internal", error.message);
    return apiOk({ corrections: data ?? [] });
  });
}
