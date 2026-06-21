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
 * tab can't write an illegal jump. Every transition also appends a
 * `task_events` row (event_kind='state_change') so the activity timeline logs.
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

  // Append-only journal row for the transition (best-effort — never blocks
  // the state change). actor_id is the session user.
  if (next !== current) {
    await supabase.from("task_events").insert({
      org_id: session.orgId,
      task_id: taskId,
      event_kind: "state_change",
      from_state: current,
      to_state: next,
      actor_id: session.userId,
    });
  }

  revalidatePath(`/m/tasks/${taskId}`);
  revalidatePath("/m/tasks");
  return null;
}

const CommentInput = z.object({
  taskId: z.string().uuid(),
  body: z.string().trim().min(1, "Comment is required.").max(4000),
  mentions: z.array(z.string().uuid()).max(50).default([]),
});

/**
 * Add a comment to a task. RLS enforces `author_id = auth.uid()`, so we set it
 * to the session user. Writes a matching `task_events` row (event_kind=
 * 'comment') so the activity timeline shows the comment alongside transitions.
 */
export async function addTaskComment(
  taskId: string,
  body: string,
  mentions: string[],
): Promise<State> {
  const session = await requireSession();
  const parsed = CommentInput.safeParse({ taskId, body, mentions });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const supabase = await createClient();

  // Re-scope: the task must be in the caller's org.
  const { data: task } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", v.taskId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!task) return { error: "Task not found." };

  const { error } = await supabase.from("task_comments").insert({
    org_id: session.orgId,
    task_id: v.taskId,
    author_id: session.userId,
    body: v.body,
    mentions: v.mentions,
  });
  if (error) return { error: `Could not post comment: ${error.message}` };

  await supabase.from("task_events").insert({
    org_id: session.orgId,
    task_id: v.taskId,
    event_kind: "comment",
    actor_id: session.userId,
    body: v.body.slice(0, 280),
  });

  revalidatePath(`/m/tasks/${v.taskId}`);
  return null;
}
