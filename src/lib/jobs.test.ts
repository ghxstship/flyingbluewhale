/**
 * H3-02 / IK-027 — retry backoff math guards.
 */
import { describe, it, expect } from "vitest";
import { computeBackoffSeconds } from "./jobs";

describe("computeBackoffSeconds", () => {
  // `rand` returns 0 → jitter = 0.5 → backoff = round(2^a * 0.5)
  const noJitter = () => 0;
  // `rand` returns 1 → jitter = 1.5 → backoff = round(2^a * 1.5)
  const fullJitter = () => 1;

  it("attempt 0 is 1 second with full jitter, 1s with no jitter", () => {
    expect(computeBackoffSeconds(0, noJitter)).toBe(1);
    expect(computeBackoffSeconds(0, fullJitter)).toBe(2);
  });

  it("doubles per attempt up through attempt 8", () => {
    // 2^3 = 8 → 4 to 12 with jitter; 2^5 = 32 → 16 to 48
    expect(computeBackoffSeconds(3, noJitter)).toBe(4);
    expect(computeBackoffSeconds(3, fullJitter)).toBe(12);
    expect(computeBackoffSeconds(5, noJitter)).toBe(16);
    expect(computeBackoffSeconds(5, fullJitter)).toBe(48);
  });

  it("clamps to 600 seconds (10 min) regardless of attempt count", () => {
    for (let a = 10; a < 50; a++) {
      expect(computeBackoffSeconds(a, fullJitter)).toBeLessThanOrEqual(600);
      expect(computeBackoffSeconds(a, noJitter)).toBeLessThanOrEqual(600);
    }
  });

  it("negative / non-finite inputs return 0", () => {
    expect(computeBackoffSeconds(-1)).toBe(0);
    expect(computeBackoffSeconds(NaN)).toBe(0);
    expect(computeBackoffSeconds(Infinity)).toBe(0);
  });
});
