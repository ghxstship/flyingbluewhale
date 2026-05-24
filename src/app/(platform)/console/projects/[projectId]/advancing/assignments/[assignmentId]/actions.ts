"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { toTitle } from "@/lib/format";
import { FULFILLMENT_STATES, NEXT_FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";

async function guardAssignment(projectId: string, assignmentId: string, orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("id, catalog_kind, title, party_kind, party_user_id, fulfillment_state")
    .eq("id", assignmentId)
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return data as {
    id: string;
    catalog_kind: string;
    title: string | null;
    party_kind: "user" | "crew_member" | "external_holder";
    party_user_id: string | null;
    fulfillment_state: FulfillmentState;
  } | null;
}

const AdvanceSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  next_state: z.enum(FULFILLMENT_STATES),
});

export async function advanceState(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = AdvanceSchema.parse(Object.fromEntries(fd));
  const a = await guardAssignment(parsed.projectId, parsed.assignmentId, session.orgId);
  if (!a) return;

  // Refuse illegal transitions server-side.
  if (!NEXT_FULFILLMENT_STATES[a.fulfillment_state]?.includes(parsed.next_state as FulfillmentState)) return;

  const supabase = await createClient();
  const { data: updated } = await supabase
    .from("assignments")
    .update({ fulfillment_state: parsed.next_state })
    .eq("id", parsed.assignmentId)
    .eq("org_id", session.orgId)
    .eq("fulfillment_state", a.fulfillment_state)
    .select("id, fulfillment_state")
    .maybeSingle();
  if (!updated) return;

  // Append to the universal event journal.
  await supabase.from("assignment_events").insert({
    assignment_id: parsed.assignmentId,
    org_id: session.orgId,
    event_kind: "state_change",
    actor_user_id: session.userId,
    from_state: a.fulfillment_state,
    to_state: parsed.next_state,
  });

  // Notify the assignee (user kind only — external holders aren't on the platform).
  if (a.party_kind === "user" && a.party_user_id) {
    void writeInbox({
      userId: a.party_user_id,
      orgId: session.orgId,
      kind: "assignment_state",
      sourceType: "assignments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: `Assignment ${toTitle(parsed.next_state)}`,
      body: a.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments/${parsed.assignmentId}`);
  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments`);
}

const ReassignSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  party_user_id: z.string().uuid(),
});

export async function reassignAssignment(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = ReassignSchema.parse(Object.fromEntries(fd));
  const a = await guardAssignment(parsed.projectId, parsed.assignmentId, session.orgId);
  if (!a) return;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.party_user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;
  if (parsed.party_user_id === a.party_user_id) return;

  await supabase
    .from("assignments")
    .update({
      party_kind: "user",
      party_user_id: parsed.party_user_id,
      party_crew_id: null,
      party_external_id: null,
    })
    .eq("id", parsed.assignmentId)
    .eq("org_id", session.orgId);

  void writeInbox({
    userId: parsed.party_user_id,
    orgId: session.orgId,
    kind: "assignment",
    sourceType: "assignment_reassignments",
    sourceId: crypto.randomUUID(),
    actorId: session.userId,
    title: "Assignment reassigned to you",
    body: a.title ?? "",
    href: "/m/advances",
  });

  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments/${parsed.assignmentId}`);
  revalidatePath(`/console/projects/${parsed.projectId}/advancing/assignments`);
}

const CommentSchema = z.object({
  projectId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export async function postComment(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = CommentSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const a = await guardAssignment(parsed.data.projectId, parsed.data.assignmentId, session.orgId);
  if (!a) return;

  const supabase = await createClient();
  await supabase.from("assignment_events").insert({
    assignment_id: parsed.data.assignmentId,
    org_id: session.orgId,
    event_kind: "comment",
    actor_user_id: session.userId,
    body: parsed.data.body,
  });

  if (a.party_kind === "user" && a.party_user_id && a.party_user_id !== session.userId) {
    void writeInbox({
      userId: a.party_user_id,
      orgId: session.orgId,
      kind: "assignment",
      sourceType: "assignment_comments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: "New comment on your assignment",
      body: a.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/console/projects/${parsed.data.projectId}/advancing/assignments/${parsed.data.assignmentId}`);
}

export async function deleteAssignment(projectId: string, assignmentId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const a = await guardAssignment(projectId, assignmentId, session.orgId);
  if (!a) return;

  const supabase = await createClient();
  await supabase
    .from("assignments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("org_id", session.orgId);

  revalidatePath(`/console/projects/${projectId}/advancing/assignments`);
  redirect(`/console/projects/${projectId}/advancing/assignments`);
}
