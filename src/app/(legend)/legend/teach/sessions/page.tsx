import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  SESSION_KIND_LABELS,
  SESSION_STATE_LABELS,
  SESSION_STATE_TONES,
  formatSessionDuration,
  formatSessionTime,
  type LiveSession,
} from "@/lib/legend_live";
import { NEXT_SESSION_STATES } from "@/lib/legend_teach";
import { StateActions } from "../StateActions";
import { setSessionStateAction } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/teach/sessions — live-session authoring (PERSONA_MATRIX blocker
 * B-2): schedule, edit, run (scheduled → live → ended), and cancel the
 * sessions the learner /legend/live registration UX consumes.
 */
export default async function TeachSessionsPage() {
  const { t } = await getRequestT();
  const eyebrow = t("console.legend.teach.eyebrow", undefined, "LEG3ND · Manage");
  const title = t("console.legend.teach.sessions.title", undefined, "Live Sessions");
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow={eyebrow} title={title} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: sessionData }, { data: regData }] = await Promise.all([
    db
      .from("legend_live_sessions")
      .select("id, org_id, title, description, host_id, host_name, kind, course_id, starts_at, duration_minutes, capacity, location, join_url, session_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("starts_at", { ascending: false })
      .limit(200),
    db.from("legend_session_registrations").select("session_id, registration_state").eq("org_id", session.orgId),
  ]);
  const sessions = (sessionData ?? []) as LiveSession[];
  const counts = new Map<string, number>();
  for (const r of (regData ?? []) as Array<{ session_id: string; registration_state: string }>) {
    if (r.registration_state === "registered" || r.registration_state === "waitlisted") {
      counts.set(r.session_id, (counts.get(r.session_id) ?? 0) + 1);
    }
  }
  const scheduled = sessions.filter((s) => s.session_state === "scheduled").length;
  const liveNow = sessions.filter((s) => s.session_state === "live").length;

  const transitionLabel = (target: string) =>
    target === "live"
      ? t("console.legend.teach.sessions.goLive", undefined, "Go live")
      : target === "ended"
        ? t("console.legend.teach.sessions.end", undefined, "End")
        : t("console.legend.teach.sessions.cancel", undefined, "Cancel");

  return (
    <>
      <ModuleHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={t(
          "console.legend.teach.sessions.subtitle",
          undefined,
          "Schedule and run webinars, labs, and workshops. Learners register on the Live Sessions page.",
        )}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: t("console.legend.teach.sessions.breadcrumb", undefined, "Sessions") },
        ]}
        action={
          <Button href="/legend/teach/sessions/new" size="sm">
            {t("console.legend.teach.sessions.newSession", undefined, "New Session")}
          </Button>
        }
      />

      <div className="metric-grid mb-6">
        <MetricCard label={t("console.legend.teach.sessions.metrics.total", undefined, "Sessions")} value={sessions.length} />
        <MetricCard label={t("console.legend.teach.sessions.metrics.scheduled", undefined, "Scheduled")} value={scheduled} />
        <MetricCard label={t("console.legend.teach.sessions.metrics.liveNow", undefined, "Live now")} value={liveNow} />
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("console.legend.teach.sessions.emptyTitle", undefined, "No sessions yet")}
          description={t(
            "console.legend.teach.sessions.emptyDescription",
            undefined,
            "Schedule the first session and it appears on the learner Live Sessions page immediately.",
          )}
          action={
            <Button href="/legend/teach/sessions/new" size="sm">
              {t("console.legend.teach.sessions.newSession", undefined, "New Session")}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const taken = counts.get(s.id) ?? 0;
            return (
              <li key={s.id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/legend/teach/sessions/${s.id}`}
                      className="text-sm font-semibold text-[var(--p-text-1)] hover:underline"
                    >
                      {s.title}
                    </Link>
                    <Badge variant={SESSION_STATE_TONES[s.session_state] === "muted" ? "default" : SESSION_STATE_TONES[s.session_state]}>
                      {SESSION_STATE_LABELS[s.session_state]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">
                    {SESSION_KIND_LABELS[s.kind]} · {formatSessionTime(s.starts_at)} · {formatSessionDuration(s.duration_minutes)}
                    {s.host_name ? ` · ${s.host_name}` : ""} ·{" "}
                    {s.capacity != null
                      ? t("console.legend.teach.sessions.seats", { taken, capacity: s.capacity }, `${taken} / ${s.capacity} seats`)
                      : t("console.legend.teach.sessions.nRegistered", { count: taken }, `${taken} registered`)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button href={`/legend/teach/sessions/${s.id}`} size="sm" variant="secondary">
                    {t("console.legend.teach.sessions.edit", undefined, "Edit")}
                  </Button>
                  <StateActions
                    action={setSessionStateAction.bind(null, s.id)}
                    options={NEXT_SESSION_STATES[s.session_state].map((n) => ({ value: n, label: transitionLabel(n) }))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
