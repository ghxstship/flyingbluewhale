"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * Save the editable identity/contact fields of the crew profile. Writes:
 *   • `users.name`              — display name (the canonical identity row)
 *   • `user_profiles`           — tagline + bio (public crew profile, upserted)
 * Emergency contacts / dietary / uniform / certs from the kit profile editor
 * have no first-class columns yet, so they round-trip through
 * `user_profiles.links` (a jsonb bag) — see saveProfileExtras below.
 */
const ProfileInput = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  tagline: z.string().max(160).optional().default(""),
  bio: z.string().max(2000).optional().default(""),
});

export async function saveProfile(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ProfileInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return {
      error: "Please fix the errors below.",
      fieldErrors,
      values: Object.fromEntries(fd) as Record<string, string>,
    };
  }
  const { name, tagline, bio } = parsed.data;
  const supabase = await createClient();

  const { error: uErr } = await supabase
    .from("users")
    .update({ name })
    .eq("id", session.userId);
  if (uErr) return { error: uErr.message };

  const { error: pErr } = await (
    supabase.from("user_profiles") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert(
    { user_id: session.userId, display_name: name, tagline, bio },
    { onConflict: "user_id" },
  );
  if (pErr) return { error: pErr.message };

  revalidatePath("/m/settings");
  return { ok: true };
}

/**
 * PAUSE the account — hides the user from scheduling/assignment pickers but
 * preserves all records and access.
 *
 * Data contract: there is no first-class `account_state` column on `users`
 * yet, so this stub writes `user_preferences.ui_state.account = "paused"`. When
 * a real availability/lifecycle column lands (e.g. `crew_members.availability_open`
 * org-wide, or a `users.account_state`), repoint this to flip that and exclude
 * paused users from the scheduling roster query. For now it records intent and
 * the caller toasts.
 */
export async function pauseAccount(): Promise<State> {
  return setAccountState("paused");
}

/**
 * ARCHIVE the account — revokes access but preserves records.
 *
 * Data contract: archive is a soft, reversible-by-admin state. The honest
 * primitive that exists today is `users.deleted_at` (soft delete) which the
 * data layer already filters on — but flipping it from a self-serve mobile
 * toggle would lock the user out immediately and is destructive, so this stub
 * deliberately records INTENT only (`ui_state.account = "archive_requested"`)
 * rather than setting `deleted_at`. Wire the real revoke (set `deleted_at`,
 * revoke memberships) behind an admin confirmation step in a later task.
 */
export async function archiveAccount(): Promise<State> {
  return setAccountState("archive_requested");
}

async function setAccountState(value: "paused" | "archive_requested" | "active"): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("ui_state")
    .eq("user_id", session.userId)
    .maybeSingle();
  const ui = (existing?.ui_state as Record<string, unknown> | null) ?? {};
  const nextUi = { ...ui, account: value } as Json;
  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: session.userId, ui_state: nextUi }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/m/settings");
  return { ok: true };
}
