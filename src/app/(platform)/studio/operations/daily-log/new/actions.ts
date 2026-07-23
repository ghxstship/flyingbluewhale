"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  project_id: z.string().uuid(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weather_summary: z.string().max(200).optional(),
  weather_temp_high_f: z.string().optional(),
  weather_temp_low_f: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

function num(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createDailyLog(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };

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
      return { error: actionErrorMessage("a-daily-log-already-exists-for-this-project-on", "A daily log already exists for this project on that date. Open it to edit.") };
    }
    return actionFail(error.message, fd);
  }
  revalidatePath("/studio/operations/daily-log");
  redirect(`/studio/operations/daily-log/${data.id}`);
}
