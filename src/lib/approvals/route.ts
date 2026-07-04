import "server-only";

import type { Session } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * v7.8 "Route To Approvals" — the shared entry point that record actions
 * (POs, change orders, …) use to open an approval_instances row against
 * the approvals engine. No local status fields: the subject record keeps
 * its own state machine and the instance carries the review lifecycle.
 */

// approval_instances.state values with no terminal semantics —
// recordDecision only stamps closed_at for approved/rejected, so
// "returned" instances are still in flight and must not be duplicated.
const OPEN_INSTANCE_STATES = ["initiated", "in_review", "escalated", "returned"] as const;

export type RouteToApprovalsResult =
  | { id: string; alreadyRouted: boolean }
  | { error: string };

export async function routeToApprovals({
  session,
  subjectTable,
  subjectId,
  metadata,
}: {
  session: Session;
  subjectTable: string;
  subjectId: string;
  metadata?: Record<string, unknown>;
}): Promise<RouteToApprovalsResult> {
  const supabase = await createClient();

  // Idempotency first: one open instance per subject. A retry or
  // double-click lands on the instance the first click created.
  const { data: existing } = await supabase
    .from("approval_instances")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("subject_table", subjectTable)
    .eq("subject_id", subjectId)
    .in("state", [...OPEN_INSTANCE_STATES])
    .order("initiated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { id: existing.id, alreadyRouted: true };

  // Policy match: approval_policies.applies_to is the subject kind /
  // table name (see the policy form hint). Latest active version wins.
  const { data: policy } = await supabase
    .from("approval_policies")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("applies_to", subjectTable)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!policy) {
    return {
      error: `No approval policy covers ${subjectTable} yet. Define one under Governance > Approvals > Policies.`,
    };
  }

  // Seed the review at the policy's first step (lowest step_number);
  // steps are optional, so a stepless policy starts with no current step.
  const { data: firstStep } = await supabase
    .from("approval_steps")
    .select("id")
    .eq("policy_id", policy.id)
    .order("step_number", { ascending: true })
    .limit(1)
    .maybeSingle();

  // state has no default and "pending" is not in the CHECK constraint —
  // "initiated" is the canonical opening state (see lib/approvals/queries.ts).
  const { data: instance, error: insertError } = await supabase
    .from("approval_instances")
    .insert({
      org_id: session.orgId,
      policy_id: policy.id,
      subject_table: subjectTable,
      subject_id: subjectId,
      state: "initiated",
      current_step_id: firstStep?.id ?? null,
      initiated_by: session.userId,
      metadata: (metadata ?? {}) as never,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  return { id: instance.id, alreadyRouted: false };
}
