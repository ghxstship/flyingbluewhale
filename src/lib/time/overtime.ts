/**
 * Overtime calculation.
 *
 * Pure and dependency-free so it can be tested exhaustively — getting this
 * wrong is a wage-and-hour liability, not a bug.
 *
 * ONLY THREE RULE SETS ARE CLAIMED, and that is deliberate:
 *
 *   flsa — the federal floor: >40 hours in a workweek at 1.5x.
 *   ca   — California: daily >8 at 1.5x, >12 at 2x, the 7th consecutive
 *          day special-cased, plus the weekly >40 rule.
 *   none — emit raw hours with no split. The org's HR system computes OT.
 *
 * Every other jurisdiction — other states with daily rules, union/CBA
 * agreements, multi-state workers, alternative workweek schedules — MUST
 * use `none` until its rules are actually implemented here. Silently
 * applying FLSA to a state with stricter law underpays people. `none` is
 * the honest answer, not a cop-out.
 *
 * Known limits of even the two implemented sets, stated plainly:
 *  - The workweek is assumed to start on the period's first day. A real
 *    FLSA workweek is a fixed, recurring 168-hour period the employer
 *    designates; orgs whose week doesn't align with their pay period need
 *    that configuration before these numbers are payroll-grade.
 *  - CA's alternative workweek schedules (4/10s etc.) are not modelled.
 *  - Meal/rest premiums, shift differentials, and double-time-after-8 on
 *    the 7th day of a 40+ hour week interact with these in ways a real
 *    payroll engine handles; this computes the hour buckets, not the money.
 */

export const OT_RULE_SETS = ["flsa", "ca", "none"] as const;
export type OtRuleSet = (typeof OT_RULE_SETS)[number];

/** Hours worked on one calendar day, in the worker's local timezone. */
export type DayHours = {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  hours: number;
};

export type OtSplit = {
  /** Straight time. */
  regular: number;
  /** Time and a half. */
  overtime: number;
  /** Double time. */
  doubletime: number;
};

const FLSA_WEEKLY_THRESHOLD = 40;
const CA_DAILY_OT_THRESHOLD = 8;
const CA_DAILY_DT_THRESHOLD = 12;
const CONSECUTIVE_DAYS_FOR_SEVENTH_DAY_RULE = 7;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptySplit(): OtSplit {
  return { regular: 0, overtime: 0, doubletime: 0 };
}

/** Are these ISO dates consecutive calendar days? */
function isNextDay(prev: string, next: string): boolean {
  const p = new Date(`${prev}T00:00:00Z`).getTime();
  const n = new Date(`${next}T00:00:00Z`).getTime();
  return n - p === 86_400_000;
}

/**
 * Index every day with how many consecutive worked days precede it,
 * so the CA 7th-day rule can fire. A gap resets the streak.
 */
function withStreak(days: DayHours[]): Array<DayHours & { streak: number }> {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const out: Array<DayHours & { streak: number }> = [];
  let streak = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (d.hours <= 0) {
      // A zero-hour day breaks the streak — it isn't a worked day.
      streak = 0;
      prev = d.date;
      out.push({ ...d, streak: 0 });
      continue;
    }
    streak = prev && isNextDay(prev, d.date) && streak > 0 ? streak + 1 : 1;
    prev = d.date;
    out.push({ ...d, streak });
  }
  return out;
}

function flsaSplit(days: DayHours[]): OtSplit {
  const total = days.reduce((s, d) => s + Math.max(0, d.hours), 0);
  return {
    regular: round2(Math.min(total, FLSA_WEEKLY_THRESHOLD)),
    overtime: round2(Math.max(0, total - FLSA_WEEKLY_THRESHOLD)),
    doubletime: 0,
  };
}

function caSplit(days: DayHours[]): OtSplit {
  const split = emptySplit();

  for (const day of withStreak(days)) {
    const hours = Math.max(0, day.hours);
    if (hours === 0) continue;

    // The 7th consecutive day in a workweek: every hour is at least OT,
    // and anything past 8 is DT. No straight time at all.
    if (day.streak >= CONSECUTIVE_DAYS_FOR_SEVENTH_DAY_RULE) {
      split.overtime += Math.min(hours, CA_DAILY_OT_THRESHOLD);
      split.doubletime += Math.max(0, hours - CA_DAILY_OT_THRESHOLD);
      continue;
    }

    split.regular += Math.min(hours, CA_DAILY_OT_THRESHOLD);
    split.overtime += Math.max(0, Math.min(hours, CA_DAILY_DT_THRESHOLD) - CA_DAILY_OT_THRESHOLD);
    split.doubletime += Math.max(0, hours - CA_DAILY_DT_THRESHOLD);
  }

  // Weekly rule: hours beyond 40 STRAIGHT-TIME hours are overtime. Applied
  // to the straight-time bucket only, so hours already paid as daily OT
  // are not counted twice — the mistake that would inflate every long week.
  if (split.regular > FLSA_WEEKLY_THRESHOLD) {
    const excess = split.regular - FLSA_WEEKLY_THRESHOLD;
    split.regular = FLSA_WEEKLY_THRESHOLD;
    split.overtime += excess;
  }

  return { regular: round2(split.regular), overtime: round2(split.overtime), doubletime: round2(split.doubletime) };
}

/**
 * Split a week's daily hours into regular / overtime / doubletime.
 *
 * `days` should be ONE workweek. Passing a longer span to a weekly rule
 * (flsa, or CA's weekly component) would apply the 40-hour threshold across
 * the whole span and under-report overtime, so callers must group first.
 */
export function splitOvertime(days: DayHours[], ruleSet: OtRuleSet): OtSplit {
  switch (ruleSet) {
    case "none": {
      const total = days.reduce((s, d) => s + Math.max(0, d.hours), 0);
      return { regular: round2(total), overtime: 0, doubletime: 0 };
    }
    case "flsa":
      return flsaSplit(days);
    case "ca":
      return caSplit(days);
  }
}

/**
 * Group daily hours into workweeks starting on `weekStartsOn`, so a pay
 * period longer than a week (biweekly, semimonthly, monthly) applies the
 * weekly threshold per week rather than across the whole period.
 *
 * @param weekStartsOn 0=Sunday … 6=Saturday. FLSA lets an employer
 *   designate any fixed day; Sunday is the common default.
 */
export function groupIntoWorkweeks(days: DayHours[], weekStartsOn = 0): DayHours[][] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const weeks = new Map<string, DayHours[]>();
  for (const d of sorted) {
    const dt = new Date(`${d.date}T00:00:00Z`);
    const shift = (dt.getUTCDay() - weekStartsOn + 7) % 7;
    const weekStart = new Date(dt.getTime() - shift * 86_400_000).toISOString().slice(0, 10);
    const list = weeks.get(weekStart) ?? [];
    list.push(d);
    weeks.set(weekStart, list);
  }
  return [...weeks.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);
}

/** Split a whole pay period, applying weekly thresholds per workweek. */
export function splitPeriodOvertime(days: DayHours[], ruleSet: OtRuleSet, weekStartsOn = 0): OtSplit {
  const total = emptySplit();
  for (const week of groupIntoWorkweeks(days, weekStartsOn)) {
    const s = splitOvertime(week, ruleSet);
    total.regular += s.regular;
    total.overtime += s.overtime;
    total.doubletime += s.doubletime;
  }
  return { regular: round2(total.regular), overtime: round2(total.overtime), doubletime: round2(total.doubletime) };
}

/** Roll time entries up into per-day hours in a given IANA timezone. */
export function dailyHoursFromEntries(
  entries: Array<{ started_at: string; duration_minutes: number | null }>,
  timeZone = "UTC",
): DayHours[] {
  const byDate = new Map<string, number>();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  for (const e of entries) {
    if (e.duration_minutes == null) continue; // still open — no duration yet
    // A cross-midnight shift attributes to the day it STARTED, matching the
    // pay-period rule. Splitting it across days would change daily-OT
    // outcomes under CA and needs a policy decision, not a default.
    const date = fmt.format(new Date(e.started_at));
    byDate.set(date, (byDate.get(date) ?? 0) + e.duration_minutes / 60);
  }
  return [...byDate.entries()]
    .map(([date, hours]) => ({ date, hours: round2(hours) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
