"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { advanceState } from "../assignments/[assignmentId]/actions";
import { bulkAdvanceAssignments } from "../assignments/actions";

/**
 * Fulfillment Queue actions — thin capability-gated wrappers. EVERY
 * transition routes through the existing NEXT_FULFILLMENT_STATES-enforcing
 * actions (advanceState / bulkAdvanceAssignments): the FSM guard, the
 * assignment_events journal row, the assignee notification, and (Kit 30)
 * the fulfilled_at / fulfilled_by / fulfilled_via='manual' provenance on
 * delivered all live THERE — never raw state writes here.
 */

const Ids = z.object({ projectId: z.string().uuid(), assignmentId: z.string().uuid() });

function queuePath(projectId: string): string {
  return `/studio/projects/${projectId}/advancing/fulfillment`;
}

async function delegateTransition(projectId: string, assignmentId: string, nextState: "approved" | "delivered"): Promise<void> {
  const session = await requireSession();
  if (!can(session, "advance:approve")) return;
  const parsed = Ids.safeParse({ projectId, assignmentId });
  if (!parsed.success) return;
  const fd = new FormData();
  fd.set("projectId", parsed.data.projectId);
  fd.set("assignmentId", parsed.data.assignmentId);
  fd.set("next_state", nextState);
  await advanceState(fd);
  revalidatePath(queuePath(projectId));
}

/** Per-line Approve — submitted/in_review → approved. */
export async function approveLineAction(projectId: string, assignmentId: string): Promise<void> {
  await delegateTransition(projectId, assignmentId, "approved");
}

/**
 * Per-line Mark Fulfilled — approved → delivered. advanceState writes the
 * manual-fulfillment provenance (fulfilled_at / fulfilled_by /
 * fulfilled_via='manual') alongside the transition.
 */
export async function markFulfilledAction(projectId: string, assignmentId: string): Promise<void> {
  await delegateTransition(projectId, assignmentId, "delivered");
}

/** Approve All — every submitted/in_review line on the project → approved. */
export async function approveAllAction(projectId: string): Promise<void> {
  const session = await requireSession();
  if (!can(session, "advance:approve")) return;
  if (!z.string().uuid().safeParse(projectId).success) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .in("fulfillment_state", ["submitted", "in_review"])
    .is("deleted_at", null)
    .limit(200);
  const ids = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (ids.length === 0) return;

  await bulkAdvanceAssignments(projectId, "approved", ids);
  revalidatePath(queuePath(projectId));
}
