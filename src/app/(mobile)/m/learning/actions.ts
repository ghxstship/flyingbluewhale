"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { scoreQuiz } from "@/lib/connecteam";

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

  revalidatePath(`/m/learning/${parsed.courseId}`);
  revalidatePath("/m/learning");
}
