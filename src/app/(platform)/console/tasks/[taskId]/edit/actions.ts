"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(8000).optional().or(z.literal("")),
  status: z.string(),
  priority: z.string().optional(),
  due_at: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateTask(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status as "todo" | "in_progress" | "blocked" | "review" | "done",
      priority: parsed.data.priority ? Number(parsed.data.priority) : 0,
      due_at: parsed.data.due_at ? new Date(parsed.data.due_at).toISOString() : null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/tasks/${id}`);
  revalidatePath("/console/tasks");
  redirect(`/console/tasks/${id}`);
}

export async function deleteTask(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/tasks");
  redirect("/console/tasks");
}
