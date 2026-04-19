/**
 * H2-04 / IK-015 — pagination primitive guards.
 */
import { describe, it, expect } from "vitest";
import { decodeCursor } from "./resource";

describe("decodeCursor", () => {
  it("returns 0 for null / undefined / empty cursor", () => {
    expect(decodeCursor(null)).toBe(0);
    expect(decodeCursor(undefined)).toBe(0);
    expect(decodeCursor("")).toBe(0);
  });
  it("parses a numeric offset", () => {
    expect(decodeCursor("0")).toBe(0);
    expect(decodeCursor("50")).toBe(50);
    expect(decodeCursor("1000")).toBe(1000);
  });
  it("floors a fractional offset", () => {
    expect(decodeCursor("12.7")).toBe(12);
  });
  it("rejects negatives and non-numeric garbage by returning 0", () => {
    expect(decodeCursor("-5")).toBe(0);
    expect(decodeCursor("not-a-number")).toBe(0);
    expect(decodeCursor("' OR 1=1 --")).toBe(0);
  });
});
