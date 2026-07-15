import "server-only";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

/** Grace window before the purge worker permanently removes an archived account. */
export const ACCOUNT_GRACE_DAYS = 30;

export type ArchiveResult =
  | { ok: true; purgeAt: string; alreadyRequested?: false }
  | { ok: true; purgeAt: null; alreadyRequested: true }
  | { ok: false; error: "internal" | "service_unavailable"; message: string };

/**
 * THE account archive contract — shared by the web self-delete API
 * (/api/v1/me/delete) and the COMPVSS field action (/m/settings/account
 * requestArchive), which previously only recorded intent and never archived.
 *
 *   1. Soft-delete `users` with a 30-day grace (`deleted_at = now + 30d`, a
 *      sentinel the purge worker interprets) and scrub PII immediately.
 *   2. Revoke every membership so app access dies on the next request (every
 *      resolution path filters `deleted_at IS NULL`).
 *   3. PRESERVE operational records (shifts, time logs, incidents, approvals,
 *      asset chain-of-custody) for legal/compliance retention.
 *
 * Reversible inside the grace window via /api/v1/me/restore. Idempotent — a
 * re-request no-ops rather than pushing the purge clock forward or re-scrubbing.
 *
 * Service-role: since migration 0063 the RLS helpers filter `deleted_at IS NULL`,
 * so the session client cannot revoke the memberships of a user it is in the
 * middle of soft-deleting. Self-offboard is a privileged anti-bricking flow, so
 * the membership revoke runs on the service client. We check for it BEFORE any
 * mutation — otherwise a missing key would leave the account scrubbed but its
 * memberships live (access retained on a PII-scrubbed account).
 */
export async function archiveOwnAccount(userId: string): Promise<ArchiveResult> {
  if (!isServiceClientAvailable()) {
    return {
      ok: false,
      error: "service_unavailable",
      message: "Account archival requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    };
  }

  const supabase = await createClient();
  const purgeAt = new Date(Date.now() + ACCOUNT_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // `.is("deleted_at", null)` makes a re-submit idempotent — without it a
  // double-request would push the purge clock forward another 30 days.
  const { data: scrubbed, error: upErr } = await supabase
    .from("users")
    .update({
      deleted_at: purgeAt,
      email: `deleted-${userId}@deleted.invalid`,
      name: "Deleted user",
      avatar_url: null,
    })
    .eq("id", userId)
    .is("deleted_at", null)
    .select("id");
  if (upErr) return { ok: false, error: "internal", message: "Couldn't process the archive request" };

  // No-op = already archived. Idempotent success rather than a confusing error.
  if (!scrubbed || scrubbed.length === 0) return { ok: true, purgeAt: null, alreadyRequested: true };

  const svc = createServiceClient();
  await svc
    .from("memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("deleted_at", null);

  return { ok: true, purgeAt };
}
