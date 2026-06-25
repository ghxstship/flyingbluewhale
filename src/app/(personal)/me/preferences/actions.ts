"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { actionFail, formFail } from "@/lib/forms/fail";
import { PreferencesSchema } from "./schema";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function savePreferencesAction(_: State, fd: FormData): Promise<State> {
  const parsed = PreferencesSchema.safeParse({
    density: fd.get("density"),
    locale: fd.get("locale"),
    timezone: fd.get("timezone"),
    analytics: fd.get("analytics") || undefined,
    marketing: fd.get("marketing") || undefined,
  });
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { error: "Sign in required" };

  const consent: Json = {
    essential: true,
    analytics: parsed.data.analytics === "on",
    marketing: parsed.data.marketing === "on",
  };

  // `theme` (the skin slug) is deliberately omitted: it is not edited here
  // (one platform skin) and color mode is the orthogonal client-side axis. On
  // INSERT the column takes its DB default ('system'); on UPDATE the stored
  // skin is left untouched — so a save never depends on, nor clobbers, theme.
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: u.user.id,
      density: parsed.data.density,
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
      consent,
    },
    { onConflict: "user_id" },
  );

  if (error) return actionFail(error.message, fd);
  // Revalidate the whole layout so `<html lang dir>` and every locale-aware
  // formatter pick up the new preference on the next paint without a full
  // browser reload.
  revalidatePath("/", "layout");
  return { ok: true };
}
