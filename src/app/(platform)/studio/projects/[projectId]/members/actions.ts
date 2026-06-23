"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { PROJECT_ROLES } from "@/lib/supabase/types";
import type { FormState } from "@/components/FormShell";
import { formFail } from "@/lib/forms/fail";

// Adding an existing org member to a project. Project_members RLS already
// constrains writes to is_org_manager_plus(project.org_id), so a normal
// server-side Supabase client (carrying the session cookie) can do the
// INSERT/UPDATE/DELETE directly — no SECURITY DEFINER bypass needed.
const AddSchema = z.object({
  userId: z.string().uuid("Pick a user"),
  role: z.enum(PROJECT_ROLES),
});

async function loadProjectForSession(projectId: string) {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { session, project: null as null | { id: string; name: string; org_id: string } };
  }
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  return { session, project };
}

export async function addProjectMemberAction(projectId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { session, project } = await loadProjectForSession(projectId);
  if (!project) return { error: "Project not found or insufficient permissions." };

  const parsed = AddSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // The candidate must be a current org member. We confirm this rather than
  // trust the picker because the user could rewrite the form payload.
  const { data: candidate } = await supabase
    .from("memberships")
    .select("user_id, users(email)")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!candidate) {
    return { error: "User isn't an active member of this org. Invite them to the org first." };
  }

  const { error } = await supabase
    .from("project_members")
    .upsert(
      { project_id: projectId, user_id: parsed.data.userId, role: parsed.data.role },
      { onConflict: "project_id,user_id" },
    );
  if (error) return { error: error.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.project_member.added",
    targetTable: "project_members",
    targetId: parsed.data.userId,
    metadata: { project_id: projectId, role: parsed.data.role },
  });

  revalidatePath(`/studio/projects/${projectId}/members`);
  return { ok: true };
}

const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(PROJECT_ROLES),
});

export async function updateProjectMemberRoleAction(projectId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { session, project } = await loadProjectForSession(projectId);
  if (!project) return { error: "Project not found or insufficient permissions." };

  const parsed = UpdateRoleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .update({ role: parsed.data.role })
    .eq("project_id", projectId)
    .eq("user_id", parsed.data.userId);
  if (error) return { error: error.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.project_member.role_changed",
    targetTable: "project_members",
    targetId: parsed.data.userId,
    metadata: { project_id: projectId, role: parsed.data.role },
  });

  revalidatePath(`/studio/projects/${projectId}/members`);
  return { ok: true };
}

export async function removeProjectMemberAction(projectId: string, userId: string): Promise<void> {
  const { session, project } = await loadProjectForSession(projectId);
  if (!project) return;
  // Self-remove from a project IS allowed (mirror of memberships RLS where
  // user_id = auth.uid() can delete their own membership row). The
  // org-level removePerson is the one that forbids self-removal.

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId);
  if (error) throw new Error(`Could not remove project member: ${error.message}`);

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.project_member.removed",
    targetTable: "project_members",
    targetId: userId,
    metadata: { project_id: projectId },
  });

  revalidatePath(`/studio/projects/${projectId}/members`);
}
