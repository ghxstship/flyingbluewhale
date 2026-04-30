"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  outcome: z.enum(["pass", "fail", "partial"]),
  notes: z.string().max(2000).optional(),
});

export async function completeJob(jobId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("maintenance_jobs")
    .select("schedule_id")
    .eq("id", jobId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!job) return;

  await supabase
    .from("maintenance_jobs")
    .update({
      completed_at: new Date().toISOString(),
      completed_by: session.userId,
      outcome: parsed.outcome,
      notes: parsed.notes ?? null,
    } as never)
    .eq("id", jobId)
    .eq("org_id", session.orgId);

  // Spawn the next job from the schedule's cadence so the queue stays alive.
  if (job.schedule_id) {
    const { data: schedule } = await supabase
      .from("maintenance_schedules")
      .select("cadence_days, target_id, target_kind, kind, active")
      .eq("id", job.schedule_id)
      .maybeSingle();
    if (schedule && schedule.active) {
      const nextDue = new Date(Date.now() + schedule.cadence_days * 86400_000).toISOString();
      await supabase.from("maintenance_jobs").insert({
        org_id: session.orgId,
        schedule_id: job.schedule_id,
        kind: schedule.kind as "inspection" | "service" | "cert_renewal" | "compliance",
        target_kind: schedule.target_kind as "venue" | "equipment" | "credential" | "workforce" | "custom",
        target_id: schedule.target_id ?? null,
        due_at: nextDue,
      });
      await supabase
        .from("maintenance_schedules")
        .update({ last_run_at: new Date().toISOString(), next_run_at: nextDue } as never)
        .eq("id", job.schedule_id);
    }
  }

  revalidatePath("/console/operations/maintenance");
}
