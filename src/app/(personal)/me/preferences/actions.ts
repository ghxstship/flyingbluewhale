"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

// BCP-47 shape: 2–3 char primary tag, optional 4-char script, optional region
// (2-char alpha or 3-digit). Mirrors the DB check constraint added in
// 20260504000005_locale_preferences.sql so a save can't pass the form yet
// fail at the row write.
const BCP47 = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$/;

const Schema = z.object({
  // Mirrors the user_preferences_theme_check Postgres constraint. The
  // previous ["light","dark","system"] enum was a stale relic from before
  // chroma themes; submitting any chroma theme name from the preferences
  // form would 500 with a check_violation. light/dark is the orthogonal
  // `data-mode` attribute, not stored in this column.
  theme: z.enum([
    "bermuda-triangle",
    "glass",
    "brutal",
    "bento",
    "kinetic",
    "copilot",
    "cyber",
    "soft",
    "earthy",
    "system",
  ]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  locale: z.string().regex(BCP47, "Use a BCP-47 tag like 'en' or 'fr-CA'"),
  timezone: z.string().min(1).max(64),
  analytics: z.string().optional(), // "on" if checkbox checked
  marketing: z.string().optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function savePreferencesAction(_: State, fd: FormData): Promise<State> {
  const parsed = Schema.safeParse({
    theme: fd.get("theme"),
    density: fd.get("density"),
    locale: fd.get("locale"),
    timezone: fd.get("timezone"),
    analytics: fd.get("analytics") || undefined,
    marketing: fd.get("marketing") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { error: "Sign in required" };

  const consent: Json = {
    essential: true,
    analytics: parsed.data.analytics === "on",
    marketing: parsed.data.marketing === "on",
  };

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: u.user.id,
      theme: parsed.data.theme,
      density: parsed.data.density,
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
      consent,
    },
    { onConflict: "user_id" },
  );

  if (error) return { error: error.message };
  // Revalidate the whole layout so `<html lang dir>` and every locale-aware
  // formatter pick up the new preference on the next paint without a full
  // browser reload.
  revalidatePath("/", "layout");
  return { ok: true };
}
