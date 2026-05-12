import { describe, it, expect } from "vitest";
import { formatSequencePreview } from "../sequences";

describe("formatSequencePreview", () => {
  it("zero-pads default {seq} to 4 wide", () => {
    expect(formatSequencePreview("INV-{seq}", { seq: 42 })).toBe("INV-0042");
  });

  it("respects custom width {seq:6}", () => {
    expect(formatSequencePreview("X-{seq:6}", { seq: 7 })).toBe("X-000007");
  });

  it("substitutes year/month/day tokens (UTC)", () => {
    const d = new Date(Date.UTC(2026, 4, 9)); // May 9, 2026
    expect(formatSequencePreview("{YYYY}-{MM}-{DD}-{seq}", { seq: 1, date: d })).toBe("2026-05-09-0001");
  });

  it("uppercases org slug", () => {
    expect(formatSequencePreview("{ORG}-{seq}", { seq: 1, orgSlug: "flytehaus" })).toBe("FLYTEHAUS-0001");
  });

  it("falls back to ORG when no slug supplied", () => {
    expect(formatSequencePreview("{ORG}-{seq:3}", { seq: 8 })).toBe("ORG-008");
  });

  it("supports composite formats", () => {
    expect(
      formatSequencePreview("INV-{YYYY}-{seq:5}", {
        seq: 17,
        date: new Date(Date.UTC(2026, 0, 1)),
      }),
    ).toBe("INV-2026-00017");
  });
});
