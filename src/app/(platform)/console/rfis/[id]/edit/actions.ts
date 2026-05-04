"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1).max(200),
  question: z.string().min(1).max(4000),
  project_id: z.string().uuid(),
  category: z.string().max(80).optional(),
  ball_in_court_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["open", "answered", "closed"]),
  due_at: z.string().optional(),
  official_answer: z.string().max(8000).optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function updateRfi(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { id, ...patch } = parsed.data;
  const { error } = await supabase
    .from("rfis")
    .update({
      subject: patch.subject,
      question: patch.question,
      project_id: patch.project_id,
      category: patch.category || null,
      ball_in_court_id: patch.ball_in_court_id || null,
      priority: patch.priority,
      status: patch.status,
      due_at: patch.due_at || null,
      official_answer: patch.official_answer || null,
      answered_at: patch.status === "answered" || patch.status === "closed" ? new Date().toISOString() : null,
    } as never)
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/rfis/${id}`);
  revalidatePath("/console/rfis");
  redirect(`/console/rfis/${id}`);
}
