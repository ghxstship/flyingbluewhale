import { z } from "zod";
import { apiOk, apiError } from "@/lib/api";
import { withAuth, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { GenerateCourseResponse } from "@/app/api/v1/ai/generate-course/route";

const LessonSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(4000),
});

const QuestionSchema = z.object({
  prompt: z.string().min(1).max(400),
  choices: z.array(z.string()).min(2).max(4),
  correct_index: z.number().int().min(0).max(3),
});

const PayloadSchema = z.object({
  lessons: z.array(LessonSchema).max(8),
  questions: z.array(QuestionSchema).max(20),
});

export async function POST(req: Request) {
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!isManagerPlus(session)) return apiError("forbidden", "Manager role required");

  let courseId: string;
  let raw: string;
  try {
    const fd = await req.formData();
    courseId = fd.get("courseId") as string;
    raw = fd.get("payload") as string;
  } catch {
    return apiError("bad_request", "Invalid form data");
  }

  if (!courseId || !/^[\da-f-]{36}$/.test(courseId)) {
    return apiError("bad_request", "courseId must be a UUID");
  }

  let payload: GenerateCourseResponse;
  try {
    payload = PayloadSchema.parse(JSON.parse(raw)) as GenerateCourseResponse;
  } catch {
    return apiError("bad_request", "Invalid payload shape");
  }

  const supabase = await createClient();

  // Org-scope guard — the user must own this course
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!course) return apiError("not_found", "Course not found");

  const { count: existingLessons } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { count: existingQuestions } = await supabase
    .from("course_quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const lessonBase = existingLessons ?? 0;
  const questionBase = existingQuestions ?? 0;

  const lessonRows = payload.lessons.map((l, i) => ({
    course_id: courseId,
    ordinal: lessonBase + i + 1,
    title: l.title,
    body: l.body,
    lesson_kind: "text",
  }));

  const questionRows = payload.questions.map((q, i) => ({
    course_id: courseId,
    ordinal: questionBase + i + 1,
    prompt: q.prompt,
    choices: q.choices.slice(0, 4),
    correct_index: Math.max(0, Math.min(q.choices.length - 1, q.correct_index)),
  }));

  const [{ error: le }, { error: qe }] = await Promise.all([
    lessonRows.length > 0
      ? supabase.from("course_lessons").insert(lessonRows)
      : Promise.resolve({ error: null }),
    questionRows.length > 0
      ? supabase.from("course_quiz_questions").insert(questionRows)
      : Promise.resolve({ error: null }),
  ]);

  if (le) return apiError("internal", le.message);
  if (qe) return apiError("internal", qe.message);

  return apiOk({
    insertedLessons: lessonRows.length,
    insertedQuestions: questionRows.length,
  });
}
