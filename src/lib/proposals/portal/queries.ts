import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  PhaseState,
  GateItem,
  ChangeOrder,
  RevisionRound,
  Revision,
  Approval,
  ProposalFile,
  ActivityEntry,
  PhaseWithGates,
} from "./types";

/**
 * Resolve a project slug + proposalId combo to the canonical scope record.
 * Returns null if either the project or proposal isn't in the user's org.
 */
export async function resolveProposalContext(slug: string, proposalId: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,org_id,slug,project_state,start_date,end_date,client_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) return null;

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,title,amount_cents,proposal_state,sent_at,signed_at,expires_at,notes,created_at,updated_at")
    .eq("project_id", project.id)
    .eq("id", proposalId)
    .maybeSingle();
  if (!proposal) return null;

  return { project, proposal };
}

export async function listPhasesWithGates(proposalId: string): Promise<PhaseWithGates[]> {
  const supabase = await createClient();
  const { data: phases } = await supabase
    .from("proposal_phase_states")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("phase_num", { ascending: true });
  const { data: gates } = await supabase
    .from("proposal_gate_items")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("ordinal", { ascending: true });

  return ((phases as PhaseState[]) ?? []).map((p) => ({
    ...p,
    gateItems: ((gates as GateItem[]) ?? []).filter((g) => g.phase_state_id === p.id),
  }));
}

export async function getPhaseWithGates(phaseStateId: string): Promise<PhaseWithGates | null> {
  const supabase = await createClient();
  const { data: phase } = await supabase.from("proposal_phase_states").select("*").eq("id", phaseStateId).maybeSingle();
  if (!phase) return null;
  const { data: gates } = await supabase
    .from("proposal_gate_items")
    .select("*")
    .eq("phase_state_id", phaseStateId)
    .order("ordinal", { ascending: true });
  return { ...(phase as PhaseState), gateItems: (gates as GateItem[]) ?? [] };
}

export async function listChangeOrders(proposalId: string): Promise<ChangeOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_change_orders")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("number", { ascending: false });
  return (data as ChangeOrder[]) ?? [];
}

export async function getChangeOrder(coId: string): Promise<ChangeOrder | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("proposal_change_orders").select("*").eq("id", coId).maybeSingle();
  return (data as ChangeOrder) ?? null;
}

export async function listRevisionRounds(proposalId: string): Promise<RevisionRound[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_revision_rounds")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });
  return (data as RevisionRound[]) ?? [];
}

export async function getRevisionRound(
  roundId: string,
): Promise<{ round: RevisionRound; revisions: Revision[] } | null> {
  const supabase = await createClient();
  const { data: round } = await supabase.from("proposal_revision_rounds").select("*").eq("id", roundId).maybeSingle();
  if (!round) return null;
  const { data: revisions } = await supabase
    .from("proposal_revisions")
    .select("*")
    .eq("round_id", roundId)
    .order("ordinal", { ascending: true });
  return { round: round as RevisionRound, revisions: (revisions as Revision[]) ?? [] };
}

export async function listApprovals(proposalId: string): Promise<Approval[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_approvals")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });
  return (data as Approval[]) ?? [];
}

export async function getApproval(approvalId: string): Promise<Approval | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("proposal_approvals").select("*").eq("id", approvalId).maybeSingle();
  return (data as Approval) ?? null;
}

export async function listFiles(proposalId: string): Promise<ProposalFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_files")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });
  return (data as ProposalFile[]) ?? [];
}

export async function listActivity(proposalId: string, limit = 50): Promise<ActivityEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_activity")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return (data as ActivityEntry[]) ?? [];
}

export type ProposalSummary = {
  totalPhases: number;
  completedPhases: number;
  activePhase: PhaseState | null;
  pendingApprovals: number;
  openChangeOrders: number;
  openRevisionRounds: number;
  totalContractedCents: number;
  approvedChangeCents: number;
};

export async function getProposalSummary(proposalId: string, baseAmountCents: number): Promise<ProposalSummary> {
  const [phases, changeOrders, rounds, approvals] = await Promise.all([
    listPhasesWithGates(proposalId),
    listChangeOrders(proposalId),
    listRevisionRounds(proposalId),
    listApprovals(proposalId),
  ]);
  const completedPhases = phases.filter((p) => p.phase_state === "complete" || p.phase_state === "approved").length;
  const activePhase = phases.find((p) => p.phase_state === "active" || p.phase_state === "in_review") ?? null;
  const pendingApprovals = approvals.filter((a) => a.state === "pending").length;
  const openChangeOrders = changeOrders.filter(
    (c) => c.state === "requested" || c.state === "priced" || c.state === "client_review",
  ).length;
  const openRevisionRounds = rounds.filter(
    (r) => r.state === "open" || r.state === "client_review" || r.state === "changes_requested",
  ).length;
  const approvedChangeCents = changeOrders
    .filter((c) => c.state === "approved")
    .reduce((sum, c) => sum + (c.delta_cents ?? 0), 0);
  return {
    totalPhases: phases.length,
    completedPhases,
    activePhase,
    pendingApprovals,
    openChangeOrders,
    openRevisionRounds,
    totalContractedCents: baseAmountCents + approvedChangeCents,
    approvedChangeCents,
  };
}
