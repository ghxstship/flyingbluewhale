import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * PATCH /api/v1/time/corrections/{id} — decide a correction.
 *
 * The decision and its effect go through the `apply_time_correction` RPC
 * so they share one transaction: the state change, the entry mutation, the
 * audit reason, and the re-open of an already-approved timesheet either all
 * land or none do. Splitting them in application code is what leaves a
 * phantom decision behind when the second write fails.
 *
 * Authority is re-checked inside the RPC (manager band, same org, never the
 * requester) rather than trusted from here — the route is the friendly
 * layer, the database is the authoritative one.
 */

const PatchSchema = z.object({
  decision: z.enum(["approved", "denied"]),
  notes: z.string().max(2000).optional(),
});

type ApplyResult = { state: string; reopened_timesheet: boolean; time_entry_id?: string };

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    // time:approve is absent from every member/contractor/crew list and
    // resolves through the owner/admin "*" grant plus manager's time:*.
    const denial = assertCapability(session, "time:approve");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { data, error } = await supabase.rpc("apply_time_correction", {
      p_correction_id: id,
      p_decision: input.decision,
      p_notes: input.notes ?? null,
    });

    if (error) {
      // Map the RPC's errcodes onto the envelope rather than leaking
      // Postgres text. 42501 covers both "not a manager" and the
      // separation-of-duties refusal; 55000 is a stale decision; P0002 is
      // an unknown id.
      if (error.code === "42501") return apiError("forbidden", error.message);
      if (error.code === "55000") return apiError("conflict", error.message);
      if (error.code === "P0002") return apiError("not_found", "Correction not found");
      return apiError("internal", error.message);
    }

    return apiOk({ result: data as ApplyResult });
  });
}
