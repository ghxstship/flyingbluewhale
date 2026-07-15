import { describe, expect, it } from "vitest";
import {
  dailyHoursFromEntries,
  groupIntoWorkweeks,
  splitOvertime,
  splitPeriodOvertime,
  type DayHours,
} from "./overtime";

/** Mon–Sun of a single workweek, hours per day. */
function week(...hours: number[]): DayHours[] {
  // 2026-03-01 is a Sunday, so this is a clean Sun-start workweek.
  return hours.map((h, i) => ({ date: `2026-03-0${i + 1}`, hours: h }));
}

const sum = (s: { regular: number; overtime: number; doubletime: number }) =>
  s.regular + s.overtime + s.doubletime;

describe("splitOvertime — none", () => {
  it("emits raw hours with no split, for orgs whose HR system computes OT", () => {
    expect(splitOvertime(week(10, 10, 10, 10, 10), "none")).toEqual({
      regular: 50,
      overtime: 0,
      doubletime: 0,
    });
  });
});

describe("splitOvertime — FLSA", () => {
  it("pays 40 straight and the rest at OT", () => {
    // The canonical case from the plan: 45 h in a week -> 40 REG + 5 OT.
    expect(splitOvertime(week(9, 9, 9, 9, 9), "flsa")).toEqual({ regular: 40, overtime: 5, doubletime: 0 });
  });

  it("has no daily rule — a 12h day inside a short week is all straight time", () => {
    expect(splitOvertime(week(12, 4), "flsa")).toEqual({ regular: 16, overtime: 0, doubletime: 0 });
  });

  it("never emits double time", () => {
    expect(splitOvertime(week(24, 24, 24), "flsa").doubletime).toBe(0);
  });

  it("pays exactly 40 with no overtime at the threshold", () => {
    expect(splitOvertime(week(8, 8, 8, 8, 8), "flsa")).toEqual({ regular: 40, overtime: 0, doubletime: 0 });
  });

  it("conserves total hours", () => {
    expect(sum(splitOvertime(week(9, 9, 9, 9, 9), "flsa"))).toBe(45);
  });
});

describe("splitOvertime — California", () => {
  it("pays over 8 in a day at OT", () => {
    // The plan's case: 10 h in a day -> 8 REG + 2 OT.
    expect(splitOvertime(week(10), "ca")).toEqual({ regular: 8, overtime: 2, doubletime: 0 });
  });

  it("pays over 12 in a day at double time", () => {
    // 14 h -> 8 REG + 4 OT (hours 8-12) + 2 DT (hours 12-14).
    expect(splitOvertime(week(14), "ca")).toEqual({ regular: 8, overtime: 4, doubletime: 2 });
  });

  it("applies the weekly rule to straight time only, never double-counting daily OT", () => {
    // 6 x 9h = 54h. Daily: each day 8 REG + 1 OT -> 48 REG + 6 OT.
    // Weekly: REG over 40 (8h) moves to OT -> 40 REG + 14 OT.
    // The bug this guards: counting the 8h weekly excess again on top of
    // hours already paid as daily OT.
    const s = splitOvertime(week(9, 9, 9, 9, 9, 9), "ca");
    expect(s).toEqual({ regular: 40, overtime: 14, doubletime: 0 });
    expect(sum(s)).toBe(54);
  });

  it("pays the 7th consecutive day at OT, with no straight time at all", () => {
    // 7 straight days of 8h: days 1-6 straight, day 7 entirely OT.
    // Daily pass -> 48 REG + 8 OT; weekly pulls 8 REG over 40 into OT.
    const s = splitOvertime(week(8, 8, 8, 8, 8, 8, 8), "ca");
    expect(s.doubletime).toBe(0);
    expect(s.regular).toBe(40);
    expect(s.overtime).toBe(16);
    expect(sum(s)).toBe(56);
  });

  it("pays past 8 hours on the 7th consecutive day at double time", () => {
    const s = splitOvertime(week(8, 8, 8, 8, 8, 8, 10), "ca");
    // Day 7: 8 OT + 2 DT.
    expect(s.doubletime).toBe(2);
    expect(sum(s)).toBe(58);
  });

  it("does not fire the 7th-day rule when a day off breaks the streak", () => {
    // A zero-hour day resets the streak, so the 8th calendar day is only
    // the 7th WORKED day but not the 7th CONSECUTIVE one.
    const days: DayHours[] = [
      { date: "2026-03-01", hours: 8 },
      { date: "2026-03-02", hours: 8 },
      { date: "2026-03-03", hours: 0 }, // day off
      { date: "2026-03-04", hours: 8 },
      { date: "2026-03-05", hours: 8 },
      { date: "2026-03-06", hours: 8 },
      { date: "2026-03-07", hours: 8 },
    ];
    const s = splitOvertime(days, "ca");
    expect(s.doubletime).toBe(0);
    // 48h total, none on a 7th consecutive day: 40 REG + 8 OT (weekly rule).
    expect(s).toEqual({ regular: 40, overtime: 8, doubletime: 0 });
  });

  it("is stricter than FLSA for the same hours", () => {
    // 4 x 10h = 40h. FLSA sees no overtime; CA sees 8h of daily OT.
    expect(splitOvertime(week(10, 10, 10, 10), "flsa")).toEqual({ regular: 40, overtime: 0, doubletime: 0 });
    expect(splitOvertime(week(10, 10, 10, 10), "ca")).toEqual({ regular: 32, overtime: 8, doubletime: 0 });
  });

  it("conserves total hours across every shape", () => {
    for (const days of [week(10), week(14), week(9, 9, 9, 9, 9, 9), week(8, 8, 8, 8, 8, 8, 8), week(24)]) {
      const total = days.reduce((s, d) => s + d.hours, 0);
      expect(sum(splitOvertime(days, "ca")), JSON.stringify(days)).toBeCloseTo(total, 2);
    }
  });
});

describe("edge cases", () => {
  it("returns zeros for an empty week", () => {
    for (const rs of ["flsa", "ca", "none"] as const) {
      expect(splitOvertime([], rs)).toEqual({ regular: 0, overtime: 0, doubletime: 0 });
    }
  });

  it("ignores negative hours rather than crediting them", () => {
    expect(splitOvertime([{ date: "2026-03-01", hours: -5 }], "flsa").regular).toBe(0);
  });

  it("handles fractional hours without drift", () => {
    const s = splitOvertime(week(8.25, 8.25, 8.25, 8.25, 8.25), "flsa");
    expect(s.regular).toBe(40);
    expect(s.overtime).toBe(1.25);
  });
});

describe("groupIntoWorkweeks", () => {
  it("splits a biweekly period into two weeks so the 40h threshold is per week", () => {
    // 14 consecutive days of 5h = 70h. As ONE span, FLSA would say
    // 40 REG + 30 OT. Per workweek it is 35h each — no overtime at all.
    const days: DayHours[] = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 2, 1 + i)).toISOString().slice(0, 10),
      hours: 5,
    }));
    expect(groupIntoWorkweeks(days).length).toBe(2);
    expect(splitPeriodOvertime(days, "flsa")).toEqual({ regular: 70, overtime: 0, doubletime: 0 });
    // Proving the failure it prevents:
    expect(splitOvertime(days, "flsa")).toEqual({ regular: 40, overtime: 30, doubletime: 0 });
  });

  it("honours a non-Sunday workweek start", () => {
    const days: DayHours[] = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 2, 1 + i)).toISOString().slice(0, 10),
      hours: 8,
    }));
    // 2026-03-01 is a Sunday. Starting the week on Monday splits this run.
    expect(groupIntoWorkweeks(days, 0).length).toBe(1);
    expect(groupIntoWorkweeks(days, 1).length).toBe(2);
  });
});

describe("dailyHoursFromEntries", () => {
  it("rolls entries up per day", () => {
    const d = dailyHoursFromEntries([
      { started_at: "2026-03-03T08:00:00Z", duration_minutes: 480 },
      { started_at: "2026-03-03T18:00:00Z", duration_minutes: 120 },
      { started_at: "2026-03-04T08:00:00Z", duration_minutes: 360 },
    ]);
    expect(d).toEqual([
      { date: "2026-03-03", hours: 10 },
      { date: "2026-03-04", hours: 6 },
    ]);
  });

  it("skips open entries — an unfinished punch has no hours yet", () => {
    expect(
      dailyHoursFromEntries([{ started_at: "2026-03-03T08:00:00Z", duration_minutes: null }]),
    ).toEqual([]);
  });

  it("attributes a cross-midnight shift to the day it started", () => {
    // 22:00 -> 06:00. Attributing to the start day matches the pay-period
    // rule; splitting it would change CA daily-OT outcomes.
    const d = dailyHoursFromEntries([{ started_at: "2026-03-03T22:00:00Z", duration_minutes: 480 }]);
    expect(d).toEqual([{ date: "2026-03-03", hours: 8 }]);
  });

  it("buckets by the worker's timezone, not UTC", () => {
    // 03:00 UTC on the 4th is 22:00 on the 3rd in New York — a different
    // workday, and under CA-style daily rules a different OT outcome.
    const utc = dailyHoursFromEntries([{ started_at: "2026-03-04T03:00:00Z", duration_minutes: 240 }], "UTC");
    const ny = dailyHoursFromEntries([{ started_at: "2026-03-04T03:00:00Z", duration_minutes: 240 }], "America/New_York");
    expect(utc[0]?.date).toBe("2026-03-04");
    expect(ny[0]?.date).toBe("2026-03-03");
  });
});
