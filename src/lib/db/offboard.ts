import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Soft-delete a user's membership in one org and cascade every surface that
 * survives a membership soft-delete and would otherwise resurrect on re-invite
 * or keep working through an alternate channel (per-project roles, PATs, chat,
 * push, AM routing). Scoped strictly to `orgId` — the user's data in OTHER orgs
 * is untouched. Access dies on the next request because every session / api-key
 * / calendar / workspace-switch path already filters `.is("deleted_at", null)`.
 *
 * The SSOT for both admin-driven removal (`removePerson`) and self-departure
 * (`leaveOrg`). Callers own the authorization gate, the last-owner guard, and
 * the audit emit (the action label differs); this only performs the teardown.
 *
 * @returns true if a live membership was found and soft-deleted, else false.
 */
export async function offboardMembershipInOrg(supabase: Client, userId: string, orgId: string): Promise<boolean> {
  // SOFT delete (preserve the row for the offboard timestamp + audit_log
  // target_id references) — access is revoked immediately regardless.
  const { error: memErr, data: removed } = await supabase
    .from("memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (memErr) throw new Error(`Could not update membership: ${memErr.message}`);
  if (!removed) return false;

  // ① project_members — re-invite would silently resurrect per-project roles.
  // soft-delete-exempt: offboarding must purge the user from ALL org projects, incl. archived ones
  const { data: orgProjectIds } = await supabase.from("projects").select("id").eq("org_id", orgId);
  const projectIds = ((orgProjectIds ?? []) as Array<{ id: string }>).map((p) => p.id);
  if (projectIds.length > 0) {
    const { error } = await supabase.from("project_members").delete().eq("user_id", userId).in("project_id", projectIds);
    if (error) throw new Error(`Could not delete project member: ${error.message}`);
  }

  // ② api_keys — PATs minted by this user in this org. Explicit revoke captures
  //    the offboard decision permanently (a re-invite would otherwise restore).
  const { error: keyErr } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("created_by", userId)
    .eq("org_id", orgId)
    .is("revoked_at", null);
  if (keyErr) throw new Error(`Could not update api key: ${keyErr.message}`);

  // ③ account_manager_assignments — deactivate (not delete) so chat history on
  //    the chat_room_id pointer is preserved.
  const { error: amErr } = await supabase
    .from("account_manager_assignments")
    .update({ active: false })
    .eq("org_id", orgId)
    .or(`portal_user_id.eq.${userId},manager_user_id.eq.${userId}`)
    .eq("active", true);
  if (amErr) throw new Error(`Could not update account manager assignment: ${amErr.message}`);

  // ④ chat_room_members — drop the user from every room owned by this org.
  // soft-delete-exempt: offboarding must drop the user from ALL org rooms, incl. archived ones
  const { data: orgRoomIds } = await supabase.from("chat_rooms").select("id").eq("org_id", orgId);
  const roomIds = ((orgRoomIds ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (roomIds.length > 0) {
    const { error } = await supabase.from("chat_room_members").delete().eq("user_id", userId).in("room_id", roomIds);
    if (error) throw new Error(`Could not delete chat room member: ${error.message}`);
  }

  // ⑤ push_subscriptions — only disable if the user has NO other active
  //    membership; otherwise they'd lose pushes from their other workspaces.
  const { data: otherMemberships } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .is("deleted_at", null);
  if (!otherMemberships || otherMemberships.length === 0) {
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ disabled_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("disabled_at", null);
    if (error) throw new Error(`Could not update push subscription: ${error.message}`);
  }

  return true;
}
