import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { summarizeEnrollments, ENROLLMENT_STATE_LABELS, type EnrollmentState } from "@/lib/legend_learning";

export const dynamic = "force-dynamic";

type EnrollmentRow = {
  id: string;
  course_id: string;
  enrollment_state: EnrollmentState;
  progress_pct: number;
  completed_at: string | null;
};

function badgeVariant(state: EnrollmentState): "success" | "info" | "default" {
  if (state === "completed") return "success";
  if (state === "in_progress" || state === "enrolled") return "info";
  return "default";
}

/**
 * /legend/my-learning — the learner's own enrolled courses, split into
 * In progress (enrolled / in_progress) and Completed, with headline stats.
 */
export default async function MyLearningPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Learn" title="My Learning" />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: enrollData } = await db
    .from("course_enrollments")
    .select("id, course_id, enrollment_state, progress_pct, completed_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false });

  const enrollments = (enrollData ?? []) as EnrollmentRow[];

  const courseMap = new Map<string, { title: string; summary: string | null }>();
  const ids = enrollments.map((e) => e.course_id);
  if (ids.length > 0) {
    const { data: courseData } = await db
      .from("legend_courses")
      .select("id, title, summary")
      .eq("org_id", session.orgId)
      .in("id", ids);
    for (const c of (courseData ?? []) as Array<{ id: string; title: string; summary: string | null }>) {
      courseMap.set(c.id, { title: c.title, summary: c.summary });
    }
  }

  const stats = summarizeEnrollments(enrollments);

  const inProgress = enrollments.filter(
    (e) => e.enrollment_state === "in_progress" || e.enrollment_state === "enrolled",
  );
  const completed = enrollments.filter((e) => e.enrollment_state === "completed");

  function CourseCard({ e }: { e: EnrollmentRow }) {
    const course = courseMap.get(e.course_id);
    return (
      <div className="surface flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/legend/learn/${e.course_id}`}
            className="text-sm font-semibold text-[var(--p-text-1)] hover:text-[var(--p-accent)]"
          >
            {course?.title ?? "Untitled course"}
          </Link>
          <Badge variant={badgeVariant(e.enrollment_state)}>{ENROLLMENT_STATE_LABELS[e.enrollment_state]}</Badge>
        </div>
        {course?.summary && <p className="text-xs text-[var(--p-text-2)]">{course.summary}</p>}
        <ProgressBar value={e.progress_pct} aria-label={`${course?.title ?? "Course"} progress`} />
      </div>
    );
  }

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Learn"
        title="My Learning"
        subtitle="Courses you're enrolled in — pick up where you left off."
      />

      <div className="metric-grid mb-6">
        <MetricCard label="Enrolled" value={String(stats.enrolled)} />
        <MetricCard label="In Progress" value={String(stats.inProgress)} />
        <MetricCard label="Completed" value={String(stats.completed)} />
        <MetricCard label="Avg Progress" value={`${stats.avgProgress}%`} />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          size="compact"
          title="Nothing enrolled yet"
          description="Browse the Catalog to enroll in your first course."
        />
      ) : (
        <div className="space-y-8">
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--p-text-2)]">In progress</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {inProgress.map((e) => (
                  <CourseCard key={e.id} e={e} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--p-text-2)]">Completed</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {completed.map((e) => (
                  <CourseCard key={e.id} e={e} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
