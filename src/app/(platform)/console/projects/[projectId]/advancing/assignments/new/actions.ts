"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

const KIND_LABEL: Record<string, string> = {
  credential_assignment: "credential",
  catering_assignment: "catering item",
  radio_assignment: "radio",
  tool_assignment: "tool",
  equipment_assignment: "equipment",
  uniform_assignment: "uniform",
  travel_assignment: "travel item",
  lodging_assignment: "lodging",
  vehicle_assignment: "vehicle",
};

const Schema = z.object({
  type: z.enum([
    "credential_assignment",
    "catering_assignment",
    "radio_assignment",
    "tool_assignment",
    "equipment_assignment",
    "uniform_assignment",
    "travel_assignment",
    "lodging_assignment",
    "vehicle_assignment",
  ]),
  title: z.string().min(1).max(200),
  assignee_id: z.string().uuid(),
  deadline: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  atom_id: z.string().uuid().optional().or(z.literal("")),
  catalog_item_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createAssignmentAction(projectId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Catalog assignment authoring is an operational decision — manager+.
  if (!isManagerPlus(session)) return { error: "Only manager+ can assign catalog items" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Cross-tenant guard on the project.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found" };

  // Assignee must be a member of the org.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.assignee_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return { error: "Assignee is not in your organization" };

  // Cross-tenant guard on the picked atom — must belong to the same
  // org as the project. RLS would block reads but we still validate the
  // FK at insert time to surface a clean error instead of a 23503.
  if (parsed.data.atom_id) {
    const { data: atom } = await supabase
      .from("xpms_atoms")
      .select("id")
      .eq("id", parsed.data.atom_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!atom) return { error: "Atom not found in your organization" };
  }

  // Cross-tenant guard on the master-catalog item, mirroring the
  // atom_id check. 0051 added deliverables.catalog_item_id specifically
  // so advancing assignments could anchor to a canonical SKU instead of
  // free-text titles — surface a clean error on mismatch.
  if (parsed.data.catalog_item_id) {
    const { data: item } = await supabase
      .from("master_catalog_items")
      .select("id")
      .eq("id", parsed.data.catalog_item_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!item) return { error: "Catalog item not found in your organization" };
  }

  const { error } = await supabase.from("deliverables").insert({
    org_id: session.orgId,
    project_id: projectId,
    type: parsed.data.type,
    title: parsed.data.title,
    assignee_id: parsed.data.assignee_id,
    deliverable_state: "briefed",
    deadline: parsed.data.deadline || null,
    data: parsed.data.notes ? { notes: parsed.data.notes } : {},
    atom_id: parsed.data.atom_id || null,
    catalog_item_id: parsed.data.catalog_item_id || null,
  } as never);
  if (error) return { error: error.message };

  // Notify the assignee — they'll see it on /m/advances and the portal.
  // Fire-and-forget; push failures don't roll back the insert.
  void sendPushTo(parsed.data.assignee_id, {
    title: `New ${KIND_LABEL[parsed.data.type] ?? "advancing item"} assigned`,
    body: parsed.data.title,
    url: "/m/advances",
    tag: `advancing:${projectId}:${parsed.data.assignee_id}:${Date.now()}`,
    kind: "advancing",
  });

  revalidatePath(`/console/projects/${projectId}/advancing/assignments`);
  redirect(`/console/projects/${projectId}/advancing/assignments`);
}
