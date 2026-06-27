"use client";

import * as React from "react";
import Link from "next/link";
import { isoDateUTC, isSameDayUTC, startOfDayUTC, type CalendarEvent } from "@/lib/views/calendar";
import { eventToneClass } from "./CalendarEventChip";

type Props = {
  cursor: Date;
  eventsByKey: Map<string, CalendarEvent[]>;
  today: Date;
  /** Number of days forward to show in the agenda. Default 30. */
  windowDays?: number;
};

const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CalendarAgenda({ cursor, eventsByKey, today, windowDays = 30 }: Props) {
  const days = React.useMemo(() => {
    const start = startOfDayUTC(cursor);
    const out: Date[] = [];
    for (let i = 0; i < windowDays; i += 1) {
      out.push(new Date(start.getTime() + i * 86_400_000));
    }
    return out.filter((d) => (eventsByKey.get(isoDateUTC(d))?.length ?? 0) > 0);
  }, [cursor, eventsByKey, windowDays]);

  if (days.length === 0) {
    return <div className="surface p-6 text-sm text-[var(--p-text-2)]">No events in the next {windowDays} days.</div>;
  }

  return (
    <ol className="surface divide-y divide-[var(--p-border)]">
      {days.map((day) => {
        const key = isoDateUTC(day);
        const events = eventsByKey.get(key) ?? [];
        return (
          <li key={key} className="px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="eyebrow">{labelForDay(day, today)}</h3>
              <span className="font-mono text-[10px] text-[var(--p-text-2)]">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            </div>
            <ul className="space-y-1.5">
              {events.map((event) => (
                <AgendaRow key={`${key}-${event.id}`} event={event} day={day} />
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function AgendaRow({ event, day }: { event: CalendarEvent; day: Date }) {
  const tone = eventToneClass(event.tone);
  const time = formatTimeRange(event, day);
  const body = (
    <span className={`inline-flex items-center gap-2 rounded px-1.5 py-0.5 ${tone}`}>
      {time && <span className="font-mono text-[10px] opacity-80">{time}</span>}
      <span className="text-xs font-medium">{event.title}</span>
    </span>
  );
  return <li className="flex items-center gap-2">{event.href ? <Link href={event.href}>{body}</Link> : body}</li>;
}

function labelForDay(day: Date, today: Date): string {
  if (isSameDayUTC(day, today)) return "Today";
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (isSameDayUTC(day, tomorrow)) return "Tomorrow";
  return `${WEEKDAY_LONG[day.getUTCDay()]} · ${MONTH_SHORT[day.getUTCMonth()]} ${day.getUTCDate()}`;
}

function formatTimeRange(event: CalendarEvent, day: Date): string | null {
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return null;
  // If event start day is before `day`, treat as "all day" / continuation.
  const startDay = startOfDayUTC(start);
  if (!isSameDayUTC(startDay, day)) return "all day";
  const startStr = formatHHMM(start);
  if (!event.end) return startStr;
  const end = new Date(event.end);
  if (Number.isNaN(end.getTime())) return startStr;
  return `${startStr}–${formatHHMM(end)}`;
}

function formatHHMM(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
