/**
 * Kit 32 · Shift Scheduler timezone math.
 *
 * The scheduler's day strip, seat bucketing and FORMS.shift parsing must all
 * agree with what `getRequestFormatters()` RENDERS — the request timezone —
 * or a shift entered at 14:00 displays as 18:00 (the server-local vs request
 * tz drift the first visual pass caught). Same two-pass Intl technique as
 * `src/lib/scheduler/slots.ts` (kit 27), which keeps those helpers private.
 * Pure functions, no deps — safe for server and client.
 */

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

/** The UTC instant of `YYYY-MM-DD` + `HH:MM` read as wall-clock in `timeZone`. */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let utc = naive;
  // Two passes converge across DST boundaries (same loop as slots.ts).
  for (let i = 0; i < 2; i++) {
    const offset = tzOffsetMinutes(new Date(utc), timeZone);
    utc = naive - offset * 60000;
  }
  return new Date(utc);
}

/** `YYYY-MM-DD` of a UTC instant as seen in `timeZone`. */
export function zonedDayKey(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(date); // en-CA renders YYYY-MM-DD
}

/** A day key `n` days after `key` (pure calendar arithmetic, DST-immune). */
export function addDaysToKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, m - 1, d + n));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(
    next.getUTCDate(),
  ).padStart(2, "0")}`;
}
