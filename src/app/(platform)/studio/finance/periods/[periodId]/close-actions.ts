"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Period Close checklist actions (kit 21 remediation R3, ADR-0015; FloQast). A
 * close item is a facet of the ONE `tasks` store — kind='close' + period_id —
 * not a new table. Add + toggle-done, org-scoped.
 */
export type CloseState = { error?: string } | null;

const AddSchema = z.object({ periodId: z.string().uuid(), title: z.string().min(1).max(200) });

export async function addCloseTask(_prev: CloseState, fd: FormData): Promise<CloseState> {
  const session = await requireSession();
  const parsed = AddSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Enter a checklist item." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    org_id: session.orgId,
    title: parsed.data.title,
    kind: "close",
    period_id: parsed.data.periodId,
    created_by: session.userId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/studio/finance/periods/${parsed.data.periodId}`);
  return null;
}

export async function toggleCloseTask(taskId: string, periodId: string, done: boolean): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ task_state: done ? "done" : "todo" })
    .eq("id", taskId)
    .eq("org_id", session.orgId)
    .eq("period_id", periodId);
  revalidatePath(`/studio/finance/periods/${periodId}`);
}
