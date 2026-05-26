"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { compute, type ActivityInput, type DependencyInput, type DepType } from "@/lib/schedule/cpm";

const Schema = z.object({ baseline_id: z.string().uuid() });

export async function activateBaseline(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: baseline } = await supabase
    .from("schedule_baselines")
    .select("id, project_id, baseline_state")
    .eq("id", parsed.data.baseline_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!baseline) return;
  const b = baseline as { id: string; project_id: string; baseline_state: string };
  if (b.baseline_state === "active") return;

  // Archive any currently-active baseline for this project (partial unique
  // index enforces one-active; we flip the existing active first).
  await supabase
    .from("schedule_baselines")
    .update({ baseline_state: "archived" })
    .eq("project_id", b.project_id)
    .eq("org_id", session.orgId)
    .eq("baseline_state", "active");

  await supabase
    .from("schedule_baselines")
    .update({ baseline_state: "active", snapshot_at: new Date().toISOString() })
    .eq("id", b.id)
    .eq("org_id", session.orgId);

  revalidatePath(`/console/schedule/baselines/${b.id}`);
}

export async function archiveBaseline(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  await supabase
    .from("schedule_baselines")
    .update({ baseline_state: "archived" })
    .eq("id", parsed.data.baseline_id)
    .eq("org_id", session.orgId);

  revalidatePath(`/console/schedule/baselines/${parsed.data.baseline_id}`);
}

/**
 * Re-run the CPM forward+backward pass for this baseline. Writes the
 * computed early_*, late_*, *_float_days, and is_critical columns back
 * to schedule_activities.
 */
export async function runCpm(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: baseline } = await supabase
    .from("schedule_baselines")
    .select("id")
    .eq("id", parsed.data.baseline_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!baseline) return;

  const [{ data: activitiesData }, { data: depsData }] = await Promise.all([
    supabase
      .from("schedule_activities")
      .select("id, duration_days, start_planned, constraint_type, constraint_date")
      .eq("baseline_id", parsed.data.baseline_id)
      .eq("org_id", session.orgId),
    supabase
      .from("schedule_activity_dependencies")
      .select("predecessor_id, successor_id, dep_type, lag_days")
      .eq("baseline_id", parsed.data.baseline_id)
      .eq("org_id", session.orgId),
  ]);

  const activityRows = (activitiesData ?? []) as Array<{
    id: string;
    duration_days: number;
    start_planned: string;
    constraint_type: ActivityInput["constraint_type"];
    constraint_date: string | null;
  }>;
  const depRows = (depsData ?? []) as Array<{
    predecessor_id: string;
    successor_id: string;
    dep_type: DepType;
    lag_days: number;
  }>;
  if (activityRows.length === 0) return;

  // Data date = earliest start_planned across activities (good enough
  // default; UI can override later).
  const dataDate = activityRows.reduce<string>(
    (min, a) => (min === "" || a.start_planned < min ? a.start_planned : min),
    "",
  );

  const result = compute({
    data_date: dataDate,
    activities: activityRows.map<ActivityInput>((a) => ({
      id: a.id,
      duration_days: Number(a.duration_days),
      constraint_type: a.constraint_type ?? "none",
      constraint_date: a.constraint_date,
    })),
    dependencies: depRows.map<DependencyInput>((d) => ({
      predecessor_id: d.predecessor_id,
      successor_id: d.successor_id,
      dep_type: d.dep_type,
      lag_days: Number(d.lag_days),
    })),
  });

  if ("error" in result) return;

  // Update each activity row with its computed values. Sequential to keep
  // the action self-contained; for large schedules a future revision can
  // batch via RPC.
  for (const a of result.activities) {
    await supabase
      .from("schedule_activities")
      .update({
        early_start: a.early_start,
        early_finish: a.early_finish,
        late_start: a.late_start,
        late_finish: a.late_finish,
        total_float_days: a.total_float_days,
        free_float_days: a.free_float_days,
        is_critical: a.is_critical,
      })
      .eq("id", a.id)
      .eq("org_id", session.orgId);
  }

  revalidatePath(`/console/schedule/baselines/${parsed.data.baseline_id}`);
}
