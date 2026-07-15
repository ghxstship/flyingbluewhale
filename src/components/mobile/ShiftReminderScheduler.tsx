"use client";

import { useEffect } from "react";
import { scheduleShiftReminders, type ShiftReminder } from "@/lib/native/shift-reminders";

/**
 * Schedules the worker's shift reminders whenever they open the schedule.
 *
 * Renders nothing. Local notifications are scheduled by the OS, so they
 * fire with the app closed — the app only has to hand the OS the list, and
 * opening the schedule is the natural moment to do that.
 *
 * Deliberately fire-and-forget: a reminder that fails to schedule must
 * never cost the worker the page they actually came for. `scheduleShiftReminders`
 * doesn't throw and no-ops on web, so this is a no-op there too.
 *
 * These are TIME-based reminders, not arrival detection — see
 * src/lib/native/shift-reminders.ts.
 */
export function ShiftReminderScheduler({ shifts }: { shifts: ShiftReminder[] }) {
  useEffect(() => {
    if (shifts.length === 0) return;
    void scheduleShiftReminders(shifts);
    // Re-run when the roster genuinely changes. Serialising the ids +
    // instants keeps a re-render with an equal-but-new array from
    // rescheduling on every paint.
  }, [shifts.map((s) => `${s.shiftId}:${s.startsAt}:${s.endsAt ?? ""}`).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
