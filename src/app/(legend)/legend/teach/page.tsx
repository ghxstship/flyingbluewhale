import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { COURSE_STATES, COURSE_STATE_LABELS, type Course, type CourseState } from "@/lib/legend_learning";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/teach — the authoring home (PERSONA_MATRIX blockers B-1 + B-2).
 * Manager+ band. Courses with a draft/published/archived lens, plus the
 * live-session scheduling console. The learner-facing catalog
 * (/legend/learn) reads the same tables filtered to published.
 */
export default async function TeachPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { t } = await getRequestT();
  const eyebrow = t("console.legend.teach.eyebrow", undefined, "LEG3ND · Manage");
  const title = t("console.legend.teach.title", undefined, "Teach");
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
  const { state } = await searchParams;
  const lens = (COURSE_STATES as readonly string[]).includes(state ?? "") ? (state as CourseState) : null;

  const db = (await createClient()) as unknown as LooseSupabase;
  const [{ data: courseData }, { data: sessionAgg }] = await Promise.all([
    db
      .from("legend_courses")
      .select("id, org_id, title, summary, cover_path, points_reward, grants_certification_id, course_state, created_at, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    db
      .from("legend_live_sessions")
      .select("id, session_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .in("session_state", ["scheduled", "live"]),
  ]);
  const courses = (courseData ?? []) as Course[];
  const upcomingSessions = (sessionAgg ?? []).length;

  const byState = new Map<CourseState, number>();
  for (const c of courses) byState.set(c.course_state, (byState.get(c.course_state) ?? 0) + 1);
  const visible = lens ? courses.filter((c) => c.course_state === lens) : courses;

  return (
    <>
      <ModuleHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={t(
          "console.legend.teach.subtitle",
          undefined,
          "Author courses, lessons, and assessments, and schedule live sessions. Published work lands in the learner catalog.",
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/legend/teach/sessions" size="sm" variant="secondary">
              {t("console.legend.teach.sessionsCta", undefined, "Live Sessions")}
            </Button>
            <Button href="/legend/teach/new" size="sm">
              {t("console.legend.teach.newCourse", undefined, "New Course")}
            </Button>
          </div>
        }
      />

      <div className="metric-grid mb-6">
        <MetricCard label={t("console.legend.teach.metrics.courses", undefined, "Courses")} value={courses.length} />
        <MetricCard
          label={t("console.legend.teach.metrics.published", undefined, "Published")}
          value={byState.get("published") ?? 0}
        />
        <MetricCard label={t("console.legend.teach.metrics.drafts", undefined, "Drafts")} value={byState.get("draft") ?? 0} />
        <MetricCard
          label={t("console.legend.teach.metrics.upcomingSessions", undefined, "Upcoming sessions")}
          value={upcomingSessions}
        />
      </div>

      {/* Authoring-lifecycle lens as a tab strip (status is never a filter
          pill — feedback canon; the row badge stays the status home). */}
      <nav
        className="mb-4 flex items-center gap-4 border-b border-[var(--p-border)]"
        aria-label={t("console.legend.teach.lens.aria", undefined, "Filter courses by lifecycle state")}
      >
        {[null, ...COURSE_STATES].map((s) => {
          const active = lens === s;
          const label = s === null ? t("console.legend.teach.lens.all", undefined, "All") : COURSE_STATE_LABELS[s];
          const count = s === null ? courses.length : (byState.get(s) ?? 0);
          return (
            <Link
              key={s ?? "all"}
              href={s === null ? "/legend/teach" : `/legend/teach?state=${s}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm ${
                active
                  ? "border-[var(--p-accent)] font-semibold text-[var(--p-text-1)]"
                  : "border-transparent text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
              }`}
            >
              {label} <span className="font-mono text-xs text-[var(--p-text-3)]">{count}</span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("console.legend.teach.emptyTitle", undefined, "No courses yet")}
          description={t(
            "console.legend.teach.emptyDescription",
            undefined,
            "Create your first course, add lessons, then publish it to the learner catalog.",
          )}
          action={
            <Button href="/legend/teach/new" size="sm">
              {t("console.legend.teach.newCourse", undefined, "New Course")}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((c) => (
            <li key={c.id}>
              <Link
                href={`/legend/teach/${c.id}`}
                className="surface hover-lift flex items-center justify-between gap-3 p-4"
                style={{ minHeight: 44 }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--p-text-1)]">{c.title}</span>
                    <StatusBadge status={c.course_state} />
                  </div>
                  {c.summary && <p className="mt-1 line-clamp-1 text-xs text-[var(--p-text-2)]">{c.summary}</p>}
                </div>
                <span className="shrink-0 font-mono text-xs text-[var(--p-text-3)]">
                  {c.points_reward > 0
                    ? t("console.legend.teach.pointsShort", { points: c.points_reward }, `${c.points_reward} pts`)
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
