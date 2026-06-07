import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { submitQuiz } from "../actions";

export const dynamic = "force-dynamic";

type Lesson = { id: string; ordinal: number; title: string; body: string | null; lesson_kind: string };
type Question = { id: string; prompt: string; choices: string[]; ordinal: number };

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { courseId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: course }, { data: assignment }] = await Promise.all([
    supabase.from("courses").select("id, title, summary").eq("id", courseId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("course_assignments")
      .select("id, assignment_state")
      .eq("course_id", courseId)
      .eq("assignee_id", session.userId)
      .maybeSingle(),
  ]);
  if (!course || !assignment) notFound();

  const [{ data: lessons }, { data: questions }, { data: completion }] = await Promise.all([
    supabase
      .from("course_lessons")
      .select("id, ordinal, title, body, lesson_kind")
      .eq("course_id", courseId)
      .order("ordinal"),
    supabase
      .from("course_quiz_questions")
      .select("id, prompt, choices, ordinal")
      .eq("course_id", courseId)
      .order("ordinal"),
    supabase
      .from("course_completions")
      .select("id, passed, score_pct, completed_at")
      .eq("assignment_id", (assignment as { id: string }).id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lessonList = (lessons ?? []) as Lesson[];
  const questionList = (
    (questions ?? []) as Array<{ id: string; prompt: string; choices: unknown; ordinal: number }>
  ).map((q) => ({ ...q, choices: Array.isArray(q.choices) ? (q.choices as string[]) : [] })) as Question[];

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">{(course as { title: string }).title}</h1>
      {(course as { summary: string | null }).summary && (
        <p className="mt-1 text-xs text-[var(--p-text-2)]">{(course as { summary: string }).summary}</p>
      )}

      <section className="mt-6 space-y-3">
        {lessonList.map((l) => (
          <article key={l.id} className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="muted">
                {t("m.learning.course.lessonLabel", { ordinal: l.ordinal }, `Lesson ${l.ordinal}`)}
              </Badge>
              <span className="font-mono text-xs text-[var(--p-text-2)]">{l.lesson_kind}</span>
            </div>
            <h2 className="mt-2 text-sm font-semibold">{l.title}</h2>
            {l.body && <p className="mt-2 text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{l.body}</p>}
          </article>
        ))}
      </section>

      {questionList.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold">{t("m.learning.course.quizHeading", undefined, "Quiz")}</h2>
          {completion ? (
            <div className="surface mt-3 p-4">
              <Badge variant={(completion as { passed: boolean }).passed ? "success" : "error"}>
                {(completion as { passed: boolean }).passed
                  ? t("m.learning.course.passed", undefined, "Passed")
                  : t("m.learning.course.didNotPass", undefined, "Did Not Pass")}
              </Badge>
              <p className="mt-2 text-xs">
                {t(
                  "m.learning.course.score",
                  { pct: (completion as { score_pct: number | null }).score_pct ?? 0 },
                  `Score: ${(completion as { score_pct: number | null }).score_pct ?? 0}%`,
                )}
              </p>
            </div>
          ) : (
            <form action={submitQuiz} className="mt-3 space-y-4">
              <input type="hidden" name="assignmentId" value={(assignment as { id: string }).id} />
              <input type="hidden" name="courseId" value={courseId} />
              {questionList.map((q) => (
                <fieldset key={q.id} className="surface p-4">
                  <legend className="text-sm font-semibold">
                    {q.ordinal}. {q.prompt}
                  </legend>
                  <div className="mt-2 space-y-1.5">
                    {q.choices.map((c, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-xs">
                        <input type="radio" name={`q_${q.id}`} value={idx} required />
                        {c}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <button type="submit" className="ps-btn w-full">
                {t("common.submit", undefined, "Submit")}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
