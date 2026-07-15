import { describe, expect, it } from "vitest";
import {
  metersBetween,
  classifyPunch,
  resolveZoneForPunch,
  scoreQuiz,
  daysBetween,
  type ZoneCandidate,
} from "./workforce";

describe("the deskless-workforce suite helpers", () => {
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

  describe("resolveZoneForPunch", () => {
    const gate: ZoneCandidate = {
      id: "gate",
      name: "Load-In Gate",
      center_lat: 25.7617,
      center_lng: -80.1918,
      radius_m: 150,
    };
    const center = { lat: 25.7617, lng: -80.1918 };

    it("resolves a punch inside a zone to that zone", () => {
      const r = resolveZoneForPunch(center, [gate]);
      expect(r.state).toBe("inside");
      expect(r.zone?.id).toBe("gate");
      expect(r.distanceM).toBeCloseTo(0, 1);
    });

    it("resolves a punch beyond the radius to outside, with no zone attributed", () => {
      const r = resolveZoneForPunch({ lat: 25.7635, lng: -80.1918 }, [gate]);
      expect(r.state).toBe("outside");
      expect(r.zone).toBeNull();
    });

    it("reports the nearest zone and distance even when outside, for operator copy", () => {
      const r = resolveZoneForPunch({ lat: 25.7635, lng: -80.1918 }, [gate]);
      expect(r.nearestZone?.name).toBe("Load-In Gate");
      expect(r.distanceM).toBeGreaterThan(150);
    });

    // The zero-zone defect. An org that never configured zones has nothing
    // for a punch to be outside OF; tagging these 'outside' would lock out
    // every worker the moment a block policy is enabled.
    it("returns 'unknown' when the org has no zones, never 'outside'", () => {
      const r = resolveZoneForPunch(center, []);
      expect(r.state).toBe("unknown");
      expect(r.zone).toBeNull();
      expect(r.nearestZone).toBeNull();
      expect(r.distanceM).toBeNull();
    });

    it("returns 'unknown' for a GPS-less punch even when zones exist", () => {
      const r = resolveZoneForPunch(null, [gate]);
      expect(r.state).toBe("unknown");
      expect(r.zone).toBeNull();
    });

    // The first-inside-wins defect: callers took the first containing zone
    // in arbitrary DB order, so overlapping zones attributed
    // nondeterministically. Containment must beat proximity, and among
    // containing zones the nearest center wins — regardless of input order.
    it("prefers a containing zone over a nearer non-containing one", () => {
      // Punch sits inside the big zone but outside the tiny one, whose
      // center is closer.
      const punch = { lat: 25.765, lng: -80.1918 };
      const big: ZoneCandidate = { id: "big", center_lat: 25.7617, center_lng: -80.1918, radius_m: 1000 };
      const tiny: ZoneCandidate = { id: "tiny", center_lat: 25.7655, center_lng: -80.1918, radius_m: 20 };
      expect(metersBetween(punch, { lat: tiny.center_lat, lng: tiny.center_lng })).toBeGreaterThan(tiny.radius_m);

      expect(resolveZoneForPunch(punch, [tiny, big]).zone?.id).toBe("big");
      expect(resolveZoneForPunch(punch, [big, tiny]).zone?.id).toBe("big");
    });

    it("picks the nearest containing zone when several overlap, order-independently", () => {
      const punch = { lat: 25.7617, lng: -80.1918 };
      const near: ZoneCandidate = { id: "near", center_lat: 25.7618, center_lng: -80.1918, radius_m: 500 };
      const far: ZoneCandidate = { id: "far", center_lat: 25.764, center_lng: -80.1918, radius_m: 500 };

      expect(resolveZoneForPunch(punch, [far, near]).zone?.id).toBe("near");
      expect(resolveZoneForPunch(punch, [near, far]).zone?.id).toBe("near");
    });

    it("treats a punch exactly on the boundary as inside", () => {
      const r = resolveZoneForPunch({ lat: 25.7617, lng: -80.1918 }, [
        { id: "z", center_lat: 25.7617, center_lng: -80.1918, radius_m: 0 },
      ]);
      expect(r.state).toBe("inside");
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
