"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { toTitle } from "@/lib/format";

async function guardAssignment(projectId: string, deliverableId: string, orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id, type, title, assignee_id, deliverable_state")
    .eq("id", deliverableId)
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as {
    id: string;
    type: string;
    title: string | null;
    assignee_id: string | null;
    deliverable_state: string;
  } | null;
}

const NEXT_ALLOWED: Record<string, string[]> = {
  briefed: ["draft", "submitted"],
  draft: ["submitted"],
  submitted: ["in_review", "approved", "revision_requested", "rejected"],
  in_review: ["approved", "revision_requested", "rejected"],
  revision_requested: ["submitted", "rejected"],
  approved: ["delivered"],
  delivered: [],
  rejected: [],
};

const AdvanceSchema = z.object({
  projectId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  next_state: z.enum(["draft", "submitted", "in_review", "approved", "revision_requested", "rejected", "delivered"]),
});

export async function advanceState(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AdvanceSchema.parse(Object.fromEntries(fd));
  const assignment = await guardAssignment(parsed.projectId, parsed.deliverableId, session.orgId);
  if (!assignment) return;

  // Refuse illegal transitions server-side — clients render only allowed
  // buttons but we trust the wire as little as possible.
  if (!NEXT_ALLOWED[assignment.deliverable_state]?.includes(parsed.next_state)) return;

  const supabase = await createClient();
  const { data: updated } = await supabase
    .from("deliverables")
    .update({ deliverable_state: parsed.next_state })
    .eq("id", parsed.deliverableId)
    .eq("org_id", session.orgId)
    .eq("deliverable_state", assignment.deliverable_state as "briefed")
    .select("id, deliverable_state")
    .maybeSingle();
  if (!updated) return; // optimistic concurrency lost — state moved underneath us

  // Append to the per-assignment history ledger so the activity feed
  // on the detail page reflects every transition. version is monotonic
  // per deliverable so future timeline UIs can scrub by step.
  const { data: lastVersion } = await supabase
    .from("deliverable_history")
    .select("version")
    .eq("deliverable_id", parsed.deliverableId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  void supabase.from("deliverable_history").insert({
    deliverable_id: parsed.deliverableId,
    version: ((lastVersion?.version as number | undefined) ?? 0) + 1,
    data: {
      kind: "state_transition",
      from: assignment.deliverable_state,
      to: parsed.next_state,
    },
    changed_by: session.userId,
  });

  // Notify the assignee on every state change — they care about
  // approvals + delivery confirmations.
  if (assignment.assignee_id) {
    // State transition gets its own inbox row distinct from the initial
    // assignment — the user wants "submitted", "approved", "delivered"
    // as separate timeline events. Fresh randomUUID() per transition
    // keeps the partial unique index from collapsing them.
    void writeInbox({
      userId: assignment.assignee_id,
      orgId: session.orgId,
      kind: "advancing_state",
      sourceType: "deliverable_state_transitions",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: `Advancing item ${toTitle(parsed.next_state)}`,
      body: assignment.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments/${parsed.deliverableId}`);
  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments`);
}

const ReassignSchema = z.object({
  projectId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  assignee_id: z.string().uuid(),
});

export async function reassignAssignment(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ReassignSchema.parse(Object.fromEntries(fd));
  const assignment = await guardAssignment(parsed.projectId, parsed.deliverableId, session.orgId);
  if (!assignment) return;

  const supabase = await createClient();
  // New assignee must be an org member.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.assignee_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;
  if (parsed.assignee_id === assignment.assignee_id) return; // no-op

  await supabase
    .from("deliverables")
    .update({ assignee_id: parsed.assignee_id })
    .eq("id", parsed.deliverableId)
    .eq("org_id", session.orgId);

  // Reassignment writes a new advancing-inbox row for the new assignee,
  // distinct from the original assignment (which lives under the
  // deliverables source). Fresh randomUUID() so transitions don't
  // collapse the row.
  void writeInbox({
    userId: parsed.assignee_id,
    orgId: session.orgId,
    kind: "advancing",
    sourceType: "deliverable_reassignments",
    sourceId: crypto.randomUUID(),
    actorId: session.userId,
    title: "Advancing item reassigned to you",
    body: assignment.title ?? "",
    href: "/m/advances",
  });

  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments/${parsed.deliverableId}`);
  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments`);
}

const CommentSchema = z.object({
  projectId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export async function postComment(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = CommentSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const assignment = await guardAssignment(parsed.data.projectId, parsed.data.deliverableId, session.orgId);
  if (!assignment) return;

  const supabase = await createClient();
  await supabase.from("deliverable_comments").insert({
    deliverable_id: parsed.data.deliverableId,
    user_id: session.userId,
    body: parsed.data.body,
  });

  // Notify the assignee (if someone else commented) so they know there's
  // a question waiting on them.
  if (assignment.assignee_id && assignment.assignee_id !== session.userId) {
    void writeInbox({
      userId: assignment.assignee_id,
      orgId: session.orgId,
      kind: "advancing",
      sourceType: "deliverable_comments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: "New comment on your advancing item",
      body: assignment.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.deliverableId}`);
}

export async function deleteAssignment(projectId: string, deliverableId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const assignment = await guardAssignment(projectId, deliverableId, session.orgId);
  if (!assignment) return;

  const supabase = await createClient();
  await supabase
    .from("deliverables")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", deliverableId)
    .eq("org_id", session.orgId);

  revalidatePath(`/console/projects/${projectId}/advancing/assignments`);
  redirect(`/console/projects/${projectId}/advancing/assignments`);
}
