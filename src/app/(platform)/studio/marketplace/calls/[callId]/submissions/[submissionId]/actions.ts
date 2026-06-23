"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/marketplace";
import { formFail } from "@/lib/forms/fail";

const Transition = z.object({
  submission_id: z.string().uuid(),
  status: z.enum(SUBMISSION_STATUSES),
  internal_notes: z.string().max(4000).optional().or(z.literal("")),
  score: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// Open-call submission FSM — submitter-initiated `withdrawn` is reachable
// from `submitted` and `shortlisted` only. Reviewer-initiated `awarded`
// and `rejected` flow from submitted/shortlisted. Terminals: awarded,
// rejected, withdrawn.
const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  submitted: ["shortlisted", "rejected", "awarded", "withdrawn"],
  shortlisted: ["awarded", "rejected", "withdrawn"],
  awarded: [],
  rejected: [],
  withdrawn: [],
};

export async function transitionSubmissionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Shortlist / award / reject are reviewer-initiated decisions —
  // manager+ only. Submitter-initiated withdrawal lives on the
  // /me/applications surface (per-user RLS).
  if (!isManagerPlus(session)) return { error: "Only manager+ can decide submission outcomes" };
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const score = parsed.data.score ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.score)))) : null;

  const { data: row } = await supabase
    .from("open_call_submissions")
    .select("submission_state")
    .eq("id", parsed.data.submission_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return { error: "Submission not found" };
  const current = (row as { submission_state: SubmissionStatus }).submission_state;
  const allowed = SUBMISSION_TRANSITIONS[current] ?? [];
  if (current !== parsed.data.status && !allowed.includes(parsed.data.status)) {
    return { error: `Cannot move ${current} → ${parsed.data.status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }

  const { data: updated, error } = await supabase
    .from("open_call_submissions")
    .update({
      submission_state: parsed.data.status,
      internal_notes: parsed.data.internal_notes || null,
      score,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.submission_id)
    .eq("org_id", session.orgId)
    .eq("submission_state", current as "submitted")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Submission was updated concurrently — refresh and retry" };
  }
  revalidatePath(`/studio/marketplace/calls`);
  return { ok: true };
}
