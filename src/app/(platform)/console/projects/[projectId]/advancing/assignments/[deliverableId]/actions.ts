"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import { urlFor } from "@/lib/urls";

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
  await supabase
    .from("deliverables")
    .update({ deliverable_state: parsed.next_state })
    .eq("id", parsed.deliverableId)
    .eq("org_id", session.orgId)
    .eq("deliverable_state", assignment.deliverable_state as "briefed");

  // Notify the assignee on every state change — they care about
  // approvals + delivery confirmations.
  if (assignment.assignee_id) {
    void sendPushTo(assignment.assignee_id, {
      title: `Advancing item ${parsed.next_state.replace(/_/g, " ")}`,
      body: assignment.title ?? "",
      url: urlFor("mobile", "/advances"),
      tag: `advancing-state:${parsed.deliverableId}:${Date.now()}`,
      kind: "advancing_state",
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

  void sendPushTo(parsed.assignee_id, {
    title: "Advancing item reassigned to you",
    body: assignment.title ?? "",
    url: urlFor("mobile", "/advances"),
    tag: `advancing-reassign:${parsed.deliverableId}:${Date.now()}`,
    kind: "advancing",
  });

  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments/${parsed.deliverableId}`);
  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments`);
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
