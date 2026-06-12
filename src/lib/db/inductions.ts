import "server-only";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InductionStatus =
  | "not_required"
  | "pending"
  | "complete"
  | "expired";

export type InductionCheck = {
  requirement_id: string;
  requirement_name: string;
  status: InductionStatus;
  completed_at?: string;
  expires_at?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// listRequirements — fetch all active requirements for an org
// ─────────────────────────────────────────────────────────────────────────────

export async function listInductionRequirements(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("induction_requirements")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("name");
  if (error) {
    log.error("listInductionRequirements", { orgId, error: error.message });
    return [];
  }
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// checkInductionCompliance — given a user + org, returns per-requirement
// compliance status. Used by the fulfillment state machine to gate credential
// or assignment issuance when induction_requirements applies.
// ─────────────────────────────────────────────────────────────────────────────

export async function checkInductionCompliance(
  orgId: string,
  userId: string,
): Promise<InductionCheck[]> {
  const supabase = await createClient();

  const { data: requirements, error: reqErr } = await supabase
    .from("induction_requirements")
    .select("id, name, valid_for_days, applies_to")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  if (reqErr) {
    log.error("checkInductionCompliance.requirements", { error: reqErr.message });
    return [];
  }

  const { data: completions, error: compErr } = await supabase
    .from("induction_completions")
    .select("requirement_id, completed_at, expires_at")
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (compErr) {
    log.error("checkInductionCompliance.completions", { error: compErr.message });
    return [];
  }

  const completionMap = new Map(
    (completions ?? []).map((c) => [c.requirement_id, c]),
  );

  const now = new Date();

  return (requirements ?? []).map((req): InductionCheck => {
    const completion = completionMap.get(req.id);
    if (!completion) {
      return { requirement_id: req.id, requirement_name: req.name, status: "pending" };
    }
    if (completion.expires_at && new Date(completion.expires_at) < now) {
      return {
        requirement_id: req.id,
        requirement_name: req.name,
        status: "expired",
        completed_at: completion.completed_at,
        expires_at: completion.expires_at,
      };
    }
    return {
      requirement_id: req.id,
      requirement_name: req.name,
      status: "complete",
      completed_at: completion.completed_at,
      expires_at: completion.expires_at ?? undefined,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// isInductionCompliant — returns true iff all applicable inductions are
// complete and unexpired. Used as a gate in the assignment fulfillment flow.
// ─────────────────────────────────────────────────────────────────────────────

export async function isInductionCompliant(
  orgId: string,
  userId: string,
): Promise<boolean> {
  const checks = await checkInductionCompliance(orgId, userId);
  return checks.every((c) => c.status === "complete" || c.status === "not_required");
}

// ─────────────────────────────────────────────────────────────────────────────
// recordCompletion — log that a user has completed an induction requirement
// ─────────────────────────────────────────────────────────────────────────────

export async function recordInductionCompletion(input: {
  orgId: string;
  requirementId: string;
  userId?: string;
  crewMemberId?: string;
  completedVia?: "platform" | "external" | "manual_override";
  verifiedBy?: string;
}) {
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("induction_requirements")
    .select("valid_for_days")
    .eq("id", input.requirementId)
    .single();

  const expires_at = req?.valid_for_days
    ? new Date(Date.now() + req.valid_for_days * 86_400_000).toISOString()
    : null;

  const { error } = await supabase.from("induction_completions").insert({
    org_id: input.orgId,
    requirement_id: input.requirementId,
    user_id: input.userId ?? null,
    crew_member_id: input.crewMemberId ?? null,
    completed_via: input.completedVia ?? "platform",
    verified_by: input.verifiedBy ?? null,
    expires_at,
  });

  if (error) {
    log.error("recordInductionCompletion", { error: error.message });
    throw error;
  }
}
