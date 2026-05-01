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
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Upsert by (org_id, project_id, log_date) — idempotent so a foreman
  // re-submitting at end of shift doesn't create duplicates.
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("project_id", parsed.project_id)
    .eq("log_date", parsed.log_date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("daily_logs")
      .update({
        weather_summary: parsed.weather_summary || null,
        notes: parsed.notes || null,
      } as never)
      .eq("id", existing.id);
    revalidatePath("/m/daily-log");
    redirect(`/console/operations/daily-log/${existing.id}`);
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      org_id: session.orgId,
      project_id: parsed.project_id,
      log_date: parsed.log_date,
      weather_summary: parsed.weather_summary || null,
      notes: parsed.notes || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/m/daily-log");
  redirect(`/console/operations/daily-log/${data.id}`);
}
