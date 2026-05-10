"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/marketplace";

const Transition = z.object({
  submission_id: z.string().uuid(),
  submission_phase: z.enum(SUBMISSION_STATUSES),
  internal_notes: z.string().max(4000).optional().or(z.literal("")),
  score: z.string().optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

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
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const score = parsed.data.score ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.score)))) : null;

  const { data: row } = await supabase
    .from("open_call_submissions")
    .select("submission_phase")
    .eq("id", parsed.data.submission_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return { error: "Submission not found" };
  const current = (row as { submission_phase: SubmissionStatus }).submission_phase;
  const allowed = SUBMISSION_TRANSITIONS[current] ?? [];
  if (current !== parsed.data.submission_phase && !allowed.includes(parsed.data.submission_phase)) {
    return { error: `Cannot move ${current} → ${parsed.data.submission_phase}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }

  const { data: updated, error } = await supabase
    .from("open_call_submissions")
    .update({
      submission_phase: parsed.data.submission_phase,
      internal_notes: parsed.data.internal_notes || null,
      score,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.submission_id)
    .eq("org_id", session.orgId)
    .eq("submission_phase", current as "submitted")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Submission was updated concurrently — refresh and retry" };
  }
  revalidatePath(`/console/marketplace/calls`);
  return { ok: true };
}
