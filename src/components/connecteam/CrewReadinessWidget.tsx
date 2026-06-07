import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";

/**
 * Real-time crew readiness summary for COMPVSS feed (Feature: Connecteam
 * Attendance Widget parity). Shows who is clocked in, on approved leave,
 * and absent right now — driven by live time_entries + time_off_requests.
 *
 * Mounted above announcements in FeedSurface so field managers get
 * operational awareness at a glance without leaving the feed.
 */
export async function CrewReadinessWidget({ orgId }: { orgId: string }) {
  if (!hasSupabase) return null;
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ count: clockedIn }, { count: onLeave }] = await Promise.all([
    // Active clock-ins: started today, not yet ended
    supabase
      .from("time_entries")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("ended_at", null)
      .gte("started_at", todayStart.toISOString()),
    // Approved time-off covering today (starts_on ≤ today ≤ ends_on)
    supabase
      .from("time_off_requests")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("request_state", "approved")
      .lte("starts_on", todayEnd.toISOString().slice(0, 10))
      .gte("ends_on", todayStart.toISOString().slice(0, 10)),
  ]);

  const safeClocked = clockedIn ?? 0;
  const safeLeave = onLeave ?? 0;

  return (
    <div className="mb-5 space-y-2">
      <RealtimeRefresh
        channelName={`crew-readiness-${orgId}`}
        table="time_entries"
        filter={`org_id=eq.${orgId}`}
      />
      <p className="text-[11px] font-semibold tracking-wider text-[var(--p-text-2)] uppercase">Crew Today</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="surface p-3 text-center">
          <div className="text-2xl font-semibold tabular-nums text-[var(--p-success,#22c55e)]">{safeClocked}</div>
          <div className="mt-0.5 text-[10px] text-[var(--p-text-2)]">Clocked In</div>
        </div>
        <div className="surface p-3 text-center">
          <div className="text-2xl font-semibold tabular-nums text-[var(--p-warning,#f59e0b)]">{safeLeave}</div>
          <div className="mt-0.5 text-[10px] text-[var(--p-text-2)]">On Leave</div>
        </div>
        <div className="surface p-3 text-center">
          <div className="text-2xl font-semibold tabular-nums">
            {safeClocked > 0 || safeLeave > 0 ? (
              <span className={safeClocked > 0 ? "text-[var(--p-accent)]" : "text-[var(--p-text-2)]"}>
                {safeClocked + safeLeave}
              </span>
            ) : (
              <span className="text-[var(--p-text-2)]">—</span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--p-text-2)]">Accounted</div>
        </div>
      </div>
    </div>
  );
}
