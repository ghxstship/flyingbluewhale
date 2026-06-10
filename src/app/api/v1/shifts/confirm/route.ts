import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  shiftId: z.string().uuid(),
});

/**
 * POST /api/v1/shifts/confirm — worker confirms attendance for an upcoming shift.
 *
 * Only the assigned worker can confirm their own shift. Sets worker_confirmed_at
 * to now() if not already set. Idempotent — repeated calls return ok without
 * changing the original timestamp.
 */
export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "write"), ...RATE_BUDGETS.write });
  if (!rl.ok) return apiError("rate_limited", "Rate limit reached; try again shortly");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    // Resolve the workforce_member row for this user so we can gate on it.
    const { data: wfm } = await supabase
      .from("workforce_members")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!wfm) return apiError("forbidden", "No workforce profile linked to your account");

    // Confirm only shifts assigned to this worker that are still in the future
    // and haven't been checked in yet.
    const { data: shift } = await supabase
      .from("shifts")
      .select("id, attendance, worker_confirmed_at")
      .eq("id", input.shiftId)
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", wfm.id)
      .maybeSingle();

    if (!shift) return apiError("not_found", "Shift not found");
    if (shift.attendance !== "scheduled") {
      return apiError("conflict", "Only scheduled shifts can be confirmed");
    }

    // Idempotent — already confirmed is fine
    if (shift.worker_confirmed_at) {
      return apiOk({ alreadyConfirmed: true, confirmedAt: shift.worker_confirmed_at });
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("shifts")
      .update({ worker_confirmed_at: now } as never)
      .eq("id", input.shiftId)
      .eq("workforce_member_id", wfm.id);

    if (error) return apiError("internal", error.message);

    return apiOk({ confirmed: true, confirmedAt: now });
  });
}
