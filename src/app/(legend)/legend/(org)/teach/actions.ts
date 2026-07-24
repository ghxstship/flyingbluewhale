"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionError, actionErrorMessage } from "@/lib/errors";
import { actionFail, formFail } from "@/lib/forms/fail";
import { COURSE_STATES, LESSON_KINDS, LESSON_STATES, ASSESSMENT_STATES } from "@/lib/legend_learning";
import {
  NEXT_ASSESSMENT_STATES,
  NEXT_COURSE_STATES,
  NEXT_LESSON_STATES,
  canPublishAssessment,
  canPublishCourse,
  canTransition,
  neighborSwap,
  parseOptionLines,
} from "@/lib/legend_teach";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * LEG3ND authoring actions (PERSONA_MATRIX blocker B-1) — the supply side
 * of the learn spine: course / lesson / assessment / question CRUD +
 * LDP-guarded lifecycle transitions. Authoring band = manager+ (page-gated
 * AND action-gated, mirroring /legend/engine); RLS backs it with the
 * owner/admin/manager/controller/collaborator write band
 * (20260625144337_rls_manager_grant_sweep.sql).
 *
 * Learner surfaces (/legend/learn/**) read the SAME tables filtered to
 * published states — authored content renders there with zero learner-side
 * changes.
 */

const AUTHOR_GATE = () => actionError("auth.manager-plus.author-courses", "Only manager+ can author courses");

async function requireAuthor() {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { session, denied: AUTHOR_GATE() };
  return { session, denied: null };
}

// ── Courses ────────────────────────────────────────────────────────────

const CourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  summary: z.string().max(2000).optional().or(z.literal("")),
  cover_path: z.string().max(500).optional().or(z.literal("")),
  points_reward: z.coerce.number().int().min(0).max(100000).default(0),
  grants_certification_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createCourseAction(_: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = CourseSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_courses")
    .insert({
      org_id: session.orgId,
      title: d.title,
      summary: d.summary || null,
      cover_path: d.cover_path || null,
      points_reward: d.points_reward,
      grants_certification_id: d.grants_certification_id || null,
      course_state: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/teach");
  redirect(`/legend/teach/${data.id}`);
}

export async function updateCourseAction(courseId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = CourseSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_courses")
    .update({
      title: d.title,
      summary: d.summary || null,
      cover_path: d.cover_path || null,
      points_reward: d.points_reward,
      grants_certification_id: d.grants_certification_id || null,
    })
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  // Read-back: RLS no-ops return no error — an empty result means the row
  // wasn't ours to write.
  if (!data) return actionFail(actionErrorMessage("not-found.course-in-org", "Course not found in your organization"), fd);
  revalidatePath("/legend/teach");
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  redirect(`/legend/teach/${courseId}`);
}

const CourseStateSchema = z.enum(COURSE_STATES);

/**
 * LDP transition — draft ⇄ published → archived (restorable). Publishing
 * carries the honest guard: at least one PUBLISHED lesson, because the
 * learner course page renders published lessons only. The target state
 * rides in `fd["next"]` (posted by <StateActions>).
 */
export async function setCourseStateAction(courseId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsedNext = CourseStateSchema.safeParse(fd.get("next"));
  if (!parsedNext.success) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: course } = await db
    .from("legend_courses")
    .select("id, course_state")
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!course) return actionError("not-found.course-in-org", "Course not found in your organization");
  if (!canTransition(NEXT_COURSE_STATES, course.course_state, parsedNext.data)) {
    return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  }
  if (parsedNext.data === "published") {
    const { count } = await db
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("course_id", courseId)
      .eq("lesson_state", "published")
      .is("deleted_at", null);
    if (!canPublishCourse(count ?? 0)) {
      return actionError("publish-requires-at-least-one-published-lesson", "Publish requires at least one published lesson");
    }
  }
  const { data: updated, error } = await db
    .from("legend_courses")
    .update({ course_state: parsedNext.data })
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .eq("course_state", course.course_state) // stale-tab guard: state must not have moved underneath us
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  revalidatePath("/legend/teach");
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath("/legend/learn");
  revalidatePath(`/legend/learn/${courseId}`);
  return { ok: true };
}

export async function deleteCourseAction(courseId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can author courses");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("legend_courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete course: ${error.message}`);
  revalidatePath("/legend/teach");
  revalidatePath("/legend/learn");
  // Legacy DeleteForm contract (no undo — legend tables are outside
  // SOFT_DELETABLE_TABLES/restoreOrgScoped): redirect server-side.
  redirect("/legend/teach");
}

// ── Lessons ────────────────────────────────────────────────────────────

const LessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  kind: z.enum(LESSON_KINDS),
  media_url: z.string().url().optional().or(z.literal("")),
  body_html: z.string().max(100000).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().min(0).max(6000).default(0),
});

/** Resolve a course the caller may author against; null when out of reach. */
async function getAuthorCourse(db: LooseSupabase, orgId: string, courseId: string) {
  const { data } = await db
    .from("legend_courses")
    .select("id, course_state")
    .eq("id", courseId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as { id: string; course_state: string } | null;
}

export async function createLessonAction(courseId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = LessonSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const course = await getAuthorCourse(db, session.orgId, courseId);
  if (!course) return actionFail(actionErrorMessage("not-found.course-in-org", "Course not found in your organization"), fd);

  // Append at the end of the current order.
  const { data: last } = await db
    .from("lessons")
    .select("sort_order")
    .eq("org_id", session.orgId)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { error } = await db.from("lessons").insert({
    org_id: session.orgId,
    course_id: courseId,
    title: d.title,
    kind: d.kind,
    media_url: d.media_url || null,
    body_html: d.body_html || null,
    duration_seconds: d.duration_minutes * 60,
    sort_order: nextOrder,
    lesson_state: "draft",
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/legend/teach/${courseId}`);
  redirect(`/legend/teach/${courseId}`);
}

export async function updateLessonAction(courseId: string, lessonId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = LessonSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("lessons")
    .update({
      title: d.title,
      kind: d.kind,
      media_url: d.media_url || null,
      body_html: d.body_html || null,
      duration_seconds: d.duration_minutes * 60,
    })
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data) return actionFail(actionErrorMessage("not-found.lesson-in-org", "Lesson not found in your organization"), fd);
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  redirect(`/legend/teach/${courseId}`);
}

const LessonStateSchema = z.enum(LESSON_STATES);

/**
 * LDP transition on a lesson. Unpublishing/archiving the LAST published
 * lesson of a published course would leave learners on a published-but-
 * empty course, so that edge demotes honestly: it is refused with the same
 * guard publish uses.
 */
export async function setLessonStateAction(courseId: string, lessonId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsedNext = LessonStateSchema.safeParse(fd.get("next"));
  if (!parsedNext.success) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: lesson } = await db
    .from("lessons")
    .select("id, lesson_state")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!lesson) return actionError("not-found.lesson-in-org", "Lesson not found in your organization");
  if (!canTransition(NEXT_LESSON_STATES, lesson.lesson_state, parsedNext.data)) {
    return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  }

  if (lesson.lesson_state === "published" && parsedNext.data !== "published") {
    const course = await getAuthorCourse(db, session.orgId, courseId);
    if (course?.course_state === "published") {
      const { count } = await db
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("course_id", courseId)
        .eq("lesson_state", "published")
        .is("deleted_at", null);
      if ((count ?? 0) <= 1) {
        return actionError("publish-requires-at-least-one-published-lesson", "Publish requires at least one published lesson");
      }
    }
  }

  const { data: updated, error } = await db
    .from("lessons")
    .update({ lesson_state: parsedNext.data })
    .eq("id", lessonId)
    .eq("org_id", session.orgId)
    .eq("lesson_state", lesson.lesson_state)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  return { ok: true };
}

const DirectionSchema = z.enum(["up", "down"]);

/** Reorder a lesson one step up/down (no drag dependency; `fd["direction"]`). */
export async function moveLessonAction(courseId: string, lessonId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsedDir = DirectionSchema.safeParse(fd.get("direction"));
  if (!parsedDir.success) return { ok: true };
  const direction = parsedDir.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: rows } = await db
    .from("lessons")
    .select("id, sort_order")
    .eq("org_id", session.orgId)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const swap = neighborSwap((rows ?? []) as Array<{ id: string; sort_order: number }>, lessonId, direction);
  if (!swap) return { ok: true }; // edge move — a no-op, not an error
  for (const w of swap) {
    const { error } = await db
      .from("lessons")
      .update({ sort_order: w.sort_order })
      .eq("id", w.id)
      .eq("org_id", session.orgId);
    if (error) return { error: error.message };
  }
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  return { ok: true };
}

export async function deleteLessonAction(courseId: string, lessonId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can author courses");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("lessons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete lesson: ${error.message}`);
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  redirect(`/legend/teach/${courseId}`);
}

// ── Assessments ────────────────────────────────────────────────────────

const AssessmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  pass_pct: z.coerce.number().int().min(0).max(100).default(70),
  max_attempts: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(100)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export async function createAssessmentAction(courseId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = AssessmentSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const course = await getAuthorCourse(db, session.orgId, courseId);
  if (!course) return actionFail(actionErrorMessage("not-found.course-in-org", "Course not found in your organization"), fd);
  const { data, error } = await db
    .from("assessments")
    .insert({
      org_id: session.orgId,
      course_id: courseId,
      title: d.title,
      pass_pct: d.pass_pct,
      max_attempts: d.max_attempts,
      assessment_state: "draft",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/legend/teach/${courseId}`);
  redirect(`/legend/teach/${courseId}/assessments/${data.id}`);
}

export async function updateAssessmentAction(
  courseId: string,
  assessmentId: string,
  _: State,
  fd: FormData,
): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = AssessmentSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("assessments")
    .update({ title: d.title, pass_pct: d.pass_pct, max_attempts: d.max_attempts })
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data) return actionFail(actionErrorMessage("not-found.assessment-in-org", "Assessment not found in your organization"), fd);
  revalidatePath(`/legend/teach/${courseId}/assessments/${assessmentId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  return { ok: true };
}

const AssessmentStateSchema = z.enum(ASSESSMENT_STATES);

/** LDP transition — publishing an assessment requires at least one question. */
export async function setAssessmentStateAction(courseId: string, assessmentId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsedNext = AssessmentStateSchema.safeParse(fd.get("next"));
  if (!parsedNext.success) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: assessment } = await db
    .from("assessments")
    .select("id, assessment_state")
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!assessment) return actionError("not-found.assessment-in-org", "Assessment not found in your organization");
  if (!canTransition(NEXT_ASSESSMENT_STATES, assessment.assessment_state, parsedNext.data)) {
    return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  }
  if (parsedNext.data === "published") {
    const { count } = await db
      .from("assessment_questions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("assessment_id", assessmentId);
    if (!canPublishAssessment(count ?? 0)) {
      return actionError("publish-requires-at-least-one-question", "Publish requires at least one question");
    }
  }
  const { data: updated, error } = await db
    .from("assessments")
    .update({ assessment_state: parsedNext.data })
    .eq("id", assessmentId)
    .eq("org_id", session.orgId)
    .eq("assessment_state", assessment.assessment_state)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/teach/${courseId}/assessments/${assessmentId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  return { ok: true };
}

export async function deleteAssessmentAction(courseId: string, assessmentId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can author courses");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("assessments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete assessment: ${error.message}`);
  revalidatePath(`/legend/teach/${courseId}`);
  revalidatePath(`/legend/learn/${courseId}`);
  redirect(`/legend/teach/${courseId}`);
}

// ── Assessment questions (answer key) ──────────────────────────────────

const QuestionSchema = z
  .object({
    prompt: z.string().min(1, "Prompt is required").max(1000),
    options: z.string().min(1, "Add at least two options, one per line").max(4000),
    // The form speaks 1-based ("option 2"); the answer key stores 0-based.
    correct_number: z.coerce.number().int().min(1),
    points: z.coerce.number().int().min(1).max(100).default(1),
  })
  .superRefine((d, ctx) => {
    const opts = parseOptionLines(d.options);
    if (opts.length < 2) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Add at least two options, one per line" });
    } else if (d.correct_number > opts.length) {
      ctx.addIssue({ code: "custom", path: ["correct_number"], message: "Correct answer must point at one of the options" });
    }
  });

/** Resolve an assessment the caller may author against. */
async function getAuthorAssessment(db: LooseSupabase, orgId: string, courseId: string, assessmentId: string) {
  const { data } = await db
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as { id: string } | null;
}

export async function createQuestionAction(courseId: string, assessmentId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = QuestionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const assessment = await getAuthorAssessment(db, session.orgId, courseId, assessmentId);
  if (!assessment) return actionFail(actionErrorMessage("not-found.assessment-in-org", "Assessment not found in your organization"), fd);

  const { data: last } = await db
    .from("assessment_questions")
    .select("sort_order")
    .eq("org_id", session.orgId)
    .eq("assessment_id", assessmentId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { error } = await db.from("assessment_questions").insert({
    org_id: session.orgId,
    assessment_id: assessmentId,
    prompt: d.prompt,
    options: parseOptionLines(d.options),
    correct_index: d.correct_number - 1,
    points: d.points,
    sort_order: nextOrder,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/legend/teach/${courseId}/assessments/${assessmentId}`);
  redirect(`/legend/teach/${courseId}/assessments/${assessmentId}`);
}

export async function updateQuestionAction(
  courseId: string,
  assessmentId: string,
  questionId: string,
  _: State,
  fd: FormData,
): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsed = QuestionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("assessment_questions")
    .update({
      prompt: d.prompt,
      options: parseOptionLines(d.options),
      correct_index: d.correct_number - 1,
      points: d.points,
    })
    .eq("id", questionId)
    .eq("assessment_id", assessmentId)
    .eq("org_id", session.orgId)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data) return actionFail(actionErrorMessage("not-found.question-in-org", "Question not found in your organization"), fd);
  revalidatePath(`/legend/teach/${courseId}/assessments/${assessmentId}`);
  redirect(`/legend/teach/${courseId}/assessments/${assessmentId}`);
}

/** Reorder a question one step up/down (`fd["direction"]`). */
export async function moveQuestionAction(
  courseId: string,
  assessmentId: string,
  questionId: string,
  _: State,
  fd: FormData,
): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const parsedDir = DirectionSchema.safeParse(fd.get("direction"));
  if (!parsedDir.success) return { ok: true };
  const direction = parsedDir.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: rows } = await db
    .from("assessment_questions")
    .select("id, sort_order")
    .eq("org_id", session.orgId)
    .eq("assessment_id", assessmentId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const swap = neighborSwap((rows ?? []) as Array<{ id: string; sort_order: number }>, questionId, direction);
  if (!swap) return { ok: true };
  for (const w of swap) {
    const { error } = await db
      .from("assessment_questions")
      .update({ sort_order: w.sort_order })
      .eq("id", w.id)
      .eq("org_id", session.orgId);
    if (error) return { error: error.message };
  }
  revalidatePath(`/legend/teach/${courseId}/assessments/${assessmentId}`);
  return { ok: true };
}

/**
 * Remove a question. `assessment_questions` carries no `deleted_at`
 * (schema 20260623215805) — this is a hard row delete, scoped to the org
 * and the assessment. A published assessment keeps its >=1-question
 * invariant: deleting the last question of a published assessment is
 * refused with the publish guard.
 */
export async function deleteQuestionAction(
  courseId: string,
  assessmentId: string,
  questionId: string,
  _: State,
  __: FormData,
): Promise<State> {
  const { session, denied } = await requireAuthor();
  if (denied) return denied;
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: assessment } = await db
    .from("assessments")
    .select("id, assessment_state")
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!assessment) return actionError("not-found.assessment-in-org", "Assessment not found in your organization");
  if (assessment.assessment_state === "published") {
    const { count } = await db
      .from("assessment_questions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("assessment_id", assessmentId);
    if ((count ?? 0) <= 1) {
      return actionError("publish-requires-at-least-one-question", "Publish requires at least one question");
    }
  }

  const { error } = await db
    .from("assessment_questions")
    .delete()
    .eq("id", questionId)
    .eq("assessment_id", assessmentId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/legend/teach/${courseId}/assessments/${assessmentId}`);
  return { ok: true };
}
