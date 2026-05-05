import { describe, it, expect } from "vitest";
import {
  monthGrid,
  weekDays,
  eventsByDay,
  startOfDayUTC,
  endOfDayUTC,
  isoDateUTC,
  startOfWeekUTC,
  reanchorStartISO,
  isSameDayUTC,
  type CalendarEvent,
} from "../views/calendar";

describe("isoDateUTC", () => {
  it("formats UTC dates as YYYY-MM-DD", () => {
    expect(isoDateUTC(new Date(Date.UTC(2026, 4, 9)))).toBe("2026-05-09");
  });

  it("zero-pads single-digit months and days", () => {
    expect(isoDateUTC(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01-01");
  });
});

describe("startOfDayUTC / endOfDayUTC", () => {
  it("snaps to midnight UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 9, 14, 30, 22));
    expect(startOfDayUTC(d).toISOString()).toBe("2026-05-09T00:00:00.000Z");
  });

  it("snaps to 23:59:59.999 UTC", () => {
    const d = new Date(Date.UTC(2026, 4, 9, 8));
    expect(endOfDayUTC(d).toISOString()).toBe("2026-05-09T23:59:59.999Z");
  });
});

describe("startOfWeekUTC", () => {
  it("Monday-anchored week starts on Monday for a Wednesday input", () => {
    // 2026-05-06 is a Wednesday (UTC).
    const wed = new Date(Date.UTC(2026, 4, 6));
    expect(isoDateUTC(startOfWeekUTC(wed, 1))).toBe("2026-05-04");
  });

  it("Sunday-anchored week starts on Sunday for a Wednesday input", () => {
    const wed = new Date(Date.UTC(2026, 4, 6));
    expect(isoDateUTC(startOfWeekUTC(wed, 0))).toBe("2026-05-03");
  });

  it("a Monday with weekStart=1 returns itself", () => {
    const mon = new Date(Date.UTC(2026, 4, 4));
    expect(isoDateUTC(startOfWeekUTC(mon, 1))).toBe("2026-05-04");
  });
});

describe("monthGrid", () => {
  it("returns 6 rows x 7 cols", () => {
    const grid = monthGrid(2026, 4, 1);
    expect(grid).toHaveLength(6);
    for (const row of grid) expect(row).toHaveLength(7);
  });

  it("starts on the configured weekday", () => {
    const grid = monthGrid(2026, 4, 1); // May 2026, Monday-start
    expect(grid[0]![0]!.getUTCDay()).toBe(1);

    const sunGrid = monthGrid(2026, 4, 0);
    expect(sunGrid[0]![0]!.getUTCDay()).toBe(0);
  });

  it("includes leading days from the previous month when needed", () => {
    // May 1 2026 is a Friday (UTC). With Monday-start, the first row should
    // contain Apr 27..May 3.
    const grid = monthGrid(2026, 4, 1);
    expect(isoDateUTC(grid[0]![0]!)).toBe("2026-04-27");
    expect(isoDateUTC(grid[0]![6]!)).toBe("2026-05-03");
  });

  it("handles February in a leap year (2024)", () => {
    const grid = monthGrid(2024, 1, 1); // Feb 2024 is a leap year
    const flat = grid.flat();
    const feb29 = flat.find((d) => isoDateUTC(d) === "2024-02-29");
    expect(feb29).toBeDefined();
  });

  it("handles February in a non-leap year (2023)", () => {
    const grid = monthGrid(2023, 1, 1);
    const flat = grid.flat();
    const feb29 = flat.find((d) => isoDateUTC(d) === "2023-02-29");
    expect(feb29).toBeUndefined();
    const mar1 = flat.find((d) => isoDateUTC(d) === "2023-03-01");
    expect(mar1).toBeDefined();
  });

  it("crosses the year boundary cleanly (Dec 2025 -> Jan 2026)", () => {
    const grid = monthGrid(2025, 11, 1);
    const flat = grid.flat();
    expect(flat.some((d) => isoDateUTC(d) === "2025-12-31")).toBe(true);
    expect(flat.some((d) => isoDateUTC(d) === "2026-01-01")).toBe(true);
  });

  it("crosses the year boundary cleanly (Jan 2026 -> Dec 2025 leading)", () => {
    const grid = monthGrid(2026, 0, 1);
    expect(isoDateUTC(grid[0]![0]!)).toBe("2025-12-29");
  });
});

describe("weekDays", () => {
  it("returns 7 consecutive days", () => {
    const days = weekDays(new Date(Date.UTC(2026, 4, 6)), 1);
    expect(days).toHaveLength(7);
    expect(isoDateUTC(days[0]!)).toBe("2026-05-04");
    expect(isoDateUTC(days[6]!)).toBe("2026-05-10");
  });

  it("respects Sunday start", () => {
    const days = weekDays(new Date(Date.UTC(2026, 4, 6)), 0);
    expect(isoDateUTC(days[0]!)).toBe("2026-05-03");
    expect(isoDateUTC(days[6]!)).toBe("2026-05-09");
  });
});

describe("eventsByDay", () => {
  it("buckets a single-day event into one key", () => {
    const events: CalendarEvent[] = [{ id: "a", title: "Show", start: "2026-05-09T20:00:00Z" }];
    const map = eventsByDay(events);
    expect(map.get("2026-05-09")).toHaveLength(1);
    expect(map.size).toBe(1);
  });

  it("expands multi-day events into every day they span", () => {
    const events: CalendarEvent[] = [
      {
        id: "festival",
        title: "Festival",
        start: "2026-07-04T16:00:00Z",
        end: "2026-07-06T04:00:00Z",
      },
    ];
    const map = eventsByDay(events);
    expect(map.get("2026-07-04")).toHaveLength(1);
    expect(map.get("2026-07-05")).toHaveLength(1);
    expect(map.get("2026-07-06")).toHaveLength(1);
    expect(map.size).toBe(3);
  });

  it("ignores events with invalid start dates", () => {
    const events: CalendarEvent[] = [
      { id: "bad", title: "Bad", start: "not-a-date" },
      { id: "good", title: "Good", start: "2026-05-09T00:00:00Z" },
    ];
    const map = eventsByDay(events);
    expect(map.size).toBe(1);
    expect(map.get("2026-05-09")).toHaveLength(1);
  });

  it("preserves event order within a day", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "First", start: "2026-05-09T08:00:00Z" },
      { id: "2", title: "Second", start: "2026-05-09T10:00:00Z" },
      { id: "3", title: "Third", start: "2026-05-09T14:00:00Z" },
    ];
    const map = eventsByDay(events);
    expect(map.get("2026-05-09")!.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  it("handles DST-prone dates without timezone drift (everything UTC)", () => {
    // US DST forward in 2026 lands on 2026-03-08 (Sun). We test that
    // an event at midnight UTC on that day is bucketed under "2026-03-08"
    // regardless of host timezone — date math here is pure UTC.
    const events: CalendarEvent[] = [{ id: "dst", title: "DST", start: "2026-03-08T00:00:00Z" }];
    const map = eventsByDay(events);
    expect(map.get("2026-03-08")).toBeDefined();
  });
});

describe("isSameDayUTC", () => {
  it("returns true for two timestamps on the same UTC day", () => {
    const a = new Date(Date.UTC(2026, 4, 9, 1));
    const b = new Date(Date.UTC(2026, 4, 9, 23));
    expect(isSameDayUTC(a, b)).toBe(true);
  });

  it("returns false across a UTC day boundary", () => {
    const a = new Date(Date.UTC(2026, 4, 9, 23));
    const b = new Date(Date.UTC(2026, 4, 10, 0));
    expect(isSameDayUTC(a, b)).toBe(false);
  });
});

describe("reanchorStartISO", () => {
  it("preserves the time-of-day when moved to a new day", () => {
    const next = reanchorStartISO("2026-05-09T20:30:00.000Z", "2026-05-15");
    expect(next).toBe("2026-05-15T20:30:00.000Z");
  });

  it("crosses month boundaries", () => {
    const next = reanchorStartISO("2026-05-31T12:00:00.000Z", "2026-06-01");
    expect(next).toBe("2026-06-01T12:00:00.000Z");
  });

  it("returns the original ISO when newDayISO is malformed", () => {
    expect(reanchorStartISO("2026-05-09T20:30:00.000Z", "garbage")).toBe("2026-05-09T20:30:00.000Z");
  });
});
