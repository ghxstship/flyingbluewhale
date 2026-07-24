"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";

/**
 * Submitter-initiated withdrawal (comms audit follow-up — the surface never
 * existed, so `withdrawn` was unreachable for open-call submissions and the
 * org was never told).
 *
 * RLS nuance: `open_call_submissions_update` is org-member-only (reviewer
 * writes), so the submitter's own client CANNOT flip the state. The write
 * rides the service client behind an explicit ownership + state check —
 * same guarded-service pattern as the token-scoped advancing writes. The
 * read proving ownership uses the caller's client (submitter SELECT is
 * granted).
 */

const WITHDRAWABLE = new Set(["submitted", "shortlisted"]);

const Schema = z.object({ submission_id: z.string().uuid() });

export type State = { error?: string; ok?: true } | null;

export async function withdrawSubmissionAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("open_call_submissions")
    .select("id, org_id, submission_state, submitter_user_id, open_call_id")
    .eq("id", parsed.data.submission_id)
    .eq("submitter_user_id", session.userId)
    .maybeSingle();
  if (!row) return { error: "Submission not found" };
  const sub = row as {
    id: string;
    org_id: string;
    submission_state: string;
    open_call_id: string;
  };
  if (!WITHDRAWABLE.has(sub.submission_state)) {
    return { error: "This submission can no longer be withdrawn" };
  }
  if (!isServiceClientAvailable()) {
    return { error: "Withdrawal is unavailable right now. Contact the organizer." };
  }

  const service = createServiceClient();
  const { data: updated, error } = await service
    .from("open_call_submissions")
    .update({ submission_state: "withdrawn" })
    .eq("id", sub.id)
    .eq("submitter_user_id", session.userId)
    .eq("submission_state", sub.submission_state as "submitted")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Submission was updated concurrently. Refresh and retry" };

  // Reverse notice — tell the call's creator. Best-effort.
  const { data: call } = await supabase
    .from("open_calls")
    .select("id, title, created_by")
    .is("deleted_at", null)
    .eq("id", sub.open_call_id)
    .maybeSingle();
  const creator = (call as { title: string; created_by: string | null } | null) ?? null;
  if (creator?.created_by && creator.created_by !== session.userId) {
    void writeInbox({
      userId: creator.created_by,
      orgId: sub.org_id,
      kind: "marketplace",
      sourceType: "open_call_submissions",
      sourceId: sub.id,
      actorId: session.userId,
      title: `Submission Withdrawn: ${creator.title}`,
      body: "A submitter withdrew from this open call.",
      href: `/studio/marketplace/calls/${sub.open_call_id}`,
      reNotify: true,
    });
  }

  revalidatePath("/me/submissions");
  revalidatePath(`/me/submissions/${sub.id}`);
  return { ok: true };
}
