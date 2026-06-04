"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { emitAudit } from "@/lib/audit";
import { PLATFORM_ROLES } from "@/lib/supabase/types";

const Schema = z.object({
  role: z.enum(PLATFORM_ROLES),
  is_developer: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});

export type State = { error?: string } | null;

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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
  if (error) return { error: error.message };
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

  revalidatePath(`/console/people/${userId}`);
  revalidatePath("/console/people");
  redirect(`/console/people/${userId}`);
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

  // SOFT delete (set deleted_at) rather than hard delete. Hard delete
  // erased the row and lost the offboard timestamp + audit_log
  // target_id references; soft delete preserves the record while
  // immediately revoking access (every session/api-key/calendar.ics/
  // workspace-switch path already filters .is("deleted_at", null)).
  const { data: removed } = await supabase
    .from("memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  // Cascade everything that survives a membership soft-delete and would
  // either resurrect on re-invite OR keep working through alternate
  // channels (chat, push, PATs, AM routing). The pattern is the same as
  // the project_members fix: scope to this org's rows and hard-delete /
  // revoke. We DON'T touch the user's other-org data — only this org's
  // surfaces.
  //
  // RLS on these tables is mostly `is_org_member` or `is_org_manager_plus`
  // gated on the row's org_id; the session client suffices for the writes.
  if (removed) {
    // ① project_members — re-invite would silently resurrect per-project
    //    roles. Hard-delete keyed to projects in THIS org.
    const { data: orgProjectIds } = await supabase.from("projects").select("id").eq("org_id", session.orgId);
    const projectIds = ((orgProjectIds ?? []) as Array<{ id: string }>).map((p) => p.id);
    if (projectIds.length > 0) {
      await supabase.from("project_members").delete().eq("user_id", userId).in("project_id", projectIds);
    }

    // ② api_keys — PATs minted by the offboarded user in this org. The
    //    verifyApiKey membership join already rejects them while the
    //    membership is soft-deleted, but a re-invite restores them; the
    //    deliberate offboard intent is lost. Explicit revoke captures the
    //    decision permanently.
    await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("created_by", userId)
      .eq("org_id", session.orgId)
      .is("revoked_at", null);

    // ③ account_manager_assignments — the user is either a portal_user
    //    or a manager_user on some assignments in this org. Deactivate
    //    (not hard-delete) so the chat_room thread history is preserved
    //    on the chat_room_id pointer.
    await supabase
      .from("account_manager_assignments")
      .update({ active: false })
      .eq("org_id", session.orgId)
      .or(`portal_user_id.eq.${userId},manager_user_id.eq.${userId}`)
      .eq("active", true);

    // ④ chat_room_members — drop the offboarded user from every chat
    //    room owned by this org. Cross-org rooms (portal threads to
    //    other orgs) are untouched.
    const { data: orgRoomIds } = await supabase.from("chat_rooms").select("id").eq("org_id", session.orgId);
    const roomIds = ((orgRoomIds ?? []) as Array<{ id: string }>).map((r) => r.id);
    if (roomIds.length > 0) {
      await supabase.from("chat_room_members").delete().eq("user_id", userId).in("room_id", roomIds);
    }

    // ⑤ push_subscriptions — only safe to disable if the user has no
    //    OTHER active org membership; otherwise they'd lose pushes from
    //    their other workspaces. Check first.
    const { data: otherMemberships } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", userId)
      .is("deleted_at", null);
    if (!otherMemberships || otherMemberships.length === 0) {
      await supabase
        .from("push_subscriptions")
        .update({ disabled_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("disabled_at", null);
    }
  }

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

  revalidatePath("/console/people");
  redirect("/console/people");
}
