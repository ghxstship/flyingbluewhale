"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.string().optional().or(z.literal("")),
  required_for_role: z.string().max(80).optional().or(z.literal("")),
  ai_lessons: z.string().optional().or(z.literal("")),
  ai_quiz_questions: z.string().optional().or(z.literal("")),
});

const LessonSchema = z.array(
  z.object({
    ordinal: z.number().int().min(1),
    title: z.string().min(1).max(200),
    body: z.string().max(4000).optional(),
  }),
);

const QuizSchema = z.array(
  z.object({
    ordinal: z.number().int().min(1),
    prompt: z.string().min(1).max(400),
    choices: z.array(z.string()).min(2).max(6),
    correct_index: z.number().int().min(0).max(5),
  }),
);

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCourseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can author courses" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const dur = parsed.data.duration_minutes ? Number(parsed.data.duration_minutes) : null;
  const { data, error } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      duration_minutes: Number.isFinite(dur as number) ? dur : null,
      required_for_role: parsed.data.required_for_role || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  const courseId = data.id;

  // Bulk-insert AI-generated lessons if the form carried them.
  if (parsed.data.ai_lessons) {
    const lessonsResult = LessonSchema.safeParse(JSON.parse(parsed.data.ai_lessons));
    if (lessonsResult.success && lessonsResult.data.length > 0) {
      await supabase.from("course_lessons").insert(
        lessonsResult.data.map((l) => ({
          course_id: courseId,
          ordinal: l.ordinal,
          title: l.title,
          body: l.body || null,
          lesson_kind: "text",
        })),
      );
    }
  }

  // Bulk-insert AI-generated quiz questions if the form carried them.
  if (parsed.data.ai_quiz_questions) {
    const questionsResult = QuizSchema.safeParse(JSON.parse(parsed.data.ai_quiz_questions));
    if (questionsResult.success && questionsResult.data.length > 0) {
      await supabase.from("course_quiz_questions").insert(
        questionsResult.data.map((q) => ({
          course_id: courseId,
          ordinal: q.ordinal,
          prompt: q.prompt,
          choices: q.choices,
          correct_index: q.correct_index,
        })),
      );
    }
  }

  revalidatePath("/console/workforce/courses");
  redirect(`/console/workforce/courses/${courseId}`);
}
