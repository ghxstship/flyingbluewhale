"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

// The account lifecycle (pause / resume / archive-request) moved to its own
// dedicated surface — see `src/app/(mobile)/m/settings/account/actions.ts`.
// SettingsView now links to /m/settings/account instead of toggling inline.
