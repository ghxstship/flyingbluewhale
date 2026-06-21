"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AccountActionState = { error?: string; ok?: true } | null;

/**
 * The COMPVSS account lifecycle, persisted to the real `user_account_status`
 * table (1:1 on user_id; RLS keyed on auth.uid()). LDP: `account_state` is the
 * cyclical operational lifecycle — `active` | `paused` | `archived`.
 *
 * - PAUSE is reversible (hides the user from scheduling/rosters, mutes
 *   notifications). `paused_until` / `pause_reason` are optional. resumeAccount
 *   flips back to `active` and clears those.
 * - ARCHIVE is a self-serve REQUEST: this surface sets `account_state =
 *   'archived'` + `archive_requested_at` but NEVER hard-revokes the caller's own
 *   access. A privileged admin flow completes the revoke + anonymization (see
 *   requestArchive's contract comment).
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
 * REQUEST ARCHIVE — records intent (account_state='archived' +
 * `archive_requested_at`). This surface deliberately does NOT revoke the
 * caller's own access or anonymize their data.
 *
 * Full archive contract (out of scope here, handled by a later admin flow):
 *   On admin confirmation, a privileged/server flow:
 *     1. Sets `users.deleted_at` (soft delete; the data layer already filters
 *        on it, which revokes app access) and revokes memberships; stamps
 *        `user_account_status.archived_at`.
 *     2. Anonymizes personal profile fields (name → "Archived Member"; clears
 *        email/phone/avatar/bio on `users` + `user_profiles`, and the
 *        sensitive 3NF rows — travel/emergency_contacts).
 *     3. PRESERVES operational records — shifts, time logs, incidents,
 *        approvals, asset chain-of-custody — for legal/compliance retention.
 *   None of that destructive work happens from this self-serve mobile action.
 */
export async function requestArchive(): Promise<AccountActionState> {
  return setAccountState({
    account_state: "archived",
    archive_requested_at: new Date().toISOString(),
  });
}
