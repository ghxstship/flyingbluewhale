"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/marketplace";
import { dollarsToCents } from "@/lib/format";
import { moneyDollarsString } from "@/lib/zod/money";
import { formFail } from "@/lib/forms/fail";
import { emitAudit } from "@/lib/audit";
import { actionErrorMessage } from "@/lib/errors";
import { writeInbox } from "@/lib/inbox";

/**
 * Submitter-visible transitions and their notification copy. Every reviewer
 * decision here is one the submitter is waiting on, so all three notify.
 */
const SUBMITTER_NOTICE: Partial<Record<SubmissionStatus, { title: string; body: string }>> = {
  shortlisted: { title: "Submission Shortlisted", body: "Your submission made the shortlist." },
  awarded: { title: "Submission Awarded", body: "Your submission was selected. Details to follow from the organizer." },
  rejected: { title: "Submission Update", body: "The organizer went another direction this time." },
};

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
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.decide-submission-outcomes", "Only manager+ can decide submission outcomes") };
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const score = parsed.data.score ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.score)))) : null;

  const { data: row } = await supabase
    .from("open_call_submissions")
    .select("submission_state, submitter_user_id")
    .eq("id", parsed.data.submission_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return { error: actionErrorMessage("not-found.submission", "Submission not found") };
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
    return { error: actionErrorMessage("concurrency.submission", "Submission was updated concurrently. Refresh and retry") };
  }

  // Tell the submitter — best-effort, never rolls back the transition.
  const notice = current !== parsed.data.status ? SUBMITTER_NOTICE[parsed.data.status] : undefined;
  const submitterId = (row as { submitter_user_id: string | null }).submitter_user_id;
  if (notice && submitterId) {
    void writeInbox({
      userId: submitterId,
      orgId: session.orgId,
      kind: "marketplace",
      sourceType: "open_call_submissions",
      sourceId: parsed.data.submission_id,
      actorId: session.userId,
      title: notice.title,
      body: notice.body,
      href: "/me/submissions",
    });
  }

  revalidatePath(`/studio/marketplace/calls`);
  return { ok: true };
}

const Book = z.object({
  performance_date: z.string().date(),
  fee: moneyDollarsString({ allowZero: false }),
});

// Booking is legal while the submission is still in play — submitted or
// shortlisted. awarded/rejected/withdrawn are terminal.
const BOOKABLE_STATES = ["submitted", "shortlisted"] as const;

/**
 * v7.8 record action — "Book". Awards the submission and drafts the
 * talent_offers row prefilled from the submission + its open call
 * (deposit_pct 60 / balance_terms load_in ride the DB defaults).
 * talent_offers.open_call_submission_id is the back-link and doubles
 * as the idempotency probe — a retry or double-click lands on the
 * offer the first click created.
 */
export async function bookSubmissionAction(submissionId: string, _prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.book-submissions", "Only manager+ can book submissions") };
  const parsed = Book.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data: submission, error: loadError } = await supabase
    .from("open_call_submissions")
    .select("id, open_call_id, talent_profile_id, submission_state, submitter_user_id")
    .eq("org_id", session.orgId)
    .eq("id", submissionId)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!submission) return { error: actionErrorMessage("not-found.submission", "Submission not found") };

  // Idempotency: an offer already drafted from this submission wins.
  const { data: existing } = await supabase
    .from("talent_offers")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("open_call_submission_id", submissionId)
    .limit(1);
  const existingOffer = existing?.[0];
  if (existingOffer) {
    redirect(`/studio/marketplace/offers/${existingOffer.id}`);
  }

  if (!BOOKABLE_STATES.includes(submission.submission_state as (typeof BOOKABLE_STATES)[number])) {
    return { error: `Submission cannot be booked from its current state (${submission.submission_state})` };
  }
  if (!submission.talent_profile_id) {
    return { error: actionErrorMessage("submission-has-no-talent-profile-to-book", "Submission has no talent profile to book") };
  }

  const { data: call } = await supabase
    .from("open_calls")
    .select("id, project_id, currency, slot_length_min")
    .eq("org_id", session.orgId)
    .eq("id", submission.open_call_id)
    .maybeSingle();

  const feeCents = dollarsToCents(parsed.data.fee.replace(/[\s,_$]/g, ""));
  const { data: offer, error: insertError } = await supabase
    .from("talent_offers")
    .insert({
      org_id: session.orgId,
      talent_profile_id: submission.talent_profile_id,
      open_call_submission_id: submissionId,
      performance_date: parsed.data.performance_date,
      fee_cents: feeCents,
      project_id: call?.project_id ?? null,
      ...(call?.currency ? { currency: call.currency } : {}),
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  // Award the submission — conditional on the observed state so a
  // stale tab can't re-award. The offer is already committed; if the
  // patch loses the race the idempotency probe still routes a retry to
  // the offer, and the reviewer can move the submission by hand.
  const { error: patchError } = await supabase
    .from("open_call_submissions")
    .update({
      submission_state: "awarded",
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("org_id", session.orgId)
    .eq("id", submissionId)
    .eq("submission_state", submission.submission_state as "submitted");
  if (patchError) {
    return { error: `Offer created, but awarding the submission failed: ${patchError.message}` };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "submission.offer_created",
    targetTable: "talent_offers",
    targetId: offer.id,
    metadata: { submissionId, openCallId: submission.open_call_id, feeCents },
  });

  // The Book chain awards outside transitionSubmissionAction, so it carries
  // its own submitter notice. Best-effort.
  const bookedSubmitterId = (submission as { submitter_user_id?: string | null }).submitter_user_id;
  if (bookedSubmitterId) {
    void writeInbox({
      userId: bookedSubmitterId,
      orgId: session.orgId,
      kind: "marketplace",
      sourceType: "open_call_submissions",
      sourceId: submissionId,
      actorId: session.userId,
      title: SUBMITTER_NOTICE.awarded!.title,
      body: SUBMITTER_NOTICE.awarded!.body,
      href: "/me/submissions",
    });
  }

  revalidatePath(`/studio/marketplace/calls/${submission.open_call_id}/submissions/${submissionId}`);
  revalidatePath("/studio/marketplace/calls");
  revalidatePath("/studio/marketplace/offers");
  redirect(`/studio/marketplace/offers/${offer.id}`);
}
