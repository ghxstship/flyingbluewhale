import { describe, it, expect } from "vitest";
import { nextRunFromRrule } from "../automations/schedule";

// All test instants are UTC. The parser computes next-firing in UTC; the
// `timezone` parameter is reserved for future BYHOUR-in-local-time support
// and is ignored by the v1 parser.

describe("nextRunFromRrule", () => {
  it("returns null for unparseable rules", () => {
    expect(nextRunFromRrule("not-an-rrule", new Date("2026-05-04T00:00:00Z"))).toBeNull();
    expect(nextRunFromRrule("FREQ=YEARLY", new Date("2026-05-04T00:00:00Z"))).toBeNull();
    expect(nextRunFromRrule("", new Date("2026-05-04T00:00:00Z"))).toBeNull();
  });

  it("FREQ=DAILY with no BYHOUR fires at midnight UTC", () => {
    const after = new Date("2026-05-04T12:34:56Z");
    const next = nextRunFromRrule("FREQ=DAILY", after);
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-05-05T00:00:00.000Z");
  });

  it("FREQ=DAILY;BYHOUR=9 returns 09:00 UTC tomorrow when 'after' is past 09:00", () => {
    const after = new Date("2026-05-04T10:00:00Z");
    const next = nextRunFromRrule("FREQ=DAILY;BYHOUR=9", after);
    expect(next!.toISOString()).toBe("2026-05-05T09:00:00.000Z");
  });

  it("FREQ=DAILY;BYHOUR=9 returns 09:00 UTC same day when 'after' is before 09:00", () => {
    const after = new Date("2026-05-04T07:00:00Z");
    const next = nextRunFromRrule("FREQ=DAILY;BYHOUR=9", after);
    expect(next!.toISOString()).toBe("2026-05-04T09:00:00.000Z");
  });

  it("FREQ=DAILY;BYHOUR=9;BYMINUTE=30 honors both BYHOUR and BYMINUTE", () => {
    const after = new Date("2026-05-04T07:00:00Z");
    const next = nextRunFromRrule("FREQ=DAILY;BYHOUR=9;BYMINUTE=30", after);
    expect(next!.toISOString()).toBe("2026-05-04T09:30:00.000Z");
  });

  it("FREQ=WEEKLY;BYDAY=MO,FR returns the next Monday or Friday", () => {
    // Wed May 6, 2026 → next Friday is May 8, 2026.
    const wed = new Date("2026-05-06T12:00:00Z");
    const nextFri = nextRunFromRrule("FREQ=WEEKLY;BYDAY=MO,FR", wed);
    expect(nextFri!.toISOString()).toBe("2026-05-08T00:00:00.000Z");

    // Sat May 9, 2026 → next Monday is May 11, 2026.
    const sat = new Date("2026-05-09T12:00:00Z");
    const nextMon = nextRunFromRrule("FREQ=WEEKLY;BYDAY=MO,FR", sat);
    expect(nextMon!.toISOString()).toBe("2026-05-11T00:00:00.000Z");
  });

  it("FREQ=WEEKLY;BYDAY=MO with BYHOUR/BYMINUTE picks the right time on the right day", () => {
    // Tue May 5, 2026 09:00 → next Monday at 14:30 UTC = May 11.
    const tue = new Date("2026-05-05T09:00:00Z");
    const next = nextRunFromRrule("FREQ=WEEKLY;BYDAY=MO;BYHOUR=14;BYMINUTE=30", tue);
    expect(next!.toISOString()).toBe("2026-05-11T14:30:00.000Z");
  });

  it("FREQ=HOURLY;INTERVAL=4 returns 4 hours later from a clean boundary", () => {
    const after = new Date("2026-05-04T08:00:00Z");
    const next = nextRunFromRrule("FREQ=HOURLY;INTERVAL=4", after);
    expect(next!.toISOString()).toBe("2026-05-04T08:00:00.000Z");

    const next2 = nextRunFromRrule("FREQ=HOURLY;INTERVAL=4", new Date("2026-05-04T09:00:00Z"));
    expect(next2!.toISOString()).toBe("2026-05-04T12:00:00.000Z");
  });

  it("FREQ=MINUTELY snaps up to the next minute boundary", () => {
    const after = new Date("2026-05-04T08:00:30Z");
    const next = nextRunFromRrule("FREQ=MINUTELY", after);
    expect(next!.toISOString()).toBe("2026-05-04T08:01:00.000Z");
  });

  it("FREQ=MINUTELY;INTERVAL=15 lands on 15-minute boundaries", () => {
    const after = new Date("2026-05-04T08:07:30Z");
    const next = nextRunFromRrule("FREQ=MINUTELY;INTERVAL=15", after);
    expect(next!.toISOString()).toBe("2026-05-04T08:15:00.000Z");
  });

  it("RRULE: prefix is tolerated", () => {
    const after = new Date("2026-05-04T07:00:00Z");
    const next = nextRunFromRrule("RRULE:FREQ=DAILY;BYHOUR=9", after);
    expect(next!.toISOString()).toBe("2026-05-04T09:00:00.000Z");
  });

  it("FREQ=DAILY;BYHOUR=9,17 picks the earliest available hour each day", () => {
    // 08:00 → 09:00 same day.
    const a = nextRunFromRrule("FREQ=DAILY;BYHOUR=9,17", new Date("2026-05-04T08:00:00Z"));
    expect(a!.toISOString()).toBe("2026-05-04T09:00:00.000Z");
    // 10:00 → 17:00 same day.
    const b = nextRunFromRrule("FREQ=DAILY;BYHOUR=9,17", new Date("2026-05-04T10:00:00Z"));
    expect(b!.toISOString()).toBe("2026-05-04T17:00:00.000Z");
    // 18:00 → 09:00 next day.
    const c = nextRunFromRrule("FREQ=DAILY;BYHOUR=9,17", new Date("2026-05-04T18:00:00Z"));
    expect(c!.toISOString()).toBe("2026-05-05T09:00:00.000Z");
  });
});
