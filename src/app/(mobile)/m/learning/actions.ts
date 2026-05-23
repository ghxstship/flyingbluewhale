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

export async function submitQuiz(fd: FormData): Promise<void> {
  const session = await requireSession();
  const entries = Object.fromEntries(fd);
  const parsed = Schema.parse({ assignmentId: entries.assignmentId, courseId: entries.courseId });
  const supabase = await createClient();

  // Verify assignment is the caller's. RLS gates writes too but this
  // protects against form replay with someone else's assignment_id.
  const { data: assignment } = await supabase
    .from("course_assignments")
    .select("id, course_id, org_id")
    .eq("id", parsed.assignmentId)
    .eq("assignee_id", session.userId)
    .maybeSingle();
  if (!assignment) return;

  // Pull the course's optional completion_badge_id so we can auto-award
  // on pass. Cheap single-row read, kept on the optimistic happy path.
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, completion_badge_id")
    .eq("id", parsed.courseId)
    .eq("org_id", (assignment as { org_id: string }).org_id)
    .maybeSingle();

  const { data: questions } = await supabase
    .from("course_quiz_questions")
    .select("id, correct_index")
    .eq("course_id", parsed.courseId);

  // Collect answers from the form. Keys are `q_<question_id>` and values
  // are choice indices.
  const answers: Record<string, number> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (k.startsWith("q_") && typeof v === "string") answers[k.slice(2)] = Number(v);
  }

  const { score_pct, passed } = scoreQuiz((questions ?? []) as Array<{ id: string; correct_index: number }>, answers);

  await supabase.from("course_completions").insert({
    assignment_id: parsed.assignmentId,
    user_id: session.userId,
    score_pct,
    passed,
    answers,
  });

  await supabase
    .from("course_assignments")
    .update({ assignment_state: passed ? "completed" : "in_progress" })
    .eq("id", parsed.assignmentId);

  // Auto-award the completion badge on pass. The badge_awards insert
  // re-checks RLS via the caller's session — they're org-scoped, so the
  // member can self-award the badge tied to their course. Fire-and-forget
  // push notify so a slow VAPID send doesn't block the redirect.
  const c = course as { id: string; title: string; completion_badge_id: string | null } | null;
  if (passed && c?.completion_badge_id) {
    const ca = assignment as { id: string; course_id: string; org_id: string };
    const { data: award } = await supabase
      .from("badge_awards")
      .insert({
        org_id: ca.org_id,
        badge_id: c.completion_badge_id,
        user_id: session.userId,
        note: `Auto-awarded for completing "${c.title}"`,
      })
      .select("id")
      .single();
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

  revalidatePath(`/m/learning/${parsed.courseId}`);
  revalidatePath("/m/learning");
}
