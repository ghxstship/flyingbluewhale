"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * COMPVSS · Approvals — the field half of the approvals engine
 * (approval.clear, kit 28 backlog §3 item 3).
 *
 * This used to be two hand-rolled deciders (time-off + shift swaps). The
 * real engine is `approval_instances`, and its ONE sanctioned write path is
 * the `record_approval_decision` RPC (20260715140000): a single plpgsql
 * transaction that inserts the `approval_decisions` row and advances the
 * instance state together, re-checking manager-band authority on the
 * instance's org itself (SECURITY DEFINER bypasses RLS), rejecting
 * already-terminal instances, and verifying the step belongs to the
 * instance's policy. The console (`/studio/governance/approvals/[id]`)
 * calls exactly the same function — the two shells cannot drift.
 *
 * Called programmatically by the offline queue's `send` (the CrisisPanel
 * precedent), not by useActionState — hence a plain-object input rather
 * than FormData.
 */

const Input = z.object({
  instanceId: z.string().uuid(),
  stepId: z.string().uuid(),
  // The deck offers the two thumb decisions only. `returned` / `recused`
  // stay console affordances — a field deck that buries "return for
  // changes" behind a third button is how the wrong verb gets fat-fingered.
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(2000).optional(),
});

export type DecideApprovalState = { error?: string; ok?: true; stale?: true } | null;

export async function decideApprovalAction(input: {
  instanceId: string;
  stepId: string;
  decision: string;
  notes?: string;
}): Promise<DecideApprovalState> {
  const session = await requireSession();
  // The RPC re-checks the band itself; this early gate just returns a
  // friendlier error than the SQL exception for a member who crafted a POST.
  if (!isManagerPlus(session)) return { error: "Only managers can clear approvals." };
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { error: "Invalid decision." };
  if (!hasSupabase) return { error: "Not configured." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_approval_decision", {
    p_instance_id: parsed.data.instanceId,
    p_step_id: parsed.data.stepId,
    p_decision: parsed.data.decision,
    p_notes: parsed.data.notes || undefined,
  });

  if (error) {
    // A queued decision can replay hours later, after another decider
    // already closed the instance (or it was cancelled). That is a
    // superseded decision, not a failure: returning `error` would park it
    // in the outbox forever and block the drain behind it. Match the two
    // exception shapes the RPC raises for "past its decision window".
    if (
      /is already .+ and cannot take a decision/.test(error.message) ||
      /approval instance .+ not found/.test(error.message)
    ) {
      return { ok: true, stale: true };
    }
    log.error("m.requests.decide_failed", { err: error.message });
    return { error: error.message };
  }

  revalidatePath("/m/requests");
  revalidatePath("/m/my-work");
  revalidatePath("/studio/governance/approvals");
  return { ok: true };
}
