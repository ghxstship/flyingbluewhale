import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaPlayer } from "@/components/ui/MediaPlayer";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { sanitizeHtml } from "@/lib/sanitize";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getCourse } from "../../../sample";
import type { Lesson } from "@/lib/legend_learning";
import { LessonComplete } from "./LessonComplete";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /legend/learn/[course]/lesson/[id] — a single lesson.
 *
 * Dual-mode: a sample-slug course renders the public-funnel preview (kit v7
 * MediaPlayer over the fixtures); a real course id renders the authenticated
 * lesson — video/audio via MediaPlayer or an article body — with a
 * mark-complete control that advances the enrollment.
 */
export default async function LessonPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: courseParam, id } = await params;

  // ── Public-funnel preview (sample fixtures) ──────────────────────────
  const sample = getCourse(courseParam);
  if (sample) {
    const index = sample.lessons.findIndex((l) => l.id === id);
    const lesson = sample.lessons[index];
    if (!lesson) notFound();
    const prev = sample.lessons[index - 1];
    const next = sample.lessons[index + 1];
    const firstQuiz = sample.quiz[0];
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <nav className="text-sm text-[var(--p-text-2)]">
          <Link href="/legend/learn" className="hover:text-[var(--p-text-1)]">
            Learn
          </Link>{" "}
          / <span className="text-[var(--p-text-1)]">{sample.title}</span>
        </nav>
        <MediaPlayer
          src={lesson.src}
          kind="video"
          poster={lesson.poster}
          eyebrow={`${lesson.eyebrow} · ${lesson.durationLabel}`}
          title={lesson.title}
          resumeKey={`legend:${sample.slug}:${lesson.id}`}
        />
        <p className="text-[var(--p-text-2)]">{lesson.body}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--p-border)] pt-4">
          <div className="flex gap-2">
            {prev && (
              <Link href={`/legend/learn/${sample.slug}/lesson/${prev.id}`} className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
                ← {prev.title}
              </Link>
            )}
            {next && (
              <Link href={`/legend/learn/${sample.slug}/lesson/${next.id}`} className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
                {next.title} →
              </Link>
            )}
          </div>
          {!next && firstQuiz && (
            <Link href={`/legend/learn/${sample.slug}/quiz/${firstQuiz.id}`} className="ps-btn ps-btn--cta" style={{ minHeight: 44 }}>
              Take the quiz
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Real authenticated lesson ────────────────────────────────────────
  if (!hasSupabase || !UUID_RE.test(courseParam)) notFound();
  const session = await getSession();
  if (!session) notFound();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: courseRow } = await db
    .from("legend_courses")
    .select("id, title")
    .eq("org_id", session.orgId)
    .eq("id", courseParam)
    .is("deleted_at", null)
    .maybeSingle();
  if (!courseRow) notFound();

  const { data: lessonData } = await db
    .from("lessons")
    .select("id, org_id, course_id, module_id, title, kind, media_url, body_html, duration_seconds, sort_order, lesson_state")
    .eq("org_id", session.orgId)
    .eq("course_id", courseParam)
    .eq("lesson_state", "published")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  const lessons = (lessonData ?? []) as Lesson[];
  const index = lessons.findIndex((l) => l.id === id);
  const lesson = lessons[index];
  if (!lesson) notFound();
  const next = lessons[index + 1];

  // completion state for this lesson
  const { data: prog } = await db
    .from("lesson_progress")
    .select("progress_state")
    .eq("org_id", session.orgId)
    .eq("lesson_id", lesson.id)
    .eq("user_id", session.userId)
    .maybeSingle();
  const alreadyDone = prog?.progress_state === "completed";

  const nextHref = next ? `/legend/learn/${courseParam}/lesson/${next.id}` : `/legend/learn/${courseParam}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="text-sm text-[var(--p-text-2)]">
        <Link href="/legend/learn" className="hover:text-[var(--p-text-1)]">
          Learn
        </Link>{" "}
        / <Link href={`/legend/learn/${courseParam}`} className="hover:text-[var(--p-text-1)]">
          {courseRow.title}
        </Link>{" "}
        / <span className="text-[var(--p-text-1)]">{lesson.title}</span>
      </nav>

      {(lesson.kind === "video" || lesson.kind === "audio") && lesson.media_url ? (
        <MediaPlayer
          src={lesson.media_url}
          kind={lesson.kind}
          eyebrow={`Lesson ${index + 1} / ${lessons.length}`}
          title={lesson.title}
          resumeKey={`legend:${courseParam}:${lesson.id}`}
        />
      ) : (
        <article className="surface prose-sm max-w-none p-5">
          <h1 className="text-2xl font-bold text-[var(--p-text-1)]">{lesson.title}</h1>
          {lesson.body_html ? (
            <div className="mt-3 text-[var(--p-text-2)]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.body_html) }} />
          ) : (
            <p className="mt-3 text-[var(--p-text-2)]">No content.</p>
          )}
        </article>
      )}

      <div className="border-t border-[var(--p-border)] pt-4">
        <LessonComplete
          courseId={courseParam}
          lessonId={lesson.id}
          positionSeconds={lesson.duration_seconds}
          nextHref={nextHref}
          alreadyDone={alreadyDone}
        />
      </div>
    </div>
  );
}
