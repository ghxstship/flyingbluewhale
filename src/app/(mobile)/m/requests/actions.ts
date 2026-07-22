"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus, MANAGER_BAND_ROLES } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { sendPushBulk } from "@/lib/push/send";
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

  // Who asked, and for what — read BEFORE the RPC so the submitter can be
  // notified after it lands (kit 31 swipe canon: "decided items leave the
  // queue + notify submitter").
  const { data: instance } = await supabase
    .from("approval_instances")
    .select("initiated_by, subject_table, policy:approval_policies(name)")
    .eq("id", parsed.data.instanceId)
    .eq("org_id", session.orgId)
    .maybeSingle();

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

  // Notify the submitter: a bell-feed row (own row → the swipe canon applies
  // to it downstream) plus a push. Best-effort — the decision already landed.
  const requester = (instance?.initiated_by as string | null) ?? null;
  if (requester && requester !== session.userId) {
    const policyName =
      (instance as { policy?: { name?: string | null } | null } | null)?.policy?.name ??
      instance?.subject_table ??
      "Request";
    const verdict = parsed.data.decision === "approved" ? "Approved" : "Denied";
    await supabase.from("notifications").insert({
      org_id: session.orgId,
      user_id: requester,
      kind: "approval",
      title: `${verdict} · ${policyName}`,
      body: parsed.data.notes || null,
      href: "/m/requests",
    });
    await sendPushBulk([requester], {
      title: `${verdict} · ${policyName}`,
      body: parsed.data.notes || "Your request was decided.",
      url: "/m/requests",
      kind: "approval",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/requests");
  revalidatePath("/m/my-work");
  revalidatePath("/m/notifications");
  revalidatePath("/studio/governance/approvals");
  return { ok: true };
}

const EscalateInput = z.object({ instanceId: z.string().uuid() });

export type EscalateState = { error?: string; ok?: true } | null;

/**
 * Kit 31 swipe canon · Escalate (warn) — for instances the caller cannot
 * decide (stepless policies, or a member nudging their own submission).
 * Mutates real state: a bell notification lands on every org admin/owner
 * (plus a push), so the escalation exists after the toast fades. Instance
 * state itself is untouched — `record_approval_decision` stays the one
 * sanctioned write path to the engine.
 */
export async function escalateApprovalAction(_prev: EscalateState, fd: FormData): Promise<EscalateState> {
  const session = await requireSession();
  const parsed = EscalateInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  if (!hasSupabase) return { error: "Not configured." };
  const supabase = await createClient();

  const { data: instance } = await supabase
    .from("approval_instances")
    .select("id, state, subject_table, initiated_by, policy:approval_policies(name)")
    .eq("id", parsed.data.instanceId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!instance) return { error: "Approval not found." };
  if (!["initiated", "in_review", "escalated"].includes(String(instance.state))) {
    return { error: "This approval is already decided." };
  }
  // Members may escalate their own submissions; managers may escalate anything.
  if (!isManagerPlus(session) && instance.initiated_by !== session.userId) {
    return { error: "You can only escalate your own requests." };
  }

  const { data: admins } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", session.orgId)
    .in("role", [...MANAGER_BAND_ROLES])
    .is("deleted_at", null);
  const targets = Array.from(
    new Set((admins ?? []).map((m) => m.user_id as string).filter((u) => u && u !== session.userId)),
  );
  if (targets.length === 0) return { error: "No one to escalate to." };

  const policyName =
    (instance as { policy?: { name?: string | null } | null }).policy?.name ??
    String(instance.subject_table);
  const rows = targets.map((userId) => ({
    org_id: session.orgId,
    user_id: userId,
    kind: "approval",
    title: `Escalated · ${policyName}`,
    body: "An approval needs attention.",
    href: "/m/requests",
  }));
  const { error: insErr } = await supabase.from("notifications").insert(rows);
  if (insErr) {
    log.error("m.requests.escalate_failed", { err: insErr.message });
    return { error: insErr.message };
  }
  await sendPushBulk(targets, {
    title: `Escalated · ${policyName}`,
    body: "An approval needs attention.",
    url: "/m/requests",
    kind: "approval",
      scope: "mobile",
    orgId: session.orgId,
  });

  revalidatePath("/m/requests");
  revalidatePath("/m/notifications");
  return { ok: true };
}
