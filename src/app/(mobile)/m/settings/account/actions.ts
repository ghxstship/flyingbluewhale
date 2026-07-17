"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { archiveOwnAccount } from "@/lib/db/account-archive";

export type AccountActionState = { error?: string; ok?: true } | null;

/**
 * The COMPVSS account lifecycle, persisted to the real `user_account_status`
 * table (1:1 on user_id; RLS keyed on auth.uid()). LDP: `account_state` is the
 * cyclical operational lifecycle — `active` | `paused` | `archived`.
 *
 * - PAUSE is reversible (hides the user from scheduling/rosters, mutes
 *   notifications). `paused_until` / `pause_reason` are optional. resumeAccount
 *   flips back to `active` and clears those.
 * - ARCHIVE runs the real archive contract (shared with the web self-delete
 *   API) — soft-delete + 30-day grace + PII scrub + membership revoke. See
 *   requestArchive.
 */

const PauseSchema = z.object({
  until: z.string().min(1).optional(),
  reason: z.string().max(280).optional(),
});

/** Upsert account_state onto the 1:1 user_account_status row, preserving
 * onboarded_at / created_at by upserting on user_id. */
async function setAccountState(
  patch: Record<string, unknown>,
): Promise<AccountActionState> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_account_status")
    .upsert({ user_id: session.userId, ...patch }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/m/settings/account");
  revalidatePath("/m/settings");
  return { ok: true };
}

/**
 * PAUSE — reversible. Sets account_state='paused' with optional `paused_until`
 * (ISO/date string) and `pause_reason`.
 */
export async function pauseAccount(input?: { until?: string; reason?: string }): Promise<AccountActionState> {
  const parsed = PauseSchema.safeParse(input ?? {});
  if (!parsed.success) return { error: "Couldn't pause your account." };
  return setAccountState({
    account_state: "paused",
    paused_until: parsed.data.until ?? null,
    pause_reason: parsed.data.reason ?? null,
  });
}

/**
 * RESUME — the reverse of pause. Returns to active and clears the pause window
 * + reason.
 */
export async function resumeAccount(): Promise<AccountActionState> {
  return setAccountState({
    account_state: "active",
    paused_until: null,
    pause_reason: null,
  });
}

/**
 * SIGN OUT EVERYWHERE — revokes every refresh token for the caller
 * (kit-29 account spec: "sessions"). Supabase has no per-device session
 * list for a client, so the honest session control is the global revoke:
 * every device, including this one, is signed out and must log back in.
 */
export async function signOutEverywhere(): Promise<AccountActionState> {
  await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * ARCHIVE — executes the real contract via the shared `archiveOwnAccount()`:
 * soft-delete `users` with a 30-day grace, scrub PII, and revoke every
 * membership so access dies immediately; operational records (shifts, time
 * logs, incidents, approvals, asset chain-of-custody) are preserved for
 * compliance retention. Reversible by signing in within the grace window
 * (/api/v1/me/restore).
 *
 * This previously only recorded intent (`archive_requested_at`) and deferred
 * the destructive work to "a later admin flow" that was never built — so the
 * request went nowhere. It now runs the SAME pipeline as the web self-delete
 * API, making the field surface a first-class archive rather than a dead-end
 * flag (2026-07 lifecycle audit).
 */
export async function requestArchive(): Promise<AccountActionState> {
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const archived = await archiveOwnAccount(session.userId);
  if (!archived.ok) return { error: archived.message };

  // Stamp the lifecycle row directly rather than via setAccountState — that
  // re-runs requireSession(), which no longer resolves once the memberships
  // are revoked. RLS here is `user_id = auth.uid()`, which still holds until
  // we sign out below. `archived_at` records that the archive actually RAN.
  const { error } = await supabase
    .from("user_account_status")
    .upsert(
      { user_id: session.userId, account_state: "archived", archive_requested_at: now, archived_at: now },
      { onConflict: "user_id" },
    );
  if (error) return { error: error.message };

  // Access is already revoked server-side; drop the session so the PWA lands
  // on the onboarding gate instead of a half-authed shell.
  await supabase.auth.signOut();
  revalidatePath("/m/settings/account");
  revalidatePath("/m/settings");
  return { ok: true };
}
