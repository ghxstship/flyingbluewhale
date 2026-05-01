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
  const parsed = StampSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  const now = new Date().toISOString();

  await supabase
    .from("submittal_revisions")
    .update({
      stamp: parsed.stamp,
      stamp_notes: parsed.stamp_notes || null,
      stamped_by: session.userId,
      stamped_at: now,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", revisionId);

  // Roll the parent submittal status to match the stamp result.
  const newStatus =
    parsed.stamp === "approved"
      ? "approved"
      : parsed.stamp === "approved_with_comments"
        ? "approved_with_comments"
        : parsed.stamp === "revise_resubmit"
          ? "revise_resubmit"
          : "rejected";

  await supabase
    .from("submittals")
    .update({ status: newStatus } as never)
    .eq("org_id", session.orgId)
    .eq("id", submittalId);

  revalidatePath(`/console/submittals/${submittalId}`);
  revalidatePath("/console/submittals");
}

export async function addNextRound(submittalId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("submittals")
    .select("current_round")
    .eq("org_id", session.orgId)
    .eq("id", submittalId)
    .maybeSingle();
  if (!sub) return;
  const nextRound = (sub.current_round as number) + 1;
  await supabase.from("submittal_revisions").insert({
    org_id: session.orgId,
    submittal_id: submittalId,
    round: nextRound,
    submitted_by: session.userId,
  } as never);
  await supabase
    .from("submittals")
    .update({ current_round: nextRound, status: "submitted" } as never)
    .eq("org_id", session.orgId)
    .eq("id", submittalId);
  revalidatePath(`/console/submittals/${submittalId}`);
}

export async function closeSubmittal(submittalId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("submittals")
    .update({ status: "closed", closed_at: new Date().toISOString() } as never)
    .eq("org_id", session.orgId)
    .eq("id", submittalId);
  revalidatePath(`/console/submittals/${submittalId}`);
  revalidatePath("/console/submittals");
}
