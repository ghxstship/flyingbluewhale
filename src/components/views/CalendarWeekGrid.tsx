"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { isoDateUTC, isSameDayUTC, weekDays, type CalendarEvent } from "@/lib/views/calendar";
import { CalendarEventChip } from "./CalendarEventChip";

type Props = {
  cursor: Date;
  weekStart: 0 | 1;
  eventsByKey: Map<string, CalendarEvent[]>;
  today: Date;
  /** Render only one column for "day" mode. */
  singleDay?: boolean;
  onCreate?: (dateISO: string) => void;
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT_PX = 36;

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CalendarWeekGrid({
  cursor,
  weekStart,
  eventsByKey,
  today,
  singleDay = false,
  onCreate,
  renderEvent,
}: Props) {
  const days = React.useMemo(() => {
    if (singleDay) return [new Date(cursor)];
    return weekDays(cursor, weekStart);
  }, [cursor, weekStart, singleDay]);

  return (
    <div className="surface overflow-x-auto" role="grid" aria-label={singleDay ? "Calendar day" : "Calendar week"}>
      <div
        className="grid min-w-[640px]"
        style={{
          gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="border-e border-b border-[var(--border-color)] bg-[var(--surface-inset)]/40" />
        {days.map((day) => {
          const isToday = isSameDayUTC(day, today);
          return (
            <div
              key={isoDateUTC(day)}
              role="columnheader"
              className="flex flex-col items-center justify-center gap-0.5 border-e border-b border-[var(--border-color)] py-2"
            >
              <span className="text-[10px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
                {WEEKDAY_SHORT[day.getUTCDay()]}
              </span>
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday ? "today-marker" : "text-[var(--text-primary)]"
                }`}
                style={isToday ? { background: "var(--org-primary)", color: "white" } : undefined}
              >
                {day.getUTCDate()}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">{MONTH_SHORT[day.getUTCMonth()]}</span>
            </div>
          );
        })}

        {/* Body — hour rail + day columns */}
        <div className="relative border-e border-[var(--border-color)]">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex items-start justify-end pe-1 font-mono text-[9px] text-[var(--text-muted)]"
              style={{ height: `${HOUR_HEIGHT_PX}px` }}
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayKey = isoDateUTC(day);
          return (
            <DayColumn
              key={dayKey}
              dayKey={dayKey}
              events={eventsByKey.get(dayKey) ?? []}
              dayDate={day}
              onCreate={onCreate}
              renderEvent={renderEvent}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({
  dayKey,
  events,
  dayDate,
  onCreate,
  renderEvent,
}: {
  dayKey: string;
  events: CalendarEvent[];
  dayDate: Date;
  onCreate?: (dateISO: string) => void;
  renderEvent?: (event: CalendarEvent) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayKey}` });
  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      data-drop-over={isOver || undefined}
      className="relative border-e border-[var(--border-color)] data-[drop-over]:bg-[var(--surface-inset)]"
      style={{ height: `${HOUR_HEIGHT_PX * 24}px` }}
      onDoubleClick={onCreate ? () => onCreate(dayKey) : undefined}
    >
      {/* Hour gridlines */}
      {HOURS.map((h) => (
        <div key={h} className="border-b border-[var(--border-color)]/50" style={{ height: `${HOUR_HEIGHT_PX}px` }} />
      ))}
      {/* Time-positioned events */}
      {events.map((event) => {
        const block = blockForEvent(event, dayDate);
        if (!block) {
          // All-day or no time info: render as a top banner.
          return (
            <div key={event.id} className="absolute start-1 end-1 top-1 z-10" style={{ minHeight: 20 }}>
              <CalendarEventChip event={event} renderEvent={renderEvent} />
            </div>
          );
        }
        return (
          <div
            key={event.id}
            className="absolute start-1 end-1 z-10 rounded border border-[var(--border-color)] bg-[var(--surface-raised)] p-1"
            style={{
              top: `${block.top}px`,
              height: `${block.height}px`,
            }}
          >
            <CalendarEventChip event={event} renderEvent={renderEvent} />
          </div>
        );
      })}
    </div>
  );
}

/** Compute the pixel block for an event within a single day column. */
function blockForEvent(event: CalendarEvent, dayDate: Date): { top: number; height: number } | null {
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return null;
  // If the start is before this day, clamp to 00:00 of this day.
  const dayStart = new Date(Date.UTC(dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const startMs = Math.max(start.getTime(), dayStart.getTime());
  const endRaw = event.end ? Date.parse(event.end) : start.getTime() + 60 * 60 * 1000;
  const endMs = Math.min(Number.isNaN(endRaw) ? startMs + 60 * 60 * 1000 : endRaw, dayEnd.getTime());
  if (endMs <= startMs) return null;
  const startHour = (startMs - dayStart.getTime()) / (60 * 60 * 1000);
  const durationHours = (endMs - startMs) / (60 * 60 * 1000);
  return {
    top: startHour * HOUR_HEIGHT_PX,
    height: Math.max(20, durationHours * HOUR_HEIGHT_PX),
  };
}
