import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const LessonSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(4000),
});

const QuizSchema = z.object({
  prompt: z.string().min(1).max(400),
  choices: z.array(z.string()).min(2).max(6),
  correct_index: z.number().int().min(0),
});

const Schema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().max(300).optional(),
  duration_minutes: z.number().int().min(1).max(600).optional(),
  lessons: z.array(LessonSchema).min(1).max(8),
  quiz_questions: z.array(QuizSchema).max(8),
});

export async function POST(req: Request) {
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  if (!isManagerPlus(session)) return apiError("forbidden", "Only manager+ can save courses");

  const supabase = await createClient();

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: input.title,
      summary: input.summary ?? null,
      duration_minutes: input.duration_minutes ?? null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (courseErr) return apiError("internal", courseErr.message);
  const courseId = course.id;

  if (input.lessons.length > 0) {
    const { error: lessonErr } = await supabase.from("course_lessons").insert(
      input.lessons.map((l: z.infer<typeof LessonSchema>, i: number) => ({
        course_id: courseId,
        ordinal: i + 1,
        title: l.title,
        body: l.body,
        lesson_kind: "text",
      })),
    );
    if (lessonErr) return apiError("internal", lessonErr.message);
  }

  if (input.quiz_questions.length > 0) {
    const { error: quizErr } = await supabase.from("course_quiz_questions").insert(
      input.quiz_questions.map((q: z.infer<typeof QuizSchema>, i: number) => ({
        course_id: courseId,
        ordinal: i + 1,
        prompt: q.prompt,
        choices: q.choices,
        correct_index: q.correct_index,
      })),
    );
    if (quizErr) return apiError("internal", quizErr.message);
  }

  return apiCreated({ id: courseId });
}
