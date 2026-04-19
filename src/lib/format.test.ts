import { describe, expect, it } from "vitest";
import { dollarsToCents, generateNumber, slugify, timeAgo } from "./format";
import { formatDate, formatMoney } from "./i18n/format";

describe("formatMoney", () => {
  it("formats cents to USD by default", () => {
    expect(formatMoney(1234500)).toBe("$12,345.00");
  });
  it("returns em-dash for null/undefined", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
  });
  it("respects currency override", () => {
    expect(formatMoney(100000, "EUR")).toContain("€");
  });
});

describe("formatDate", () => {
  it("returns em-dash for null", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
  it("returns em-dash for invalid dates", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
  it("formats ISO strings", () => {
    const d = formatDate("2026-04-16", "medium");
    expect(d).toMatch(/2026/);
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for a fresh timestamp", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });
  it("returns minutes for < 1h", () => {
    const fiveAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(fiveAgo)).toBe("5m ago");
  });
  it("returns hours for < 24h", () => {
    const threeHourAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(timeAgo(threeHourAgo)).toBe("3h ago");
  });
  it("returns days for < 30d", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400_000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });
});

describe("slugify", () => {
  it("lowercases + kebab-cases", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
  it("trims leading/trailing dashes", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
  it("clamps to max length", () => {
    expect(slugify("a".repeat(100), 10)).toHaveLength(10);
  });
});

describe("dollarsToCents", () => {
  it("converts a string", () => { expect(dollarsToCents("12.34")).toBe(1234); });
  it("converts a number", () => { expect(dollarsToCents(12.5)).toBe(1250); });
  it("handles empty", () => { expect(dollarsToCents("")).toBe(0); expect(dollarsToCents(null)).toBe(0); });
  it("rejects NaN", () => { expect(dollarsToCents("banana")).toBe(0); });
});

describe("generateNumber", () => {
  it("produces prefixed refs", () => {
    const n = generateNumber("INV");
    expect(n).toMatch(/^INV-\d{2}\d{5}$/);
  });
});
