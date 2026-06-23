import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  SESSION_KIND_LABELS,
  SESSION_STATE_LABELS,
  SESSION_STATE_TONES,
  formatSessionTime,
  formatSessionDuration,
  type LiveSession,
} from "@/lib/legend_live";
import { SessionRegisterButton } from "./SessionRegisterButton";

export const dynamic = "force-dynamic";

/**
 * /legend/live — webinars, cohort labs, and instructor-led workshops with
 * per-learner registration (capacity-aware → waitlist). Reads real sessions +
 * the viewer's own registrations.
 */
export default async function LiveSessionsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Learn" title="Live Sessions" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: sessionData }, { data: regData }, { data: myRegData }] = await Promise.all([
    db
      .from("legend_live_sessions")
      .select("id, org_id, title, description, host_id, host_name, kind, course_id, starts_at, duration_minutes, capacity, location, join_url, session_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .neq("session_state", "cancelled")
      .order("starts_at", { ascending: true })
      .limit(100),
    db.from("legend_session_registrations").select("session_id, registration_state").eq("org_id", session.orgId),
    db
      .from("legend_session_registrations")
      .select("session_id, registration_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
  ]);

  const sessions = (sessionData ?? []) as LiveSession[];

  // Count active registrations per session (registered + waitlisted).
  const counts = new Map<string, number>();
  for (const r of (regData ?? []) as Array<{ session_id: string; registration_state: string }>) {
    if (r.registration_state === "registered" || r.registration_state === "waitlisted") {
      counts.set(r.session_id, (counts.get(r.session_id) ?? 0) + 1);
    }
  }
  // The viewer's own active registrations.
  const myReg = new Map<string, string>();
  for (const r of (myRegData ?? []) as Array<{ session_id: string; registration_state: string }>) {
    if (r.registration_state !== "cancelled") myReg.set(r.session_id, r.registration_state);
  }

  const upcoming = sessions.filter((s) => s.session_state !== "ended").length;
  const myCount = sessions.filter((s) => myReg.has(s.id)).length;

  return (
    <>
      <ModuleHeader eyebrow="LEG3ND · Learn" title="Live Sessions" subtitle="Webinars, cohort labs, and instructor-led workshops — register to reserve your seat." />

      <div className="metric-grid mb-6">
        <MetricCard label="Upcoming" value={upcoming} />
        <MetricCard label="You're registered" value={myCount} />
        <MetricCard label="Total sessions" value={sessions.length} />
      </div>

      {sessions.length === 0 ? (
        <EmptyState size="compact" title="No sessions scheduled" description="Live sessions your org schedules will appear here." />
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const taken = counts.get(s.id) ?? 0;
            const myState = myReg.get(s.id);
            const seats = s.capacity != null ? `${taken} / ${s.capacity} seats` : `${taken} registered`;
            return (
              <li key={s.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--p-text-1)]">{s.title}</h3>
                    <Badge variant={SESSION_STATE_TONES[s.session_state] === "muted" ? "default" : SESSION_STATE_TONES[s.session_state]}>
                      {SESSION_STATE_LABELS[s.session_state]}
                    </Badge>
                    {myState && (
                      <span className="text-xs font-medium text-[var(--p-success)]">
                        {myState === "waitlisted" ? "Waitlisted" : "Registered"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">
                    {SESSION_KIND_LABELS[s.kind]} · {formatSessionTime(s.starts_at)} · {formatSessionDuration(s.duration_minutes)}
                    {s.host_name ? ` · ${s.host_name}` : ""} · {seats}
                  </p>
                  {s.description && <p className="mt-1 text-xs text-[var(--p-text-3)]">{s.description}</p>}
                </div>
                {s.session_state !== "ended" && (
                  <SessionRegisterButton sessionId={s.id} registered={!!myState} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
