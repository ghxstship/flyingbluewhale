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
  const parsed = LessonSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardCourse(parsed.data.courseId, session.orgId))) return;
  const supabase = await createClient();

  // Compute next ordinal — same pattern as `nextOrgCode` but per-course.
  const { count } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", parsed.data.courseId);
  const { error } = await supabase.from("course_lessons").insert({
    course_id: parsed.data.courseId,
    ordinal: (count ?? 0) + 1,
    title: parsed.data.title,
    body: parsed.data.body || null,
    lesson_kind: "text",
  });
  if (error) throw new Error(`Could not create course lesson: ${error.message}`);
  revalidatePath(`/console/workforce/courses/${parsed.data.courseId}`);
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
  const parsed = QuizSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardCourse(parsed.data.courseId, session.orgId))) return;
  const supabase = await createClient();

  const choices = parsed.data.choices
    .split(/\n|\|/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (choices.length < 2) return;
  const correct = Math.max(0, Math.min(choices.length - 1, Number(parsed.data.correct_index)));

  const { count } = await supabase
    .from("course_quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("course_id", parsed.data.courseId);
  const { error } = await supabase.from("course_quiz_questions").insert({
    course_id: parsed.data.courseId,
    ordinal: (count ?? 0) + 1,
    prompt: parsed.data.prompt,
    choices,
    correct_index: correct,
  });
  if (error) throw new Error(`Could not create course quiz question: ${error.message}`);
  revalidatePath(`/console/workforce/courses/${parsed.data.courseId}`);
}

const PublishSchema = z.object({ courseId: z.string().uuid() });
export async function publishCourse(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = PublishSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardCourse(parsed.data.courseId, session.orgId))) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ publish_state: "published" })
    .eq("id", parsed.data.courseId)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft");
  if (error) throw new Error(`Could not update cours: ${error.message}`);
  revalidatePath(`/console/workforce/courses/${parsed.data.courseId}`);
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
  const parsed = AssignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardCourse(parsed.data.courseId, session.orgId))) return;
  const supabase = await createClient();

  // Assignee must be in this org. Without the check, manager+ could
  // assign across tenants.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.assignee_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  const { error } = await supabase.from("course_assignments").insert({
    org_id: session.orgId,
    course_id: parsed.data.courseId,
    assignee_id: parsed.data.assignee_id,
    due_at: parsed.data.due_at || null,
    assigned_by: session.userId,
  });
  if (error) throw new Error(`Could not create course assignment: ${error.message}`);
  revalidatePath(`/console/workforce/courses/${parsed.data.courseId}`);
}

const BadgeSchema = z.object({
  courseId: z.string().uuid(),
  badge_id: z.string().uuid().optional().or(z.literal("")),
});

export async function setCompletionBadge(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = BadgeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (!(await guardCourse(parsed.data.courseId, session.orgId))) return;
  const supabase = await createClient();

  // Empty value = clear the auto-award. Otherwise the badge must be in
  // this org — the FK check would catch a cross-tenant id, but the
  // explicit guard surfaces the failure before the UPDATE fires.
  let badgeId: string | null = null;
  if (parsed.data.badge_id) {
    const { data: b } = await supabase
      .from("badges")
      .select("id")
      .eq("id", parsed.data.badge_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!b) return;
    badgeId = parsed.data.badge_id;
  }
  const { error } = await supabase
    .from("courses")
    .update({ completion_badge_id: badgeId })
    .eq("id", parsed.data.courseId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update cours: ${error.message}`);
  revalidatePath(`/console/workforce/courses/${parsed.data.courseId}`);
}

// Compliance auto-assignment — Docebo "auto-assign on role change" pattern
// (2025-2026). Finds all org members that don't yet have an active assignment
// for this course and bulk-assigns them. If `required_for_role` is set on the
// course, only members matching that role are targeted; otherwise the action
// assigns to all members (general-compliance use case). Returns the count of
// new rows inserted so the UI can surface a success message.
export async function autoAssignComplianceCourses(
  courseId: string,
): Promise<{ assigned: number; error?: string }> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { assigned: 0, error: "Manager access required" };
  if (!(await guardCourse(courseId, session.orgId))) return { assigned: 0, error: "Course not found" };
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("required_for_role")
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!course) return { assigned: 0, error: "Course not found" };

  // Pull all active memberships for the org.
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (!memberships?.length) return { assigned: 0 };

  // Filter to matching role if the course targets a specific role.
  const targetRole = (course as { required_for_role?: string | null }).required_for_role;
  const eligible = targetRole
    ? memberships.filter((m) => {
        const r = (m as { role?: string }).role ?? "";
        return r === targetRole || r.includes(targetRole);
      })
    : memberships;

  if (!eligible.length) return { assigned: 0 };

  // Exclude already-assigned members (idempotent re-runs are safe).
  const { data: existing } = await supabase
    .from("course_assignments")
    .select("assignee_id")
    .eq("course_id", courseId);
  const alreadyAssigned = new Set((existing ?? []).map((e) => e.assignee_id));

  const toInsert = eligible
    .filter((m) => !alreadyAssigned.has(m.user_id))
    .map((m) => ({
      org_id: session.orgId,
      course_id: courseId,
      assignee_id: m.user_id,
      assigned_by: session.userId,
    }));

  if (!toInsert.length) return { assigned: 0 };

  const { error } = await supabase.from("course_assignments").insert(toInsert);
  if (error) return { assigned: 0, error: error.message };

  revalidatePath(`/console/workforce/courses/${courseId}`);
  return { assigned: toInsert.length };
}

export async function deleteCourse(courseId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  if (!(await guardCourse(courseId, session.orgId))) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", courseId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update cours: ${error.message}`);
  revalidatePath("/console/workforce/courses");
  redirect("/console/workforce/courses");
}
