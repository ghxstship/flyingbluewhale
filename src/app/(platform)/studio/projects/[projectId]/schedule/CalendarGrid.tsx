"use client";

import * as React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";

export type CalendarEvent = {
  id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
};

export type CalendarTask = {
  id: string;
  title: string;
  due_at: string | null;
  status: string | null;
};

/**
 * Month-grid calendar. Events anchor on starts_at; tasks anchor on due_at.
 * Day cells stack chips in date order — the operator sees what lands when
 * without scrolling a list. Month nav is client-side (`?month=`) so deep
 * links to a specific month survive a refresh.
 */
export function CalendarGrid({
  events,
  tasks,
  initialMonth,
}: {
  events: CalendarEvent[];
  tasks: CalendarTask[];
  initialMonth: string;
}) {
  const t = useT();
  const [cursor, setCursor] = React.useState(() => parseMonth(initialMonth));
  // `today` is null until mount — `new Date()` during render runs at different
  // instants on server vs client and flips the "today" highlight, which
  // hydration-mismatches (React #418). The highlight appears after mount.
  const [today, setToday] = React.useState<Date | null>(null);
  React.useEffect(() => setToday(new Date()), []);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d));

  const eventsByDay = bucketByDay(events, (e) => (e.starts_at ? new Date(e.starts_at) : null));
  const tasksByDay = bucketByDay(tasks, (task) => (task.due_at ? new Date(task.due_at) : null));

  return (
    <div className="surface overflow-hidden rounded-md border border-[var(--p-border)]">
      <div className="flex items-center justify-between border-b border-[var(--p-border)] p-3">
        <button
          type="button"
          className="ps-btn ps-btn--sm"
          onClick={() => setCursor(addMonths(cursor, -1))}
          aria-label={t("console.projects.schedule.calendar.previousMonth", undefined, "Previous Month")}
        >
          ←
        </button>
        <div className="text-sm font-semibold tracking-tight">{monthLabel}</div>
        <button
          type="button"
          className="ps-btn ps-btn--sm"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label={t("console.projects.schedule.calendar.nextMonth", undefined, "Next Month")}
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-[var(--p-border)] bg-[var(--p-surface-2)] text-[10px] font-semibold tracking-[0.16em] text-[var(--p-text-2)] uppercase">
        {[
          t("console.projects.schedule.calendar.weekday.sun", undefined, "Sun"),
          t("console.projects.schedule.calendar.weekday.mon", undefined, "Mon"),
          t("console.projects.schedule.calendar.weekday.tue", undefined, "Tue"),
          t("console.projects.schedule.calendar.weekday.wed", undefined, "Wed"),
          t("console.projects.schedule.calendar.weekday.thu", undefined, "Thu"),
          t("console.projects.schedule.calendar.weekday.fri", undefined, "Fri"),
          t("console.projects.schedule.calendar.weekday.sat", undefined, "Sat"),
        ].map((d) => (
          <div key={d} className="px-2 py-1.5 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = dayKey(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = today !== null && isSameDay(d, today);
          const dayEvents = eventsByDay.get(key) ?? [];
          const dayTasks = tasksByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-[90px] border-e border-b border-[var(--p-border)] p-1.5 text-xs ${
                inMonth ? "" : "bg-[var(--p-surface-2)]/40 text-[var(--p-text-2)]"
              }`}
            >
              <div className={`mb-1 font-mono text-[10px] ${isToday ? "font-semibold text-[var(--p-accent)]" : ""}`}>
                {d.getDate()}
              </div>
              <ul className="space-y-1">
                {dayEvents.map((e) => (
                  <li key={`e-${e.id}`}>
                    <Link
                      href={`/studio/events/${e.id}`}
                      className="block truncate rounded-sm bg-[var(--p-accent)]/15 px-1 py-0.5 text-[10px] hover:bg-[var(--p-accent)]/25"
                      title={`${e.name} · ${e.status ?? t("console.projects.schedule.calendar.eventStatusDraft", undefined, "draft")}`}
                    >
                      {e.name}
                    </Link>
                  </li>
                ))}
                {dayTasks.map((task) => (
                  <li key={`t-${task.id}`}>
                    <Link
                      href={`/studio/tasks/${task.id}`}
                      className="block truncate rounded-sm bg-[var(--p-surface-2)] px-1 py-0.5 text-[10px] hover:bg-[var(--p-surface)]"
                      title={`${task.title} · ${task.status ?? t("console.projects.schedule.calendar.taskStatusOpen", undefined, "open")}`}
                    >
                      ◇ {task.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseMonth(m: string): Date {
  const [y = Number.NaN, mo = Number.NaN] = m.split("-").map((n) => Number.parseInt(n, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mo)) return new Date();
  return new Date(y, mo - 1, 1);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfWeek(d: Date): Date {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  return c;
}
function endOfWeek(d: Date): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + (6 - c.getDay()));
  return c;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function bucketByDay<T>(items: T[], get: (x: T) => Date | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const d = get(it);
    if (!d) continue;
    const k = dayKey(d);
    const list = map.get(k) ?? [];
    list.push(it);
    map.set(k, list);
  }
  return map;
}
