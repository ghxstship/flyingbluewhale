/**
 * Pure date math for the generic <TimelineView> primitive.
 *
 * All operations work in UTC to avoid host-timezone flakiness in tests +
 * SSR. The component layer is responsible for locale-aware presentation.
 *
 * Phase 3.6a — SmartSuite parity (Timeline View). Mirrors the math layer
 * pattern used by `calendar.ts` so view-type primitives stay consistent.
 *
 * SmartSuite reference: https://help.smartsuite.com/en/articles/4765981
 */

export type TimelineZoom = "day" | "week" | "month" | "quarter";

export type TimelineMarker = {
  date: Date;
  label: string;
  /** Pixel offset from the timeline anchor. */
  offset: number;
};

export const MS_PER_DAY = 86_400_000;

/** Snap a Date to the start of the day (UTC). */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Add `days` (integer) to a UTC date, producing a new Date. */
export function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/** Snap to first day of month (UTC). */
export function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Snap to first day of next month (UTC). */
export function startOfNextMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

/** Snap to start of quarter (UTC). */
export function startOfQuarterUTC(d: Date): Date {
  const m = d.getUTCMonth();
  return new Date(Date.UTC(d.getUTCFullYear(), Math.floor(m / 3) * 3, 1));
}

/** Snap to start of week (Monday, UTC). */
export function startOfWeekUTC(d: Date): Date {
  const day = startOfDayUTC(d);
  const dow = day.getUTCDay(); // 0 = Sun
  const diff = (dow + 6) % 7; // distance back to Monday
  return addDaysUTC(day, -diff);
}

/** Whole days between two UTC dates (b - a), rounded. */
export function daysBetweenUTC(a: Date, b: Date): number {
  return Math.round((startOfDayUTC(b).getTime() - startOfDayUTC(a).getTime()) / MS_PER_DAY);
}

/**
 * Compute the [start, end] date range covering all items + reasonable
 * padding. Pads outwards so the leading/trailing items don't sit flush
 * against the canvas edge. If no items, returns a 30-day window centered
 * on today.
 *
 * Returns dates snapped to start-of-day UTC.
 */
export function dateRange(items: ReadonlyArray<{ start: string; end: string }>): { start: Date; end: Date } {
  if (!items.length) {
    const today = startOfDayUTC(new Date());
    return {
      start: addDaysUTC(today, -7),
      end: addDaysUTC(today, 23),
    };
  }
  let minMs = Infinity;
  let maxMs = -Infinity;
  for (const it of items) {
    const s = new Date(it.start).getTime();
    const e = new Date(it.end).getTime();
    if (Number.isFinite(s) && s < minMs) minMs = s;
    if (Number.isFinite(e) && e > maxMs) maxMs = e;
  }
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) {
    const today = startOfDayUTC(new Date());
    return { start: addDaysUTC(today, -7), end: addDaysUTC(today, 23) };
  }
  const minDate = startOfDayUTC(new Date(minMs));
  const maxDate = startOfDayUTC(new Date(maxMs));
  // Pad ~7 days on each side, snapped to month start/next-month for
  // tidy axis labels.
  const paddedStart = startOfMonthUTC(addDaysUTC(minDate, -7));
  const paddedEnd = startOfNextMonthUTC(addDaysUTC(maxDate, 7));
  return { start: paddedStart, end: paddedEnd };
}

/**
 * Convert a date to pixels offset from the timeline's anchor, given pxPerDay.
 * Sub-day precision preserved for smooth bar positioning.
 */
export function pxFromDate(date: Date, anchor: Date, pxPerDay: number): number {
  const diffMs = date.getTime() - anchor.getTime();
  return (diffMs / MS_PER_DAY) * pxPerDay;
}

/**
 * Inverse — pixels to a date. Used for drag-snap. The output is snapped
 * to the start of the day in UTC, since the timeline grid is day-grained.
 */
export function dateFromPx(px: number, anchor: Date, pxPerDay: number): Date {
  if (pxPerDay <= 0) return startOfDayUTC(anchor);
  const days = Math.round(px / pxPerDay);
  return addDaysUTC(startOfDayUTC(anchor), days);
}

function makeTimelineFmts(locale: string) {
  return {
    month: new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }),
    shortMonth: new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }),
    day: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

function quarterLabel(d: Date): string {
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q} ${d.getUTCFullYear()}`;
}

/**
 * Generate top-axis markers for a date range based on zoom. Marker
 * granularity:
 *  - day      → one marker per day
 *  - week     → one marker per Monday
 *  - month    → one marker per month start
 *  - quarter  → one marker per quarter start
 *
 * Each marker's `offset` is its pixel distance from `start` at the zoom's
 * pxPerDay (passed externally — the math here just computes day-distances,
 * which the caller multiplies). To keep the helper self-contained we
 * include the offset assuming pxPerDay = 1; callers scale by the active
 * pxPerDay if needed. Most consumers use the default px-per-day mapping
 * provided alongside `<TimelineView>`.
 */
export function monthMarkers(start: Date, end: Date, zoom: TimelineZoom, pxPerDay = 1, locale = "en"): TimelineMarker[] {
  if (start.getTime() >= end.getTime()) return [];
  const out: TimelineMarker[] = [];
  const cap = 5_000; // safety guard
  const fmt = makeTimelineFmts(locale);

  if (zoom === "day") {
    let cursor = startOfDayUTC(start);
    let i = 0;
    while (cursor.getTime() < end.getTime() && i < cap) {
      const offset = pxFromDate(cursor, start, pxPerDay);
      out.push({ date: new Date(cursor), label: fmt.day.format(cursor), offset });
      cursor = addDaysUTC(cursor, 1);
      i++;
    }
    return out;
  }

  if (zoom === "week") {
    let cursor = startOfWeekUTC(start);
    if (cursor.getTime() < start.getTime()) cursor = addDaysUTC(cursor, 7);
    let i = 0;
    while (cursor.getTime() < end.getTime() && i < cap) {
      const offset = pxFromDate(cursor, start, pxPerDay);
      out.push({ date: new Date(cursor), label: fmt.day.format(cursor), offset });
      cursor = addDaysUTC(cursor, 7);
      i++;
    }
    return out;
  }

  if (zoom === "month") {
    let cursor = startOfMonthUTC(start);
    if (cursor.getTime() < start.getTime()) cursor = startOfNextMonthUTC(cursor);
    let i = 0;
    while (cursor.getTime() < end.getTime() && i < cap) {
      const offset = pxFromDate(cursor, start, pxPerDay);
      const label = cursor.getUTCMonth() === 0 ? fmt.month.format(cursor) : fmt.shortMonth.format(cursor);
      out.push({ date: new Date(cursor), label, offset });
      cursor = startOfNextMonthUTC(cursor);
      i++;
    }
    return out;
  }

  // quarter
  let cursor = startOfQuarterUTC(start);
  if (cursor.getTime() < start.getTime()) {
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 3, 1));
  }
  let i = 0;
  while (cursor.getTime() < end.getTime() && i < cap) {
    const offset = pxFromDate(cursor, start, pxPerDay);
    out.push({ date: new Date(cursor), label: quarterLabel(cursor), offset });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 3, 1));
    i++;
  }
  return out;
}

/**
 * Resolve a bar's left + width given its date span. Same-day items get a
 * 1-day-wide bar so they stay visible.
 */
export function barGeometry(
  itemStart: Date,
  itemEnd: Date,
  anchor: Date,
  pxPerDay: number,
): { left: number; width: number } {
  const left = pxFromDate(itemStart, anchor, pxPerDay);
  const days = Math.max(1, daysBetweenUTC(itemStart, itemEnd) || 1);
  const width = days * pxPerDay;
  return { left, width };
}
