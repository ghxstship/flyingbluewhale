"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { transitionDailyLogState } from "@/lib/db/daily-log";
import { filesFrom, uploadFieldPhotos } from "@/lib/mobile/photo-upload";

export type State = { error?: string; warning?: string; ok?: boolean; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  projectId: z.string().uuid("Pick a project."),
  log_date: z.string().min(1, "Pick a date."),
  weather_summary: z.string().optional(),
  weather_temp_high_f: z.string().optional(),
  weather_temp_low_f: z.string().optional(),
  notes: z.string().optional(),
});

/** Same bucket the console writes daily-log photos to. */
const DAILY_LOG_PHOTO_BUCKET = "procore-parity";

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
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, x]) => typeof x === "string"));
  const parsed = Input.safeParse(scalars);
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

  const { data: saved, error } = await supabase
    .from("daily_logs")
    .upsert(
      {
        org_id: session.orgId,
        project_id: v.projectId,
        log_date: v.log_date,
        weather_summary: v.weather_summary || null,
        weather_temp_high_f: num(v.weather_temp_high_f),
        weather_temp_low_f: num(v.weather_temp_low_f),
        notes: v.notes || null,
        // Saving keeps it a draft. Submitting is a separate, explicit act —
        // see `submitDailyLog`.
        log_state: "draft",
        created_by: session.userId,
      },
      { onConflict: "org_id,project_id,log_date" },
    )
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };

  // Site photos ride along with the save. A daily log without them is a
  // paragraph; with them it's a record — and the phone is the only device
  // on site that can take them.
  const photoFiles = filesFrom(fd, "photo");
  let warning: string | undefined;
  if (saved?.id && photoFiles.length) {
    const upload = await uploadFieldPhotos(supabase, DAILY_LOG_PHOTO_BUCKET, session.orgId, session.userId, photoFiles);
    if (upload.paths.length) {
      const { error: insErr } = await supabase.from("daily_log_photos").insert(
        upload.paths.map((p) => ({
          org_id: session.orgId,
          daily_log_id: saved.id as string,
          file_path: p,
          taken_by: session.userId,
        })),
      );
      if (insErr) warning = "Log saved, but the photos could not be attached.";
    }
    if (upload.error) warning = `Log saved. ${upload.error}`;
  }

  revalidatePath("/m/daily-log");
  return warning ? { warning } : null;
}

/**
 * Submit today's log for review — draft → submitted.
 *
 * COMPVSS could author a site diary and never finish it: `saveDailyLog`
 * hard-codes `draft` and there was no transition path in the mobile shell
 * at all, so the person who was actually on site had to find a desktop to
 * push their own log forward. Routes through the shared FSM so the console
 * and the field can't drift.
 */
export async function submitDailyLog(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("id") ?? "");
  if (!id) return { error: "Missing log id." };

  const supabase = await createClient();
  const result = await transitionDailyLogState(supabase, session, id, "submitted");
  if (!result.ok) return { error: result.error };

  revalidatePath("/m/daily-log");
  return { ok: true };
}
