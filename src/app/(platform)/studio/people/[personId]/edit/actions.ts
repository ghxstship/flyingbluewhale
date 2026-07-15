"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { offboardMembershipInOrg } from "@/lib/db/offboard";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { emitAudit } from "@/lib/audit";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  role: z.enum(PLATFORM_ROLES),
  is_developer: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updatePerson(userId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Role + is_developer are owner/admin-only fields. RLS gates the
  // membership table write, but a server action MUST also gate at the
  // app layer — otherwise a non-admin who bypasses RLS via any future
  // policy regression could escalate to owner with a single POST.
  if (!isAdmin(session)) return { error: "Only owners and admins can change a member's role" };
  // Reject self-edits — admins can't change their own role here; the
  // owner-transfer / leave-org flows have their own surfaces with
  // explicit confirmation. Without this, the last owner could
  // accidentally demote themselves and lock the org out of admin.
  if (userId === session.userId) return { error: "Use the leave-org flow to change your own role" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Read the row we're about to change so we know the prior role (for the
  // last-owner guard + audit metadata).
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  if (!expectedUpdatedAt) return { error: STALE_ROW_MESSAGE };
  const { data: prior } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const priorRole = (prior as { role: string } | null)?.role ?? null;

  // Last-owner guard: refuse to demote the only remaining owner. Without
  // this, an admin can leave the org with zero owners — owner is the only
  // role that can change billing + transfer ownership, so the org bricks
  // until manual DB intervention. The self-edit guard above stops the
  // last owner from demoting themselves; this stops the *other* admin
  // from doing it.
  if (priorRole === "owner" && parsed.data.role !== "owner") {
    const { count: ownerCount } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("role", "owner")
      .is("deleted_at", null);
    if ((ownerCount ?? 0) <= 1) {
      return { error: "Refusing to demote the only owner. Promote someone to owner first." };
    }
  }

  // Sea Trial FINDING-022: optimistic concurrency.
  // .is("deleted_at", null) — refuse to update a soft-deleted membership.
  const { data, error } = await supabase
    .from("memberships")
    .update({
      role: parsed.data.role,
      is_developer: parsed.data.is_developer,
    })
    .eq("user_id", userId)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data) return { error: STALE_ROW_MESSAGE };

  // Role changes are the most security-sensitive console write; emit
  // an audit row explicitly so the compliance trail captures who
  // changed whose role and from what.
  if (priorRole !== parsed.data.role) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.role.changed",
      targetTable: "memberships",
      targetId: userId,
      metadata: { from: priorRole, to: parsed.data.role, is_developer: parsed.data.is_developer },
    });
  }

  revalidatePath(`/studio/people/${userId}`);
  revalidatePath("/studio/people");
  redirect(`/studio/people/${userId}`);
}

export async function removePerson(userId: string): Promise<void> {
  const session = await requireSession();
  // Same gate as updatePerson — offboarding is destructive enough that
  // it must remain owner/admin-only at the app layer, not just RLS.
  if (!isAdmin(session)) return;
  // Refuse self-removal — same rationale as updatePerson. The leave-org
  // flow handles voluntary departure (with owner-handoff requirements).
  if (userId === session.userId) return;
  const supabase = await createClient();

  // Last-owner guard: don't soft-delete the only remaining owner. Mirror
  // of the guard in updatePerson — silently no-ops rather than throwing
  // so the existing form (which doesn't surface action errors) doesn't
  // break, but the row stays put.
  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if ((target as { role: string } | null)?.role === "owner") {
    const { count: ownerCount } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("role", "owner")
      .is("deleted_at", null);
    if ((ownerCount ?? 0) <= 1) return;
  }

  // Soft-delete the membership + cascade every alternate-channel surface
  // (project roles, PATs, chat, push, AM routing), scoped to this org. Shared
  // with the self-departure `leaveOrg` flow — see offboardMembershipInOrg.
  //
  // The teardown elevates itself (see offboardMembershipInOrg) — this call site
  // used to hand it the admin's user client, which silently under-performed the
  // cascade: RLS scoped each org-wide sweep to what the ADMIN could see rather
  // than what the ORG has, so the departing user kept their chat room
  // memberships and, with them, live read access to org threads.
  //
  // The decision stays here on the caller's session: the isAdmin gate, the
  // self-removal refusal, and the last-owner guard above.
  //
  // No service-key pre-check: this action returns void (it is bound straight to
  // a form), so it has nowhere to put a friendly message, and the teardown
  // throws on a missing key by design. A half-offboard must not look like a
  // success — the other guards here no-op silently because a no-op leaves the
  // member correctly in place; this one would leave them partly removed.
  const removed = await offboardMembershipInOrg(userId, session.orgId);

  // Explicit audit emit — offboard symmetry with /auth/resolve emitting
  // `auth.login`. Compliance reviewers want both endpoints visible.
  if (removed) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.member.removed",
      targetTable: "memberships",
      targetId: userId,
    });
  }

  revalidatePath("/studio/people");
  redirect("/studio/people");
}
