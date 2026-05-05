/**
 * Pure date math for the generic <CalendarView> primitive.
 *
 * All operations work in UTC to avoid host-timezone flakiness in
 * tests + SSR. The component layer is responsible for locale-aware
 * presentation (via `useFormatters()`).
 *
 * Phase 3.3 — SmartSuite parity (Calendar View). Lifted from the
 * bespoke ScheduleCalendar so it can be reused across any
 * date-bearing table (events, tasks, inspections, briefings, ...).
 */

export type CalendarMode = "month" | "week" | "day" | "agenda";

export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO datetime or date-only string. */
  start: string;
  /** Optional ISO datetime. If omitted, single-day event. */
  end?: string;
  /** Tone for color coding. */
  tone?: "info" | "warn" | "error" | "success" | "neutral";
  /** Optional URL on click. */
  href?: string;
  /** Optional metadata for callbacks. */
  data?: Record<string, unknown>;
};

const MS_PER_DAY = 86_400_000;

/** Snap a Date to the start of the day (UTC). */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Snap a Date to the end of the day (UTC) — last millisecond. */
export function endOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/** YYYY-MM-DD format (UTC). */
export function isoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add `days` (integer) to a UTC date, producing a new Date. */
export function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/**
 * Snap a UTC date back to the start of its calendar week.
 * `weekStart` 0 = Sunday, 1 = Monday.
 */
export function startOfWeekUTC(d: Date, weekStart: 0 | 1 = 1): Date {
  const day = startOfDayUTC(d);
  const dow = day.getUTCDay(); // 0..6
  const diff = (dow - weekStart + 7) % 7;
  return addDaysUTC(day, -diff);
}

/**
 * Generate a 6-row x 7-col matrix of Dates for the given month, including
 * leading days from the previous month and trailing days from the next so
 * the grid is always rectangular.
 */
export function monthGrid(year: number, monthIndex: number, weekStart: 0 | 1 = 1): Date[][] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const gridStart = startOfWeekUTC(firstOfMonth, weekStart);
  const rows: Date[][] = [];
  for (let r = 0; r < 6; r += 1) {
    const row: Date[] = [];
    for (let c = 0; c < 7; c += 1) {
      row.push(addDaysUTC(gridStart, r * 7 + c));
    }
    rows.push(row);
  }
  return rows;
}

/** 7 days starting from the week containing `date`. */
export function weekDays(date: Date, weekStart: 0 | 1 = 1): Date[] {
  const start = startOfWeekUTC(date, weekStart);
  const out: Date[] = [];
  for (let i = 0; i < 7; i += 1) out.push(addDaysUTC(start, i));
  return out;
}

/**
 * Group events into a Map keyed by YYYY-MM-DD (UTC), expanding multi-day
 * events into each day they span. Preserves event order within each day.
 */
export function eventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const startMs = Date.parse(e.start);
    if (Number.isNaN(startMs)) continue;
    const start = startOfDayUTC(new Date(startMs));
    const endMs = e.end ? Date.parse(e.end) : NaN;
    const end = !Number.isNaN(endMs) ? startOfDayUTC(new Date(endMs)) : start;
    let cursor = start.getTime();
    const stop = end.getTime();
    while (cursor <= stop) {
      const key = isoDateUTC(new Date(cursor));
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
      cursor += MS_PER_DAY;
    }
  }
  return map;
}

/** Compare two Dates for same UTC calendar day. */
export function isSameDayUTC(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Convert a date or ISO string to its UTC YYYY-MM-DD key. Returns null on
 * invalid input — call sites should treat as "skip".
 */
export function dateKey(input: Date | string): string | null {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  return isoDateUTC(d);
}

/**
 * Re-anchor an event's start to a new YYYY-MM-DD, preserving the original
 * time-of-day. Useful for drag-to-reschedule callbacks where the drop target
 * is a calendar cell.
 */
export function reanchorStartISO(originalStartISO: string, newDayISO: string): string {
  const original = new Date(originalStartISO);
  if (Number.isNaN(original.getTime())) return new Date(newDayISO).toISOString();
  const [y, m, d] = newDayISO.split("-").map(Number);
  if (!y || !m || !d) return originalStartISO;
  const next = new Date(original);
  next.setUTCFullYear(y, m - 1, d);
  return next.toISOString();
}
