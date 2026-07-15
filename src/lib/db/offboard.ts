import "server-only";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

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
 * ## Why this builds its own client instead of taking one
 *
 * The teardown MUST run elevated, and it used to accept whatever client the
 * caller handed it. `leaveOrg` correctly passed a service client (a member
 * cannot soft-delete their own membership under `memberships_update_admin`);
 * `removePerson` passed the admin's user client, and the difference was
 * invisible — every step still "succeeded", it just did less.
 *
 * The failure mode is silent by construction. Each cascade step sweeps by org
 * (`.eq("org_id", orgId)` → `.in(...)`), so under RLS it clears the
 * intersection of "what the org has" and "what this caller can see", then
 * reports success. Step ④ was the live case: chat RLS only shows rooms you are
 * IN (ADR-0008 Amendment 5), an org admin is typically in none, so `roomIds`
 * came back empty, the delete was skipped, and the offboarded user kept their
 * `chat_room_members` rows. `chat_messages` gates on room membership alone with
 * no org check, so those rows are live read access — the exact alternate
 * channel this function exists to close.
 *
 * A parameter that is only ever correct with one argument is a footgun, so it
 * is gone: the elevation is now a property of the teardown rather than
 * something each call site has to remember. Callers still own the DECISION
 * (gate, last-owner guard, audit) on their own session — that has not moved.
 *
 * @throws if the service-role key is absent — half-offboarding someone is worse
 *   than failing loudly. Pre-check with `isServiceClientAvailable()` if you need
 *   to surface a friendly message instead.
 * @returns true if a live membership was found and soft-deleted, else false.
 */
export async function offboardMembershipInOrg(userId: string, orgId: string): Promise<boolean> {
  if (!isServiceClientAvailable()) {
    throw new Error("Offboarding requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.");
  }
  const supabase = createServiceClient();
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
