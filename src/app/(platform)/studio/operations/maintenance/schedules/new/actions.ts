"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(160),
  kind: z.enum(["inspection", "service", "cert_renewal", "compliance"]),
  cadence_days: z.coerce.number().int().min(1).max(3650),
  target_kind: z.enum(["venue", "equipment", "credential", "workforce", "custom"]),
  target_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createSchedule(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const next = new Date(Date.now() + parsed.data.cadence_days * 86400_000).toISOString();

  // Cross-tenant FK guard on target_id. Polymorphic by target_kind —
  // dispatch to the correct table per kind. `custom` has no FK target.
  if (parsed.data.target_id) {
    const id = parsed.data.target_id;
    const orgId = session.orgId;
    let exists = false;
    if (parsed.data.target_kind === "venue") {
      const { data } = await supabase.from("venues").select("id").eq("id", id).eq("org_id", orgId).maybeSingle();
      exists = !!data;
    } else if (parsed.data.target_kind === "equipment") {
      // target_kind stays "equipment" (DB check constraint); ids now resolve against the unified assets store.
      const { data } = await supabase
        .from("assets")
        .select("id")
        .eq("id", id)
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .maybeSingle();
      exists = !!data;
    } else if (parsed.data.target_kind === "credential") {
      const { data } = await supabase.from("credentials").select("id").eq("id", id).eq("org_id", orgId).maybeSingle();
      exists = !!data;
    } else if (parsed.data.target_kind === "workforce") {
      const { data } = await supabase.from("crew_members").select("id").eq("id", id).eq("org_id", orgId).maybeSingle();
      exists = !!data;
    } else {
      // `custom` — no FK target to validate.
      exists = true;
    }
    if (!exists) return { error: `${parsed.data.target_kind} not found in your organization` };
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from("maintenance_schedules")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      cadence_days: parsed.data.cadence_days,
      target_kind: parsed.data.target_kind,
      target_id: parsed.data.target_id || null,
      next_run_at: next,
      owner_id: session.userId,
    })
    .select("id")
    .single();
  if (scheduleError) return actionFail(scheduleError.message, fd);

  // Materialise the first job immediately so it shows up in the queue.
  const { error: insertError } = await supabase.from("maintenance_jobs").insert({
    org_id: session.orgId,
    schedule_id: schedule.id,
    kind: parsed.data.kind,
    target_kind: parsed.data.target_kind,
    target_id: parsed.data.target_id || null,
    due_at: next,
  });
  if (insertError) return actionFail(insertError.message, fd);

  revalidatePath("/studio/operations/maintenance");
  redirect("/studio/operations/maintenance");
}
