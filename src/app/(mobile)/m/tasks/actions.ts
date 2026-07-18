"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/tasks list-level writes — the kit 31 (v2.7) swipe canon's Flag/Unflag
 * (warn) and Archive (neutral, "Show Archived" reveals). Stores are
 * `tasks.flagged_at` / `tasks.archived_at` (20260718013348). Done/Reopen rides
 * the existing `setTaskState` transition action beside the detail page.
 *
 * RBAC mirrors `tasks_update` RLS: manager band or the task's assignee. The
 * explicit re-check turns what RLS would silently swallow (0-row update) into
 * a real error the swipe UI can surface.
 */

export type State = { error?: string } | null;

const ToggleSchema = z.object({
  taskId: z.string().uuid(),
  on: z.enum(["1", ""]),
});

async function stampTask(
  fd: FormData,
  column: "flagged_at" | "archived_at",
): Promise<State> {
  const session = await requireSession();
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, assigned_to")
    .eq("id", parsed.data.taskId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!task) return { error: "Task not found." };
  if (!isManagerPlus(session) && task.assigned_to !== session.userId) {
    return { error: "You can only update your own tasks." };
  }

  const stamp = parsed.data.on === "1" ? new Date().toISOString() : null;
  const patch = column === "flagged_at" ? { flagged_at: stamp } : { archived_at: stamp };
  const { error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", parsed.data.taskId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath("/m/tasks");
  return null;
}

/** Swipe Flag/Unflag (warn). */
export async function setTaskFlag(_prev: State, fd: FormData): Promise<State> {
  return stampTask(fd, "flagged_at");
}

/** Swipe Archive (neutral) — non-destructive hide; undo clears the stamp. */
export async function setTaskArchived(_prev: State, fd: FormData): Promise<State> {
  return stampTask(fd, "archived_at");
}
