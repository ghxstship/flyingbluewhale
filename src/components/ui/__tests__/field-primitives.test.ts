import { describe, it, expect } from "vitest";
import { toE164 } from "../PhoneField";
import { coerceAddress } from "../AddressField";

describe("toE164", () => {
  it("formats US number", () => {
    expect(toE164({ country: "US", number: "(555) 123-4567" })).toBe("+15551234567");
  });
  it("strips non-digits", () => {
    expect(toE164({ country: "GB", number: "20 7946 0958" })).toBe("+442079460958");
  });
  it("returns empty for empty input", () => {
    expect(toE164({ country: "US", number: "" })).toBe("");
  });
  it("does not double-prefix when number already has dial code", () => {
    expect(toE164({ country: "US", number: "+1 555 123 4567" })).toBe("+15551234567");
  });
  it("falls back to +1 for unknown country", () => {
    expect(toE164({ country: "XX", number: "5551234" })).toBe("+15551234");
  });
});

describe("coerceAddress", () => {
  it("returns empty defaults for non-object", () => {
    const a = coerceAddress(null);
    expect(a.street1).toBe("");
    expect(a.country_code).toBe("US");
  });
  it("preserves all fields", () => {
    const a = coerceAddress({
      street1: "123 Main",
      street2: "Apt 4",
      locality: "Brooklyn",
      region: "NY",
      postal_code: "11201",
      country_code: "US",
      lat: 40.7,
      lng: -74.0,
    });
    expect(a.locality).toBe("Brooklyn");
    expect(a.lat).toBe(40.7);
  });
  it("ignores extra keys", () => {
    const a = coerceAddress({ street1: "x", junk: 42 } as Record<string, unknown>);
    expect(a.street1).toBe("x");
    expect((a as unknown as { junk?: unknown }).junk).toBeUndefined();
  });
  it("coerces non-string fields to empty", () => {
    const a = coerceAddress({ street1: 42 });
    expect(a.street1).toBe("");
  });
});
