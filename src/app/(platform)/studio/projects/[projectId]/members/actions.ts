"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasProjectRole, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { PROJECT_ROLES } from "@/lib/supabase/types";
import type { FormState } from "@/components/FormShell";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

// Adding an existing org member to a project. Project-role authority is the
// gate: platform manager+ (auto-bypass) OR the project's `lead` may manage the
// roster. Wired through hasProjectRole so a project lead can run their own
// project's membership without a platform-manager grant — the matching
// project_members RLS write policies (has_project_role(project_id,['lead']))
// let the cookie-session client do the INSERT/UPDATE/DELETE directly.
const AddSchema = z.object({
  userId: z.string().uuid("Pick a user"),
  role: z.enum(PROJECT_ROLES),
});

async function loadProjectForSession(projectId: string) {
  const session = await requireSession();
  if (!(await hasProjectRole(session, projectId, ["lead"]))) {
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
  if (!project) return { error: actionErrorMessage("not-found.project-or-forbidden", "Project not found or insufficient permissions.") };

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
    return { error: actionErrorMessage("user-isn-t-an-active-member-of-this-org", "User isn't an active member of this org. Invite them to the org first.") };
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
  if (!project) return { error: actionErrorMessage("not-found.project-or-forbidden", "Project not found or insufficient permissions.") };

  const parsed = UpdateRoleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: actionErrorMessage("invalid.input", "Invalid input") };

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
