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

const ChecklistInput = z.object({
  taskId: z.string().uuid(),
  index: z.coerce.number().int().min(0).max(199),
  done: z.boolean(),
});

/**
 * Kit 31 (live-test resolution #14): toggle a checklist item.
 *
 * `tasks.checklist` is jsonb `[{label, done}]`; `percent_complete` derives
 * from the checklist whenever one exists, so the two can't disagree. Same
 * RBAC band as a state change: manager+ OR the assignee.
 */
export async function toggleChecklistItem(taskId: string, index: number, done: boolean): Promise<State> {
  const session = await requireSession();
  const parsed = ChecklistInput.safeParse({ taskId, index, done });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data: task, error: loadErr } = await supabase
    .from("tasks")
    .select("checklist, assigned_to")
    .eq("id", v.taskId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (loadErr) return { error: `Could not load task: ${loadErr.message}` };
  if (!task) return { error: "Task not found." };

  if (!isManagerPlus(session) && task.assigned_to !== session.userId) {
    return { error: "You don't have permission to change this task." };
  }

  const checklist = (Array.isArray(task.checklist) ? task.checklist : []) as Array<{
    label?: unknown;
    done?: unknown;
  }>;
  if (v.index >= checklist.length) return { error: "That checklist item no longer exists." };
  // Normalize every entry — the jsonb column wants clean {label, done} rows.
  const next = checklist.map((item, i) => ({
    label: String(item.label ?? ""),
    done: i === v.index ? v.done : !!item.done,
  }));
  const doneCount = next.filter((i) => i.done).length;
  const percent = next.length ? Math.round((doneCount / next.length) * 100) : null;

  const { error } = await supabase
    .from("tasks")
    .update({ checklist: next, percent_complete: percent })
    .eq("id", v.taskId)
    .eq("org_id", session.orgId);
  if (error) return { error: `Could not update checklist: ${error.message}` };

  revalidatePath(`/m/tasks/${v.taskId}`);
  revalidatePath("/m/tasks");
  return null;
}

const TimerInput = z.object({ taskId: z.string().uuid() });

/**
 * Start the per-task timer: opens a time_entries row with the task attached and
 * activity_category='task'. That category isolates it from the shift clock (the
 * /m/clock face and /api/v1/time/clock exclude 'task', so an open task timer
 * never reads as "clocked in") and from payroll (compile_timesheets excludes
 * 'task', so task time doesn't double-count against the shift-of-record). Only
 * the task's assignee or a manager may log against it; one running timer per
 * user at a time.
 */
export async function startTaskTimer(taskId: string): Promise<State> {
  const session = await requireSession();
  const parsed = TimerInput.safeParse({ taskId });
  if (!parsed.success) return { error: "Invalid task." };
  const supabase = await createClient();

  const { data: task, error: loadErr } = await supabase
    .from("tasks")
    .select("id, assigned_to")
    .eq("id", taskId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (loadErr) return { error: `Could not load task: ${loadErr.message}` };
  if (!task) return { error: "Task not found." };
  if (!isManagerPlus(session) && task.assigned_to !== session.userId) {
    return { error: "You don't have permission to track time on this task." };
  }

  // One running task timer per user — stop the current one before starting another.
  const { data: openTimer } = await supabase
    .from("time_entries")
    .select("id, task_id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .eq("activity_category", "task")
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();
  if (openTimer) {
    return {
      error: openTimer.task_id === taskId ? "Timer already running." : "Stop your other task timer first.",
    };
  }

  const { error } = await supabase.from("time_entries").insert({
    org_id: session.orgId,
    user_id: session.userId,
    task_id: taskId,
    started_at: new Date().toISOString(),
    activity_category: "task",
    billable: false,
    source_channel: "app",
  });
  if (error) return { error: `Could not start timer: ${error.message}` };

  revalidatePath(`/m/tasks/${taskId}`);
  return null;
}

/** Stop & log the running per-task timer (closes the open 'task' entry; the
 *  derive trigger fills duration_minutes). */
export async function stopTaskTimer(taskId: string): Promise<State> {
  const session = await requireSession();
  const parsed = TimerInput.safeParse({ taskId });
  if (!parsed.success) return { error: "Invalid task." };
  const supabase = await createClient();

  const { data: openTimer } = await supabase
    .from("time_entries")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .eq("task_id", taskId)
    .eq("activity_category", "task")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!openTimer) return { error: "No running timer to stop." };

  const { error } = await supabase
    .from("time_entries")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", openTimer.id as string)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId);
  if (error) return { error: `Could not stop timer: ${error.message}` };

  revalidatePath(`/m/tasks/${taskId}`);
  return null;
}
