import { describe, expect, it } from "vitest";
import { generateDeviceToken, hashDeviceToken, isPlausibleDeviceToken } from "./device-token";
import { hashPin, pinLookupDigest, validatePin, verifyPin } from "./pins";

/** T1-4 kiosk PIN crypto + device-token contract tests. */

describe("validatePin", () => {
  it("accepts ordinary 4-6 digit PINs", () => {
    expect(validatePin("4827")).toEqual({ ok: true });
    expect(validatePin("73914")).toEqual({ ok: true });
    expect(validatePin("305817")).toEqual({ ok: true });
  });

  it("rejects non-digit or wrong-length input as format", () => {
    for (const bad of ["123", "1234567", "12a4", "", "12 34", "١٢٣٤"]) {
      expect(validatePin(bad)).toEqual({ ok: false, reason: "format" });
    }
  });

  it("rejects repeats and runs as weak", () => {
    for (const weak of ["0000", "111111", "1234", "123456", "4321", "9876", "0123"]) {
      expect(validatePin(weak)).toEqual({ ok: false, reason: "weak" });
    }
  });

  it("rejects the famous-PIN deny list", () => {
    expect(validatePin("2580")).toEqual({ ok: false, reason: "weak" });
    expect(validatePin("1212")).toEqual({ ok: false, reason: "weak" });
  });
});

describe("hashPin / verifyPin", () => {
  it("round-trips and salts (same PIN, different hashes)", () => {
    const a = hashPin("4827");
    const b = hashPin("4827");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt:")).toBe(true);
    expect(verifyPin("4827", a)).toBe(true);
    expect(verifyPin("4827", b)).toBe(true);
  });

  it("rejects the wrong PIN", () => {
    const stored = hashPin("4827");
    expect(verifyPin("4828", stored)).toBe(false);
    expect(verifyPin("482", stored)).toBe(false);
  });

  it("rejects malformed stored values instead of throwing", () => {
    expect(verifyPin("4827", "")).toBe(false);
    expect(verifyPin("4827", "bcrypt:whatever")).toBe(false);
    expect(verifyPin("4827", "scrypt:x:y:z:!!:!!")).toBe(false);
    expect(verifyPin("4827", "scrypt:16384:8:1:onlyfive")).toBe(false);
  });
});

describe("pinLookupDigest", () => {
  const ORG_A = "11111111-1111-1111-1111-111111111111";
  const ORG_B = "22222222-2222-2222-2222-222222222222";

  it("is deterministic per (org, pin, secret) — the uniqueness-index premise", () => {
    expect(pinLookupDigest(ORG_A, "4827", "pepper")).toBe(pinLookupDigest(ORG_A, "4827", "pepper"));
  });

  it("differs across orgs, pins, and secrets", () => {
    const base = pinLookupDigest(ORG_A, "4827", "pepper");
    expect(pinLookupDigest(ORG_B, "4827", "pepper")).not.toBe(base);
    expect(pinLookupDigest(ORG_A, "4828", "pepper")).not.toBe(base);
    expect(pinLookupDigest(ORG_A, "4827", "other")).not.toBe(base);
  });

  it("refuses an empty secret — an unpeppered digest must never be written", () => {
    expect(() => pinLookupDigest(ORG_A, "4827", "")).toThrow();
  });
});

describe("device tokens", () => {
  it("mints unique kd_ tokens that pass the plausibility gate", () => {
    const a = generateDeviceToken();
    const b = generateDeviceToken();
    expect(a).not.toBe(b);
    expect(isPlausibleDeviceToken(a)).toBe(true);
  });

  it("hashes deterministically to sha256 hex", () => {
    const raw = generateDeviceToken();
    expect(hashDeviceToken(raw)).toBe(hashDeviceToken(raw));
    expect(hashDeviceToken(raw)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("plausibility gate refuses junk cheaply", () => {
    expect(isPlausibleDeviceToken(undefined)).toBe(false);
    expect(isPlausibleDeviceToken(null)).toBe(false);
    expect(isPlausibleDeviceToken("")).toBe(false);
    expect(isPlausibleDeviceToken("not-a-token")).toBe(false);
    expect(isPlausibleDeviceToken("kd_short")).toBe(false);
    expect(isPlausibleDeviceToken(`kd_${"x".repeat(300)}`)).toBe(false);
  });
});
