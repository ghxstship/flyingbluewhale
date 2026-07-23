import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import {
  REGISTRATION_STATE_LABELS,
  SESSION_STATE_LABELS,
  SESSION_STATE_TONES,
  type LiveSession,
  type RegistrationState,
} from "@/lib/legend_live";
import { NEXT_SESSION_STATES } from "@/lib/legend_teach";
import { StateActions } from "../../StateActions";
import { SessionForm } from "../SessionForm";
import { setSessionStateAction, updateSessionAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/teach/sessions/[sessionId] — edit a live session, run its LDP
 * lifecycle (go live / end / cancel), and see the registration funnel the
 * learner page writes into.
 */
export default async function EditSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: sessionRow }, members, { data: courseData }, { data: regData }] = await Promise.all([
    db
      .from("legend_live_sessions")
      .select("id, org_id, title, description, host_id, host_name, kind, course_id, starts_at, duration_minutes, capacity, location, join_url, session_state")
      .eq("id", sessionId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    listOrgMembers(session.orgId),
    db
      .from("legend_courses")
      .select("id, title")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("title", { ascending: true })
      .limit(200),
    db
      .from("legend_session_registrations")
      .select("registration_state")
      .eq("org_id", session.orgId)
      .eq("session_id", sessionId),
  ]);
  if (!sessionRow) notFound();
  const liveSession = sessionRow as LiveSession;
  const courses = (courseData ?? []) as Array<{ id: string; title: string }>;
  const regs = (regData ?? []) as Array<{ registration_state: RegistrationState }>;
  const regCounts = new Map<RegistrationState, number>();
  for (const r of regs) regCounts.set(r.registration_state, (regCounts.get(r.registration_state) ?? 0) + 1);

  const transitionLabel = (target: string) =>
    target === "live"
      ? t("console.legend.teach.sessions.goLive", undefined, "Go live")
      : target === "ended"
        ? t("console.legend.teach.sessions.end", undefined, "End")
        : t("console.legend.teach.sessions.cancel", undefined, "Cancel");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.sessions.editEyebrow", undefined, "Live Session")}
        title={liveSession.title}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: t("console.legend.teach.sessions.breadcrumb", undefined, "Sessions"), href: "/legend/teach/sessions" },
          { label: liveSession.title },
        ]}
      />

      <div className="page-content space-y-8">
        <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                SESSION_STATE_TONES[liveSession.session_state] === "muted"
                  ? "default"
                  : SESSION_STATE_TONES[liveSession.session_state]
              }
            >
              {SESSION_STATE_LABELS[liveSession.session_state]}
            </Badge>
            <span className="text-xs text-[var(--p-text-2)]">
              {liveSession.session_state === "cancelled" || liveSession.session_state === "ended"
                ? t("console.legend.teach.sessions.terminalHint", undefined, "This session is closed. Schedule a new one to run it again.")
                : t("console.legend.teach.sessions.lifecycleHint", undefined, "Scheduled sessions go live, then end. Cancelling notifies nobody automatically; tell your registrants.")}
            </span>
          </div>
          <StateActions
            action={setSessionStateAction.bind(null, liveSession.id)}
            options={NEXT_SESSION_STATES[liveSession.session_state].map((n) => ({ value: n, label: transitionLabel(n) }))}
          />
        </div>

        <div className="metric-grid">
          <MetricCard
            label={REGISTRATION_STATE_LABELS.registered}
            value={regCounts.get("registered") ?? 0}
          />
          <MetricCard
            label={REGISTRATION_STATE_LABELS.waitlisted}
            value={regCounts.get("waitlisted") ?? 0}
          />
          <MetricCard
            label={REGISTRATION_STATE_LABELS.cancelled}
            value={regCounts.get("cancelled") ?? 0}
          />
          <MetricCard
            label={REGISTRATION_STATE_LABELS.attended}
            value={regCounts.get("attended") ?? 0}
          />
        </div>

        <section className="max-w-2xl space-y-3">
          <h2 className="eyebrow">{t("console.legend.teach.sessions.detailsHeading", undefined, "Details")}</h2>
          <SessionForm
            action={updateSessionAction.bind(null, liveSession.id)}
            liveSession={liveSession}
            courses={courses}
            hosts={members.map((m) => ({ id: m.id, name: m.name }))}
            submitLabel={t("console.legend.teach.sessions.editSubmit", undefined, "Save Session")}
          />
        </section>
      </div>
    </>
  );
}
