"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { emitAudit } from "@/lib/audit";
import { urlFor } from "@/lib/urls";
import { PRODUCT_ACCENTS } from "@/lib/brand";
import { PLATFORM_ROLES, PROJECT_ROLES } from "@/lib/supabase/types";
import { PORTAL_PERSONAS } from "@/lib/nav";
import type { FormState } from "@/components/FormShell";
import { actionFail, formFail } from "@/lib/forms/fail";

const CreateSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    role: z.enum(PLATFORM_ROLES),
    // Optional pre-set membership persona (P0.5). Empty → derive from role
    // on acceptance (accept_invite's coalesce). Constrained to the portal
    // sub-personas; operator personas are already implied by the role.
    persona: z
      .enum(PORTAL_PERSONAS as unknown as [string, ...string[]])
      .optional()
      .or(z.literal("").transform(() => undefined)),
    // Optional project scope. The form sends empty string when "Org-wide" is
    // selected; coerce that to undefined so .optional() treats it as absent.
    projectId: z
      .string()
      .uuid()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    projectRole: z
      .enum(PROJECT_ROLES)
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => (v.projectId ? !!v.projectRole : true), {
    message: "Pick a project role when scoping to a project",
    path: ["projectRole"],
  });

export async function createInviteAction(_: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only owners and admins can invite." };

  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // Guard: a project_id from the form must belong to this org. Without
  // this check a manager+ in org A could insert an invite scoped to a
  // project in org B (RLS on `invites` only checks org_id, not project_id).
  if (parsed.data.projectId) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!proj) return { error: "That project doesn't belong to your org." };
  }

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      org_id: session.orgId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      persona: parsed.data.persona ?? null,
      invited_by: session.userId,
      project_id: parsed.data.projectId ?? null,
      project_role: parsed.data.projectId ? parsed.data.projectRole : null,
    } as never)
    .select("id, token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A pending invite already exists for this email." };
    }
    return actionFail(error.message, fd);
  }

  if (!invite) return { error: "Failed to create invite" };

  // Fire-and-forget the invitation email; failure to send doesn't undo the
  // row — admin can copy the link from the list view if email delivery is
  // down. The table is the source of truth.
  // /accept-invite lives on the apex (auth shell) — same origin as login.
  const acceptUrl = urlFor("auth", `/accept-invite/${invite.token}`);
  void sendEmail({
    to: parsed.data.email,
    subject: `You're invited to join a ATLVS Technologies workspace`,
    html: `
      <div style="font-family:'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <p style="color:#5b6472;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace">Invitation</p>
        <h1 style="font-family:'Anton','Arial Narrow','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:400;margin:12px 0 8px;letter-spacing:0.005em;text-transform:uppercase">You've been invited</h1>
        <p style="color:#181b23;font-size:14px">${session.email} invited you to join their workspace as ${parsed.data.role}.</p>
        <p><a href="${acceptUrl}" style="display:inline-block;background:${PRODUCT_ACCENTS.atlvs};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Accept invitation</a></p>
        <p style="color:#8c95a3;font-size:12px;margin-top:24px;font-family:'Space Mono','Courier New',monospace">Link expires in 7 days. If the button doesn't work:<br/><code>${acceptUrl}</code></p>
      </div>`,
  });

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.invite.created",
    targetTable: "invites",
    targetId: invite.id,
    metadata: {
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      persona: parsed.data.persona ?? null,
      project_id: parsed.data.projectId ?? null,
      project_role: parsed.data.projectRole ?? null,
    },
  });

  revalidatePath("/console/people/invites");
  redirect("/console/people/invites");
}

export async function revokeInviteAction(id: string): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only owners and admins can revoke." };

  const supabase = await createClient();
  // Only pending invites can be revoked. Without the .eq("invite_state",
  // "pending") guard, the action would also flip already-accepted or
  // expired invites to "revoked", producing a misleading audit trail
  // (the user is in the org; their invite isn't really revokable).
  const { data, error } = await supabase
    .from("invites")
    .update({ invite_state: "revoked" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("invite_state", "pending")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a pending invite can be revoked" };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.invite.revoked",
    targetTable: "invites",
    targetId: id,
  });

  revalidatePath("/console/people/invites");
  return { ok: true };
}
