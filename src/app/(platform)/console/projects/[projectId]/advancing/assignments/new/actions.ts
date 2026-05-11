"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("deliverables").insert({
    org_id: session.orgId,
    project_id: projectId,
    type: parsed.data.type,
    title: parsed.data.title,
    assignee_id: parsed.data.assignee_id,
    deliverable_state: "briefed",
    deadline: parsed.data.deadline || null,
    data: parsed.data.notes ? { notes: parsed.data.notes } : {},
  } as never);
  if (error) return { error: error.message };

  revalidatePath(`/console/projects/${projectId}/advancing/assignments`);
  redirect(`/console/projects/${projectId}/advancing/assignments`);
}
