import { describe, expect, it } from "vitest";
import {
  evaluateGuardrails,
  hasBlockingViolation,
  isoWeekKey,
  DEFAULT_REST_FLOOR_HOURS,
  type ScheduleActivityInput,
  type CredentialInput,
} from "./guardrails";

/** Build an activity quickly; times are ISO. */
function act(
  id: string,
  startsAt: string,
  endsAt: string,
  resourceRef: string | null = "crew-1",
  locationId: string | null = "loc-A",
): ScheduleActivityInput {
  return { id, startsAt, endsAt, resourceRef, locationId };
}

describe("schedule guardrails — expired credential (error)", () => {
  it("blocks when a required credential expired before the activity starts", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z");
    const creds: CredentialInput[] = [
      { resourceRef: "crew-1", expiresOn: "2026-07-01", label: "OSHA-30" },
    ];
    const v = evaluateGuardrails(candidate, [], creds);
    expect(v).toHaveLength(1);
    expect(v[0]!.code).toBe("expired_credential");
    expect(v[0]!.level).toBe("error");
    expect(hasBlockingViolation(v)).toBe(true);
  });

  it("passes when the credential is still valid or never expires", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z");
    const creds: CredentialInput[] = [
      { resourceRef: "crew-1", expiresOn: "2026-12-31", label: "OSHA-30" },
      { resourceRef: "crew-1", expiresOn: null, label: "First Aid" },
    ];
    expect(evaluateGuardrails(candidate, [], creds)).toHaveLength(0);
  });

  it("ignores credentials belonging to a different resource", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z", "crew-1");
    const creds: CredentialInput[] = [
      { resourceRef: "crew-2", expiresOn: "2020-01-01", label: "OSHA-30" },
    ];
    expect(evaluateGuardrails(candidate, [], creds)).toHaveLength(0);
  });
});

describe("schedule guardrails — cross-location double-book (error)", () => {
  it("blocks the same resource overlapping at a different location", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T12:00:00Z", "crew-1", "loc-A");
    const peer = act("a2", "2026-07-10T10:00:00Z", "2026-07-10T14:00:00Z", "crew-1", "loc-B");
    const v = evaluateGuardrails(candidate, [peer], []);
    expect(v.some((x) => x.code === "double_book" && x.level === "error")).toBe(true);
  });

  it("does NOT block an overlap at the SAME location (stacking is allowed)", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T12:00:00Z", "crew-1", "loc-A");
    const peer = act("a2", "2026-07-10T10:00:00Z", "2026-07-10T14:00:00Z", "crew-1", "loc-A");
    // Same location overlap only triggers the (warn) rest rule, never double_book.
    const v = evaluateGuardrails(candidate, [peer], []);
    expect(v.some((x) => x.code === "double_book")).toBe(false);
  });

  it("does NOT block different resources overlapping at different locations", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T12:00:00Z", "crew-1", "loc-A");
    const peer = act("a2", "2026-07-10T10:00:00Z", "2026-07-10T14:00:00Z", "crew-2", "loc-B");
    expect(evaluateGuardrails(candidate, [peer], [])).toHaveLength(0);
  });
});

describe("schedule guardrails — minimum rest window (warn)", () => {
  it("warns when the adjacent activity leaves less than the rest floor", () => {
    // Candidate ends 17:00; next starts 20:00 same day → 3h < 8h floor.
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z");
    const peer = act("a2", "2026-07-10T20:00:00Z", "2026-07-10T23:00:00Z");
    const v = evaluateGuardrails(candidate, [peer], []);
    const rest = v.find((x) => x.code === "min_rest");
    expect(rest?.level).toBe("warn");
    expect(hasBlockingViolation(v)).toBe(false);
  });

  it("does not warn when the gap meets the floor", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z");
    // next day 09:00 → 16h gap, well over 8h.
    const peer = act("a2", "2026-07-11T09:00:00Z", "2026-07-11T17:00:00Z");
    expect(evaluateGuardrails(candidate, [peer], [])).toHaveLength(0);
  });

  it("respects a custom rest floor", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z");
    const peer = act("a2", "2026-07-10T20:00:00Z", "2026-07-10T23:00:00Z"); // 3h gap
    expect(evaluateGuardrails(candidate, [peer], [], { restFloorHours: 2 })).toHaveLength(0);
  });
});

describe("schedule guardrails — fair-workweek cap (warn)", () => {
  it("warns when the resource's ISO-week total exceeds the cap", () => {
    // Candidate = 8h; three 20h peers in the same week → 68h > 60h cap.
    const candidate = act("a1", "2026-07-06T00:00:00Z", "2026-07-06T08:00:00Z");
    const peers = [
      act("a2", "2026-07-07T00:00:00Z", "2026-07-07T20:00:00Z"),
      act("a3", "2026-07-08T00:00:00Z", "2026-07-08T20:00:00Z"),
      act("a4", "2026-07-09T00:00:00Z", "2026-07-09T20:00:00Z"),
    ];
    const v = evaluateGuardrails(candidate, peers, []);
    expect(v.some((x) => x.code === "max_hours" && x.level === "warn")).toBe(true);
  });

  it("does not count activities in a different ISO week", () => {
    const candidate = act("a1", "2026-07-06T00:00:00Z", "2026-07-06T08:00:00Z");
    const peers = [act("a2", "2026-07-01T00:00:00Z", "2026-07-01T23:00:00Z")]; // prior week
    expect(evaluateGuardrails(candidate, peers, []).some((x) => x.code === "max_hours")).toBe(false);
  });
});

describe("schedule guardrails — plumbing", () => {
  it("default rest floor is 8h", () => {
    expect(DEFAULT_REST_FLOOR_HOURS).toBe(8);
  });

  it("isoWeekKey anchors to the Monday of the week (UTC)", () => {
    // 2026-07-08 is a Wednesday → Monday is 2026-07-06.
    expect(isoWeekKey("2026-07-08T12:00:00Z")).toBe("2026-07-06");
    expect(isoWeekKey("2026-07-06T00:00:00Z")).toBe("2026-07-06");
    // Sunday 2026-07-12 still belongs to the 07-06 week.
    expect(isoWeekKey("2026-07-12T23:00:00Z")).toBe("2026-07-06");
  });

  it("excludes the candidate itself from the peer set (id match)", () => {
    const candidate = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z", "crew-1", "loc-A");
    // Same id, different location — must not self-report a double-book.
    const echo = act("a1", "2026-07-10T09:00:00Z", "2026-07-10T17:00:00Z", "crew-1", "loc-B");
    expect(evaluateGuardrails(candidate, [echo], [])).toHaveLength(0);
  });
});
