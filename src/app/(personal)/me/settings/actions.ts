"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const Schema = z.object({
  density: z.enum(["compact", "comfortable", "spacious"]).optional(),
  locale: z.string().min(2).max(8).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function updateSettings(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const upsertRow: Record<string, unknown> = { user_id: session.userId };
  if (parsed.data.density) upsertRow.density = parsed.data.density;
  if (parsed.data.locale) upsertRow.locale = parsed.data.locale;
  if (parsed.data.timezone) upsertRow.timezone = parsed.data.timezone;
  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert(upsertRow as Json & Record<string, unknown>, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/me/settings");
  return { ok: true };
}
