"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CHANNELS } from "./constants";

export type State = { error?: string; ok?: true } | null;

const Toggle = z.object({
  category: z.enum(CATEGORIES),
  channel: z.enum(CHANNELS),
  on: z.enum(["0", "1"]),
});

/**
 * Persist a single matrix cell toggle into `notification_preferences.matrix`
 * (jsonb keyed `matrix[category][channel] = boolean`). One cell per call keeps
 * the optimistic UI simple and avoids clobbering concurrent edits.
 */
export async function toggleNotifPref(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Toggle.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid toggle." };
  const { category, channel, on } = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("matrix")
    .eq("user_id", session.userId)
    .maybeSingle();

  const matrix =
    ((existing?.matrix as Record<string, Record<string, boolean>> | null) ?? {}) ;
  const nextMatrix = {
    ...matrix,
    [category]: { ...(matrix[category] ?? {}), [channel]: on === "1" },
  };

  const { error } = await (
    supabase.from("notification_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: session.userId, matrix: nextMatrix }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  revalidatePath("/m/notifications");
  return { ok: true };
}
