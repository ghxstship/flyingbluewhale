"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type AccountActionState = { error?: string; ok?: true } | null;

/**
 * The COMPVSS account lifecycle, modeled as intent flags on
 * `user_preferences.ui_state.account` — there is intentionally NO
 * `account_state` column in the DB (BUILD.md §5). Shape:
 *
 *   ui_state.account = {
 *     paused?: boolean;
 *     paused_at?: ISO string;          // when the (reversible) pause began
 *     archive_requested_at?: ISO string; // self-serve archive REQUEST
 *   }
 *
 * - PAUSE is fully reversible by the user (hides them from scheduling/rosters,
 *   mutes notifications). resumeAccount clears the flag.
 * - ARCHIVE is a REQUEST only: this surface can never revoke the user's own
 *   access. See requestArchive's contract comment for the admin-side follow-up.
 */

type AccountUiState = {
  paused?: boolean;
  paused_at?: string;
  archive_requested_at?: string;
};

async function readAccountState(): Promise<{
  userId: string;
  ui: Record<string, unknown>;
  account: AccountUiState;
}> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("ui_state")
    .eq("user_id", session.userId)
    .maybeSingle();
  const ui = (existing?.ui_state as Record<string, unknown> | null) ?? {};
  const account = ((ui.account as AccountUiState | undefined) ?? {}) as AccountUiState;
  return { userId: session.userId, ui, account };
}

async function writeAccountState(
  userId: string,
  ui: Record<string, unknown>,
  account: AccountUiState,
): Promise<AccountActionState> {
  const supabase = await createClient();
  const nextUi = { ...ui, account } as Json;
  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: userId, ui_state: nextUi }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/m/settings/account");
  revalidatePath("/m/settings");
  return { ok: true };
}

/**
 * PAUSE — reversible. Hides the user from scheduling/rosters and mutes alerts.
 * Records `paused: true` + `paused_at`; preserves everything else. When a real
 * availability/lifecycle column lands, repoint the roster query to also exclude
 * `ui_state.account.paused` users.
 */
export async function pauseAccount(): Promise<AccountActionState> {
  const { userId, ui, account } = await readAccountState();
  return writeAccountState(userId, ui, {
    ...account,
    paused: true,
    paused_at: new Date().toISOString(),
  });
}

/**
 * RESUME — the reverse of pause. Clears the pause flag + timestamp so the user
 * reappears in scheduling and notifications resume.
 */
export async function resumeAccount(): Promise<AccountActionState> {
  const { userId, ui, account } = await readAccountState();
  const next = { ...account };
  delete next.paused;
  delete next.paused_at;
  return writeAccountState(userId, ui, next);
}

/**
 * REQUEST ARCHIVE — records INTENT only (`archive_requested_at`). This surface
 * deliberately does NOT revoke the caller's own access.
 *
 * Full archive contract (out of scope here, handled by a later admin flow):
 *   On admin confirmation, a privileged/server flow:
 *     1. Sets `users.deleted_at` (soft delete; the data layer already filters
 *        on it, which revokes app access) and revokes memberships.
 *     2. Anonymizes personal profile fields (name → "Archived Member",
 *        clears email/phone/avatar/bio on `users` + `user_profiles`).
 *     3. PRESERVES operational records — shifts, time logs, incidents,
 *        approvals, asset chain-of-custody — for legal/compliance retention.
 *   None of that destructive work happens from this self-serve mobile action.
 */
export async function requestArchive(): Promise<AccountActionState> {
  const { userId, ui, account } = await readAccountState();
  return writeAccountState(userId, ui, {
    ...account,
    archive_requested_at: new Date().toISOString(),
  });
}
