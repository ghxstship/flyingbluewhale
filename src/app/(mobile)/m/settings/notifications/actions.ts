"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NOTIF_ROWS, NOTIF_ROW_IDS, CHANNELS } from "./constants";

export type State = { error?: string; ok?: true } | null;

const Toggle = z.object({
  // Stable row id (kebab), never the display label — labels are localized.
  row: z.enum(NOTIF_ROW_IDS),
  channel: z.enum(CHANNELS),
  on: z.enum(["0", "1"]),
});

/**
 * Persist a matrix-row toggle into `notification_preferences.matrix`, keyed by
 * canonical `PushKind` (jsonb `matrix[kind][channel] = boolean`) — the exact
 * shape `src/lib/push/send.ts` reads to gate delivery. One toggle writes every
 * kind the display row owns (e.g. "Shifts" → shift + shift_swap), so the switch
 * actually silences push, not just a dead title-case bucket.
 */
export async function toggleNotifPref(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Toggle.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid toggle." };
  const { row, channel, on } = parsed.data;
  const kinds = NOTIF_ROWS.find((r) => r.id === row)?.kinds ?? [];
  if (kinds.length === 0) return { error: "Unknown preference." };
  const value = on === "1";

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("matrix")
    .eq("user_id", session.userId)
    .maybeSingle();

  const matrix = (existing?.matrix as Record<string, Record<string, boolean>> | null) ?? {};
  const nextMatrix = { ...matrix };
  for (const kind of kinds) {
    nextMatrix[kind] = { ...(matrix[kind] ?? {}), [channel]: value };
  }

  const { error } = await (
    supabase.from("notification_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: session.userId, matrix: nextMatrix }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  revalidatePath("/m/settings/notifications");
  revalidatePath("/m/notifications");
  return { ok: true };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const QuietHoursInput = z.object({
  enabled: z.enum(["0", "1"]),
  start: z.string().regex(HHMM),
  end: z.string().regex(HHMM),
  // IANA zone captured client-side (Intl.resolvedOptions().timeZone);
  // validated server-side by actually constructing a formatter with it.
  tz: z.string().min(1).max(64),
});

function hhmmToMinutes(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the push quiet-hours window into
 * `notification_preferences.quiet_hours` (jsonb — the exact shape
 * `src/lib/push/tiers.ts#parseQuietHours` reads to gate delivery):
 * `{ enabled, start_min, end_min, tz }`, wall-clock minutes in `tz`.
 * The window may wrap midnight (22:00 → 07:00).
 */
export async function saveQuietHours(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = QuietHoursInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid quiet hours." };
  const { enabled, start, end, tz } = parsed.data;
  const zone = isValidTimeZone(tz) ? tz : "UTC";

  const quiet_hours = {
    enabled: enabled === "1",
    start_min: hhmmToMinutes(start),
    end_min: hhmmToMinutes(end),
    tz: zone,
  };

  const supabase = await createClient();
  const { error } = await (
    supabase.from("notification_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: session.userId, quiet_hours }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  revalidatePath("/m/settings/notifications");
  return { ok: true };
}
