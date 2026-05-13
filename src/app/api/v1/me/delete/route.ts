import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { emitAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Account deletion request — soft-delete with a 30-day grace window.
 *
 * - Sets users.deleted_at = now + 30 days (sentinel future date interpreted by purge worker)
 * - Sets memberships.deleted_at = now (revokes access immediately)
 * - Anonymizes email + name on `users` to scrub PII from active reads
 * - The actual purge runs as a Supabase Edge Function on a daily cron
 *
 * Re-activation: if the user signs in within 30 days, undelete via /api/v1/me/restore (TBD).
 */

const Schema = z.object({
  // Confirm with the typed phrase to match Stripe / Linear pattern
  confirmPhrase: z.literal("delete my account"),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Schema);
  if (parsed instanceof NextResponse) return parsed;

  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return apiError("unauthorized", "Sign in to delete your account");
  }
  const userId = userData.user.id;

  // Soft-delete user with 30-day grace. .is(deleted_at, null) makes
  // a re-submit idempotent — without it a double-POST would re-stamp
  // deleted_at and push the purge clock forward by another 30 days,
  // and would re-scrub already-scrubbed PII (no-op but noisy).
  const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: scrubbed, error: upErr } = await supabase
    .from("users")
    .update({
      deleted_at: purgeAt,
      // Scrub PII immediately
      email: `deleted-${userId}@deleted.invalid`,
      name: "Deleted user",
      avatar_url: null,
    })
    .eq("id", userId)
    .is("deleted_at", null)
    .select("id");

  if (upErr) {
    return apiError("internal", "Couldn't process deletion request");
  }
  // No-op = already deleted. Sign the user out and return the
  // idempotent success — they may have hit retry; we shouldn't
  // confuse them with a non-deterministic error.
  if (!scrubbed || scrubbed.length === 0) {
    await supabase.auth.signOut();
    return apiOk({
      message: "Account already scheduled for deletion. Sign in within the grace window to cancel.",
      purgeAt: null,
      alreadyRequested: true,
    });
  }

  // Revoke memberships immediately. Same idempotency guard — only
  // soft-delete rows that aren't already deleted, preserving the
  // original offboard timestamps.
  const nowIso = new Date().toISOString();
  await supabase.from("memberships").update({ deleted_at: nowIso }).eq("user_id", userId).is("deleted_at", null);

  // H2-07 — audit the deletion request BEFORE we sign out so the
  // actor is still on the session used by emitAudit().
  const session = await getSession();
  if (session?.orgId) {
    await emitAudit({
      actorId: userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.delete_requested",
      metadata: { purge_at: purgeAt },
      requestId: req.headers.get("x-request-id"),
    });
    // Broadcast webhook-only event + queue confirmation email.
    const { notify } = await import("@/lib/notify");
    await notify({
      orgId: session.orgId,
      userId: null,
      eventType: "account.deletion_requested",
      title: `Account deletion requested`,
      body: session.email ?? undefined,
      data: { userId, purgeAt },
    });
    if (session.email) {
      const { createServiceClient, isServiceClientAvailable } = await import("@/lib/supabase/server");
      if (!isServiceClientAvailable()) {
        return apiError(
          "service_unavailable",
          "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
        );
      }
      const svc = createServiceClient();
      await (
        svc.from("job_queue") as unknown as {
          insert: (p: Record<string, unknown>) => Promise<unknown>;
        }
      ).insert({
        type: "email.send",
        org_id: session.orgId,
        payload: {
          to: session.email,
          subject: "Account deletion requested — 30-day grace",
          html: `<p>Your ATLVS Technologies account is scheduled for permanent deletion on <strong>${new Date(purgeAt).toLocaleDateString()}</strong>.</p><p>Sign in within that window to cancel the deletion. After 30 days all your data will be unrecoverable.</p>`,
        },
      });
    }
  }

  // Sign the user out
  await supabase.auth.signOut();

  return apiOk({
    message: "Account scheduled for deletion in 30 days. Sign in within that window to cancel.",
    purgeAt,
  });
}
