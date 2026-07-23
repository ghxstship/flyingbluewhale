import Link from "next/link";
import { notFound } from "next/navigation";
import { Steps, type Step } from "@/components/ui/Steps";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getCourse } from "../sample";
import { LESSON_KIND_LABELS, formatDuration, type Course, type Lesson } from "@/lib/legend_learning";
import { averageRating, ratingBreakdown, type CourseReview } from "@/lib/legend_reviews";
import { CourseEnroll } from "./CourseEnroll";
import { ReviewForm } from "./ReviewForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /legend/learn/[course] — course overview.
 *
 * If `[course]` is a sample slug, redirect into the preview's first lesson
 * (the public funnel has no overview). If it's a real course id, render the
 * authenticated learner overview: the learn→assess→certify→recert <Steps>
 * spine, the lesson list with per-lesson completion, and the enroll/continue
 * control.
 */
export default async function CourseOverviewPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseParam } = await params;
  const { t } = await getRequestT();

  // Sample preview slug → there's no overview; route into the first lesson.
  const sample = getCourse(courseParam);
  if (sample) {
    const first = sample.lessons[0];
    if (first) {
      return (
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-[var(--p-text-1)]">{sample.title}</h1>
          <p className="text-[var(--p-text-2)]">{sample.summary}</p>
          <Link href={`/legend/learn/${sample.slug}/lesson/${first.id}`} className="ps-btn ps-btn--cta ps-btn--lg" style={{ minHeight: 44 }}>
            {t("console.legend.learn.course.startPreview", undefined, "Start preview")}
          </Link>
        </div>
      );
    }
    notFound();
  }

  if (!hasSupabase || !UUID_RE.test(courseParam)) notFound();
  const session = await getSession();
  if (!session) notFound();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: courseRow } = await db
    .from("legend_courses")
    .select("id, org_id, title, summary, cover_path, points_reward, grants_certification_id, course_state, created_at, updated_at")
    .eq("org_id", session.orgId)
    .eq("id", courseParam)
    .is("deleted_at", null)
    .maybeSingle();
  if (!courseRow) notFound();
  const course = courseRow as Course;

  const [{ data: lessonData }, { data: enrollment }, { data: assessmentRow }] = await Promise.all([
    db
      .from("lessons")
      .select("id, org_id, course_id, module_id, title, kind, media_url, body_html, duration_seconds, sort_order, lesson_state")
      .eq("org_id", session.orgId)
      .eq("course_id", course.id)
      .eq("lesson_state", "published")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    db
      .from("course_enrollments")
      .select("id, enrollment_state, progress_pct")
      .eq("org_id", session.orgId)
      .eq("course_id", course.id)
      .eq("user_id", session.userId)
      .maybeSingle(),
    db
      .from("assessments")
      .select("id, title, pass_pct")
      .eq("org_id", session.orgId)
      .eq("course_id", course.id)
      .eq("assessment_state", "published")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const lessons = (lessonData ?? []) as Lesson[];
  const enrolled = !!enrollment;
  const progressPct = (enrollment?.progress_pct as number | undefined) ?? 0;

  let completedLessons = new Set<string>();
  let passedAttempt = false;
  let certified = false;
  if (enrollment) {
    const [{ data: prog }, { data: attempts }] = await Promise.all([
      db.from("lesson_progress").select("lesson_id").eq("org_id", session.orgId).eq("enrollment_id", enrollment.id).eq("progress_state", "completed"),
      assessmentRow
        ? db.from("assessment_attempts").select("passed").eq("org_id", session.orgId).eq("assessment_id", assessmentRow.id).eq("user_id", session.userId).eq("passed", true).limit(1)
        : Promise.resolve({ data: [] as Array<{ passed: boolean }> }),
    ]);
    completedLessons = new Set((prog ?? []).map((r: { lesson_id: string }) => r.lesson_id));
    passedAttempt = ((attempts ?? []) as Array<unknown>).length > 0;
  }
  if (course.grants_certification_id) {
    const { data: holder } = await db
      .from("certification_holders")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("certification_id", course.grants_certification_id)
      .eq("user_id", session.userId)
      .limit(1)
      .maybeSingle();
    certified = !!holder;
  }

  // Course reviews (published) + reviewer names + the viewer's own review.
  const { data: reviewData } = await db
    .from("legend_course_reviews")
    .select("id, org_id, course_id, user_id, rating, body, created_at")
    .eq("org_id", session.orgId)
    .eq("course_id", course.id)
    .eq("review_state", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  const reviews = (reviewData ?? []) as CourseReview[];
  const reviewerIds = [...new Set(reviews.map((r) => r.user_id))];
  const reviewerNames = new Map<string, string>();
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await db.from("users").select("id, name, email").in("id", reviewerIds);
    for (const u of (reviewers ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      reviewerNames.set(u.id, u.name || u.email || t("console.legend.learn.course.member", undefined, "Member"));
    }
  }
  const myReview = reviews.find((r) => r.user_id === session.userId);
  const avgRating = averageRating(reviews);
  const breakdown = ratingBreakdown(reviews);

  const learnDone = progressPct >= 100;
  const steps: Step[] = [
    {
      label: t("console.legend.learn.course.steps.learn", undefined, "Learn"),
      description: t(
        "console.legend.learn.course.steps.learnDescription",
        { done: completedLessons.size, total: lessons.length || "—" },
        `${completedLessons.size}/${lessons.length || "—"} lessons`,
      ),
      state: learnDone ? "done" : enrolled ? "current" : "upcoming",
    },
    {
      label: t("console.legend.learn.course.steps.assess", undefined, "Assess"),
      description: assessmentRow
        ? t(
            "console.legend.learn.course.steps.assessPass",
            { pct: assessmentRow.pass_pct },
            `Pass ≥ ${assessmentRow.pass_pct}%`,
          )
        : t("console.legend.learn.course.steps.noAssessment", undefined, "No assessment"),
      state: passedAttempt ? "done" : learnDone ? "current" : "upcoming",
    },
    {
      label: t("console.legend.learn.course.steps.certify", undefined, "Certify"),
      description: course.grants_certification_id
        ? t("console.legend.learn.course.steps.onPass", undefined, "On pass")
        : t("console.legend.learn.course.steps.noCertificate", undefined, "No certificate"),
      state: certified ? "done" : passedAttempt ? "current" : "upcoming",
    },
    {
      label: t("console.legend.learn.course.steps.recert", undefined, "Recert"),
      description: t("console.legend.learn.course.steps.recertDescription", undefined, "Tracked in Certifications"),
      state: certified ? "current" : "upcoming",
    },
  ];

  const nextLesson = lessons.find((l) => !completedLessons.has(l.id)) ?? lessons[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="text-sm text-[var(--p-text-2)]">
        <Link href="/legend/learn" className="hover:text-[var(--p-text-1)]">
          {t("console.legend.learn.course.breadcrumb", undefined, "Learn")}
        </Link>{" "}
        / <span className="text-[var(--p-text-1)]">{course.title}</span>
      </nav>

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[var(--p-text-1)]">{course.title}</h1>
          {certified && <Badge variant="success">{t("console.legend.learn.course.certified", undefined, "Certified")}</Badge>}
        </div>
        {course.summary && <p className="text-[var(--p-text-2)]">{course.summary}</p>}
      </header>

      <div className="surface p-5">
        <Steps steps={steps} />
      </div>

      {enrolled && (
        <div>
          <ProgressBar
            value={progressPct}
            showLabel
            aria-label={t("console.legend.learn.course.progressAria", undefined, "Course progress")}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!enrolled ? (
          <CourseEnroll courseId={course.id} label={t("console.legend.learn.course.enroll", undefined, "Enroll")} />
        ) : nextLesson ? (
          <Link href={`/legend/learn/${course.id}/lesson/${nextLesson.id}`} className="ps-btn ps-btn--cta ps-btn--lg" style={{ minHeight: 44 }}>
            {progressPct > 0
              ? t("console.legend.learn.course.continue", undefined, "Continue")
              : t("console.legend.learn.course.startCourse", undefined, "Start course")}
          </Link>
        ) : null}
        {enrolled && learnDone && assessmentRow && (
          <Link href={`/legend/learn/${course.id}/quiz/${assessmentRow.id}`} className="ps-btn ps-btn--secondary ps-btn--lg" style={{ minHeight: 44 }}>
            {passedAttempt
              ? t("console.legend.learn.course.reviewAssessment", undefined, "Review assessment")
              : t("console.legend.learn.course.takeAssessment", undefined, "Take assessment")}
          </Link>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="eyebrow">{t("console.legend.learn.course.lessons", undefined, "Lessons")}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t("console.legend.learn.course.noLessons", undefined, "No lessons published yet.")}
          </p>
        ) : (
          <ol className="surface divide-y divide-[var(--p-border)]">
            {lessons.map((l, i) => {
              const done = completedLessons.has(l.id);
              return (
                <li key={l.id}>
                  <Link
                    href={`/legend/learn/${course.id}/lesson/${l.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--p-surface-2)]"
                    style={{ minHeight: 44 }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        background: done ? "var(--p-success)" : "var(--p-surface-2, var(--p-surface))",
                        color: done ? "var(--p-accent-cta-contrast)" : "var(--p-text-2)",
                        border: `1px solid ${done ? "var(--p-success)" : "var(--p-border)"}`,
                      }}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-[var(--p-text-1)]">{l.title}</span>
                    <span className="font-mono text-xs text-[var(--p-text-3)]">{LESSON_KIND_LABELS[l.kind]}</span>
                    {l.duration_seconds > 0 && <span className="font-mono text-xs text-[var(--p-text-3)]">{formatDuration(l.duration_seconds)}</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="eyebrow">{t("console.legend.learn.course.reviews", undefined, "Reviews")}</h2>
          {reviews.length > 0 && (
            <span className="text-sm text-[var(--p-text-2)]">
              <span className="font-bold tabular-nums text-[var(--p-text-1)]">{avgRating.toFixed(1)}</span> ★ · {reviews.length}{" "}
              {reviews.length === 1
                ? t("console.legend.learn.course.reviewSingular", undefined, "review")
                : t("console.legend.learn.course.reviewPlural", undefined, "reviews")}
            </span>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="surface space-y-1 p-3">
            {breakdown.map((b) => (
              <div key={b.stars} className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
                <span className="w-8 tabular-nums">{b.stars} ★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--p-surface-2)]">
                  <span className="block h-full rounded-full bg-[var(--p-accent)]" style={{ width: `${b.pct}%` }} />
                </span>
                <span className="w-8 text-end tabular-nums">{b.count}</span>
              </div>
            ))}
          </div>
        )}

        <ReviewForm courseId={course.id} initialRating={myReview?.rating} initialBody={myReview?.body ?? undefined} />

        {reviews.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.legend.learn.course.noReviewsTitle", undefined, "No reviews yet")}
            description={t("console.legend.learn.course.noReviewsDescription", undefined, "Be the first to review this course.")}
          />
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--p-text-1)]">
                    {r.user_id === session.userId
                      ? t("console.legend.learn.course.you", undefined, "You")
                      : reviewerNames.get(r.user_id) ?? t("console.legend.learn.course.member", undefined, "Member")}
                  </span>
                  <span
                    className="text-xs tabular-nums text-[var(--p-warning)]"
                    aria-label={t("console.legend.learn.course.ratingAria", { rating: r.rating }, `${r.rating} out of 5`)}
                  >
                    {"★".repeat(r.rating)}
                    <span className="text-[var(--p-text-3)]">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                {r.body && <p className="mt-1 text-sm text-[var(--p-text-2)]">{r.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
