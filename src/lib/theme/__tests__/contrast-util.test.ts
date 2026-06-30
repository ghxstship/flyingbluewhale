import { describe, expect, it } from "vitest";
import { bestInk, contrastRatio, parseHex, wcagLevel } from "../contrast-util";

describe("contrast-util", () => {
  it("parses 3- and 6-digit hex (with/without #)", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("000000")).toEqual([0, 0, 0]);
    expect(parseHex("#E23414")).toEqual([226, 52, 20]);
    expect(parseHex("nope")).toBeNull();
  });

  it("black on white is the 21:1 maximum", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    // order-independent
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 0);
  });

  it("identical colors are 1:1", () => {
    expect(contrastRatio("#E23414", "#E23414")).toBeCloseTo(1, 5);
  });

  it("returns null on malformed input", () => {
    expect(contrastRatio("#E23414", "zzz")).toBeNull();
  });

  it("bestInk picks the higher-contrast ink", () => {
    expect(bestInk("#111318")).toBe("#FFFFFF"); // dark bg → white ink
    expect(bestInk("#FFC400")).toBe("#000000"); // bright yellow → black ink
  });

  it("grades WCAG levels at the right thresholds", () => {
    expect(wcagLevel(21)).toBe("AAA");
    expect(wcagLevel(7)).toBe("AAA");
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(3)).toBe("AA Large");
    expect(wcagLevel(2.9)).toBe("Fail");
    expect(wcagLevel(null)).toBe("Fail");
    // large text relaxes the bar
    expect(wcagLevel(3, true)).toBe("AA");
    expect(wcagLevel(4.5, true)).toBe("AAA");
  });
});
