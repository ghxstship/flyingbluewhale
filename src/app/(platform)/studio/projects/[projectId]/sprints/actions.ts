"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { SPRINT_STATES, STORY_STATES, remainingPoints } from "@/lib/sprints";
import type { SprintStory } from "@/lib/sprints";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const dateOrEmpty = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal(""));

const SprintSchema = z.object({
  name: z.string().min(1).max(160),
  starts_on: dateOrEmpty,
  ends_on: dateOrEmpty,
  sprint_state: z.enum(SPRINT_STATES),
  goal: z.string().max(2000).optional(),
});

const StorySchema = z.object({
  sprint_id: z.string().uuid(),
  title: z.string().min(1).max(280),
  points: z.coerce.number().int().min(0).max(999),
});

/** Create a sprint under the given project. */
export async function createSprintAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create sprints" };
  const parsed = SprintSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("sprints").insert({
    org_id: session.orgId,
    project_id: projectId,
    name: parsed.data.name,
    starts_on: parsed.data.starts_on || null,
    ends_on: parsed.data.ends_on || null,
    sprint_state: parsed.data.sprint_state,
    goal: parsed.data.goal || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/projects/${projectId}/sprints`);
  redirect(`/studio/projects/${projectId}/sprints`);
}

/** Add a backlog story to a sprint. */
export async function createStoryAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can add stories" };
  const parsed = StorySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("sprint_stories").insert({
    org_id: session.orgId,
    sprint_id: parsed.data.sprint_id,
    title: parsed.data.title,
    points: parsed.data.points,
    story_state: "todo",
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/projects/${projectId}/sprints`);
  return { ok: true };
}

/**
 * Move a story across kanban columns. RLS enforces org scoping; the
 * server-side enum guard rejects an illegal state value from a stale tab.
 */
export async function moveStoryAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const projectId = String(formData.get("projectId") ?? "");
  const storyId = String(formData.get("storyId") ?? "");
  const next = String(formData.get("story_state") ?? "");
  if (!projectId || !storyId) return;
  if (!STORY_STATES.includes(next as (typeof STORY_STATES)[number])) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase
    .from("sprint_stories")
    .update({ story_state: next })
    .eq("id", storyId)
    .eq("org_id", session.orgId);
  revalidatePath(`/studio/projects/${projectId}/sprints`);
}

/**
 * Capture today's burndown reading from the live remaining points. Upserts
 * on (org_id, sprint_id, snapshot_on) so re-snapshotting the same day
 * overwrites rather than duplicates.
 */
export async function snapshotBurndownAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const projectId = String(formData.get("projectId") ?? "");
  const sprintId = String(formData.get("sprintId") ?? "");
  if (!projectId || !sprintId) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: stories } = await supabase
    .from("sprint_stories")
    .select("points, story_state")
    .eq("sprint_id", sprintId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  const remaining = remainingPoints((stories ?? []) as Pick<SprintStory, "points" | "story_state">[]);
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("burndown_snapshots").upsert(
    {
      org_id: session.orgId,
      sprint_id: sprintId,
      snapshot_on: today,
      remaining_points: remaining,
      created_by: session.userId,
    },
    { onConflict: "org_id,sprint_id,snapshot_on" },
  );
  revalidatePath(`/studio/projects/${projectId}/sprints`);
}
