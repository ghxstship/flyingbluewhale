"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JOB_APPLICATION_STATUSES, type JobApplicationStatus } from "@/lib/marketplace";

const Transition = z.object({
  application_id: z.string().uuid(),
  application_phase: z.enum(JOB_APPLICATION_STATUSES),
  reviewer_notes: z.string().max(4000).optional().or(z.literal("")),
  score: z.string().optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

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
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const score = parsed.data.score ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.score)))) : null;

  const { data: row } = await supabase
    .from("job_applications")
    .select("application_phase")
    .eq("id", parsed.data.application_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return { error: "Application not found" };
  const current = (row as { application_phase: JobApplicationStatus }).application_phase;
  const allowed = APPLICATION_TRANSITIONS[current] ?? [];
  if (current !== parsed.data.application_phase && !allowed.includes(parsed.data.application_phase)) {
    return { error: `Cannot move ${current} → ${parsed.data.application_phase}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }

  const { data: updated, error } = await supabase
    .from("job_applications")
    .update({
      application_phase: parsed.data.application_phase,
      reviewer_notes: parsed.data.reviewer_notes || null,
      score,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.application_id)
    .eq("org_id", session.orgId)
    .eq("application_phase", current as "new")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Application was updated concurrently — refresh and retry" };
  }
  revalidatePath(`/console/marketplace/postings`);
  return { ok: true };
}
