import "server-only";
import { createClient } from "@/lib/supabase/server";
import { WEEKLY_OVERTIME_THRESHOLD_HOURS, weekBoundsUtc, shiftHours } from "@/lib/workforce";

export type SwapOvertimeRisk = {
  targetUserId: string;
  projectedHours: number;
  thresholdHours: number;
};

/**
 * Would approving this swap push the target worker's scheduled hours for
 * the shift's week over the weekly overtime threshold? Returns null for
 * open-pool swaps (no named target), a target with no workforce_member
 * record in this org, or a shift that isn't found — those can't be
 * evaluated and aren't blocked.
 */
export async function computeSwapOvertimeRisk(
  orgId: string,
  shiftId: string,
  targetUserId: string | null,
): Promise<SwapOvertimeRisk | null> {
  if (!targetUserId) return null;
  const supabase = await createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("starts_at, ends_at, break_minutes")
    .eq("org_id", orgId)
    .eq("id", shiftId)
    .maybeSingle();
  if (!shift) return null;

  const { data: member } = await supabase
    .from("workforce_members")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!member) return null;

  const { start, end } = weekBoundsUtc(shift.starts_at);
  const { data: weekShifts } = await supabase
    .from("shifts")
    .select("id, starts_at, ends_at, break_minutes")
    .eq("org_id", orgId)
    .eq("workforce_member_id", member.id)
    .gte("starts_at", start)
    .lt("starts_at", end);

  const existingHours = (weekShifts ?? [])
    .filter((s) => s.id !== shiftId)
    .reduce((sum, s) => sum + shiftHours(s.starts_at, s.ends_at, s.break_minutes), 0);
  const projectedHours = existingHours + shiftHours(shift.starts_at, shift.ends_at, shift.break_minutes);

  if (projectedHours <= WEEKLY_OVERTIME_THRESHOLD_HOURS) return null;
  return {
    targetUserId,
    projectedHours: Math.round(projectedHours * 100) / 100,
    thresholdHours: WEEKLY_OVERTIME_THRESHOLD_HOURS,
  };
}
