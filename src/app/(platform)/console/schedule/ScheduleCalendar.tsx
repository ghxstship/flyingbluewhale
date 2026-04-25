"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChartShell } from "@/components/charts/ChartShell";
import { Button } from "@/components/ui/Button";

type CalendarEvent = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

type View = "month" | "week";

/**
 * Schedule calendar — month + week views, keyboard-aware. Events render
 * as colored chips inside day cells; the cell itself stays clickable so
 * operators can drill to the day's view in /console/events.
 *
 * Stays read-only on this page. Drag-to-reschedule lives on the project
 * detail Gantt where event-vs-task ownership is unambiguous.
 */
export function ScheduleCalendar({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = React.useState<View>("month");
  const [cursor, setCursor] = React.useState<Date>(() => startOfMonth(new Date()));

  const range = React.useMemo(
    () => (view === "month" ? monthRange(cursor) : weekRange(cursor)),
    [view, cursor],
  );
  const days = React.useMemo(() => buildDays(range.start, range.end), [range]);
  const eventsByDay = React.useMemo(
    () => bucketEvents(events, range.start, range.end),
    [events, range],
  );

  function shift(direction: -1 | 1) {
    if (view === "month") {
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + direction);
      setCursor(startOfMonth(next));
    } else {
      const next = new Date(cursor);
      next.setDate(next.getDate() + direction * 7);
      setCursor(next);
    }
  }
  function jumpToday() {
    setCursor(view === "month" ? startOfMonth(new Date()) : new Date());
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(cursor);

  return (
    <ChartShell
      title={view === "month" ? monthLabel : weekLabel(range.start, range.end)}
      description={view === "month" ? "Click any event chip to open" : "This week — events visible in their start day"}
      empty={events.length === 0}
      emptyLabel="No scheduled events yet."
      height={500}
      actions={
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setView("month")}
              className={`px-2 py-1 text-xs ${view === "month" ? "bg-[var(--surface-inset)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={`px-2 py-1 text-xs ${view === "week" ? "bg-[var(--surface-inset)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            >
              Week
            </button>
          </div>
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous"
            className="rounded p-1 hover:bg-[var(--surface-inset)]"
          >
            <ChevronLeft size={14} />
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={jumpToday}>
            Today
          </Button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next"
            className="rounded p-1 hover:bg-[var(--surface-inset)]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border-color)]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"
            >
              {d}
            </div>
          ))}
        </div>
        <div
          className={`grid ${
            view === "month" ? "grid-cols-7 grid-rows-6" : "grid-cols-7 grid-rows-1"
          }`}
        >
          {days.map((day, idx) => {
            const inMonth = view === "week" || day.getMonth() === cursor.getMonth();
            const today = isSameDay(day, new Date());
            const dayKey = day.toISOString().slice(0, 10);
            const dayEvents = eventsByDay.get(dayKey) ?? [];
            return (
              <div
                key={idx}
                className={`min-h-[80px] border-b border-e border-[var(--border-color)] p-1.5 ${
                  inMonth ? "" : "bg-[var(--surface-inset)]/40"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${
                      today
                        ? "bg-[var(--org-primary)] text-white"
                        : inMonth
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="font-mono text-[9px] text-[var(--text-muted)]">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      href={`/console/events/${e.id}`}
                      className={`truncate rounded px-1 py-0.5 text-[10px] ${eventTone(e.status)}`}
                      title={e.name}
                    >
                      {e.name}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="px-1 text-[9px] text-[var(--text-muted)]">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartShell>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}
function monthRange(cursor: Date) {
  const start = startOfWeek(startOfMonth(cursor));
  const end = new Date(start);
  end.setDate(end.getDate() + 42); // 6 weeks always
  return { start, end };
}
function weekRange(cursor: Date) {
  const start = startOfWeek(cursor);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}
function buildDays(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(start);
  while (d < end) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function bucketEvents(
  events: CalendarEvent[],
  start: Date,
  end: Date,
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const startsAt = new Date(e.startsAt);
    if (Number.isNaN(startsAt.getTime())) continue;
    if (startsAt < start || startsAt >= end) continue;
    const key = startsAt.toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function weekLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  return `${fmt.format(start)} – ${fmt.format(last)}`;
}
function eventTone(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25";
    case "live":
      return "bg-[var(--org-primary)]/15 text-[var(--org-primary)] hover:bg-[var(--org-primary)]/25";
    case "completed":
      return "bg-[var(--surface-inset)] text-[var(--text-muted)] hover:bg-[var(--surface-raised)]";
    case "cancelled":
      return "bg-[color:var(--color-error)]/10 text-[color:var(--color-error)] line-through hover:bg-[color:var(--color-error)]/20";
    default:
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25";
  }
}
