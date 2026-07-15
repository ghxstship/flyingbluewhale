"use client";

import { isNativePlatform } from "./permissions";

/**
 * Schedule-anchored shift reminders — Phase 7a of
 * docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md.
 *
 * WHAT THIS IS, PRECISELY: a reminder tied to the CLOCK, not to arrival.
 * "Your shift starts in 15 minutes" — not "you have arrived on site".
 *
 * Real arrival/departure detection needs the OS to wake the app on a
 * geofence crossing, which needs a background-geolocation plugin this app
 * does not have, which needs a new native binary through Google Play's
 * background-location review and iOS "Always" permission. None of that is
 * closable from JavaScript. This is the honest 80%: the actual failure in
 * the field is FORGETTING, not being unaware you arrived, and a time-based
 * reminder fixes forgetting at zero native cost.
 *
 * Do not describe these as arrival nudges in copy, tickets, or to
 * customers. They are not.
 *
 * PLATFORM: `@capacitor/local-notifications` is a native plugin. In the web
 * PWA there is no equivalent that survives the tab closing — the Web
 * Notifications API needs the page alive or a push from a server — so this
 * no-ops on web rather than pretending. `scheduleShiftReminders` returns
 * the count actually scheduled, so a caller can tell nothing from silence.
 */

export type ShiftReminder = {
  /** Stable per shift, so re-scheduling replaces rather than duplicates. */
  shiftId: string;
  startsAt: string;
  endsAt: string | null;
  venueName: string | null;
};

/** Minutes before a shift starts to remind. */
const LEAD_MINUTES = 15;
/** Minutes after a shift ends to nudge about clocking out. */
const TRAIL_MINUTES = 10;

/**
 * Capacitor notification ids must be 32-bit ints, but our ids are uuids.
 * Hash to a stable positive int so the SAME shift always maps to the same
 * notification — that is what makes re-scheduling idempotent instead of
 * stacking a second reminder every time the app opens.
 */
function notificationId(shiftId: string, kind: "start" | "end"): number {
  let h = 2166136261;
  for (const ch of `${shiftId}:${kind}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  // Keep it comfortably inside int32 and never zero/negative.
  return (h >>> 1) % 2_000_000_000 || 1;
}

type PendingNotification = { id: number };
type LocalNotificationsPlugin = {
  checkPermissions(): Promise<{ display: string }>;
  requestPermissions(): Promise<{ display: string }>;
  getPending(): Promise<{ notifications: PendingNotification[] }>;
  cancel(opts: { notifications: PendingNotification[] }): Promise<void>;
  schedule(opts: { notifications: unknown[] }): Promise<void>;
};

async function loadPlugin(): Promise<LocalNotificationsPlugin | null> {
  if (!isNativePlatform()) return null;
  try {
    const mod = (await import("@capacitor/local-notifications")) as unknown as {
      LocalNotifications?: LocalNotificationsPlugin;
    };
    return mod.LocalNotifications ?? null;
  } catch {
    // The shell predates the plugin. Remote-loaded JS always has to assume
    // it might be running against an older binary than it was built for.
    return null;
  }
}

export type ScheduleOutcome = {
  scheduled: number;
  /** Why nothing happened, when nothing happened. */
  skipped?: "web" | "no_permission" | "plugin_unavailable" | "nothing_due";
};

/**
 * Schedule reminders for the worker's upcoming shifts.
 *
 * Idempotent: cancels this app's previously-scheduled shift reminders
 * before scheduling, so opening the app repeatedly does not stack
 * duplicates. Only future instants are scheduled — the OS rejects a past
 * fire date, and a "starts in 15 minutes" for a shift that began an hour
 * ago is worse than nothing.
 */
export async function scheduleShiftReminders(shifts: ShiftReminder[]): Promise<ScheduleOutcome> {
  const plugin = await loadPlugin();
  if (!plugin) return { scheduled: 0, skipped: isNativePlatform() ? "plugin_unavailable" : "web" };

  try {
    let perm = await plugin.checkPermissions();
    if (perm.display !== "granted") perm = await plugin.requestPermissions();
    if (perm.display !== "granted") return { scheduled: 0, skipped: "no_permission" };
  } catch {
    return { scheduled: 0, skipped: "plugin_unavailable" };
  }

  const wanted = new Map<number, unknown>();
  const now = Date.now();

  for (const s of shifts) {
    const start = new Date(s.startsAt).getTime();
    const where = s.venueName ? ` at ${s.venueName}` : "";
    const startFire = start - LEAD_MINUTES * 60_000;
    if (startFire > now) {
      wanted.set(notificationId(s.shiftId, "start"), {
        id: notificationId(s.shiftId, "start"),
        title: "Shift starting soon",
        body: `Your shift${where} starts in ${LEAD_MINUTES} minutes. Clock in when you get there.`,
        schedule: { at: new Date(startFire) },
        extra: { shiftId: s.shiftId, kind: "start" },
      });
    }
    if (s.endsAt) {
      const endFire = new Date(s.endsAt).getTime() + TRAIL_MINUTES * 60_000;
      if (endFire > now) {
        wanted.set(notificationId(s.shiftId, "end"), {
          id: notificationId(s.shiftId, "end"),
          title: "Still on the clock?",
          body: `Your shift${where} has ended. Don't forget to clock out.`,
          schedule: { at: new Date(endFire) },
          extra: { shiftId: s.shiftId, kind: "end" },
        });
      }
    }
  }

  try {
    // Replace, don't accumulate: cancel any of OUR ids that are still
    // pending before re-scheduling. Scoped to the ids we'd schedule plus
    // the ones already pending for these shifts, so we never cancel a
    // notification some other feature owns.
    const pending = await plugin.getPending();
    const ours = new Set(shifts.flatMap((s) => [notificationId(s.shiftId, "start"), notificationId(s.shiftId, "end")]));
    const stale = pending.notifications.filter((n) => ours.has(n.id));
    if (stale.length > 0) await plugin.cancel({ notifications: stale });

    if (wanted.size === 0) return { scheduled: 0, skipped: "nothing_due" };
    await plugin.schedule({ notifications: [...wanted.values()] });
    return { scheduled: wanted.size };
  } catch {
    return { scheduled: 0, skipped: "plugin_unavailable" };
  }
}
