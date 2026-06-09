import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { emitAudit } from "@/lib/audit";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

/**
 * Cancel a pending account deletion (within the 30-day grace window).
 *
 * Pairs with `/api/v1/me/delete`. The deletion route soft-sets
 * `users.deleted_at = now + 30 days` and soft-deletes every membership for
 * the user with `deleted_at = now`. This route undoes both:
 *
 *  - Clears `users.deleted_at`
 *  - Restores `users.email` + `users.name` from `auth.users` (auth.users is
 *    untouched by /me/delete, so the original email lives on there)
 *  - Clears `memberships.deleted_at` for the memberships that were
 *    deleted as part of this request — identified by their timestamp
 *    falling within a ±5s window of the delete-request time (purgeAt - 30d).
 *    Memberships removed for unrelated reasons (admin offboard, prior
 *    /me/delete attempt) are NOT restored.
 *
 * No body required — the action is the request. The user MUST be
 * signed in; the delete route signs them out but the grace-window
 * design assumes they sign back in to recover.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return apiError("unauthorized", "Sign in to restore your account");
  }
  const userId = userData.user.id;
  const authEmail = userData.user.email ?? null;
  const authName =
    (userData.user.user_metadata?.name as string | undefined) ??
    (userData.user.user_metadata?.full_name as string | undefined) ??
    null;

  // Read the soft-deleted profile.
  const { data: existing } = await supabase.from("users").select("id, deleted_at").eq("id", userId).maybeSingle();
  if (!existing) {
    return apiError("not_found", "User profile not found");
  }
  const deletedAt = (existing as { deleted_at: string | null }).deleted_at;
  if (!deletedAt) {
    return apiOk({ message: "Account is not scheduled for deletion. Nothing to restore.", restored: false });
  }
  const purgeAtMs = new Date(deletedAt).getTime();
  if (Number.isNaN(purgeAtMs)) {
    return apiError("internal", "Invalid deletion timestamp on record");
  }
  if (purgeAtMs <= Date.now()) {
    // Grace window expired — the purge worker should have run; either way
    // restoration is no longer safe (cascade reaper may have already taken
    // referenced rows). Surface a clear 409 so the caller knows it's a
    // hard delete now.
    return apiError("conflict", "Grace window has expired — account cannot be restored");
  }

  // Restore the profile. `email` + `name` come from auth.users which the
  // deletion route never scrubs — that's the canonical identity.
  if (!authEmail) {
    return apiError("internal", "No email on auth identity to restore");
  }

  // Service-role required: the user's session is, by definition, in a
  // soft-deleted state at this point — RLS helpers (post-0063) filter
  // `deleted_at IS NULL`, so the session client cannot touch their own
  // memberships any more. /me/restore is an explicit anti-bricking
  // self-rescue endpoint; the privileged write is intentional.
  if (!isServiceClientAvailable()) {
    return apiError(
      "service_unavailable",
      "Account restore requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    );
  }
  const svc = createServiceClient();

  const { error: profErr } = await svc
    .from("users")
    .update({ deleted_at: null, email: authEmail, name: authName ?? "User" })
    .eq("id", userId);
  if (profErr) {
    return apiError("internal", `Couldn't restore profile: ${profErr.message}`);
  }

  // Restore memberships soft-deleted as part of this delete request.
  // Window: ±5 seconds around (purgeAt - 30 days). Anything outside is
  // an unrelated offboard and must stay deleted.
  const requestMs = purgeAtMs - 30 * 24 * 60 * 60 * 1000;
  const windowMs = 5_000;
  const lower = new Date(requestMs - windowMs).toISOString();
  const upper = new Date(requestMs + windowMs).toISOString();
  const { data: restored } = await svc
    .from("memberships")
    .update({ deleted_at: null })
    .eq("user_id", userId)
    .gte("deleted_at", lower)
    .lte("deleted_at", upper)
    .select("org_id");
  const restoredOrgIds = (restored ?? []).map((r) => (r as { org_id: string }).org_id);

  // Audit — one event per org so each org's compliance trail has its own row.
  for (const orgId of restoredOrgIds) {
    await emitAudit({
      actorId: userId,
      orgId,
      actorEmail: authEmail,
      action: "auth.delete_cancelled",
      targetTable: "users",
      targetId: userId,
      requestId: req.headers.get("x-request-id"),
    });
  }

  return apiOk({
    message: "Account restored.",
    restored: true,
    restoredOrgIds,
  });
}
