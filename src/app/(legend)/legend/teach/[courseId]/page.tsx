import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  COURSE_STATE_LABELS,
  LESSON_KIND_LABELS,
  formatDuration,
  type Assessment,
  type Course,
  type Lesson,
} from "@/lib/legend_learning";
import { NEXT_COURSE_STATES, NEXT_LESSON_STATES } from "@/lib/legend_teach";
import { StateActions } from "../StateActions";
import {
  deleteCourseAction,
  deleteLessonAction,
  moveLessonAction,
  setCourseStateAction,
  setLessonStateAction,
} from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/teach/[courseId] — the course editor hub: metadata, LDP
 * transitions (publish carries the >=1-published-lesson guard), ordered
 * lesson management, and the assessment list. What publishes here renders
 * verbatim on /legend/learn/[courseId].
 */
export default async function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: courseRow } = await db
    .from("legend_courses")
    .select("id, org_id, title, summary, cover_path, points_reward, grants_certification_id, course_state, created_at, updated_at")
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!courseRow) notFound();
  const course = courseRow as Course;

  const [{ data: lessonData }, { data: assessmentData }, { count: enrollmentCount }, certName] = await Promise.all([
    db
      .from("lessons")
      .select("id, org_id, course_id, module_id, title, kind, media_url, body_html, duration_seconds, sort_order, lesson_state")
      .eq("org_id", session.orgId)
      .eq("course_id", course.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    db
      .from("assessments")
      .select("id, org_id, course_id, lesson_id, title, pass_pct, max_attempts, assessment_state")
      .eq("org_id", session.orgId)
      .eq("course_id", course.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    db
      .from("course_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("course_id", course.id),
    course.grants_certification_id
      ? db
          .from("legend_certifications")
          .select("name")
          .eq("id", course.grants_certification_id)
          .eq("org_id", session.orgId)
          .is("deleted_at", null)
          .maybeSingle()
          .then((r: { data: unknown }) => ((r.data as { name: string } | null)?.name ?? null))
      : Promise.resolve<string | null>(null),
  ]);

  const lessons = (lessonData ?? []) as Lesson[];
  const assessments = (assessmentData ?? []) as Assessment[];
  const publishedLessons = lessons.filter((l) => l.lesson_state === "published").length;

  const transitionLabel = (target: string) =>
    target === "published"
      ? t("console.legend.teach.transitions.publish", undefined, "Publish")
      : target === "archived"
        ? t("console.legend.teach.transitions.archive", undefined, "Archive")
        : course.course_state === "archived"
          ? t("console.legend.teach.transitions.restore", undefined, "Restore")
          : t("console.legend.teach.transitions.unpublish", undefined, "Unpublish");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.teach.editor.eyebrow", undefined, "Course Editor")}
        title={course.title}
        subtitle={`${COURSE_STATE_LABELS[course.course_state]}${certName ? ` · ${certName}` : ""}`}
        breadcrumbs={[
          { label: t("console.legend.teach.breadcrumbRoot", undefined, "LEG3ND") },
          { label: t("console.legend.teach.title", undefined, "Teach"), href: "/legend/teach" },
          { label: course.title },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button href={`/legend/learn/${course.id}`} size="sm" variant="ghost">
              {t("console.legend.teach.editor.viewAsLearner", undefined, "View as learner")}
            </Button>
            <Button href={`/legend/teach/${course.id}/edit`} size="sm" variant="secondary">
              {t("console.legend.teach.editor.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteCourseAction.bind(null, course.id)}
              confirm={t("console.legend.teach.editor.deleteConfirm", { title: course.title }, `Delete course "${course.title}"?`)}
            />
          </div>
        }
      />

      <div className="page-content space-y-8">
        <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={course.course_state} />
            <span className="text-xs text-[var(--p-text-2)]">
              {course.course_state === "draft"
                ? t(
                    "console.legend.teach.editor.draftHint",
                    undefined,
                    "Drafts are invisible to learners. Publish needs at least one published lesson.",
                  )
                : course.course_state === "published"
                  ? t("console.legend.teach.editor.publishedHint", undefined, "Live in the learner catalog.")
                  : t("console.legend.teach.editor.archivedHint", undefined, "Hidden from the catalog. Restore to edit and republish.")}
            </span>
          </div>
          <StateActions
            action={setCourseStateAction.bind(null, course.id)}
            options={NEXT_COURSE_STATES[course.course_state].map((s) => ({ value: s, label: transitionLabel(s) }))}
          />
        </div>

        <div className="metric-grid">
          <MetricCard label={t("console.legend.teach.editor.lessons", undefined, "Lessons")} value={lessons.length} />
          <MetricCard label={t("console.legend.teach.editor.publishedLessons", undefined, "Published lessons")} value={publishedLessons} />
          <MetricCard label={t("console.legend.teach.editor.assessments", undefined, "Assessments")} value={assessments.length} />
          <MetricCard label={t("console.legend.teach.editor.enrollments", undefined, "Enrollments")} value={enrollmentCount ?? 0} />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="eyebrow">{t("console.legend.teach.editor.lessonsHeading", undefined, "Lessons")}</h2>
            <Button href={`/legend/teach/${course.id}/lessons/new`} size="sm">
              {t("console.legend.teach.editor.addLesson", undefined, "Add Lesson")}
            </Button>
          </div>
          {lessons.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legend.teach.editor.noLessonsTitle", undefined, "No lessons yet")}
              description={t(
                "console.legend.teach.editor.noLessonsDescription",
                undefined,
                "Add the first lesson. The course can publish once at least one lesson is published.",
              )}
            />
          ) : (
            <ol className="surface divide-y divide-[var(--p-border)]">
              {lessons.map((l, i) => (
                <li key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 text-center font-mono text-xs text-[var(--p-text-3)]">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/legend/teach/${course.id}/lessons/${l.id}`}
                          className="text-sm font-medium text-[var(--p-text-1)] hover:underline"
                        >
                          {l.title}
                        </Link>
                        <StatusBadge status={l.lesson_state} />
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-[var(--p-text-3)]">
                        {LESSON_KIND_LABELS[l.kind]}
                        {l.duration_seconds > 0 ? ` · ${formatDuration(l.duration_seconds)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StateActions
                      action={moveLessonAction.bind(null, course.id, l.id)}
                      name="direction"
                      options={[
                        ...(i > 0 ? [{ value: "up", label: "↑" }] : []),
                        ...(i < lessons.length - 1 ? [{ value: "down", label: "↓" }] : []),
                      ]}
                    />
                    <StateActions
                      action={setLessonStateAction.bind(null, course.id, l.id)}
                      options={NEXT_LESSON_STATES[l.lesson_state].map((s) => ({
                        value: s,
                        label:
                          s === "published"
                            ? t("console.legend.teach.transitions.publish", undefined, "Publish")
                            : s === "archived"
                              ? t("console.legend.teach.transitions.archive", undefined, "Archive")
                              : l.lesson_state === "archived"
                                ? t("console.legend.teach.transitions.restore", undefined, "Restore")
                                : t("console.legend.teach.transitions.unpublish", undefined, "Unpublish"),
                      }))}
                    />
                    <DeleteForm
                      action={deleteLessonAction.bind(null, course.id, l.id)}
                      confirm={t("console.legend.teach.editor.deleteLessonConfirm", { title: l.title }, `Delete lesson "${l.title}"?`)}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="eyebrow">{t("console.legend.teach.editor.assessmentsHeading", undefined, "Assessments")}</h2>
            <Button href={`/legend/teach/${course.id}/assessments/new`} size="sm">
              {t("console.legend.teach.editor.addAssessment", undefined, "Add Assessment")}
            </Button>
          </div>
          {assessments.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legend.teach.editor.noAssessmentsTitle", undefined, "No assessment")}
              description={t(
                "console.legend.teach.editor.noAssessmentsDescription",
                undefined,
                "Optional. Without a published assessment the course completes on lessons alone; with one, passing can grant the linked certification.",
              )}
            />
          ) : (
            <ul className="surface divide-y divide-[var(--p-border)]">
              {assessments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/legend/teach/${course.id}/assessments/${a.id}`}
                        className="text-sm font-medium text-[var(--p-text-1)] hover:underline"
                      >
                        {a.title}
                      </Link>
                      <StatusBadge status={a.assessment_state} />
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-[var(--p-text-3)]">
                      {t("console.legend.teach.editor.passPct", { pct: a.pass_pct }, `Pass ≥ ${a.pass_pct}%`)}
                      {a.max_attempts != null
                        ? ` · ${t("console.legend.teach.editor.maxAttempts", { count: a.max_attempts }, `${a.max_attempts} attempts max`)}`
                        : ""}
                    </p>
                  </div>
                  <Button href={`/legend/teach/${course.id}/assessments/${a.id}`} size="sm" variant="secondary">
                    {t("console.legend.teach.editor.openBuilder", undefined, "Open builder")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
