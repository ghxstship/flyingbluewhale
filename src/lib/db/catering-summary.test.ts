import { describe, expect, it } from "vitest";
// Import through the canonical module so the re-export path is what the
// test certifies (vitest aliases `server-only` to a no-op mock).
import { deriveMealSummary, MEAL_PERIODS } from "@/lib/db/assignments";

describe("deriveMealSummary", () => {
  it("20-day contract × lunch every contract day = 20 meals", () => {
    const s = deriveMealSummary({
      meal_periods: ["lunch"],
      starts_on: "2026-10-01",
      ends_on: "2026-10-20",
      every_contract_day: true,
      excluded_dates: [],
    });
    expect(s.days).toBe(20);
    expect(s.meals).toBe(20);
    expect(s.label).toBe("Lunch Only · 20 Days · 20 Meals");
  });

  it("subtracts in-range excluded dates when not every contract day", () => {
    const s = deriveMealSummary({
      meal_periods: ["lunch"],
      starts_on: "2026-10-01",
      ends_on: "2026-10-20",
      every_contract_day: false,
      excluded_dates: ["2026-10-05", "2026-10-06", "2026-09-30", "2026-10-05"],
    });
    // 20 - 2 in-range (out-of-range + duplicate excluded dates ignored).
    expect(s.days).toBe(18);
    expect(s.meals).toBe(18);
  });

  it("ignores excluded dates when every_contract_day is set", () => {
    const s = deriveMealSummary({
      meal_periods: ["breakfast", "dinner"],
      starts_on: "2026-10-01",
      ends_on: "2026-10-10",
      every_contract_day: true,
      excluded_dates: ["2026-10-02"],
    });
    expect(s.days).toBe(10);
    expect(s.meals).toBe(20);
    expect(s.label).toBe("Breakfast & Dinner · 10 Days · 20 Meals");
  });

  it("multiplies days by every selected period", () => {
    const s = deriveMealSummary({
      meal_periods: [...MEAL_PERIODS],
      starts_on: "2026-10-01",
      ends_on: "2026-10-03",
      every_contract_day: true,
      excluded_dates: [],
    });
    expect(s.days).toBe(3);
    expect(s.meals).toBe(9);
    expect(s.label).toBe("Breakfast & Lunch & Dinner · 3 Days · 9 Meals");
  });

  it("singular units read as Day / Meal", () => {
    const s = deriveMealSummary({
      meal_periods: ["lunch"],
      starts_on: "2026-10-01",
      ends_on: "2026-10-01",
      every_contract_day: true,
      excluded_dates: [],
    });
    expect(s.label).toBe("Lunch Only · 1 Day · 1 Meal");
  });

  it("returns zeros for a missing or inverted range", () => {
    expect(
      deriveMealSummary({
        meal_periods: ["lunch"],
        starts_on: null,
        ends_on: "2026-10-20",
        every_contract_day: true,
        excluded_dates: [],
      }).days,
    ).toBe(0);
    expect(
      deriveMealSummary({
        meal_periods: ["lunch"],
        starts_on: "2026-10-20",
        ends_on: "2026-10-01",
        every_contract_day: true,
        excluded_dates: [],
      }).meals,
    ).toBe(0);
  });

  it("zero periods yields zero meals and an explicit label", () => {
    const s = deriveMealSummary({
      meal_periods: [],
      starts_on: "2026-10-01",
      ends_on: "2026-10-20",
      every_contract_day: true,
      excluded_dates: [],
    });
    expect(s.days).toBe(20);
    expect(s.meals).toBe(0);
    expect(s.label).toBe("No Meal Periods · 20 Days · 0 Meals");
  });
});
