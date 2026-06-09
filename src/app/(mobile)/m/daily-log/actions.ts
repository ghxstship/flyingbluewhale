"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  project_id: z.string().uuid(),
  log_date: z.string(),
  weather_summary: z.string().max(200).optional(),
  notes: z.string().max(4000).optional(),
});

export async function quickCreateDailyLog(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Cross-tenant FK guard: confirm the submitted project_id belongs
  // to the caller's org before we insert. RLS on daily_logs gates by
  // is_org_member(org_id), but the FK on project_id only validates
  // existence — without this check a user could attach a daily-log
  // row to another org's project_id while still claiming their own
  // org_id, leaving a dangling cross-org reference.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) throw new Error("Project not found in your organization");

  // Upsert by (org_id, project_id, log_date) — idempotent so a foreman
  // re-submitting at end of shift doesn't create duplicates.
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("project_id", parsed.data.project_id)
    .eq("log_date", parsed.data.log_date)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("daily_logs")
      .update({
        weather_summary: parsed.data.weather_summary || null,
        notes: parsed.data.notes || null,
      } as never)
      .eq("id", existing.id);
    if (updateError) throw new Error(`Could not update daily log: ${updateError.message}`);
    revalidatePath("/m/daily-log");
    redirect(`/console/operations/daily-log/${existing.id}`);
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      log_date: parsed.data.log_date,
      weather_summary: parsed.data.weather_summary || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/m/daily-log");
  redirect(`/console/operations/daily-log/${data.id}`);
}
