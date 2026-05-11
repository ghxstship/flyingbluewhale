"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function guardCourse(courseId: string, orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return !!data;
}

const LessonSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().max(4000).optional().or(z.literal("")),
});

export async function addLesson(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = LessonSchema.parse(Object.fromEntries(fd));
  if (!(await guardCourse(parsed.courseId, session.orgId))) return;
  const supabase = await createClient();

  // Compute next ordinal — same pattern as `nextOrgCode` but per-course.
  const { count } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", parsed.courseId);
  await supabase.from("course_lessons").insert({
    course_id: parsed.courseId,
    ordinal: (count ?? 0) + 1,
    title: parsed.title,
    body: parsed.body || null,
    lesson_kind: "text",
  });
  revalidatePath(`/console/workforce/courses/${parsed.courseId}`);
}

const QuizSchema = z.object({
  courseId: z.string().uuid(),
  prompt: z.string().min(1).max(400),
  choices: z.string().min(1),
  correct_index: z.string().refine((v) => Number.isFinite(Number(v)), "Must be a number"),
});

export async function addQuizQuestion(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = QuizSchema.parse(Object.fromEntries(fd));
  if (!(await guardCourse(parsed.courseId, session.orgId))) return;
  const supabase = await createClient();

  const choices = parsed.choices
    .split(/\n|\|/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (choices.length < 2) return;
  const correct = Math.max(0, Math.min(choices.length - 1, Number(parsed.correct_index)));

  const { count } = await supabase
    .from("course_quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("course_id", parsed.courseId);
  await supabase.from("course_quiz_questions").insert({
    course_id: parsed.courseId,
    ordinal: (count ?? 0) + 1,
    prompt: parsed.prompt,
    choices,
    correct_index: correct,
  });
  revalidatePath(`/console/workforce/courses/${parsed.courseId}`);
}

const PublishSchema = z.object({ courseId: z.string().uuid() });
export async function publishCourse(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = PublishSchema.parse(Object.fromEntries(fd));
  if (!(await guardCourse(parsed.courseId, session.orgId))) return;
  const supabase = await createClient();
  await supabase
    .from("courses")
    .update({ publish_state: "published" })
    .eq("id", parsed.courseId)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft");
  revalidatePath(`/console/workforce/courses/${parsed.courseId}`);
  revalidatePath("/console/workforce/courses");
}

const AssignSchema = z.object({
  courseId: z.string().uuid(),
  assignee_id: z.string().uuid(),
  due_at: z.string().optional().or(z.literal("")),
});

export async function assignCourse(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AssignSchema.parse(Object.fromEntries(fd));
  if (!(await guardCourse(parsed.courseId, session.orgId))) return;
  const supabase = await createClient();

  // Assignee must be in this org. Without the check, manager+ could
  // assign across tenants.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.assignee_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  await supabase.from("course_assignments").insert({
    org_id: session.orgId,
    course_id: parsed.courseId,
    assignee_id: parsed.assignee_id,
    due_at: parsed.due_at || null,
    assigned_by: session.userId,
  });
  revalidatePath(`/console/workforce/courses/${parsed.courseId}`);
}

const BadgeSchema = z.object({
  courseId: z.string().uuid(),
  badge_id: z.string().uuid().optional().or(z.literal("")),
});

export async function setCompletionBadge(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = BadgeSchema.parse(Object.fromEntries(fd));
  if (!(await guardCourse(parsed.courseId, session.orgId))) return;
  const supabase = await createClient();

  // Empty value = clear the auto-award. Otherwise the badge must be in
  // this org — the FK check would catch a cross-tenant id, but the
  // explicit guard surfaces the failure before the UPDATE fires.
  let badgeId: string | null = null;
  if (parsed.badge_id) {
    const { data: b } = await supabase
      .from("badges")
      .select("id")
      .eq("id", parsed.badge_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!b) return;
    badgeId = parsed.badge_id;
  }
  await supabase
    .from("courses")
    .update({ completion_badge_id: badgeId })
    .eq("id", parsed.courseId)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/workforce/courses/${parsed.courseId}`);
}

export async function deleteCourse(courseId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  if (!(await guardCourse(courseId, session.orgId))) return;
  const supabase = await createClient();
  await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", courseId)
    .eq("org_id", session.orgId);
  revalidatePath("/console/workforce/courses");
  redirect("/console/workforce/courses");
}
