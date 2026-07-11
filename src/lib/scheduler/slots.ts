/**
 * Bespoke scheduler slot computation (kit 27, Phase 4 — Calendly parity).
 *
 * Pure module: given an event type's rules (duration, buffers, min notice,
 * daily cap, timezone), its availability windows (weekly + dated
 * overrides), and the existing active bookings, compute the open UTC slot
 * starts for a date range. No external tz library — offsets come from the
 * Intl API (two-pass fixed point handles DST edges).
 */

export type SlotEventType = {
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_per_day: number | null;
  timezone: string;
};

export type SlotWindow = {
  weekday: number | null;
  override_date: string | null; // YYYY-MM-DD in the event type's timezone
  start_minute: number;
  end_minute: number;
  is_open: boolean;
};

export type SlotBooking = {
  starts_at: string;
  ends_at: string;
  booking_state: string;
};

const ACTIVE_BOOKING_STATES = new Set(["booked", "rescheduled"]);

/** Minutes to ADD to UTC to get wall-clock time in `timeZone` at `date`. */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

/** The UTC instant of (y-m-d, minute-of-day) as wall-clock time in `timeZone`. */
function zonedMinuteToUtc(y: number, m: number, d: number, minute: number, timeZone: string): Date {
  let utc = Date.UTC(y, m - 1, d, 0, minute);
  for (let i = 0; i < 2; i++) {
    const offset = tzOffsetMinutes(new Date(utc), timeZone);
    utc = Date.UTC(y, m - 1, d, 0, minute) - offset * 60000;
  }
  return new Date(utc);
}

/** Calendar date (y, m, d, weekday, iso) of a UTC instant in `timeZone`. */
function zonedDateParts(date: Date, timeZone: string): { y: number; m: number; d: number; weekday: number; iso: string } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday ?? "Sun");
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  return { y, m, d, weekday, iso: `${parts.year}-${parts.month}-${parts.day}` };
}

export function computeSlots(input: {
  eventType: SlotEventType;
  windows: SlotWindow[];
  bookings: SlotBooking[];
  from: Date;
  days: number;
  now?: Date;
}): Date[] {
  const { eventType, windows, bookings, from, days } = input;
  const now = input.now ?? new Date();
  const tz = eventType.timezone || "UTC";
  const duration = Math.max(5, eventType.duration_minutes);
  const earliest = now.getTime() + eventType.min_notice_minutes * 60000;

  const active = bookings
    .filter((b) => ACTIVE_BOOKING_STATES.has(b.booking_state))
    .map((b) => ({ start: Date.parse(b.starts_at), end: Date.parse(b.ends_at) }));

  const bookedPerDay = new Map<string, number>();
  for (const b of active) {
    const key = zonedDateParts(new Date(b.start), tz).iso;
    bookedPerDay.set(key, (bookedPerDay.get(key) ?? 0) + 1);
  }

  const slots: Date[] = [];
  for (let offset = 0; offset < days; offset++) {
    const probe = new Date(from.getTime() + offset * 86400000);
    const day = zonedDateParts(probe, tz);

    const overrides = windows.filter((w) => w.override_date === day.iso);
    if (overrides.some((w) => !w.is_open)) continue;
    const dayWindows = overrides.length
      ? overrides
      : windows.filter((w) => w.override_date === null && w.weekday === day.weekday && w.is_open);
    if (dayWindows.length === 0) continue;

    if (eventType.max_per_day != null && (bookedPerDay.get(day.iso) ?? 0) >= eventType.max_per_day) continue;
    let remaining = eventType.max_per_day == null ? Infinity : eventType.max_per_day - (bookedPerDay.get(day.iso) ?? 0);

    for (const w of dayWindows) {
      for (let minute = w.start_minute; minute + duration <= w.end_minute; minute += duration) {
        if (remaining <= 0) break;
        const start = zonedMinuteToUtc(day.y, day.m, day.d, minute, tz);
        const end = start.getTime() + duration * 60000;
        if (start.getTime() < earliest) continue;
        const guardStart = start.getTime() - eventType.buffer_before_minutes * 60000;
        const guardEnd = end + eventType.buffer_after_minutes * 60000;
        const collides = active.some((b) => b.start < guardEnd && b.end > guardStart);
        if (collides) continue;
        slots.push(start);
        remaining -= 1;
      }
    }
  }
  slots.sort((a, b) => a.getTime() - b.getTime());
  return slots;
}
