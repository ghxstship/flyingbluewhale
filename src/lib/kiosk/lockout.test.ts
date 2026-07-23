import { describe, expect, it } from "vitest";
import {
  KIOSK_LOCKOUT_BASE_MS,
  KIOSK_LOCKOUT_CAP_MS,
  KIOSK_PIN_MAX_ATTEMPTS,
  isLockedOut,
  lockoutMsFor,
  lockoutRemainingS,
  registerPinFailure,
} from "./lockout";

/**
 * T1-4 kiosk PIN lockout math. Pure-function contract tests — the security
 * of a 4-6 digit PIN is rate limiting, so the escalation curve IS the
 * security property and gets pinned here.
 */
describe("lockoutMsFor", () => {
  it("charges nothing below the attempt threshold", () => {
    for (let n = 0; n < KIOSK_PIN_MAX_ATTEMPTS; n++) {
      expect(lockoutMsFor(n)).toBe(0);
    }
  });

  it("starts at the base window on the threshold attempt", () => {
    expect(lockoutMsFor(KIOSK_PIN_MAX_ATTEMPTS)).toBe(KIOSK_LOCKOUT_BASE_MS);
  });

  it("doubles per further failure", () => {
    expect(lockoutMsFor(KIOSK_PIN_MAX_ATTEMPTS + 1)).toBe(KIOSK_LOCKOUT_BASE_MS * 2);
    expect(lockoutMsFor(KIOSK_PIN_MAX_ATTEMPTS + 2)).toBe(KIOSK_LOCKOUT_BASE_MS * 4);
    expect(lockoutMsFor(KIOSK_PIN_MAX_ATTEMPTS + 3)).toBe(KIOSK_LOCKOUT_BASE_MS * 8);
  });

  it("caps at fifteen minutes, even for pathological counters", () => {
    expect(lockoutMsFor(KIOSK_PIN_MAX_ATTEMPTS + 10)).toBe(KIOSK_LOCKOUT_CAP_MS);
    expect(lockoutMsFor(1_000)).toBe(KIOSK_LOCKOUT_CAP_MS);
    expect(lockoutMsFor(Number.MAX_SAFE_INTEGER)).toBe(KIOSK_LOCKOUT_CAP_MS);
  });

  it("treats garbage as unlocked rather than throwing", () => {
    expect(lockoutMsFor(Number.NaN)).toBe(0);
    expect(lockoutMsFor(-3)).toBe(0);
  });
});

describe("registerPinFailure", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  it("increments without locking under the threshold", () => {
    const next = registerPinFailure(0, now);
    expect(next.failedAttempts).toBe(1);
    expect(next.lockedUntil).toBeNull();
  });

  it("locks exactly at the threshold", () => {
    const next = registerPinFailure(KIOSK_PIN_MAX_ATTEMPTS - 1, now);
    expect(next.failedAttempts).toBe(KIOSK_PIN_MAX_ATTEMPTS);
    expect(next.lockedUntil?.getTime()).toBe(now.getTime() + KIOSK_LOCKOUT_BASE_MS);
  });

  it("escalates the window on repeated failure", () => {
    const next = registerPinFailure(KIOSK_PIN_MAX_ATTEMPTS, now);
    expect(next.failedAttempts).toBe(KIOSK_PIN_MAX_ATTEMPTS + 1);
    expect(next.lockedUntil?.getTime()).toBe(now.getTime() + KIOSK_LOCKOUT_BASE_MS * 2);
  });

  it("clamps a negative prior counter to a first failure", () => {
    const next = registerPinFailure(-10, now);
    expect(next.failedAttempts).toBe(1);
    expect(next.lockedUntil).toBeNull();
  });
});

describe("isLockedOut / lockoutRemainingS", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  it("null and past expiries are unlocked", () => {
    expect(isLockedOut(null, now)).toBe(false);
    expect(isLockedOut(undefined, now)).toBe(false);
    expect(isLockedOut(new Date(now.getTime() - 1), now)).toBe(false);
    expect(lockoutRemainingS(null, now)).toBe(0);
  });

  it("future expiries lock, from either Date or ISO-string storage", () => {
    const until = new Date(now.getTime() + 42_000);
    expect(isLockedOut(until, now)).toBe(true);
    expect(isLockedOut(until.toISOString(), now)).toBe(true);
    expect(lockoutRemainingS(until, now)).toBe(42);
    expect(lockoutRemainingS(until.toISOString(), now)).toBe(42);
  });

  it("rounds partial seconds UP so the UI never understates a lock", () => {
    const until = new Date(now.getTime() + 500);
    expect(lockoutRemainingS(until, now)).toBe(1);
  });

  it("an unparseable stored expiry fails open (no permanent lock from corrupt data)", () => {
    expect(isLockedOut("not-a-date", now)).toBe(false);
  });
});
