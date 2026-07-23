"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { compute, type ActivityInput, type DependencyInput, type DepType } from "@/lib/schedule/cpm";
import { parseSchedule } from "@/lib/schedule/import";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({ baseline_id: z.string().uuid() });

export async function activateBaseline(fd: FormData): Promise<void> {
  const session = await requireSession();
  // RLS catches this too (schedule_baselines update requires manager+),
  // but the app gate keeps the failure path predictable and lets us
  // skip the round trip when we already know the answer.
  if (!isManagerPlus(session)) return;
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
  const { error: updateError } = await supabase
    .from("schedule_baselines")
    .update({ baseline_state: "archived" })
    .eq("project_id", b.project_id)
    .eq("org_id", session.orgId)
    .eq("baseline_state", "active");
  if (updateError) throw new Error(`Could not update schedule baseline: ${updateError.message}`);

  const { error } = await supabase
    .from("schedule_baselines")
    .update({ baseline_state: "active", snapshot_at: new Date().toISOString() })
    .eq("id", b.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update schedule baseline: ${error.message}`);

  revalidatePath(`/studio/schedule/baselines/${b.id}`);
}

export async function archiveBaseline(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { error } = await supabase
    .from("schedule_baselines")
    .update({ baseline_state: "archived" })
    .eq("id", parsed.data.baseline_id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update schedule baseline: ${error.message}`);

  revalidatePath(`/studio/schedule/baselines/${parsed.data.baseline_id}`);
}

/**
 * Re-run the CPM forward+backward pass for this baseline. Writes the
 * computed early_*, late_*, *_float_days, and is_critical columns back
 * to schedule_activities.
 */
export async function runCpm(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
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

  // Update each activity row with its computed values. Batched Promise.all
  // (HP-11): each row still gets its own UPDATE (per-row computed values,
  // no RPC/migration), but they fly CHUNK-at-a-time instead of one
  // sequential round trip per activity — a 1,000-activity baseline drops
  // from 1,000 serial round trips to ~40 batched ones.
  const CPM_WRITE_CHUNK = 25;
  for (let i = 0; i < result.activities.length; i += CPM_WRITE_CHUNK) {
    const chunk = result.activities.slice(i, i + CPM_WRITE_CHUNK);
    const outcomes = await Promise.all(
      chunk.map((a) =>
        supabase
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
          .eq("org_id", session.orgId),
      ),
    );
    for (const { error } of outcomes as Array<{ error: { message: string } | null }>) {
      if (error) throw new Error(`Could not update schedule activity: ${error.message}`);
    }
  }

  revalidatePath(`/studio/schedule/baselines/${parsed.data.baseline_id}`);
}

/**
 * Import a P6 XER / P6 XML / MSP XML / Asta XML file into this baseline.
 * Wipes any existing activities + dependencies on the baseline first
 * (replace semantics) — re-import is non-destructive at the baseline
 * level since baselines are versioned.
 */
const ImportScheduleSchema = z.object({
  baseline_id: z.string().uuid(),
  source_content: z
    .string()
    .min(1)
    .max(50 * 1024 * 1024), // 50MB cap
});

export type ImportState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  success?: { activities: number; dependencies: number; warnings: string[] };
} | null;

export async function importSchedule(_: ImportState, fd: FormData): Promise<ImportState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.import-a-schedule", "Only owners, admins, and managers can import a schedule.") };
  const parsed = ImportScheduleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Cross-tenant guard.
  const { data: baseline } = await supabase
    .from("schedule_baselines")
    .select("id, baseline_state")
    .eq("id", parsed.data.baseline_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!baseline) return { error: actionErrorMessage("not-found.baseline-in-org", "Baseline not found in your organization") };

  const result = parseSchedule(parsed.data.source_content);
  if (result.activities.length === 0) {
    return { error: result.warnings[0] ?? "The import file contained zero activities" };
  }

  // Replace semantics: clear existing rows.
  const { error: deleteError2 } = await supabase
    .from("schedule_activity_dependencies")
    .delete()
    .eq("baseline_id", parsed.data.baseline_id)
    .eq("org_id", session.orgId);
  if (deleteError2) return { error: deleteError2.message };
  const { error: deleteError } = await supabase
    .from("schedule_activities")
    .delete()
    .eq("baseline_id", parsed.data.baseline_id)
    .eq("org_id", session.orgId);
  if (deleteError) return { error: deleteError.message };

  // Insert activities. We need our DB id per source_id for dependency mapping.
  const sourceIdToDbId = new Map<string, string>();
  for (const a of result.activities) {
    const { error: insertError, data: inserted } = await supabase
      .from("schedule_activities")
      .insert({
        org_id: session.orgId,
        baseline_id: parsed.data.baseline_id,
        code: a.code || a.source_id,
        name: a.name,
        wbs_path: a.wbs_path,
        start_planned: a.start_planned,
        finish_planned: a.finish_planned,
        duration_days: a.duration_days,
        constraint_type: a.constraint_type,
        constraint_date: a.constraint_date,
        percent_complete: a.percent_complete,
        notes_md: a.notes_md,
      })
      .select("id")
      .single();
    if (insertError) return { error: insertError.message };
    if (inserted) sourceIdToDbId.set(a.source_id, (inserted as { id: string }).id);
  }

  // Insert dependencies, mapping source IDs to our DB IDs.
  let dependenciesInserted = 0;
  for (const d of result.dependencies) {
    const predId = sourceIdToDbId.get(d.predecessor_source_id);
    const succId = sourceIdToDbId.get(d.successor_source_id);
    if (!predId || !succId) continue; // skip dangling deps
    const { error } = await supabase.from("schedule_activity_dependencies").insert({
      org_id: session.orgId,
      baseline_id: parsed.data.baseline_id,
      predecessor_id: predId,
      successor_id: succId,
      dep_type: d.dep_type,
      lag_days: d.lag_days,
    });
    if (!error) dependenciesInserted += 1;
  }

  // Mark the baseline as imported.
  const { error: updateError } = await supabase
    .from("schedule_baselines")
    .update({
      imported_from: result.source_format,
      imported_at: new Date().toISOString(),
      imported_by: session.userId,
    })
    .eq("id", parsed.data.baseline_id)
    .eq("org_id", session.orgId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/studio/schedule/baselines/${parsed.data.baseline_id}`);
  return {
    success: {
      activities: result.activities.length,
      dependencies: dependenciesInserted,
      warnings: result.warnings,
    },
  };
}
