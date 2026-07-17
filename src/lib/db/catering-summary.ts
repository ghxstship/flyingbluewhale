// Kit 30 — catering meal-period derivation.
//
// Pure date math over the `catering_assignment_details` row shape
// ("Lunch Only · 20 Days · 20 Meals"). Deliberately NOT in
// `src/lib/db/assignments.ts` itself: that module is `server-only`, and the
// Advance Cart composes this summary live in a client component. The
// canonical import path is still `@/lib/db/assignments` (which re-exports
// everything here); this file exists so the pure math has a client-safe home.
//
// The derived numbers are never stored — the columns are the SSOT and the
// summary recomputes everywhere it renders (cart line, fulfillment queue,
// field surfaces).

/** Mirrors the CHECK constraint on catering_assignment_details.meal_periods. */
export const MEAL_PERIODS = ["breakfast", "lunch", "dinner"] as const;
export type MealPeriod = (typeof MEAL_PERIODS)[number];

export const MEAL_PERIOD_LABEL: Record<MealPeriod, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** The columns of catering_assignment_details this derivation reads. */
export type CateringSummaryInput = {
  meal_periods: readonly string[];
  starts_on: string | null;
  ends_on: string | null;
  every_contract_day: boolean;
  excluded_dates: readonly string[];
};

export type CateringSummary = {
  /** Serviced days inside the range (0 when the range is missing/invalid). */
  days: number;
  /** days × meal periods per day. */
  meals: number;
  /** "Lunch Only · 20 Days · 20 Meals" — middot separators, Title Case. */
  label: string;
};

/** Parse YYYY-MM-DD as a UTC day number; null when absent/invalid. */
function utcDay(date: string | null): number | null {
  if (!date) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : null;
}

/**
 * Derive the day count, meal count, and display label for a catering line.
 *
 * days = inclusive length of [starts_on, ends_on]. When
 * `every_contract_day` is true the whole range is serviced and
 * `excluded_dates` is ignored; otherwise each excluded date that falls
 * inside the range subtracts one day. meals = days × meal_periods.length.
 */
export function deriveMealSummary(input: CateringSummaryInput): CateringSummary {
  const start = utcDay(input.starts_on);
  const end = utcDay(input.ends_on);

  let days = 0;
  if (start !== null && end !== null && end >= start) {
    days = end - start + 1;
    if (!input.every_contract_day && input.excluded_dates.length > 0) {
      const excluded = new Set<number>();
      for (const d of input.excluded_dates) {
        const day = utcDay(d);
        if (day !== null && day >= start && day <= end) excluded.add(day);
      }
      days = Math.max(0, days - excluded.size);
    }
  }

  // Canonical order, deduped, unknown values dropped (the DB CHECK already
  // forbids them — this keeps the pure function total).
  const periods = MEAL_PERIODS.filter((p) => input.meal_periods.includes(p));
  const meals = days * periods.length;

  const first = periods[0];
  const periodsLabel =
    first === undefined
      ? "No Meal Periods"
      : periods.length === 1
        ? `${MEAL_PERIOD_LABEL[first]} Only`
        : periods.map((p) => MEAL_PERIOD_LABEL[p]).join(" & ");

  const label = `${periodsLabel} · ${days} ${days === 1 ? "Day" : "Days"} · ${meals} ${meals === 1 ? "Meal" : "Meals"}`;
  return { days, meals, label };
}
