"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["open", "in_progress", "ready_for_review", "complete", "void"]),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  due_at: z.string().optional(),
  site_plan_id: z.string().uuid().optional().or(z.literal("")),
  show_ready_gate: z.string().optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function updatePunchItem(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { id, ...patch } = parsed.data;
  const { error } = await supabase
    .from("punch_items")
    .update({
      title: patch.title,
      description: patch.description || null,
      project_id: patch.project_id,
      priority: patch.priority,
      status: patch.status,
      assignee_id: patch.assignee_id || null,
      vendor_id: patch.vendor_id || null,
      due_at: patch.due_at || null,
      site_plan_id: patch.site_plan_id || null,
      show_ready_gate: patch.show_ready_gate === "1",
      completed_at: patch.status === "complete" ? new Date().toISOString() : null,
    } as never)
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/punch/${id}`);
  revalidatePath("/console/punch");
  redirect(`/console/punch/${id}`);
}
