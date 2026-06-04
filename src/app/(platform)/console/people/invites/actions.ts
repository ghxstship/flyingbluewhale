"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { urlFor } from "@/lib/urls";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import type { FormState } from "@/components/FormShell";

const CreateSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(PLATFORM_ROLES),
});

export async function createInviteAction(_: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only owners and admins can invite." };

  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      org_id: session.orgId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_by: session.userId,
    })
    .select("token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A pending invite already exists for this email." };
    }
    return { error: error.message };
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
      <div style="font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <p style="color:#5b6472;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace">Invitation</p>
        <h1 style="font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;font-size:30px;font-weight:700;margin:12px 0 8px;letter-spacing:-0.01em">You've been invited</h1>
        <p style="color:#181b23;font-size:14px">${session.email} invited you to join their workspace as ${parsed.data.role}.</p>
        <p><a href="${acceptUrl}" style="display:inline-block;background:#FF2E88;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Accept invitation</a></p>
        <p style="color:#8c95a3;font-size:12px;margin-top:24px;font-family:'Space Mono','Courier New',monospace">Link expires in 7 days. If the button doesn't work:<br/><code>${acceptUrl}</code></p>
      </div>`,
  });

  revalidatePath("/console/people/invites");
  redirect("/console/people/invites");
}

export async function revokeInviteAction(id: string): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only owners and admins can revoke." };

  const supabase = await createClient();
  // Only pending invites can be revoked. Without the .eq("status",
  // "pending") guard, the action would also flip already-accepted or
  // expired invites to "revoked", producing a misleading audit trail
  // (the user is in the org; their invite isn't really revokable).
  const { data, error } = await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a pending invite can be revoked" };

  revalidatePath("/console/people/invites");
  return { ok: true };
}
