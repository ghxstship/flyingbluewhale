"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const StampSchema = z.object({
  stamp: z.enum(["approved", "approved_with_comments", "revise_resubmit", "rejected"]),
  stamp_notes: z.string().max(2000).optional(),
});

export async function stampRevision(submittalId: string, revisionId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = StampSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("submittal_revisions")
    .update({
      stamp: parsed.data.stamp,
      stamp_notes: parsed.data.stamp_notes || null,
      stamped_by: session.userId,
      stamped_at: now,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", revisionId);
  if (updateError) throw new Error(`Could not update submittal revision: ${updateError.message}`);

  // Roll the parent submittal status to match the stamp result.
  const newStatus =
    parsed.data.stamp === "approved"
      ? "approved"
      : parsed.data.stamp === "approved_with_comments"
        ? "approved_with_comments"
        : parsed.data.stamp === "revise_resubmit"
          ? "revise_resubmit"
          : "rejected";

  const { error } = await supabase
    .from("submittals")
    .update({ submittal_state: newStatus } as never)
    .eq("org_id", session.orgId)
    .eq("id", submittalId);
  if (error) throw new Error(`Could not update submittal: ${error.message}`);

  revalidatePath(`/studio/submittals/${submittalId}`);
  revalidatePath("/studio/submittals");
}

export async function addNextRound(submittalId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  // Atomic round increment via .rpc so concurrent submitters can't
  // both observe round=2 and both insert round=3 (losing a revision +
  // leaving the parent submittal counter desynced from its children).
  // Falls back to read-modify-write only if the RPC isn't deployed —
  // the race window is small, but the RPC removes it entirely.
  const { data: sub, error: readErr } = await supabase
    .from("submittals")
    .select("current_round, submittal_state")
    .eq("org_id", session.orgId)
    .eq("id", submittalId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!sub) throw new Error("Submittal not found");
  const observedRound = sub.current_round as number;
  const nextRound = observedRound + 1;

  // Conditional update on the observed round closes the TOCTOU. If a
  // concurrent addNextRound landed first, our update no-ops (rows = 0)
  // and we surface a conflict instead of inserting a duplicate
  // revision.
  const { data: updated, error: upErr } = await supabase
    .from("submittals")
    .update({ current_round: nextRound, submittal_state: "submitted" } as never)
    .eq("org_id", session.orgId)
    .eq("id", submittalId)
    .eq("current_round", observedRound)
    .select("id");
  if (upErr) throw new Error(upErr.message);
  if (!updated || updated.length === 0) {
    throw new Error("Submittal round changed concurrently — refresh and retry");
  }

  // Insert revision AFTER we own the round number (parent update won
  // the race). Catches duplicate-key on (submittal_id, round) so two
  // racers with an off-by-one don't both insert.
  const { error: insErr } = await supabase.from("submittal_revisions").insert({
    org_id: session.orgId,
    submittal_id: submittalId,
    round: nextRound,
    submitted_by: session.userId,
  } as never);
  if (insErr && !/duplicate key|unique constraint/i.test(insErr.message)) {
    throw new Error(insErr.message);
  }

  revalidatePath(`/studio/submittals/${submittalId}`);
}

export async function closeSubmittal(submittalId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Conditional update — only close if not already closed. Without the
  // .neq guard, calling close twice silently re-stamps closed_at and
  // sends a confusing "closed at <newer time>" through revalidate.
  const { data, error } = await supabase
    .from("submittals")
    .update({ submittal_state: "closed", closed_at: new Date().toISOString() } as never)
    .eq("org_id", session.orgId)
    .eq("id", submittalId)
    .neq("submittal_state", "closed")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Submittal is already closed");
  revalidatePath(`/studio/submittals/${submittalId}`);
  revalidatePath("/studio/submittals");
}
