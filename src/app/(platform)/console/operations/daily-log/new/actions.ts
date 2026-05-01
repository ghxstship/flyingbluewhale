"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  project_id: z.string().uuid(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weather_summary: z.string().max(200).optional(),
  weather_temp_high_f: z.string().optional(),
  weather_temp_low_f: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export type State = { error?: string } | null;

function num(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createDailyLog(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      log_date: parsed.data.log_date,
      weather_summary: parsed.data.weather_summary || null,
      weather_temp_high_f: num(parsed.data.weather_temp_high_f),
      weather_temp_low_f: num(parsed.data.weather_temp_low_f),
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return { error: "A daily log already exists for this project on that date. Open it to edit." };
    }
    return { error: error.message };
  }
  revalidatePath("/console/operations/daily-log");
  redirect(`/console/operations/daily-log/${data.id}`);
}
