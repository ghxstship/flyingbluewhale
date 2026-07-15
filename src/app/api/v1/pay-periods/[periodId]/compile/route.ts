import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * POST /api/v1/pay-periods/{periodId}/compile — gather punches into sheets.
 *
 * The caller `compile_timesheets` never had. Until this route existed the
 * RPC was real but unreachable, so nothing inserted a `timesheets` row and
 * nothing stamped `time_entries.timesheet_id` — the exact hollowness the
 * lifecycle plan opened by describing, one layer up.
 *
 * SAFE TO RE-RUN, and meant to be. The RPC is idempotent by construction
 * (ON CONFLICT on `ts_one_per_party_period`), so an operator can compile
 * again as late offline punches replay without duplicating a sheet or
 * disturbing one that has already moved past `open`.
 *
 * Manager band: compiling is bookkeeping over hours already recorded, not a
 * decision about them.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await ctx.params;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "time:approve");
    if (denial) return denial;

    const db = (await createClient()) as unknown as LooseSupabase;
    const { data, error } = await db.rpc("compile_timesheets", {
      p_org_id: session.orgId,
      p_pay_period_id: periodId,
    });

    if (error) {
      if (error.code === "42501") return apiError("forbidden", error.message);
      // The period is locked or posted — compiling into it would move hours
      // payroll has already consumed.
      if (error.code === "55000") return apiError("conflict", error.message);
      if (error.code === "P0002") return apiError("not_found", "Pay period not found");
      return apiError("internal", error.message);
    }

    const result = data as { sheets: number; entries_linked: number } | null;
    return apiOk({
      compiled: result,
      message: `${result?.sheets ?? 0} timesheet${result?.sheets === 1 ? "" : "s"}, ${result?.entries_linked ?? 0} entr${result?.entries_linked === 1 ? "y" : "ies"} linked.`,
    });
  });
}
