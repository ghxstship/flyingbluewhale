/**
 * H3-01 / IK-023 — hourBucketStart math guard.
 */
import { describe, it, expect } from "vitest";
import { hourBucketStart } from "./usage";

describe("hourBucketStart", () => {
  it("floors a mid-hour timestamp to the hour start (UTC)", () => {
    expect(hourBucketStart(new Date("2026-04-18T14:37:29.123Z"))).toBe("2026-04-18T14:00:00.000Z");
  });
  it("is a no-op for an already-on-the-hour timestamp", () => {
    expect(hourBucketStart(new Date("2026-04-18T14:00:00.000Z"))).toBe("2026-04-18T14:00:00.000Z");
  });
  it("crosses the day boundary correctly", () => {
    expect(hourBucketStart(new Date("2026-04-18T23:59:59.999Z"))).toBe("2026-04-18T23:00:00.000Z");
  });
});
