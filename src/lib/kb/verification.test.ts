import { describe, it, expect } from "vitest";
import { isEventSyncable, kbVerification } from "./verification";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

describe("kbVerification", () => {
  it("is unverified with no stamp", () => {
    expect(kbVerification(null, 180, NOW)).toEqual({ state: "unverified" });
  });

  it("is verified within the review interval", () => {
    const at = new Date(NOW - 10 * DAY).toISOString();
    expect(kbVerification(at, 180, NOW)).toEqual({ state: "verified", verifiedAt: at });
  });

  it("is stale once the interval lapses", () => {
    const at = new Date(NOW - 200 * DAY).toISOString();
    expect(kbVerification(at, 180, NOW)).toEqual({ state: "stale", verifiedAt: at });
  });

  it("treats exactly-at-interval as still verified", () => {
    const at = new Date(NOW - 180 * DAY).toISOString();
    expect(kbVerification(at, 180, NOW).state).toBe("verified");
  });
});

// L-P5 — verified-only event-sync gate: only a CURRENTLY verified article may
// enter an event's grounded corpus. Stale (review lapsed) and unverified are
// both blocked; the corpus walker applies the same gate.
describe("isEventSyncable (verified-only gate)", () => {
  it("allows only a currently verified article", () => {
    const at = new Date(NOW - 10 * DAY).toISOString();
    expect(isEventSyncable(kbVerification(at, 180, NOW))).toBe(true);
  });

  it("blocks an unverified article", () => {
    expect(isEventSyncable(kbVerification(null, 180, NOW))).toBe(false);
  });

  it("blocks a stale article until re-verified", () => {
    const at = new Date(NOW - 200 * DAY).toISOString();
    expect(isEventSyncable(kbVerification(at, 180, NOW))).toBe(false);
  });
});
