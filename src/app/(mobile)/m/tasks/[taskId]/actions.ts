"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NEXT_TASK_STATES, TASK_STATES, type TaskState } from "../_shared";

export type State = { error?: string } | null;

const Input = z.object({
  taskId: z.string().uuid(),
  next: z.enum(TASK_STATES),
});

/**
 * Transition a task's `task_state`. RBAC: manager+ OR the task's assignee.
 * The `NEXT_TASK_STATES` lifecycle guard is enforced server-side so a stale
 * tab can't write an illegal jump.
 */
export async function setTaskState(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { taskId, next } = parsed.data;

  const supabase = await createClient();

  // Load current state + assignee to re-check both the permission band and
  // the legal-transition guard.
  const { data: task, error: loadErr } = await supabase
    .from("tasks")
    .select("task_state, assigned_to")
    .eq("id", taskId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (loadErr) return { error: `Could not load task: ${loadErr.message}` };
  if (!task) return { error: "Task not found." };

  const isAssignee = task.assigned_to === session.userId;
  if (!isManagerPlus(session) && !isAssignee) {
    return { error: "You don't have permission to change this task." };
  }

  const current = task.task_state as TaskState;
  if (next !== current && !(NEXT_TASK_STATES[current] ?? []).includes(next)) {
    return { error: `Cannot move from ${current} to ${next}.` };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ task_state: next })
    .eq("id", taskId)
    .eq("org_id", session.orgId);
  if (error) return { error: `Could not update task: ${error.message}` };

  revalidatePath(`/m/tasks/${taskId}`);
  revalidatePath("/m/tasks");
  return null;
}
