"use client";

import * as React from "react";
import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { isoDateUTC, isSameDayUTC, monthGrid, type CalendarEvent } from "@/lib/views/calendar";
import { CalendarEventChip, eventToneClass } from "./CalendarEventChip";

type Props = {
  cursor: Date;
  weekStart: 0 | 1;
  eventsByKey: Map<string, CalendarEvent[]>;
  today: Date;
  onCreate?: (dateISO: string) => void;
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
};

const WEEKDAY_LABELS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LABELS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarMonthGrid({ cursor, weekStart, eventsByKey, today, onCreate, renderEvent }: Props) {
  const grid = React.useMemo(
    () => monthGrid(cursor.getUTCFullYear(), cursor.getUTCMonth(), weekStart),
    [cursor, weekStart],
  );
  const labels = weekStart === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN;

  return (
    <div className="surface overflow-x-auto" role="grid" aria-label="Calendar month">
      <div className="grid min-w-[640px] grid-cols-7 border-b border-[var(--border-color)]">
        {labels.map((d) => (
          <div
            key={d}
            role="columnheader"
            className="px-2 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-w-[640px] grid-cols-7 grid-rows-6">
        {grid.flat().map((day) => {
          const key = isoDateUTC(day);
          const inMonth = day.getUTCMonth() === cursor.getUTCMonth();
          const isToday = isSameDayUTC(day, today);
          const dayEvents = eventsByKey.get(key) ?? [];
          return (
            <DayCell
              key={key}
              dateKey={key}
              dayNumber={day.getUTCDate()}
              inMonth={inMonth}
              isToday={isToday}
              events={dayEvents}
              onCreate={onCreate}
              renderEvent={renderEvent}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  dateKey,
  dayNumber,
  inMonth,
  isToday,
  events,
  onCreate,
  renderEvent,
}: {
  dateKey: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  onCreate?: (dateISO: string) => void;
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dateKey}` });
  const [showOverflow, setShowOverflow] = React.useState(false);
  const visible = events.slice(0, 3);
  const overflow = events.slice(3);

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-label={dateKey}
      data-today={isToday || undefined}
      data-out-of-month={!inMonth || undefined}
      data-drop-over={isOver || undefined}
      className={`group relative min-h-[96px] border-e border-b border-[var(--border-color)] p-1.5 transition-colors data-[drop-over]:bg-[var(--surface-inset)] ${
        inMonth ? "" : "bg-[var(--surface-inset)]/40"
      }`}
      onDoubleClick={onCreate ? () => onCreate(dateKey) : undefined}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
            isToday ? "today-marker" : inMonth ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          }`}
          style={
            isToday
              ? {
                  background: "var(--org-primary)",
                  color: "white",
                }
              : undefined
          }
        >
          {dayNumber}
        </span>
        {events.length > 0 && <span className="font-mono text-[9px] text-[var(--text-muted)]">{events.length}</span>}
      </div>
      <div className="flex flex-col gap-0.5">
        {visible.map((event) => (
          <CalendarEventChip key={event.id} event={event} renderEvent={renderEvent} />
        ))}
        {overflow.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOverflow((prev) => !prev)}
            className="px-1 text-left text-[9px] text-[var(--text-muted)] underline-offset-2 hover:underline"
            aria-expanded={showOverflow}
          >
            +{overflow.length} more
          </button>
        )}
      </div>
      {showOverflow && overflow.length > 0 && (
        <div
          className="elevation-2 absolute top-full right-1 left-1 z-20 mt-1 flex flex-col gap-1 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-1.5"
          role="dialog"
          aria-label={`More events on ${dateKey}`}
        >
          {overflow.map((event) =>
            event.href ? (
              <Link
                key={event.id}
                href={event.href}
                className={`truncate rounded px-1 py-0.5 text-[10px] ${eventToneClass(event.tone)}`}
              >
                {event.title}
              </Link>
            ) : (
              <span key={event.id} className={`truncate rounded px-1 py-0.5 text-[10px] ${eventToneClass(event.tone)}`}>
                {event.title}
              </span>
            ),
          )}
          <button
            type="button"
            onClick={() => setShowOverflow(false)}
            className="self-end px-1 text-[9px] text-[var(--text-muted)] hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
