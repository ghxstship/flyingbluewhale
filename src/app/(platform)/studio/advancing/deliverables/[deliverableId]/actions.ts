"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Deliverable reviewer actions (kit 21 W2, Frame.io canon). Managers assign or
 * remove reviewers; each assigned reviewer records their own verdict. Every
 * write is org-scoped (RLS backstops it; the explicit checks make the failure
 * modes deterministic).
 */
export type ReviewState = { error?: string } | null;

async function guardDeliverable(orgId: string, deliverableId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id")
    .eq("id", deliverableId)
    .eq("org_id", orgId)
    .maybeSingle();
  return !!data;
}

const AssignSchema = z.object({ deliverableId: z.string().uuid(), reviewerId: z.string().uuid() });

export async function assignReviewer(_prev: ReviewState, fd: FormData): Promise<ReviewState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only managers can assign reviewers." };
  const parsed = AssignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick a reviewer." };
  if (!(await guardDeliverable(session.orgId, parsed.data.deliverableId)))
    return { error: "Deliverable not found." };

  const supabase = await createClient();
  const { error } = await supabase.from("deliverable_reviewers").insert({
    org_id: session.orgId,
    deliverable_id: parsed.data.deliverableId,
    reviewer_id: parsed.data.reviewerId,
  });
  if (error) return { error: error.code === "23505" ? "That person is already a reviewer." : error.message };
  revalidatePath(`/studio/advancing/deliverables/${parsed.data.deliverableId}`);
  return null;
}

export async function removeReviewer(deliverableId: string, reviewerId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  await supabase
    .from("deliverable_reviewers")
    .delete()
    .eq("org_id", session.orgId)
    .eq("deliverable_id", deliverableId)
    .eq("reviewer_id", reviewerId);
  revalidatePath(`/studio/advancing/deliverables/${deliverableId}`);
}

/** A reviewer records their own verdict (approve / request changes / reset). */
export async function submitVerdict(
  deliverableId: string,
  verdict: "approved" | "changes_requested" | "pending",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("deliverable_reviewers")
    .update({
      review_state: verdict,
      reviewed_at: verdict === "pending" ? null : new Date().toISOString(),
    })
    .eq("org_id", session.orgId)
    .eq("deliverable_id", deliverableId)
    .eq("reviewer_id", session.userId);
  revalidatePath(`/studio/advancing/deliverables/${deliverableId}`);
}
