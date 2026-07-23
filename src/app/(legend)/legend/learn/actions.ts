"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { scoreAttempt, type AssessmentQuestion } from "@/lib/legend_learning";
import { awardAchievement } from "@/lib/legend_awards";
import { sendPushTo } from "@/lib/push/send";

export type State = { error?: string; ok?: true } | null;

/**
 * Enroll the caller in a course (idempotent — unique (org, course, user)).
 * Then route into the course so they can start the first lesson.
 */
export async function enrollAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const courseId = z.string().uuid().safeParse(fd.get("course_id"));
  if (!courseId.success) return { error: "Invalid course" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: existing } = await db
    .from("course_enrollments")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("course_id", courseId.data)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!existing) {
    const { error } = await db.from("course_enrollments").insert({
      org_id: session.orgId,
      course_id: courseId.data,
      user_id: session.userId,
      enrollment_state: "enrolled",
      progress_pct: 0,
    });
    if (error) return { error: error.message };
  }
  revalidatePath(`/legend/learn/${courseId.data}`);
  redirect(`/legend/learn/${courseId.data}`);
}

/**
 * Mark a lesson complete, recompute course progress, and — when every
 * published lesson is done — flip the enrollment to completed + award the
 * course's points to the shared ledger.
 */
export async function completeLessonAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = z
    .object({ course_id: z.string().uuid(), lesson_id: z.string().uuid(), position_seconds: z.coerce.number().int().min(0).default(0) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid lesson" };
  const { course_id, lesson_id, position_seconds } = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: enrollment } = await db
    .from("course_enrollments")
    .select("id, enrollment_state")
    .eq("org_id", session.orgId)
    .eq("course_id", course_id)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!enrollment) return { error: "Enroll before completing lessons" };

  await db
    .from("lesson_progress")
    .upsert(
      {
        org_id: session.orgId,
        enrollment_id: enrollment.id,
        lesson_id,
        user_id: session.userId,
        progress_state: "completed",
        position_seconds,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,lesson_id" },
    );

  // Recompute progress across published lessons.
  const [{ data: lessons }, { data: done }] = await Promise.all([
    db.from("lessons").select("id").eq("org_id", session.orgId).eq("course_id", course_id).eq("lesson_state", "published").is("deleted_at", null),
    db.from("lesson_progress").select("lesson_id").eq("org_id", session.orgId).eq("enrollment_id", enrollment.id).eq("progress_state", "completed"),
  ]);
  const total = (lessons ?? []).length || 1;
  const completed = new Set((done ?? []).map((r: { lesson_id: string }) => r.lesson_id));
  const pct = Math.min(100, Math.round((Math.min(completed.size, total) / total) * 100));
  const finished = pct >= 100;

  await db
    .from("course_enrollments")
    .update({
      progress_pct: pct,
      enrollment_state: finished ? "completed" : "in_progress",
      completed_at: finished ? new Date().toISOString() : null,
    })
    .eq("id", enrollment.id);

  if (finished && enrollment.enrollment_state !== "completed") {
    // select("*") on purpose: pre-migration (20260723120100) the table lacks
    // completion_achievement_id, and naming it would error the whole query —
    // silently killing the existing points award. `*` degrades gracefully.
    const { data: course } = await db.from("legend_courses").select("*").eq("id", course_id).maybeSingle();
    const reward = (course?.points_reward as number | undefined) ?? 0;
    if (reward > 0) {
      await db.from("points_ledger").insert({
        org_id: session.orgId,
        user_id: session.userId,
        points: reward,
        reason: `Completed ${course?.title ?? "course"}`,
        source: "legend",
        ref_kind: "course",
        ref_id: course_id,
      });
    }

    // Badge earn path (S-1): when the course grants an achievement, award it
    // idempotently (once per user + achievement — the helper's read-back gates
    // the points credit and the push, so a re-completion can't double-award).
    const achievementId = (course?.completion_achievement_id as string | null | undefined) ?? null;
    if (achievementId) {
      const award = await awardAchievement(db, {
        orgId: session.orgId,
        userId: session.userId,
        achievementId,
        source: "legend",
        note: `Completed ${course?.title ?? "course"}`,
      });
      if (award.awarded) {
        await sendPushTo(session.userId, {
          title: "Badge Earned",
          body: award.points > 0 ? `${award.name ?? "Achievement"} · +${award.points} pts` : (award.name ?? "Achievement"),
          url: "/legend/badges",
          kind: "badge",
          scope: "all",
          orgId: session.orgId,
        });
      }
    }
  }
  revalidatePath(`/legend/learn/${course_id}`);
  return { ok: true };
}

/**
 * Persist media playback position to `lesson_progress` (audit D-27) so
 * resume survives across devices instead of living only in localStorage.
 * Marks the lesson `in_progress`; never downgrades a completed lesson
 * (auto-completion at >= 90% watched is the client's call into
 * `completeLessonAction`). Fire-and-forget from a throttled timeupdate —
 * failures are non-fatal.
 */
export async function saveLessonProgressAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = z
    .object({
      course_id: z.string().uuid(),
      lesson_id: z.string().uuid(),
      position_seconds: z.coerce.number().int().min(0),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid lesson" };
  const { course_id, lesson_id, position_seconds } = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: enrollment } = await db
    .from("course_enrollments")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("course_id", course_id)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!enrollment) return { error: "Enroll before starting lessons" };

  const { data: existing } = await db
    .from("lesson_progress")
    .select("id, progress_state")
    .eq("enrollment_id", enrollment.id)
    .eq("lesson_id", lesson_id)
    .maybeSingle();
  if (existing?.progress_state === "completed") return { ok: true };

  const { error } = await db.from("lesson_progress").upsert(
    {
      org_id: session.orgId,
      enrollment_id: enrollment.id,
      lesson_id,
      user_id: session.userId,
      progress_state: "in_progress",
      position_seconds,
    },
    { onConflict: "enrollment_id,lesson_id" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * Submit an assessment attempt. Scores server-side against the question
 * bank (client never sees correct_index), persists the attempt, and — on
 * a pass — issues the course's certification if one is configured.
 */
export async function submitAttemptAction(
  assessmentId: string,
  answers: number[],
): Promise<{ error?: string; passed?: boolean; scorePct?: number }> {
  const session = await requireSession();
  if (!z.string().uuid().safeParse(assessmentId).success) return { error: "Invalid assessment" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: assessment } = await db
    .from("assessments")
    .select("id, course_id, pass_pct")
    .eq("org_id", session.orgId)
    .eq("id", assessmentId)
    .maybeSingle();
  if (!assessment) return { error: "Assessment not found" };

  const { data: questions } = await db
    .from("assessment_questions")
    .select("correct_index, points")
    .eq("org_id", session.orgId)
    .eq("assessment_id", assessmentId)
    .order("sort_order", { ascending: true });

  const { scorePct } = scoreAttempt((questions ?? []) as Pick<AssessmentQuestion, "correct_index" | "points">[], answers);
  const passed = scorePct >= (assessment.pass_pct as number);

  await db.from("assessment_attempts").insert({
    org_id: session.orgId,
    assessment_id: assessmentId,
    user_id: session.userId,
    score_pct: scorePct,
    passed,
    answers: answers,
    attempt_state: passed ? "passed" : "failed",
    submitted_at: new Date().toISOString(),
  });

  if (passed && assessment.course_id) {
    const { data: course } = await db
      .from("legend_courses")
      .select("grants_certification_id")
      .eq("id", assessment.course_id)
      .maybeSingle();
    const certId = course?.grants_certification_id as string | null | undefined;
    if (certId) {
      const { data: cert } = await db.from("legend_certifications").select("validity_months").eq("id", certId).maybeSingle();
      const months = cert?.validity_months as number | null | undefined;
      const expires = months ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null;
      await db.from("certification_holders").upsert(
        {
          org_id: session.orgId,
          certification_id: certId,
          user_id: session.userId,
          source_course_id: assessment.course_id,
          issued_at: new Date().toISOString(),
          expires_on: expires,
          next_recert_due: expires,
          accreditation_state: "valid",
        },
        { onConflict: "org_id,certification_id,user_id" },
      );
    }
  }
  revalidatePath("/legend/certifications");
  return { passed, scorePct };
}
