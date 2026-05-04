"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import type { FormState } from "@/components/FormShell";

const ADMIN_ROLES: ReadonlyArray<"owner" | "admin" | "developer"> = ["owner", "admin", "developer"];

function isAdmin(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

const CreateSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["owner", "admin", "controller", "collaborator", "contractor", "crew", "client", "viewer", "community"]),
});

export async function createInviteAction(_: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session.role)) return { error: "Only owners, admins, and developers can invite." };

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

  // Fire-and-forget the invitation email; failure to send doesn't undo the
  // row — admin can copy the link from the list view if email delivery is
  // down. The table is the source of truth.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const acceptUrl = `${origin}/accept-invite/${invite.token}`;
  void sendEmail({
    to: parsed.data.email,
    subject: `You're invited to join a LYTEHAUS Technologies workspace`,
    html: `
      <div style="font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <p style="color:#666;font-size:12px;letter-spacing:.15em;text-transform:uppercase;font-family:'Share Tech Mono','Courier New',monospace">Invitation</p>
        <h1 style="font-family:'Anton','Helvetica Neue',Arial,sans-serif;font-size:36px;margin:12px 0 8px;letter-spacing:-0.02em;text-transform:uppercase">You've been invited</h1>
        <p style="color:#444;font-size:14px">${session.email} invited you to join their workspace as ${parsed.data.role}.</p>
        <p><a href="${acceptUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 24px;border:0;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:.1em">Accept invitation</a></p>
        <p style="color:#999;font-size:12px;margin-top:24px;font-family:'Share Tech Mono','Courier New',monospace">Link expires in 7 days. If the button doesn't work:<br/><code>${acceptUrl}</code></p>
      </div>`,
  });

  revalidatePath("/console/people/invites");
  redirect("/console/people/invites");
}

export async function revokeInviteAction(id: string): Promise<FormState> {
  const session = await requireSession();
  if (!isAdmin(session.role)) return { error: "Only owners, admins, and developers can revoke." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath("/console/people/invites");
  return { ok: true };
}
