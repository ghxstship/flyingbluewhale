import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * PATCH /api/v1/time/entries/{id} — the manager's audited punch edit.
 *
 * Plan item 4. `time:edit` was granted in Phase 2 and no route used it, so
 * a manager who needed to fix a punch had no path but a correction request
 * the worker had to file for them.
 *
 * Goes through the `edit_time_entry` RPC rather than an UPDATE, because the
 * audit trigger reads the reason from a transaction-scoped GUC: making the
 * reason a NOT NULL argument of the RPC is what makes an unattributed edit
 * structurally impossible instead of merely discouraged.
 *
 * Editing a POSTED sheet's entry is refused at the database and rolls the
 * whole call back — hours payroll has consumed need the sheet re-opened
 * first, deliberately.
 */

const PatchSchema = z
  .object({
    reason: z.string().min(10, "Say why, in a sentence or so.").max(2000),
    startedAt: z.string().datetime({ offset: true }).optional(),
    endedAt: z.string().datetime({ offset: true }).nullish(),
    zoneId: z.string().uuid().optional(),
    /** Clear a quarantined/warned exception as part of the edit. */
    clearException: z.boolean().optional(),
  })
  .refine((v) => v.startedAt || v.endedAt || v.zoneId || v.clearException, {
    message: "Nothing to change.",
  });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "time:edit");
    if (denial) return denial;
    // `can()` and `isManagerPlus` disagree for personas granted time:* —
    // require both so a collaborator can't edit someone else's hours.
    if (!isManagerPlus(session)) {
      return apiError("forbidden", "Only managers can edit a time entry.");
    }

    const db = (await createClient()) as unknown as LooseSupabase;
    const { data, error } = await db.rpc("edit_time_entry", {
      p_entry_id: id,
      p_reason: input.reason,
      p_started_at: input.startedAt ?? null,
      p_ended_at: input.endedAt ?? null,
      p_zone_id: input.zoneId ?? null,
      p_clear_exception: input.clearException ?? false,
    });

    if (error) {
      if (error.code === "42501") {
        // Both "not a manager" and the posted-sheet freeze land here; the
        // message from the trigger names which.
        return apiError("forbidden", error.message);
      }
      if (error.code === "22023") return apiError("bad_request", error.message);
      if (error.code === "P0002") return apiError("not_found", "Time entry not found");
      return apiError("internal", error.message);
    }

    return apiOk({ result: data });
  });
}
