import { describe, expect, it } from "vitest";
import { metersBetween, classifyPunch, scoreQuiz, daysBetween } from "./connecteam";

describe("connecteam helpers", () => {
  describe("metersBetween", () => {
    it("returns 0 for the same point", () => {
      expect(metersBetween({ lat: 25.7617, lng: -80.1918 }, { lat: 25.7617, lng: -80.1918 })).toBe(0);
    });

    it("matches the known Miami → Fort Lauderdale distance within tolerance", () => {
      // Miami coords (25.7617, -80.1918) → Fort Lauderdale (26.1224, -80.1373)
      // True great-circle ≈ 40.4 km. Our haversine should land within
      // ±200 m of that.
      const d = metersBetween({ lat: 25.7617, lng: -80.1918 }, { lat: 26.1224, lng: -80.1373 });
      expect(d).toBeGreaterThan(40_000);
      expect(d).toBeLessThan(40_800);
    });

    it("is symmetric", () => {
      const a = { lat: 40.7128, lng: -74.006 }; // NYC
      const b = { lat: 34.0522, lng: -118.2437 }; // LA
      expect(metersBetween(a, b)).toBeCloseTo(metersBetween(b, a), 1);
    });

    it("handles antipodal points", () => {
      const a = { lat: 0, lng: 0 };
      const b = { lat: 0, lng: 180 };
      // Half the equatorial circumference ≈ 20 015 km
      expect(metersBetween(a, b)).toBeGreaterThan(20_010_000);
      expect(metersBetween(a, b)).toBeLessThan(20_020_000);
    });
  });

  describe("classifyPunch", () => {
    const zone = { center_lat: 25.7617, center_lng: -80.1918, radius_m: 150 };

    it("returns 'inside' for a punch at the center", () => {
      expect(classifyPunch({ lat: 25.7617, lng: -80.1918 }, zone)).toBe("inside");
    });

    it("returns 'inside' for a punch within the radius", () => {
      // Move ~50m north — well under the 150m radius.
      expect(classifyPunch({ lat: 25.7621, lng: -80.1918 }, zone)).toBe("inside");
    });

    it("returns 'outside' for a punch beyond the radius", () => {
      // Move ~200m north — beyond the 150m radius.
      expect(classifyPunch({ lat: 25.7635, lng: -80.1918 }, zone)).toBe("outside");
    });

    it("returns 'unknown' when either input is null", () => {
      expect(classifyPunch(null, zone)).toBe("unknown");
      expect(classifyPunch({ lat: 25.7617, lng: -80.1918 }, null)).toBe("unknown");
      expect(classifyPunch(null, null)).toBe("unknown");
    });
  });

  describe("scoreQuiz", () => {
    const Qs = [
      { id: "q1", correct_index: 0 },
      { id: "q2", correct_index: 2 },
      { id: "q3", correct_index: 1 },
    ];

    it("returns 100% pass when every answer is correct", () => {
      const r = scoreQuiz(Qs, { q1: 0, q2: 2, q3: 1 });
      expect(r.score_pct).toBe(100);
      expect(r.passed).toBe(true);
      expect(r.correct).toBe(3);
      expect(r.total).toBe(3);
    });

    it("returns 0% fail when every answer is wrong", () => {
      const r = scoreQuiz(Qs, { q1: 1, q2: 0, q3: 0 });
      expect(r.score_pct).toBe(0);
      expect(r.passed).toBe(false);
      expect(r.correct).toBe(0);
    });

    it("crosses the 70% pass threshold correctly", () => {
      // 2 / 3 = 66.67% — under default 70% threshold, so fails.
      const r = scoreQuiz(Qs, { q1: 0, q2: 2, q3: 0 });
      expect(r.score_pct).toBeCloseTo(66.67, 1);
      expect(r.passed).toBe(false);
    });

    it("respects a custom pass threshold", () => {
      const r = scoreQuiz(Qs, { q1: 0, q2: 2, q3: 0 }, 50);
      expect(r.passed).toBe(true);
    });

    it("treats missing answers as wrong (not omitted)", () => {
      const r = scoreQuiz(Qs, { q1: 0 });
      expect(r.correct).toBe(1);
      expect(r.score_pct).toBeCloseTo(33.33, 1);
    });

    it("returns a zeroed result for an empty quiz", () => {
      const r = scoreQuiz([], {});
      expect(r.score_pct).toBe(0);
      expect(r.passed).toBe(false);
      expect(r.total).toBe(0);
    });
  });

  describe("daysBetween", () => {
    it("returns 1 for the same day", () => {
      expect(daysBetween("2026-05-11", "2026-05-11")).toBe(1);
    });

    it("returns 2 for adjacent days (inclusive)", () => {
      expect(daysBetween("2026-05-11", "2026-05-12")).toBe(2);
    });

    it("clamps to 1 for end-before-start (caller bug)", () => {
      // We're not the validator — the schema enforces end >= start.
      // Internal helper just doesn't blow up.
      expect(daysBetween("2026-05-12", "2026-05-11")).toBe(1);
    });

    it("handles cross-month ranges", () => {
      // May 11 → June 11 inclusive = 32 days
      expect(daysBetween("2026-05-11", "2026-06-11")).toBe(32);
    });
  });
});
