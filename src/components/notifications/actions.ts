"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NOTIF_KINDS } from "./kinds";

export type NotifToggleState = { error?: string; ok?: true } | null;

const Toggle = z.object({
  kind: z.enum(NOTIF_KINDS),
  on: z.enum(["0", "1"]),
});

/**
 * Persist a single push-channel toggle into `notification_preferences.matrix`
 * — the SAME store `sendPushTo`/`sendPushBulk` gate delivery on
 * (`matrix[kind].push === false` skips the user). One cell per call keeps the
 * optimistic UI simple and avoids clobbering concurrent edits; unrelated
 * matrix keys (e.g. the mobile category grid) are preserved.
 *
 * Replaces the retired `/me/notifications` placebo that wrote
 * `user_preferences.ui_state.notifications` (AUDIT C-22 / F-02) — nothing
 * ever read that path.
 */
export async function toggleNotifKindPref(_prev: NotifToggleState, fd: FormData): Promise<NotifToggleState> {
  const session = await requireSession();
  const parsed = Toggle.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid toggle." };
  const { kind, on } = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("matrix")
    .eq("user_id", session.userId)
    .maybeSingle();

  const matrix = (existing?.matrix as Record<string, Record<string, boolean>> | null) ?? {};
  const nextMatrix = {
    ...matrix,
    [kind]: { ...(matrix[kind] ?? {}), push: on === "1" },
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

  return { ok: true };
}
