"use client";

import * as React from "react";
import { CalendarView, type CalendarEvent } from "@/components/views/CalendarView";
import { useT } from "@/lib/i18n/LocaleProvider";
import { rescheduleEvent } from "./actions";

/**
 * Thin Client Component shim that hands the generic <CalendarView> the
 * schedule-specific server action. Lives next to /studio/schedule so
 * the page itself can stay a Server Component.
 */
export function ScheduleCalendarView({ events }: { events: CalendarEvent[] }) {
  const translate = useT();
  const onReschedule = React.useCallback(
    async (eventId: string, newStartISO: string) => {
      const result = await rescheduleEvent(eventId, newStartISO);
      if (!result.ok) {
        // Throw so <CalendarView> announces "Reschedule failed" to SR.
        throw new Error(result.error ?? translate("console.schedule.rescheduleFailed", undefined, "Reschedule failed"));
      }
    },
    [translate],
  );
  return <CalendarView events={events} initialMode="month" onReschedule={onReschedule} />;
}
