"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { GeneratedCourse } from "@/app/api/v1/ai/course-generate/route";

const Schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.string().optional().or(z.literal("")),
  required_for_role: z.string().max(80).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCourseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Course creation is a content-authoring action — manager+ only.
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

  revalidatePath("/console/workforce/courses");
  redirect(`/console/workforce/courses/${data.id}`);
}

export type AIState = { error?: string; courseId?: string } | null;

/**
 * Server action wired to GenerateCoursePanel. Takes the AI-generated
 * course object and bulk-inserts the course header, all lessons (ordered),
 * and all quiz questions (ordered). Returns the new course id for redirect.
 */
export async function createCourseFromAI(course: GeneratedCourse): Promise<AIState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can author courses" };

  if (!course?.title) return { error: "Generated course is missing a title" };

  const supabase = await createClient();

  const { data: courseRow, error: courseErr } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: course.title.slice(0, 200),
      summary: course.summary?.slice(0, 2000) ?? null,
      duration_minutes: Number.isFinite(course.duration_minutes) ? course.duration_minutes : null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (courseErr || !courseRow) return { error: courseErr?.message ?? "Failed to create course" };

  const courseId = courseRow.id as string;

  if (course.lessons?.length) {
    const lessonRows = course.lessons.map((l, i) => ({
      course_id: courseId,
      ordinal: i + 1,
      title: l.title.slice(0, 200),
      body: l.body,
      lesson_kind: "text" as const,
    }));
    const { error: lessonErr } = await supabase.from("course_lessons").insert(lessonRows);
    if (lessonErr) return { error: lessonErr.message };
  }

  if (course.quiz_questions?.length) {
    const quizRows = course.quiz_questions.map((q, i) => ({
      course_id: courseId,
      ordinal: i + 1,
      prompt: q.prompt,
      choices: q.choices,
      correct_index: q.correct_index,
    }));
    const { error: quizErr } = await supabase.from("course_quiz_questions").insert(quizRows);
    if (quizErr) return { error: quizErr.message };
  }

  revalidatePath("/console/workforce/courses");
  return { courseId };
}
