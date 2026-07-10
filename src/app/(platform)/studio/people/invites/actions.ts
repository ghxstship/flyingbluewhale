"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, wrapEmailHtml } from "@/lib/email";
import { emitAudit } from "@/lib/audit";
import { urlFor } from "@/lib/urls";
import { PRODUCT_ACCENTS } from "@/lib/brand";
import { PLATFORM_ROLES, PROJECT_ROLES } from "@/lib/supabase/types";
import { PORTAL_PERSONAS } from "@/lib/nav";
import type { FormState } from "@/components/FormShell";
import { actionFail, formFail } from "@/lib/forms/fail";
import { SCOPABLE_MODULES } from "./scopable-modules";

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

  // Scope-gated subcontractor fields (kit 21 W4). module_scope is a subset of
  // the console rail groups; when set, the seat is time-boxed via expiresInDays
  // (rides the invite's expires_at, mirrored onto the membership on accept).
  const rawModules = fd.getAll("moduleScope").map(String).filter(Boolean);
  const moduleScope = rawModules.filter((m) => SCOPABLE_MODULES.includes(m));
  if (rawModules.length > 0 && moduleScope.length === 0) {
    return { error: "Pick at least one module the subcontractor can reach." };
  }
  const expiresRaw = Number(fd.get("expiresInDays") ?? "");
  const expiresInDays = Number.isFinite(expiresRaw) && expiresRaw > 0 ? Math.min(365, Math.floor(expiresRaw)) : null;

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
      module_scope: moduleScope.length > 0 ? moduleScope : null,
      // A scoped, time-boxed invite overrides the default 7-day window.
      ...(moduleScope.length > 0 && expiresInDays
        ? { expires_at: new Date(Date.now() + expiresInDays * 86_400_000).toISOString() }
        : {}),
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

  // Send the invitation email and remember whether it landed; failure to
  // send doesn't undo the row — the table is the source of truth and the
  // admin can copy the link from the list view — but the failure must be
  // SURFACED (it used to be void-discarded, so delivery outages looked
  // like sent invites).
  // /accept-invite lives on the apex (auth shell) — same origin as login.
  const acceptUrl = urlFor("auth", `/accept-invite/${invite.token}`);
  const sent = await sendEmail({
    to: parsed.data.email,
    subject: `You're invited to join an ATLVS Technologies workspace`,
    html: inviteEmailHtml(session.email, parsed.data.role, acceptUrl),
  });
  if (!sent.ok) {
    console.error("[invite email] send failed:", sent.error);
  }

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
      module_scope: moduleScope.length > 0 ? moduleScope : null,
      expires_in_days: moduleScope.length > 0 ? expiresInDays : null,
    },
  });

  revalidatePath("/studio/people/invites");
  // Surface a send failure on the list: the invite exists (copy the link),
  // but the email never went out.
  redirect(sent.ok ? "/studio/people/invites" : "/studio/people/invites?emailFailed=1");
}

/**
 * Invite email body — the recipient-facing content only; the canonical
 * transactional chrome (header band, endorsement footer) comes from
 * `wrapEmailHtml`, same as every other transactional sender.
 */
function inviteEmailHtml(inviterEmail: string, role: string, acceptUrl: string): string {
  return wrapEmailHtml(`
      <p style="color:#5b6472;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace;margin:0">Invitation</p>
      <h1 style="font-family:'Anton','Arial Narrow','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:400;margin:12px 0 8px;letter-spacing:0.005em;text-transform:uppercase">You've been invited</h1>
      <p style="color:#181b23;font-size:14px">${inviterEmail} invited you to join their workspace as ${role}.</p>
      <p><a href="${acceptUrl}" style="display:inline-block;background:${PRODUCT_ACCENTS.atlvs};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Accept invitation</a></p>
      <p style="color:#8c95a3;font-size:12px;margin-top:24px;font-family:'Space Mono','Courier New',monospace">Link expires in 7 days. If the button doesn't work:<br/><code>${acceptUrl}</code></p>`);
}

/**
 * Re-send the invitation email for a still-pending invite. If the invite
 * has expired, the window is extended by 7 days first so the re-sent link
 * actually works. Admin-only, same as create/revoke.
 */
export async function resendInviteAction(id: string): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only owners and admins can resend." };

  const supabase = await createClient();
  const { data: invite, error: readErr } = await supabase
    .from("invites")
    .select("id, email, role, token, expires_at, invite_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  if (!invite || invite.invite_state !== "pending") {
    return { error: "Only a pending invite can be resent" };
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    const { error: extendErr } = await supabase
      .from("invites")
      .update({ expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .eq("invite_state", "pending");
    if (extendErr) return { error: extendErr.message };
  }

  const acceptUrl = urlFor("auth", `/accept-invite/${invite.token}`);
  const sent = await sendEmail({
    to: invite.email,
    subject: `You're invited to join an ATLVS Technologies workspace`,
    html: inviteEmailHtml(session.email, invite.role, acceptUrl),
  });
  if (!sent.ok) return { error: `Email could not be sent: ${sent.error ?? "delivery failed"}` };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.invite.resent",
    targetTable: "invites",
    targetId: id,
    metadata: { email: invite.email },
  });

  revalidatePath("/studio/people/invites");
  return { ok: true };
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

  revalidatePath("/studio/people/invites");
  return { ok: true };
}
