"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { GOAL_STATES, KR_STATES } from "@/lib/goals";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ============================================================
// Goals
// ============================================================
const GoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  owner_id: z.string().uuid().optional().or(z.literal("")),
  period: z.string().max(120).optional().or(z.literal("")),
  goal_state: z.enum(GOAL_STATES).default("draft"),
});

export async function createGoalAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create goals" };
  const parsed = GoalSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("goals")
    .insert({
      org_id: session.orgId,
      title: d.title,
      description: d.description || null,
      owner_id: d.owner_id || null,
      period: d.period || null,
      goal_state: d.goal_state,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/goals");
  redirect(`/console/goals/${data.id}`);
}

export async function updateGoalAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit goals" };
  const parsed = GoalSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("goals")
    .update({
      title: d.title,
      description: d.description || null,
      owner_id: d.owner_id || null,
      period: d.period || null,
      goal_state: d.goal_state,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/goals");
  revalidatePath(`/console/goals/${id}`);
  redirect(`/console/goals/${id}`);
}

const GoalStateSchema = z.enum(GOAL_STATES);

export async function setGoalStateAction(id: string, next: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change goal state");
  const parsed = GoalStateSchema.safeParse(next);
  if (!parsed.success) throw new Error("Invalid goal state");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("goals")
    .update({ goal_state: parsed.data })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not update goal: ${error.message}`);
  revalidatePath(`/console/goals/${id}`);
  revalidatePath("/console/goals");
}

export async function deleteGoalAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete goals");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("goals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete goal: ${error.message}`);
  revalidatePath("/console/goals");
  redirect("/console/goals");
}

// ============================================================
// Key results
// ============================================================
const KeyResultSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  target_value: z.coerce.number().finite("Target must be a number"),
  current_value: z.coerce.number().finite("Current must be a number"),
  unit: z.string().max(40).optional().or(z.literal("")),
  kr_state: z.enum(KR_STATES).default("on_track"),
});

export async function createKeyResultAction(goalId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can add key results" };
  const parsed = KeyResultSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  // Confirm the goal belongs to this org before attaching a child to it.
  const { data: goal } = await db
    .from("goals")
    .select("id")
    .eq("id", goalId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!goal) return { error: "Goal not found" };
  const { error } = await db.from("key_results").insert({
    org_id: session.orgId,
    goal_id: goalId,
    title: d.title,
    target_value: d.target_value,
    current_value: d.current_value,
    unit: d.unit || null,
    kr_state: d.kr_state,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/goals/${goalId}`);
  revalidatePath("/console/goals");
  return { ok: true };
}

export async function updateKeyResultAction(
  goalId: string,
  krId: string,
  _: State,
  fd: FormData,
): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can update key results" };
  const parsed = KeyResultSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("key_results")
    .update({
      title: d.title,
      target_value: d.target_value,
      current_value: d.current_value,
      unit: d.unit || null,
      kr_state: d.kr_state,
    })
    .eq("id", krId)
    .eq("goal_id", goalId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/goals/${goalId}`);
  revalidatePath("/console/goals");
  return { ok: true };
}

export async function deleteKeyResultAction(goalId: string, krId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete key results");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("key_results")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", krId)
    .eq("goal_id", goalId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete key result: ${error.message}`);
  revalidatePath(`/console/goals/${goalId}`);
  revalidatePath("/console/goals");
}
