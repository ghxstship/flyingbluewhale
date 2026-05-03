"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const Schema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  locale: z.string().min(2).max(8),
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
  revalidatePath("/me/preferences");
  return { ok: true };
}
