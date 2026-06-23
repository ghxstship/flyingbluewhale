import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getCourse } from "../../../sample";
import { QuizRunner } from "../QuizRunner";
import { AssessmentRunner, type RunnerQuestion } from "../AssessmentRunner";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /legend/learn/[course]/quiz/[id] — the assessment.
 *
 * Dual-mode: a sample-slug course runs the public-funnel <QuizRunner> over
 * the fixtures (client-side scoring, for the preview); a real course runs the
 * <AssessmentRunner>, which submits answers to the server action for scoring
 * (the client never receives correct answers) and certificate issuance.
 */
export default async function QuizPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: courseParam, id } = await params;

  // ── Public-funnel preview ────────────────────────────────────────────
  const sample = getCourse(courseParam);
  if (sample) {
    if (sample.quiz.length === 0) notFound();
    const startIndex = Math.max(0, sample.quiz.findIndex((qq) => qq.id === id));
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <nav className="text-sm text-[var(--p-text-2)]">
          <Link href="/legend/learn" className="hover:text-[var(--p-text-1)]">
            Learn
          </Link>{" "}
          / <span className="text-[var(--p-text-1)]">{sample.title}</span> / Quiz
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--p-text-1)]">{sample.title} — Quiz</h1>
        <QuizRunner items={sample.quiz} startIndex={startIndex} />
      </div>
    );
  }

  // ── Real assessment ──────────────────────────────────────────────────
  if (!hasSupabase || !UUID_RE.test(courseParam) || !UUID_RE.test(id)) notFound();
  const session = await getSession();
  if (!session) notFound();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: assessment } = await db
    .from("assessments")
    .select("id, course_id, title, pass_pct")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("assessment_state", "published")
    .maybeSingle();
  if (!assessment) notFound();

  const { data: questionData } = await db
    .from("assessment_questions")
    .select("id, prompt, options")
    .eq("org_id", session.orgId)
    .eq("assessment_id", id)
    .order("sort_order", { ascending: true });
  const questions = ((questionData ?? []) as Array<{ id: string; prompt: string; options: string[] }>).map(
    (q): RunnerQuestion => ({ id: q.id, prompt: q.prompt, options: Array.isArray(q.options) ? q.options : [] }),
  );
  if (questions.length === 0) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav className="text-sm text-[var(--p-text-2)]">
        <Link href="/legend/learn" className="hover:text-[var(--p-text-1)]">
          Learn
        </Link>{" "}
        / <Link href={`/legend/learn/${courseParam}`} className="hover:text-[var(--p-text-1)]">
          Course
        </Link>{" "}
        / Assessment
      </nav>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--p-text-1)]">{assessment.title}</h1>
      <AssessmentRunner
        courseId={courseParam}
        assessmentId={assessment.id}
        passPct={assessment.pass_pct as number}
        questions={questions}
      />
    </div>
  );
}
