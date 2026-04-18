import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
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

  // Soft-delete user with 30-day grace
  const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: upErr } = await supabase
    .from("users")
    .update({
      deleted_at: purgeAt,
      // Scrub PII immediately
      email: `deleted-${userId}@deleted.invalid`,
      name: "Deleted user",
      avatar_url: null,
    })
    .eq("id", userId);

  if (upErr) {
    return apiError("internal", "Couldn't process deletion request");
  }

  // Revoke memberships immediately
  const nowIso = new Date().toISOString();
  await supabase.from("memberships").update({ deleted_at: nowIso }).eq("user_id", userId);

  // Sign the user out
  await supabase.auth.signOut();

  return apiOk({
    message: "Account scheduled for deletion in 30 days. Sign in within that window to cancel.",
    purgeAt,
  });
}
