import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

/**
 * Shared learning assignments surface (ADR-0008 Move 1).
 *
 * Same query + render across COMPVSS (`/m/learning`) and the portal
 * crew persona (`/p/[slug]/crew/learning`). Caller passes the variant
 * (drives layout/spacing) + a function that produces the course-detail
 * URL — so /m/learning links to /m/learning/[courseId] while the
 * portal can deep-link to its own quiz surface or back to mobile.
 */

type AssignRow = {
  id: string;
  course_id: string;
  assignment_state: string;
  due_at: string | null;
  assigned_at: string;
};

type CourseRow = {
  id: string;
  title: string;
  summary: string | null;
  duration_minutes: number | null;
};

export async function LearningSurface({
  variant,
  detailHref,
  eyebrowLabel,
  titleLabel,
}: {
  variant: "mobile" | "portal";
  /** Function that returns the per-course detail URL for the given
   *  courseId. Mobile uses `/m/learning/{id}`; portal can deep-link to
   *  its own surface or to the mobile equivalent. */
  detailHref: (courseId: string) => string;
  eyebrowLabel?: string;
  titleLabel?: string;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: assignments } = await supabase
    .from("course_assignments")
    .select("id, course_id, assignment_state, due_at, assigned_at")
    .eq("assignee_id", session.userId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(50);

  const rows = (assignments ?? []) as AssignRow[];
  const courseIds = rows.map((r) => r.course_id);
  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, title, summary, duration_minutes").in("id", courseIds)
    : { data: [] as CourseRow[] };
  const courseMap = new Map(((courses ?? []) as CourseRow[]).map((c) => [c.id, c]));

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.common.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.learning.title", undefined, "Learning");

  return (
    <div className={containerClass}>
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t("m.learning.coursesAssigned", { count: rows.length }, `${rows.length} courses assigned`)}
      </p>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.learning.empty.title", undefined, "No Courses")}
              description={t("m.learning.empty.description", undefined, "Training assignments will appear here.")}
            />
          </li>
        ) : (
          rows.map((a) => {
            const course = courseMap.get(a.course_id);
            const tone =
              a.assignment_state === "completed" ? "success" : a.assignment_state === "overdue" ? "error" : "info";
            return (
              <li key={a.id}>
                <Link href={detailHref(a.course_id)} className="surface block p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={tone}>{a.assignment_state}</Badge>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {a.due_at
                        ? t("m.learning.dueDate", { date: fmt.date(a.due_at) }, `due ${fmt.date(a.due_at)}`)
                        : ""}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">
                    {course?.title ?? t("m.learning.courseFallback", undefined, "Course")}
                  </h2>
                  {course?.summary ? (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{course.summary}</p>
                  ) : null}
                  {course?.duration_minutes ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {t(
                        "m.learning.durationMin",
                        { minutes: course.duration_minutes },
                        `~${course.duration_minutes} min`,
                      )}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
