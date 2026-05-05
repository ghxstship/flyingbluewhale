import { describe, it, expect } from "vitest";
import {
  addDaysUTC,
  barGeometry,
  dateFromPx,
  dateRange,
  daysBetweenUTC,
  monthMarkers,
  pxFromDate,
  startOfDayUTC,
  startOfMonthUTC,
  startOfQuarterUTC,
  startOfWeekUTC,
} from "../views/timeline";

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString();

describe("startOfDayUTC", () => {
  it("snaps to midnight UTC regardless of input time", () => {
    const d = new Date(Date.UTC(2026, 4, 9, 14, 30, 22));
    expect(startOfDayUTC(d).toISOString()).toBe("2026-05-09T00:00:00.000Z");
  });
});

describe("addDaysUTC", () => {
  it("crosses month boundary cleanly", () => {
    const d = new Date(Date.UTC(2026, 4, 30));
    expect(addDaysUTC(d, 5).toISOString()).toBe("2026-06-04T00:00:00.000Z");
  });

  it("crosses year boundary cleanly", () => {
    const d = new Date(Date.UTC(2026, 11, 30));
    expect(addDaysUTC(d, 5).toISOString()).toBe("2027-01-04T00:00:00.000Z");
  });
});

describe("startOfWeekUTC", () => {
  it("snaps to Monday for a Wednesday input", () => {
    // 2026-05-06 is a Wednesday
    const wed = new Date(Date.UTC(2026, 4, 6));
    expect(startOfWeekUTC(wed).toISOString()).toBe("2026-05-04T00:00:00.000Z");
  });

  it("snaps Sunday back to the prior Monday", () => {
    // 2026-05-03 is a Sunday
    const sun = new Date(Date.UTC(2026, 4, 3));
    expect(startOfWeekUTC(sun).toISOString()).toBe("2026-04-27T00:00:00.000Z");
  });
});

describe("startOfMonthUTC / startOfQuarterUTC", () => {
  it("month snaps to first day", () => {
    const mid = new Date(Date.UTC(2026, 4, 17));
    expect(startOfMonthUTC(mid).toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("quarter snaps May to April 1", () => {
    const may = new Date(Date.UTC(2026, 4, 17));
    expect(startOfQuarterUTC(may).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("quarter snaps January to January 1", () => {
    const jan = new Date(Date.UTC(2026, 0, 17));
    expect(startOfQuarterUTC(jan).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("daysBetweenUTC", () => {
  it("counts whole days between two ISO dates", () => {
    expect(daysBetweenUTC(new Date(iso(2026, 5, 1)), new Date(iso(2026, 5, 10)))).toBe(9);
  });

  it("returns 0 for the same day", () => {
    expect(daysBetweenUTC(new Date(iso(2026, 5, 1)), new Date(iso(2026, 5, 1)))).toBe(0);
  });
});

describe("dateRange", () => {
  it("returns a 30-day window centered on today when items is empty", () => {
    const { start, end } = dateRange([]);
    const span = (end.getTime() - start.getTime()) / 86_400_000;
    expect(span).toBeGreaterThanOrEqual(28);
    expect(span).toBeLessThanOrEqual(35);
  });

  it("pads outwards and snaps to month boundaries", () => {
    const { start, end } = dateRange([{ start: iso(2026, 5, 10), end: iso(2026, 5, 20) }]);
    // Leading pad: May 10 - 7 days = May 3 → startOfMonth = May 1.
    expect(start.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    // Trailing pad: May 20 + 7 days = May 27 → next-month snap = June 1.
    expect(end.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("leading pad rolls back to prior month when item is early in the month", () => {
    const { start } = dateRange([{ start: iso(2026, 5, 5), end: iso(2026, 5, 6) }]);
    // May 5 - 7 days = April 28 → startOfMonth = April 1.
    expect(start.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("handles a single same-day item without collapsing the window", () => {
    const { start, end } = dateRange([{ start: iso(2026, 5, 10), end: iso(2026, 5, 10) }]);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it("spans years correctly", () => {
    const { start, end } = dateRange([{ start: iso(2025, 12, 20), end: iso(2026, 1, 10) }]);
    expect(start.getUTCFullYear()).toBeLessThanOrEqual(2025);
    expect(end.getUTCFullYear()).toBeGreaterThanOrEqual(2026);
  });
});

describe("pxFromDate / dateFromPx", () => {
  it("are inverses for whole-day offsets", () => {
    const anchor = new Date(iso(2026, 5, 1));
    const target = new Date(iso(2026, 5, 11));
    const px = pxFromDate(target, anchor, 18);
    expect(px).toBe(180);
    const back = dateFromPx(px, anchor, 18);
    expect(back.toISOString()).toBe(target.toISOString());
  });

  it("dateFromPx snaps to nearest day", () => {
    const anchor = new Date(iso(2026, 5, 1));
    // 27 px at 18 px/day = 1.5 days → rounds to 2 days
    const back = dateFromPx(27, anchor, 18);
    expect(back.toISOString()).toBe("2026-05-03T00:00:00.000Z");
  });

  it("dateFromPx returns anchor day when pxPerDay is 0", () => {
    const anchor = new Date(iso(2026, 5, 1));
    const back = dateFromPx(100, anchor, 0);
    expect(back.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("pxFromDate returns negative px for dates before the anchor", () => {
    const anchor = new Date(iso(2026, 5, 10));
    const before = new Date(iso(2026, 5, 5));
    expect(pxFromDate(before, anchor, 18)).toBe(-90);
  });
});

describe("monthMarkers", () => {
  const start = new Date(iso(2026, 4, 1));
  const end = new Date(iso(2026, 7, 1));

  it("generates one marker per month for zoom='month'", () => {
    const markers = monthMarkers(start, end, "month", 6);
    // Apr, May, Jun
    expect(markers.length).toBe(3);
    expect(markers[0].date.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(markers[1].date.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(markers[2].date.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("includes the year in the January label only", () => {
    const markers = monthMarkers(new Date(iso(2025, 12, 1)), new Date(iso(2026, 3, 1)), "month", 6);
    const jan = markers.find((m) => m.date.getUTCMonth() === 0);
    expect(jan?.label).toMatch(/2026/);
    const feb = markers.find((m) => m.date.getUTCMonth() === 1);
    expect(feb?.label).not.toMatch(/2026/);
  });

  it("respects pxPerDay when computing offsets", () => {
    const markers = monthMarkers(start, end, "month", 6);
    // April 1 → offset 0
    expect(markers[0].offset).toBe(0);
    // May 1 is 30 days after April 1 → 30 * 6 = 180
    expect(markers[1].offset).toBe(180);
  });

  it("zoom='week' yields one marker per Monday", () => {
    const markers = monthMarkers(new Date(iso(2026, 5, 1)), new Date(iso(2026, 5, 22)), "week", 18);
    // Mondays in May 2026: 4, 11, 18 (May 25 is the start of the next
    // bucket; we stop before `end`).
    for (const m of markers) {
      expect(m.date.getUTCDay()).toBe(1);
    }
    expect(markers.length).toBeGreaterThanOrEqual(2);
  });

  it("zoom='quarter' yields one marker per quarter", () => {
    const markers = monthMarkers(new Date(iso(2026, 1, 1)), new Date(iso(2027, 1, 1)), "quarter", 2);
    expect(markers.length).toBe(4);
    expect(markers[0].label).toMatch(/Q1 2026/);
    expect(markers[3].label).toMatch(/Q4 2026/);
  });

  it("zoom='day' yields one marker per day", () => {
    const markers = monthMarkers(new Date(iso(2026, 5, 1)), new Date(iso(2026, 5, 6)), "day", 60);
    expect(markers.length).toBe(5);
  });

  it("returns no markers when end <= start", () => {
    const d = new Date(iso(2026, 5, 1));
    expect(monthMarkers(d, d, "month", 6)).toEqual([]);
    expect(monthMarkers(d, addDaysUTC(d, -1), "month", 6)).toEqual([]);
  });
});

describe("barGeometry", () => {
  const anchor = new Date(iso(2026, 5, 1));

  it("computes left + width for a multi-day bar", () => {
    const start = new Date(iso(2026, 5, 4));
    const end = new Date(iso(2026, 5, 10));
    const { left, width } = barGeometry(start, end, anchor, 18);
    // 3 days from anchor → 54 px left
    expect(left).toBe(54);
    // 6 days span → 108 px wide
    expect(width).toBe(108);
  });

  it("falls back to a 1-day-wide bar for same-day items", () => {
    const d = new Date(iso(2026, 5, 4));
    const { width } = barGeometry(d, d, anchor, 18);
    expect(width).toBe(18);
  });

  it("scales with pxPerDay", () => {
    const start = new Date(iso(2026, 5, 1));
    const end = new Date(iso(2026, 5, 11));
    const wide = barGeometry(start, end, anchor, 60);
    const narrow = barGeometry(start, end, anchor, 6);
    expect(wide.width).toBe(narrow.width * 10);
  });
});
