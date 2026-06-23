import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  type Course,
  type CourseEnrollment,
  summarizeEnrollments,
  COURSE_STATE_LABELS,
} from "@/lib/legend_learning";

export const dynamic = "force-dynamic";

/**
 * /legend/path — the Learning Path: the org's published courses laid out as
 * sequential units the learner progresses through. Each unit shows lesson
 * count, XP reward, the learner's progress, and enrollment state — complete
 * each to unlock the next.
 */
export default async function LearningPathPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Learn" title="Learning Path" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: courseData }, { data: enrollData }, { data: lessonData }] = await Promise.all([
    db
      .from("legend_courses")
      .select("id, title, summary, points_reward, course_state, created_at")
      .eq("org_id", session.orgId)
      .eq("course_state", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    db
      .from("course_enrollments")
      .select("course_id, enrollment_state, progress_pct")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
    db
      .from("lessons")
      .select("course_id")
      .eq("org_id", session.orgId)
      .eq("lesson_state", "published")
      .is("deleted_at", null),
  ]);

  const courses = (courseData ?? []) as Course[];

  const enrollments = (enrollData ?? []) as Array<
    Pick<CourseEnrollment, "course_id" | "enrollment_state" | "progress_pct">
  >;
  const enrollmentByCourse = new Map(enrollments.map((e) => [e.course_id, e]));

  const lessonCounts = new Map<string, number>();
  for (const l of (lessonData ?? []) as Array<{ course_id: string }>) {
    lessonCounts.set(l.course_id, (lessonCounts.get(l.course_id) ?? 0) + 1);
  }

  const stats = summarizeEnrollments(enrollments);

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Learn"
        title="Learning Path"
        subtitle="Your sequential route through the org's published courses — complete each unit to unlock the next."
      />

      <div className="metric-grid mb-6">
        <MetricCard label="Courses" value={String(courses.length)} />
        <MetricCard label="Completed" value={String(stats.completed)} />
        <MetricCard label="In Progress" value={String(stats.inProgress)} />
        <MetricCard label="Avg Progress" value={`${stats.avgProgress}%`} />
      </div>

      {courses.length === 0 ? (
        <EmptyState
          size="compact"
          title="No courses yet"
          description="Published courses will appear here as your org builds the path."
        />
      ) : (
        <ol className="space-y-3">
          {courses.map((course, i) => {
            const enrollment = enrollmentByCourse.get(course.id);
            const lessons = lessonCounts.get(course.id) ?? 0;
            const progress = enrollment?.progress_pct ?? 0;
            const stateLabel = enrollment ? enrollment.enrollment_state : "Not started";
            return (
              <li key={course.id} className="surface flex gap-4 p-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: "var(--p-accent)", color: "var(--p-surface)" }}
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/legend/learn/${course.id}`}
                      className="text-lg font-semibold"
                      style={{ color: "var(--p-text-1)" }}
                    >
                      {course.title}
                    </Link>
                    <span className="font-mono text-xs" style={{ color: "var(--p-text-3)" }}>
                      {COURSE_STATE_LABELS[course.course_state]} · +{course.points_reward} XP
                    </span>
                  </div>
                  {course.summary && (
                    <p className="text-sm" style={{ color: "var(--p-text-2)" }}>
                      {course.summary}
                    </p>
                  )}
                  <ProgressBar value={progress} aria-label={`${course.title} progress`} />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span style={{ color: "var(--p-text-3)" }}>
                      {lessons} {lessons === 1 ? "lesson" : "lessons"}
                    </span>
                    <span style={{ color: "var(--p-text-2)" }}>{stateLabel}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
