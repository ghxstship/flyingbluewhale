"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";

const Schema = z.object({
  subject: z.string().min(1).max(200),
  question: z.string().min(1).max(4000),
  project_id: z.string().uuid(),
  category: z.string().max(80).optional(),
  ball_in_court_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  due_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createRfi(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const code = await nextOrgCode("rfis", session.orgId, "RFI");

  const { data, error } = await supabase
    .from("rfis")
    .insert({
      org_id: session.orgId,
      code,
      project_id: parsed.data.project_id,
      subject: parsed.data.subject,
      question: parsed.data.question,
      category: parsed.data.category || null,
      ball_in_court_id: parsed.data.ball_in_court_id || null,
      priority: parsed.data.priority,
      due_at: parsed.data.due_at || null,
      asked_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/rfis");
  redirect(`/console/rfis/${data.id}`);
}
