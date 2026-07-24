import "server-only";
import { createServiceClient } from "./supabase/server";
import type { NotifyEvent } from "./notify";
import type { PushKind } from "./push/send";

/**
 * Notification channel resolver — reads the ONE live preference store.
 *
 * History: this module originally read `user_preferences.ui_state
 * .notifications`, a per-EVENT matrix saved by an early /me/notifications
 * page. That page was rewritten onto `notification_preferences.matrix`
 * (keyed by the `notification_kind_catalog` kind taxonomy) and the old
 * store was retired as a placebo (AUDIT C-22 / F-02) — but this resolver
 * kept reading it, so in_app/email gating silently degraded to
 * defaults-for-everyone and a user's per-kind Email switch never muted a
 * notify() email. As of 2026-07-24 the resolver reads
 * `notification_preferences.matrix` like every other channel gate.
 *
 * Semantics (behavior-preserving where no explicit cell exists):
 *   in_app → default ON; an explicit `matrix[kind].in_app === false` mutes.
 *   email  → default ON for notify() events; an explicit
 *            `matrix[kind].email` cell (either value) wins. Note the push
 *            fan-out path (`fanOutEmail`, push/send.ts) treats a missing
 *            email cell as OFF — that opt-in default is that path's
 *            contract; here the historical default is ON and flipping it
 *            silently would drop emails users rely on.
 *   Events with no kind mapping have no matrix row to consult and keep
 *   the defaults (there is no switch to honor — adding the event to
 *   NOTIFY_EVENT_PUSH_KIND is what creates the switch).
 *
 * PUSH IS DELIBERATELY NOT A CHANNEL HERE. Push resolves inside
 * sendPushTo/sendPushBulk against the same matrix (`matrix[kind].push`);
 * the narrowed `NotifyChannel` keeps the old dead-store push gate a
 * compile error (memory: project-notify-push-dead-store).
 *
 * Webhooks intentionally bypass this gate — they're subscriber-side and
 * fire regardless of any single user's preference.
 */

export type NotifyChannel = "in_app" | "email";

const DEFAULT_ON: Record<NotifyChannel, boolean> = {
  in_app: true,
  email: true,
};

/**
 * NotifyEvent → PushKind. THE map that gives a notify() event a per-kind
 * switch (push via sendPushTo, in_app/email via this resolver). Unmapped
 * events push nothing and keep default-on in_app/email. Lives here (not in
 * notify.ts) so the resolver never imports notify.ts at runtime; notify.ts
 * re-exports `pushKindForEvent` for its callers and tests.
 *
 * Adding an event here is opt-in, and every kind it names must be
 * toggleable (NOTIF_KINDS) so the switch is real — see
 * notify-push-kind.test.ts.
 */
export const NOTIFY_EVENT_PUSH_KIND: Partial<Record<NotifyEvent, PushKind>> = {
  "timesheet.submitted": "timesheet",
  "timesheet.approved": "timesheet",
  "timesheet.rejected": "timesheet",
  "timesheet.posted": "timesheet",
  "payroll.posted": "payroll",
  "time.correction_requested": "time_correction",
  "time.correction_decided": "time_correction",
};

/** The PushKind for an event, or undefined when it has no per-kind switch. */
export function pushKindForEvent(eventType: NotifyEvent): PushKind | undefined {
  return NOTIFY_EVENT_PUSH_KIND[eventType];
}

type MatrixCell = { push?: boolean; email?: boolean; in_app?: boolean };
type Matrix = Record<string, MatrixCell>;

function readMatrix(raw: unknown): Matrix | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Matrix;
}

function lookup(matrix: Matrix | null, event: NotifyEvent, channel: NotifyChannel): boolean {
  const kind = pushKindForEvent(event);
  if (!matrix || !kind) return DEFAULT_ON[channel];
  const cell = matrix[kind];
  if (!cell) return DEFAULT_ON[channel];
  const value = channel === "email" ? cell.email : cell.in_app;
  return typeof value === "boolean" ? value : DEFAULT_ON[channel];
}

/** Returns true iff the user wants `event` delivered via `channel`. */
export async function shouldNotify(userId: string, event: NotifyEvent, channel: NotifyChannel): Promise<boolean> {
  if (!userId) return DEFAULT_ON[channel];
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("matrix")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return DEFAULT_ON[channel];
    return lookup(readMatrix((data as { matrix: unknown }).matrix), event, channel);
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

  let rows: Array<{ user_id: string; matrix: unknown }> = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("notification_preferences").select("user_id, matrix").in("user_id", userIds);
    rows = (data ?? []) as Array<{ user_id: string; matrix: unknown }>;
  } catch {
    // Same fallback as the singular: treat the matrix as missing and
    // emit the default-on channels.
  }

  const byUser = new Map(rows.map((r) => [r.user_id, readMatrix(r.matrix)]));
  for (const id of userIds) {
    const matrix = byUser.get(id) ?? null;
    if (lookup(matrix, event, channel)) allowed.add(id);
  }
  return allowed;
}
