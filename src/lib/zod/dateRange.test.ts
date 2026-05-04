import { describe, expect, it } from "vitest";
import { z } from "zod";
import { dateRangeRefine } from "./dateRange";

const RequiredSchema = z
  .object({
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
  })
  .refine(...dateRangeRefine("starts_at", "ends_at"));

const OptionalSchema = z
  .object({
    start_date: z.string().optional().or(z.literal("")),
    end_date: z.string().optional().or(z.literal("")),
  })
  .refine(...dateRangeRefine("start_date", "end_date"));

describe("dateRangeRefine — required pair", () => {
  it("accepts ends >= starts", () => {
    expect(RequiredSchema.safeParse({ starts_at: "2026-05-20T18:00", ends_at: "2026-05-20T20:00" }).success).toBe(true);
    expect(RequiredSchema.safeParse({ starts_at: "2026-05-20T18:00", ends_at: "2026-05-20T18:00" }).success).toBe(true);
  });

  it("rejects ends < starts", () => {
    const r = RequiredSchema.safeParse({
      starts_at: "2026-05-20T18:00",
      ends_at: "2026-05-20T16:00",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("ends_at"))).toBe(true);
      expect(r.error.issues.some((i) => /on or after/i.test(i.message))).toBe(true);
    }
  });

  it("rejects unparseable dates", () => {
    const r = RequiredSchema.safeParse({ starts_at: "garbage", ends_at: "also-garbage" });
    expect(r.success).toBe(false);
  });
});

describe("dateRangeRefine — optional pair", () => {
  it("accepts both blank", () => {
    expect(OptionalSchema.safeParse({ start_date: "", end_date: "" }).success).toBe(true);
    expect(OptionalSchema.safeParse({}).success).toBe(true);
  });

  it("accepts only start supplied", () => {
    expect(OptionalSchema.safeParse({ start_date: "2026-05-20" }).success).toBe(true);
  });

  it("accepts only end supplied", () => {
    expect(OptionalSchema.safeParse({ end_date: "2026-05-20" }).success).toBe(true);
  });

  it("rejects backwards-time when both supplied", () => {
    const r = OptionalSchema.safeParse({ start_date: "2026-05-20", end_date: "2026-05-19" });
    expect(r.success).toBe(false);
  });
});
