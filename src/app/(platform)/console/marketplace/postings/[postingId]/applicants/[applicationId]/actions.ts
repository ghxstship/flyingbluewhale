"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_APPLICATION_STATUSES, type JobApplicationStatus } from "@/lib/marketplace";
import { formFail } from "@/lib/forms/fail";

const Transition = z.object({
  application_id: z.string().uuid(),
  status: z.enum(JOB_APPLICATION_STATUSES),
  reviewer_notes: z.string().max(4000).optional().or(z.literal("")),
  score: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// Job application FSM mirrors a standard ATS pipeline. `withdrawn` is
// applicant-initiated and reachable from any non-terminal stage.
// Reviewer can move forward (new → reviewed → phone → booked) or out
// (hold / pass) at any point. Terminals: booked, pass, withdrawn.
const APPLICATION_TRANSITIONS: Record<JobApplicationStatus, readonly JobApplicationStatus[]> = {
  new: ["reviewed", "phone", "booked", "hold", "pass", "withdrawn"],
  reviewed: ["phone", "booked", "hold", "pass", "withdrawn"],
  phone: ["booked", "hold", "pass", "withdrawn"],
  hold: ["reviewed", "phone", "booked", "pass", "withdrawn"],
  booked: [],
  pass: [],
  withdrawn: [],
};

export async function transitionApplicationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Reviewer-side ATS transitions — manager+ only. Applicant-initiated
  // withdrawal lives on /me/applications (per-user RLS).
  if (!isManagerPlus(session)) return { error: "Only manager+ can decide applications" };
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const score = parsed.data.score ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.score)))) : null;

  const { data: row } = await supabase
    .from("job_applications")
    .select("job_application_state")
    .eq("id", parsed.data.application_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return { error: "Application not found" };
  const current = (row as { job_application_state: JobApplicationStatus }).job_application_state;
  const allowed = APPLICATION_TRANSITIONS[current] ?? [];
  if (current !== parsed.data.status && !allowed.includes(parsed.data.status)) {
    return { error: `Cannot move ${current} → ${parsed.data.status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }

  const { data: updated, error } = await supabase
    .from("job_applications")
    .update({
      job_application_state: parsed.data.status,
      reviewer_notes: parsed.data.reviewer_notes || null,
      score,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.application_id)
    .eq("org_id", session.orgId)
    .eq("job_application_state", current as "new")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Application was updated concurrently — refresh and retry" };
  }
  revalidatePath(`/console/marketplace/postings`);
  return { ok: true };
}
