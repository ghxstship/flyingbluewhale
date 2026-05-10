import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { ChangeOrderState, RevisionState } from "./types";

type ActorContext = {
  userId: string;
  userLabel: string | null;
  orgId: string;
};

async function logActivity(
  proposalId: string,
  actor: ActorContext,
  kind: string,
  summary: string,
  options: { targetKind?: string; targetId?: string | null; meta?: Record<string, unknown> } = {},
) {
  const supabase = await createClient();
  const args: {
    p_proposal_id: string;
    p_org_id: string;
    p_kind: string;
    p_actor_id: string;
    p_summary?: string;
    p_actor_label?: string;
    p_target_kind?: string;
    p_target_id?: string;
    p_meta?: Json;
  } = {
    p_proposal_id: proposalId,
    p_org_id: actor.orgId,
    p_kind: kind,
    p_actor_id: actor.userId,
    p_summary: summary,
  };
  if (actor.userLabel != null) args.p_actor_label = actor.userLabel;
  if (options.targetKind) args.p_target_kind = options.targetKind;
  if (options.targetId) args.p_target_id = options.targetId;
  if (options.meta) args.p_meta = options.meta as Json;
  await supabase.rpc("log_proposal_activity", args);
}

// ── PHASE / GATE MUTATIONS ──────────────────────────────────────────────────

export async function toggleGateItem(
  gateItemId: string,
  isDone: boolean,
  actor: ActorContext,
): Promise<{ proposalId: string }> {
  const supabase = await createClient();
  // Pin org_id on both select and update — RLS already gates by org,
  // but explicit scoping protects against a future RLS regression and
  // turns silent zero-row writes into clear "not found" errors.
  const { data: row } = await supabase
    .from("proposal_gate_items")
    .select("id,proposal_id,phase_state_id,label")
    .eq("id", gateItemId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!row) throw new Error("Gate item not found");

  await supabase
    .from("proposal_gate_items")
    .update({
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
      done_by: isDone ? actor.userId : null,
    })
    .eq("id", gateItemId)
    .eq("org_id", actor.orgId);

  await logActivity(
    row.proposal_id,
    actor,
    isDone ? "gate.checked" : "gate.unchecked",
    `Gate item ${isDone ? "checked" : "unchecked"}: ${row.label}`,
    { targetKind: "gate_item", targetId: gateItemId },
  );

  return { proposalId: row.proposal_id };
}

export async function approvePhase(phaseStateId: string, actor: ActorContext): Promise<{ proposalId: string }> {
  const supabase = await createClient();
  const { data: phase } = await supabase
    .from("proposal_phase_states")
    .select("id,proposal_id,phase_num,phase_name")
    .eq("id", phaseStateId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!phase) throw new Error("Phase not found");

  await supabase
    .from("proposal_phase_states")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: actor.userId,
    })
    .eq("id", phaseStateId)
    .eq("org_id", actor.orgId);

  await logActivity(
    phase.proposal_id,
    actor,
    "phase.approved",
    `Phase ${String(phase.phase_num).padStart(2, "0")} — ${phase.phase_name} approved.`,
    { targetKind: "phase", targetId: phaseStateId, meta: { phase_num: phase.phase_num } },
  );

  // Auto-unlock next phase if it's locked
  const { data: nextPhase } = await supabase
    .from("proposal_phase_states")
    .select("id,phase_num,phase_name,status")
    .eq("org_id", actor.orgId)
    .eq("proposal_id", phase.proposal_id)
    .eq("phase_num", phase.phase_num + 1)
    .maybeSingle();

  if (nextPhase && nextPhase.status === "locked") {
    await supabase
      .from("proposal_phase_states")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", nextPhase.id)
      .eq("org_id", actor.orgId);
    await logActivity(
      phase.proposal_id,
      actor,
      "phase.started",
      `Phase ${String(nextPhase.phase_num).padStart(2, "0")} — ${nextPhase.phase_name} unlocked.`,
      { targetKind: "phase", targetId: nextPhase.id, meta: { phase_num: nextPhase.phase_num } },
    );
  }

  return { proposalId: phase.proposal_id };
}

// ── CHANGE ORDERS ────────────────────────────────────────────────────────────

export async function createChangeOrder(
  proposalId: string,
  input: { title: string; body: string },
  actor: ActorContext,
): Promise<{ id: string; number: number }> {
  const supabase = await createClient();
  // Cross-tenant FK guard on proposalId.
  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", proposalId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!proposalRow) throw new Error("Proposal not found");

  const { data, error } = await supabase
    .from("proposal_change_orders")
    .insert({
      proposal_id: proposalId,
      org_id: actor.orgId,
      number: 0,
      title: input.title,
      body: input.body,
      state: "requested",
      requested_by: actor.userId,
      requested_label: actor.userLabel,
    })
    .select("id,number")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create change order");

  await logActivity(proposalId, actor, "co.requested", `Change order #${data.number} requested: ${input.title}`, {
    targetKind: "change_order",
    targetId: data.id,
    meta: { number: data.number },
  });
  return data as { id: string; number: number };
}

export async function decideChangeOrder(
  coId: string,
  decision: "approved" | "rejected",
  note: string | null,
  actor: ActorContext,
): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("proposal_change_orders")
    .select("id,proposal_id,number,title,delta_cents")
    .eq("id", coId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!row) throw new Error("Change order not found");

  await supabase
    .from("proposal_change_orders")
    .update({
      state: decision as ChangeOrderState,
      decided_at: new Date().toISOString(),
      decided_by: actor.userId,
      decision_note: note,
    })
    .eq("id", coId)
    .eq("org_id", actor.orgId);

  await logActivity(row.proposal_id, actor, `co.${decision}`, `Change order #${row.number} ${decision}.`, {
    targetKind: "change_order",
    targetId: coId,
    meta: { delta_cents: row.delta_cents },
  });
}

// ── REVISION ROUNDS ──────────────────────────────────────────────────────────

export async function createRevisionRound(
  proposalId: string,
  input: {
    title: string;
    summary: string;
    targetKind: "proposal" | "phase" | "change_order" | "asset";
    targetId: string | null;
  },
  actor: ActorContext,
): Promise<{ id: string }> {
  const supabase = await createClient();
  // Cross-tenant FK guard on proposalId.
  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", proposalId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!proposalRow) throw new Error("Proposal not found");

  const { count } = await supabase
    .from("proposal_revision_rounds")
    .select("id", { count: "exact", head: true })
    .eq("org_id", actor.orgId)
    .eq("proposal_id", proposalId)
    .eq("target_kind", input.targetKind);
  const nextRoundNum = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("proposal_revision_rounds")
    .insert({
      proposal_id: proposalId,
      org_id: actor.orgId,
      target_kind: input.targetKind,
      target_id: input.targetId,
      round_num: nextRoundNum,
      title: input.title,
      summary: input.summary,
      state: "open",
      created_by: actor.userId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create revision round");

  await logActivity(proposalId, actor, "rev.created", `Revision round opened — ${input.title}`, {
    targetKind: "revision_round",
    targetId: data.id,
    meta: { round_num: nextRoundNum },
  });
  return data as { id: string };
}

export async function decideRevisionRound(
  roundId: string,
  decision: RevisionState,
  note: string | null,
  actor: ActorContext,
): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("proposal_revision_rounds")
    .select("id,proposal_id,title,round_num")
    .eq("id", roundId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!row) throw new Error("Revision round not found");

  await supabase
    .from("proposal_revision_rounds")
    .update({
      state: decision,
      decided_at: new Date().toISOString(),
      decided_by: actor.userId,
      decision_note: note,
    })
    .eq("id", roundId)
    .eq("org_id", actor.orgId);

  await logActivity(
    row.proposal_id,
    actor,
    `rev.${decision}`,
    `Revision round #${row.round_num} (${row.title}): ${decision.replace(/_/g, " ")}.`,
    { targetKind: "revision_round", targetId: roundId },
  );
}

// ── APPROVALS ────────────────────────────────────────────────────────────────

export async function signApproval(approvalId: string, signedLabel: string, actor: ActorContext): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("proposal_approvals")
    .select("id,proposal_id,title,kind,target_id")
    .eq("id", approvalId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!row) throw new Error("Approval not found");

  await supabase
    .from("proposal_approvals")
    .update({
      state: "signed",
      signed_at: new Date().toISOString(),
      signed_by: actor.userId,
      signed_label: signedLabel,
    })
    .eq("id", approvalId)
    .eq("org_id", actor.orgId);

  await logActivity(row.proposal_id, actor, "approval.signed", `Approval signed: ${row.title}`, {
    targetKind: "approval",
    targetId: approvalId,
    meta: { kind: row.kind },
  });

  // If this is a phase_gate approval, also approve the phase
  if (row.kind === "phase_gate" && row.target_id) {
    await approvePhase(row.target_id, actor);
  }
}

export async function declineApproval(approvalId: string, reason: string, actor: ActorContext): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("proposal_approvals")
    .select("id,proposal_id,title")
    .eq("id", approvalId)
    .eq("org_id", actor.orgId)
    .maybeSingle();
  if (!row) throw new Error("Approval not found");

  await supabase
    .from("proposal_approvals")
    .update({ state: "declined", decline_reason: reason })
    .eq("id", approvalId)
    .eq("org_id", actor.orgId);

  await logActivity(row.proposal_id, actor, "approval.declined", `Approval declined: ${row.title}`, {
    targetKind: "approval",
    targetId: approvalId,
  });
}
