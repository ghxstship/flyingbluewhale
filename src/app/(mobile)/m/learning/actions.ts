"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { scoreQuiz } from "@/lib/connecteam";
import { writeInbox } from "@/lib/inbox";

const Schema = z.object({
  assignmentId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export type State = { error?: string } | null;

export async function submitQuiz(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const entries = Object.fromEntries(fd);
  const parsed = Schema.safeParse({ assignmentId: entries.assignmentId, courseId: entries.courseId });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Verify assignment is the caller's. RLS gates writes too but this
  // protects against form replay with someone else's assignment_id.
  const { data: assignment } = await supabase
    .from("course_assignments")
    .select("id, course_id, org_id")
    .eq("id", parsed.data.assignmentId)
    .eq("assignee_id", session.userId)
    .maybeSingle();
  if (!assignment) return { error: "Course assignment not found" };

  // Pull the course's optional completion_badge_id so we can auto-award
  // on pass. Cheap single-row read, kept on the optimistic happy path.
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, completion_badge_id")
    .eq("id", parsed.data.courseId)
    .eq("org_id", (assignment as { org_id: string }).org_id)
    .maybeSingle();

  const { data: questions } = await supabase
    .from("course_quiz_questions")
    .select("id, correct_index")
    .eq("course_id", parsed.data.courseId);

  // Collect answers from the form. Keys are `q_<question_id>` and values
  // are choice indices.
  const answers: Record<string, number> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (k.startsWith("q_") && typeof v === "string") answers[k.slice(2)] = Number(v);
  }

  const { score_pct, passed } = scoreQuiz((questions ?? []) as Array<{ id: string; correct_index: number }>, answers);

  const { error: completionError } = await supabase.from("course_completions").insert({
    assignment_id: parsed.data.assignmentId,
    user_id: session.userId,
    score_pct,
    passed,
    answers,
  });
  if (completionError) return { error: `Could not record quiz result: ${completionError.message}` };

  const { error: assignmentError } = await supabase
    .from("course_assignments")
    .update({ assignment_state: passed ? "completed" : "in_progress" })
    .eq("id", parsed.data.assignmentId);
  if (assignmentError) return { error: `Could not update course progress: ${assignmentError.message}` };

  // Auto-award the completion badge on pass. The badge_awards insert
  // re-checks RLS via the caller's session — they're org-scoped, so the
  // member can self-award the badge tied to their course. Fire-and-forget
  // push notify so a slow VAPID send doesn't block the redirect.
  const c = course as { id: string; title: string; completion_badge_id: string | null } | null;
  if (passed && c?.completion_badge_id) {
    const ca = assignment as { id: string; course_id: string; org_id: string };
    const { data: award, error: awardError } = await supabase
      .from("badge_awards")
      .insert({
        org_id: ca.org_id,
        badge_id: c.completion_badge_id,
        user_id: session.userId,
        note: `Auto-awarded for completing "${c.title}"`,
      })
      .select("id")
      .single();
    if (awardError) return { error: `Could not award badge: ${awardError.message}` };
    if (award) {
      void writeInbox({
        userId: session.userId,
        orgId: ca.org_id,
        kind: "badge",
        sourceType: "badge_awards",
        sourceId: (award as { id: string }).id,
        title: "Badge earned",
        body: `Course passed: ${c.title}`,
        href: "/m/kudos",
      });
    }
  }

  revalidatePath(`/m/learning/${parsed.data.courseId}`);
  revalidatePath("/m/learning");
  return null;
}
