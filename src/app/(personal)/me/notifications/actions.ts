"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { CHANNELS, EVENTS } from "./constants";

export type State = { error?: string; ok?: true } | null;

export async function saveNotificationPrefs(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  const matrix: Record<string, Record<string, boolean>> = {};
  for (const ev of EVENTS) {
    matrix[ev] = {};
    for (const ch of CHANNELS) {
      matrix[ev][ch] = fd.get(`${ev}__${ch}`) === "on";
    }
  }

  const { data: existing } = await supabase
    .from("user_preferences")
    .select("ui_state")
    .eq("user_id", session.userId)
    .maybeSingle();
  const ui = (existing?.ui_state as Record<string, unknown> | null) ?? {};
  const nextUi = { ...ui, notifications: matrix } as Json;

  const upsertRow = { user_id: session.userId, ui_state: nextUi } as Record<string, unknown>;
  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert(upsertRow, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/me/notifications");
  return { ok: true };
}
