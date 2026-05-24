"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(120),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

export async function updateProfile(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  // .is("deleted_at", null) — refuse to update a soft-deleted user's
  // profile. /api/v1/me/delete sets users.deleted_at to a 30-day-out
  // purge date AND scrubs the row to "Deleted user" / "deleted-*@*"
  // for PII removal; a concurrent profile save would otherwise re-
  // populate the scrubbed fields and silently undo the GDPR scrub.
  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", session.userId)
    .is("deleted_at", null);
  if (error) return { error: error.message };
  revalidatePath("/me/profile");
  revalidatePath("/me");
  return { ok: true };
}

// Parse the textarea links field into the JSONB shape user_profiles
// stores. Each line is either `Label|URL` or just a bare `URL`. Bad
// URLs are silently dropped — we never want a malformed link to block
// a save of legitimate edits to other fields.
function parseLinks(raw: string | undefined): Array<{ label: string; url: string }> {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const pipe = line.indexOf("|");
      const label = pipe >= 0 ? line.slice(0, pipe).trim() : "";
      const url = pipe >= 0 ? line.slice(pipe + 1).trim() : line;
      try {
        const u = new URL(url);
        return { label: label || u.host, url: u.toString() };
      } catch {
        return null;
      }
    })
    .filter((v): v is { label: string; url: string } => !!v)
    .slice(0, 12);
}

const PublicProfileSchema = z.object({
  public_handle: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-z0-9_-]{3,64}$|^$/i, "3-64 chars, letters/digits/_/- only")
    .optional()
    .or(z.literal("")),
  display_name: z.string().trim().max(120).optional().or(z.literal("")),
  tagline: z.string().trim().max(140).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
  hero_url: z.string().url().max(500).optional().or(z.literal("")),
  links: z.string().max(2000).optional().or(z.literal("")),
  is_public: z.coerce.boolean().optional(),
  available_for_work: z.coerce.boolean().optional(),
});

export async function updatePublicProfile(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = PublicProfileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const handle = parsed.data.public_handle?.trim().toLowerCase() || null;

  // user_profiles PK is user_id — upsert on it. RLS policy
  // user_profiles_self_rw gates writes to auth.uid() = user_id so the
  // row is only ever the caller's own.
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: session.userId,
      public_handle: handle,
      display_name: parsed.data.display_name?.trim() || null,
      tagline: parsed.data.tagline?.trim() || null,
      bio: parsed.data.bio?.trim() || null,
      avatar_url: parsed.data.avatar_url || null,
      hero_url: parsed.data.hero_url || null,
      links: parseLinks(parsed.data.links),
      is_public: parsed.data.is_public ?? false,
      available_for_work: parsed.data.available_for_work ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    // Unique-violation on public_handle surfaces clearly to the user.
    if (error.message.includes("user_profiles_handle_unique")) {
      return { error: "That handle is already taken — try a different one." };
    }
    return { error: error.message };
  }

  revalidatePath("/me/profile");
  revalidatePath("/me");
  if (handle) revalidatePath(`/marketplace/talent/${handle}`);
  return { ok: true };
}
