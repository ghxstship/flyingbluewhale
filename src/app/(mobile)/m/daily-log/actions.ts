"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  projectId: z.string().uuid("Pick a project."),
  log_date: z.string().min(1, "Pick a date."),
  weather_summary: z.string().optional(),
  weather_temp_high_f: z.string().optional(),
  weather_temp_low_f: z.string().optional(),
  notes: z.string().optional(),
});

function num(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Upsert a daily log for (project, date). Org-scoped; new rows seed
 * log_state `draft`. Re-submitting the same day overwrites the weather/notes
 * via the (org_id, project_id, log_date) unique key.
 */
export async function saveDailyLog(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  // Verify the project belongs to the caller's org.
  const supabase = await createClient();
  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("id", v.projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!proj) return { error: "That project is not in your organization." };

  const { error } = await supabase.from("daily_logs").upsert(
    {
      org_id: session.orgId,
      project_id: v.projectId,
      log_date: v.log_date,
      weather_summary: v.weather_summary || null,
      weather_temp_high_f: num(v.weather_temp_high_f),
      weather_temp_low_f: num(v.weather_temp_low_f),
      notes: v.notes || null,
      log_state: "draft",
      created_by: session.userId,
    },
    { onConflict: "org_id,project_id,log_date" },
  );
  if (error) return { error: error.message };

  revalidatePath("/m/daily-log");
  return null;
}
