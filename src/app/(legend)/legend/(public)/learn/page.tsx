import Link from "next/link";
import { COURSES } from "./sample";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { formatDuration, type Course } from "@/lib/legend_learning";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/learn — the LEG3ND LMS catalog (XPMS 2.0 protocol).
 *
 * Dual-mode, in keeping with the public-funnel layout: anonymous visitors
 * see the self-contained preview courses (sample fixtures showcasing
 * MediaPlayer + QuizQuestion); authenticated learners additionally see
 * their org's real published courses with live enrollment progress. The
 * real spine (overview → lessons → assessment → certify) lives under
 * `/legend/learn/[course]` keyed by course id.
 */
export default async function LearnCatalogPage() {
  const { t } = await getRequestT();
  const session = hasSupabase ? await getSession() : null;

  let real: Course[] = [];
  const enrollments = new Map<string, { enrollment_state: string; progress_pct: number }>();
  const durations = new Map<string, number>();
  if (session) {
    const db = (await createClient()) as unknown as LooseSupabase;
    const [{ data: courseData }, { data: enrollData }, { data: lessonData }] = await Promise.all([
      db
        .from("legend_courses")
        .select("id, org_id, title, summary, cover_path, points_reward, grants_certification_id, course_state, created_at, updated_at")
        .eq("org_id", session.orgId)
        .eq("course_state", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("course_enrollments").select("course_id, enrollment_state, progress_pct").eq("org_id", session.orgId).eq("user_id", session.userId),
      db.from("lessons").select("course_id, duration_seconds").eq("org_id", session.orgId).eq("lesson_state", "published").is("deleted_at", null),
    ]);
    real = (courseData ?? []) as Course[];
    for (const e of (enrollData ?? []) as Array<{ course_id: string; enrollment_state: string; progress_pct: number }>) {
      enrollments.set(e.course_id, e);
    }
    for (const l of (lessonData ?? []) as Array<{ course_id: string; duration_seconds: number }>) {
      durations.set(l.course_id, (durations.get(l.course_id) ?? 0) + (l.duration_seconds ?? 0));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="eyebrow eyebrow-accent">{t("console.legend.learn.eyebrow", undefined, "LEG3ND · Learn")}</p>
        <h1>{t("console.legend.learn.title", undefined, "Courses & LMS")}</h1>
        <p className="text-lg text-[var(--p-text-2)]">
          {t(
            "console.legend.learn.subtitle",
            undefined,
            "Short courses on the standard, the signage system, and field readiness, on the XPMS 2.0 protocol.",
          )}
        </p>
      </header>

      {real.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">{t("console.legend.learn.yourCourses", undefined, "Your courses")}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {real.map((c) => {
              const e = enrollments.get(c.id);
              const dur = durations.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/legend/learn/${c.id}`}
                    className="group flex h-full flex-col gap-2 rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-5 transition-colors hover:border-[var(--p-border-2)] hover:bg-[var(--p-surface-2)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-lg font-semibold text-[var(--p-text-1)]">{c.title}</span>
                      {e ? (
                        <Badge variant={e.enrollment_state === "completed" ? "success" : "info"}>
                          {e.enrollment_state === "completed"
                            ? t("console.legend.learn.completed", undefined, "Completed")
                            : t("console.legend.learn.enrolled", undefined, "Enrolled")}
                        </Badge>
                      ) : (
                        <Badge variant="muted">{t("console.legend.learn.new", undefined, "New")}</Badge>
                      )}
                    </div>
                    {c.summary && <p className="text-sm text-[var(--p-text-2)] line-clamp-2">{c.summary}</p>}
                    <p className="mt-auto font-mono text-xs text-[var(--p-text-3)]">
                      {dur > 0 ? formatDuration(dur) : t("console.legend.learn.selfPaced", undefined, "Self-paced")}
                      {c.points_reward > 0
                        ? ` · ${t("console.legend.learn.pts", { count: c.points_reward }, `${c.points_reward} pts`)}`
                        : ""}
                    </p>
                    {e && e.enrollment_state !== "completed" && (
                      <ProgressBar
                        value={e.progress_pct}
                        aria-label={t("console.legend.learn.progressAria", { title: c.title }, `${c.title} progress`)}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        {real.length > 0 && <h2 className="eyebrow">{t("console.legend.learn.previews", undefined, "Previews")}</h2>}
        <ul className="grid gap-4 sm:grid-cols-2">
          {COURSES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/legend/learn/${c.slug}/lesson/${c.lessons[0]?.id ?? ""}`}
                className="group block h-full rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-5 transition-colors hover:border-[var(--p-border-2)] hover:bg-[var(--p-surface-2)]"
              >
                <div className="text-lg font-semibold text-[var(--p-text-1)]">{c.title}</div>
                <p className="mt-1 text-sm text-[var(--p-text-2)]">{c.summary}</p>
                <p className="mt-3 font-mono text-xs text-[var(--p-text-3)]">
                  {t(
                    "console.legend.learn.previewMeta",
                    { lessons: c.lessons.length, questions: c.quiz.length },
                    `${c.lessons.length} lessons · ${c.quiz.length}-question quiz`,
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
