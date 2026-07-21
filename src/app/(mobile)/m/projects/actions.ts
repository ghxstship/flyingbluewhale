"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Project field mutations — kit 34 v3.x. The Projects hub reads the XPMS
 * Coordinate-Matrix datasets (project_tasks / project_events /
 * project_milestones); authoring a NEW coordinate record (with its full XPMS
 * spine) stays in the ATLVS console. What the field needs — and what was
 * missing — is the ability to ADVANCE the work: move a record's lifecycle
 * state, reassign a task, or archive a finished one. Those write here.
 *
 * RLS gates every update/delete to the manager band (owner/admin/manager/
 * controller/collaborator for state/reassign; owner/admin for archive), so a
 * crew member's write is refused at the row — we surface that as an error
 * rather than a silent no-op by reading the affected row back.
 */
export type State = { error?: string } | null;

// Closed enums — mirror the CHECK constraints in
// 20260719224440_kit34_xpms_project_surfaces.sql so an illegal state can't be
// written from a stale client.
const TASK_STATES = ["Open", "In progress", "Blocked", "Done"] as const;
const MILESTONE_STATES = ["Upcoming", "On Track", "At Risk", "Done"] as const;
const EVENT_STATES = ["Scheduled", "Upcoming", "Done"] as const;

const StateInput = z.object({ id: z.string().min(1), state: z.string().min(1) });
const IdInput = z.object({ id: z.string().min(1) });
const ReassignInput = z.object({ id: z.string().min(1), assignee: z.string().trim().max(120) });

async function applyState(
  table: "project_tasks" | "project_events" | "project_milestones",
  column: "task_state" | "event_state" | "milestone_state",
  allowed: readonly string[],
  fd: FormData,
): Promise<State> {
  await requireSession();
  const parsed = StateInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  if (!allowed.includes(parsed.data.state)) return { error: "Unknown state." };

  // Dynamic table + column → the loose client (per CLAUDE.md, reserved for
  // genuinely dynamic table names).
  const supabase = (await createClient()) as unknown as LooseSupabase;
  // Update + read the row back: an RLS-refused write returns zero rows (not an
  // error), so `.select()` empty = "you can't change this", surfaced honestly.
  const { data, error } = await supabase
    .from(table)
    .update({ [column]: parsed.data.state })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You don't have permission to change this record." };

  revalidatePath("/m/projects/tasks");
  revalidatePath("/m/projects/milestones");
  revalidatePath("/m/projects/calendar");
  revalidatePath("/m/projects/timeline");
  return null;
}

/** Advance a project task's lifecycle state (Open → In progress → Blocked → Done). */
export async function setTaskState(_prev: State, fd: FormData): Promise<State> {
  return applyState("project_tasks", "task_state", TASK_STATES, fd);
}

/** Advance a milestone's state (Upcoming → On Track → At Risk → Done). */
export async function setMilestoneState(_prev: State, fd: FormData): Promise<State> {
  return applyState("project_milestones", "milestone_state", MILESTONE_STATES, fd);
}

/** Advance a calendar event's state (Scheduled → Upcoming → Done). */
export async function setEventState(_prev: State, fd: FormData): Promise<State> {
  return applyState("project_events", "event_state", EVENT_STATES, fd);
}

/** Reassign a task's owner. Free-text label (the field roster is names, not a
 *  strict user picker); clears the linked auth id so it can't disagree. */
export async function reassignTask(_prev: State, fd: FormData): Promise<State> {
  await requireSession();
  const parsed = ReassignInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const assignee = parsed.data.assignee.trim();
  const { data, error } = await supabase
    .from("project_tasks")
    .update({ assignee: assignee || null, assignee_id: null })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You don't have permission to reassign this task." };

  revalidatePath("/m/projects/tasks");
  return null;
}

/** Archive a finished/void task (owner/admin only per RLS). Soft — sets the
 *  `archived` flag the read helper already filters on. */
export async function archiveTask(_prev: State, fd: FormData): Promise<State> {
  await requireSession();
  const parsed = IdInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .update({ archived: true })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only an owner or admin can archive a task." };

  revalidatePath("/m/projects/tasks");
  return null;
}
