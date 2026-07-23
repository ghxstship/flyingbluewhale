import "server-only";
import { createServiceClient } from "./supabase/server";
import type { NotifyEvent } from "./notify";

/**
 * Notification channel resolver — Phase 1.4 of the SmartSuite parity work.
 *
 * `me/notifications/page.tsx` saves a per-event × per-channel matrix into
 * `user_preferences.ui_state.notifications`. Until now the matrix was
 * read-only — the UI let users toggle preferences, but no emit path
 * actually consulted them. This resolver closes that loop for the in_app
 * and email channels: each notify call is gated on the matrix entry for
 * `(event, channel)`.
 *
 * Defaults match `me/notifications/page.tsx#DEFAULT_ON`:
 *   email → on, in_app → on.
 *
 * PUSH IS DELIBERATELY NOT A CHANNEL HERE. This store was retired as a
 * placebo (AUDIT C-22 / F-02) and its push default was false — gating push
 * on it meant notify() never pushed, for anyone (the F2 dead-store defect;
 * memory: project-notify-push-dead-store). Push resolves through the LIVE
 * per-kind store instead: `notification_preferences.matrix[kind].push`,
 * read by sendPushTo/sendPushBulk (src/lib/push/send.ts) via the
 * NOTIFY_EVENT_PUSH_KIND map in notify.ts. Narrowing `NotifyChannel` makes
 * reintroducing the dead gate a compile error; `notify-push-kind.test.ts`
 * guards the source besides.
 *
 * Webhooks intentionally bypass this gate — they're subscriber-side
 * (org webhook endpoints) and should fire regardless of any single
 * user's preference.
 */

export type NotifyChannel = "in_app" | "email";

const DEFAULT_ON: Record<NotifyChannel, boolean> = {
  in_app: true,
  email: true,
};

type Matrix = Record<string, Record<string, boolean>>;

function readMatrix(uiState: unknown): Matrix | null {
  if (!uiState || typeof uiState !== "object") return null;
  const matrix = (uiState as { notifications?: Matrix }).notifications;
  if (!matrix || typeof matrix !== "object") return null;
  return matrix;
}

function lookup(matrix: Matrix | null, event: NotifyEvent, channel: NotifyChannel): boolean {
  if (!matrix) return DEFAULT_ON[channel];
  const row = matrix[event];
  if (!row) return DEFAULT_ON[channel];
  const cell = row[channel];
  return typeof cell === "boolean" ? cell : DEFAULT_ON[channel];
}

/** Returns true iff the user wants `event` delivered via `channel`. */
export async function shouldNotify(userId: string, event: NotifyEvent, channel: NotifyChannel): Promise<boolean> {
  if (!userId) return DEFAULT_ON[channel];
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("user_preferences")
      .select("ui_state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return DEFAULT_ON[channel];
    return lookup(readMatrix(data.ui_state), event, channel);
  } catch {
    // If the service client is unavailable (e.g. missing service-role key
    // in a preview deploy) fall back to defaults rather than dropping
    // notifications entirely.
    return DEFAULT_ON[channel];
  }
}

/** Bulk variant — single round-trip for a list of users. Returns the
 *  set of user ids whose preferences allow this (event, channel). */
export async function bulkShouldNotify(
  userIds: string[],
  event: NotifyEvent,
  channel: NotifyChannel,
): Promise<Set<string>> {
  const allowed = new Set<string>();
  if (userIds.length === 0) return allowed;

  let rows: Array<{ user_id: string; ui_state: unknown }> = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("user_preferences").select("user_id, ui_state").in("user_id", userIds);
    rows = (data ?? []) as Array<{ user_id: string; ui_state: unknown }>;
  } catch {
    // Same fallback as the singular: treat the matrix as missing and
    // emit the default-on channels.
  }

  const byUser = new Map(rows.map((r) => [r.user_id, readMatrix(r.ui_state)]));
  for (const id of userIds) {
    const matrix = byUser.get(id) ?? null;
    if (lookup(matrix, event, channel)) allowed.add(id);
  }
  return allowed;
}
