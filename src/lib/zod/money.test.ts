import { describe, expect, it } from "vitest";
import { z } from "zod";
import { moneyDollarsString } from "./money";

const StrictSchema = z.object({ amount: moneyDollarsString({ allowZero: false }) });
const OptionalSchema = z.object({ amount: moneyDollarsString({ allowEmpty: true }) });

describe("moneyDollarsString — strict (expenses, invoices)", () => {
  it("accepts a positive plain number", () => {
    expect(StrictSchema.safeParse({ amount: "27500" }).success).toBe(true);
    expect(StrictSchema.safeParse({ amount: "27500.50" }).success).toBe(true);
  });

  it("accepts a positive number with $ and commas", () => {
    expect(StrictSchema.safeParse({ amount: "$27,500.00" }).success).toBe(true);
  });

  it("rejects a negative number", () => {
    const r = StrictSchema.safeParse({ amount: "-1000" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => /negative/i.test(i.message))).toBe(true);
    }
  });

  it("rejects zero when allowZero is false", () => {
    const r = StrictSchema.safeParse({ amount: "0" });
    expect(r.success).toBe(false);
  });

  it("rejects non-numeric input", () => {
    const r = StrictSchema.safeParse({ amount: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => /must be a number/i.test(i.message))).toBe(true);
    }
  });

  it("rejects values above the ceiling", () => {
    const r = StrictSchema.safeParse({ amount: "999999999" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => /exceeds maximum/i.test(i.message))).toBe(true);
    }
  });

  it("rejects empty string when allowEmpty is false (default)", () => {
    const r = StrictSchema.safeParse({ amount: "" });
    expect(r.success).toBe(false);
  });
});

describe("moneyDollarsString — optional (proposals, leads)", () => {
  it("accepts blank", () => {
    expect(OptionalSchema.safeParse({ amount: "" }).success).toBe(true);
  });

  it("rejects negative when supplied", () => {
    expect(OptionalSchema.safeParse({ amount: "-50" }).success).toBe(false);
  });

  it("accepts zero (allowZero defaults to true)", () => {
    expect(OptionalSchema.safeParse({ amount: "0" }).success).toBe(true);
  });
});
