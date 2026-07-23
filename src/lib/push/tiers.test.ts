import { describe, expect, it } from "vitest";
import { NOTIF_KINDS } from "@/components/notifications/kinds";
import { UNSILENCEABLE_KINDS, type PushKind } from "./send";
import {
  DIGEST_MIDDAY_MIN,
  DIGEST_MORNING_MIN,
  PUSH_KIND_TIER,
  SHOW_DAY_PROMOTED,
  effectiveTier,
  gatePush,
  inQuietWindow,
  minuteOfDayIn,
  nextDigestWindow,
  nextWallMinute,
  parseQuietHours,
  type GateDecision,
  type PushTier,
  type QuietHours,
} from "./tiers";

/**
 * T1-2 push discipline — the gate math ratchet.
 *
 * PUSH_KIND_TIER is typed Record<PushKind, PushTier>, so kind-coverage is
 * a COMPILE-level guarantee (a new PushKind without a tier fails tsc).
 * The runtime assertions below pin the semantic invariants the type can't:
 * the show-day promotion set stays inside ambient, unsilenceable kinds are
 * interrupt, and the full tier × quiet-hours × show-day × opt-out matrix
 * behaves per the ratified design.
 */

const QUIET_NIGHT_UTC: QuietHours = { enabled: true, start_min: 22 * 60, end_min: 7 * 60, tz: "UTC" };
const at = (iso: string) => new Date(iso);

describe("PUSH_KIND_TIER — SSOT invariants", () => {
  it("covers every toggleable kind plus the unsilenceable ones", () => {
    // Belt over the compile-level Record guard: the union mirrored in
    // NOTIF_KINDS + UNSILENCEABLE_KINDS is exactly the map's key set.
    const mapKeys = Object.keys(PUSH_KIND_TIER).sort();
    const union = [...NOTIF_KINDS, ...UNSILENCEABLE_KINDS].sort();
    expect(mapKeys).toEqual(union);
  });

  it("classifies unsilenceable kinds as interrupt", () => {
    for (const kind of UNSILENCEABLE_KINDS) {
      expect(PUSH_KIND_TIER[kind]).toBe("interrupt");
    }
  });

  it("only promotes ambient kinds on show day", () => {
    for (const kind of SHOW_DAY_PROMOTED) {
      expect(PUSH_KIND_TIER[kind]).toBe("ambient");
    }
  });

  it("promotes exactly the operational assignment/scan/schedule kinds", () => {
    expect([...SHOW_DAY_PROMOTED].sort()).toEqual(
      ["assignment", "assignment_scan", "assignment_state", "shift", "shift_swap"].sort(),
    );
  });
});

describe("parseQuietHours", () => {
  it("parses the canonical shape", () => {
    expect(
      parseQuietHours({ enabled: true, start_min: 1320, end_min: 420, tz: "America/New_York" }),
    ).toEqual({ enabled: true, start_min: 1320, end_min: 420, tz: "America/New_York" });
  });

  it("rejects junk and out-of-range minutes", () => {
    expect(parseQuietHours(null)).toBeNull();
    expect(parseQuietHours("22:00")).toBeNull();
    expect(parseQuietHours({ start_min: 1500, end_min: 420 })).toBeNull();
    expect(parseQuietHours({ start_min: "22", end_min: 420 })).toBeNull();
  });

  it("defaults tz to UTC and enabled to false", () => {
    expect(parseQuietHours({ start_min: 0, end_min: 60 })).toEqual({
      enabled: false,
      start_min: 0,
      end_min: 60,
      tz: "UTC",
    });
  });
});

describe("quiet-window math", () => {
  it("handles a same-day window", () => {
    expect(inQuietWindow(600, 540, 720)).toBe(true); // 10:00 in 09:00-12:00
    expect(inQuietWindow(720, 540, 720)).toBe(false); // end-exclusive
    expect(inQuietWindow(500, 540, 720)).toBe(false);
  });

  it("handles midnight wraparound (22:00 -> 07:00)", () => {
    expect(inQuietWindow(23 * 60, 1320, 420)).toBe(true);
    expect(inQuietWindow(3 * 60, 1320, 420)).toBe(true);
    expect(inQuietWindow(12 * 60, 1320, 420)).toBe(false);
    expect(inQuietWindow(7 * 60, 1320, 420)).toBe(false); // exactly at end
  });

  it("treats a zero-length window as never quiet", () => {
    expect(inQuietWindow(300, 300, 300)).toBe(false);
  });

  it("computes wall-clock minute in a non-UTC zone", () => {
    // 2026-01-15T03:30:00Z is 22:30 the previous day in New York (UTC-5).
    expect(minuteOfDayIn(at("2026-01-15T03:30:00Z"), "America/New_York")).toBe(22 * 60 + 30);
    expect(minuteOfDayIn(at("2026-01-15T03:30:00Z"), "UTC")).toBe(3 * 60 + 30);
  });

  it("falls back to UTC on an invalid tz instead of throwing", () => {
    expect(minuteOfDayIn(at("2026-01-15T03:30:00Z"), "Not/AZone")).toBe(3 * 60 + 30);
  });
});

describe("nextWallMinute", () => {
  it("lands later the same day when the minute is still ahead", () => {
    expect(nextWallMinute(at("2026-07-01T05:00:00Z"), 7 * 60, "UTC").toISOString()).toBe(
      "2026-07-01T07:00:00.000Z",
    );
  });

  it("rolls to tomorrow when the minute already passed", () => {
    expect(nextWallMinute(at("2026-07-01T08:00:00Z"), 7 * 60, "UTC").toISOString()).toBe(
      "2026-07-02T07:00:00.000Z",
    );
  });

  it("resolves in the user's zone, not UTC", () => {
    // 14:00Z on Jul 1 is 10:00 in New York (UTC-4, DST). Next 12:00 NY
    // wall clock is 16:00Z the same day.
    expect(nextWallMinute(at("2026-07-01T14:00:00Z"), 12 * 60, "America/New_York").toISOString()).toBe(
      "2026-07-01T16:00:00.000Z",
    );
  });
});

describe("nextDigestWindow", () => {
  it("uses quiet-hours end + midday when quiet hours are enabled", () => {
    // 23:00 UTC, quiet 22:00-07:00: next window is 07:00 (quiet end),
    // before the 12:00 midday window.
    expect(nextDigestWindow(at("2026-07-01T23:00:00Z"), QUIET_NIGHT_UTC).toISOString()).toBe(
      "2026-07-02T07:00:00.000Z",
    );
    // 09:00 UTC: midday (12:00) beats tomorrow's 07:00.
    expect(nextDigestWindow(at("2026-07-01T09:00:00Z"), QUIET_NIGHT_UTC).toISOString()).toBe(
      "2026-07-01T12:00:00.000Z",
    );
  });

  it("uses morning + midday defaults when quiet hours are unset", () => {
    expect(DIGEST_MORNING_MIN).toBe(8 * 60);
    expect(DIGEST_MIDDAY_MIN).toBe(12 * 60);
    // 13:00 UTC, no quiet hours: next window is 08:00 tomorrow.
    expect(nextDigestWindow(at("2026-07-01T13:00:00Z"), null).toISOString()).toBe(
      "2026-07-02T08:00:00.000Z",
    );
    // 09:30 UTC: midday today.
    expect(nextDigestWindow(at("2026-07-01T09:30:00Z"), null).toISOString()).toBe(
      "2026-07-01T12:00:00.000Z",
    );
  });
});

describe("effectiveTier", () => {
  it("show-day promotes only SHOW_DAY_PROMOTED ambient kinds", () => {
    expect(effectiveTier("assignment", undefined, true)).toBe("interrupt");
    expect(effectiveTier("shift", undefined, true)).toBe("interrupt");
    expect(effectiveTier("chat", undefined, true)).toBe("ambient"); // not promoted
    expect(effectiveTier("kudos", undefined, true)).toBe("digest"); // digest stays digest
    expect(effectiveTier("assignment", undefined, false)).toBe("ambient");
  });

  it("per-call override wins over the kind's tier", () => {
    expect(effectiveTier("approval", "interrupt", false)).toBe("interrupt");
    expect(effectiveTier("chat", "digest", false)).toBe("digest");
  });
});

// ---------------------------------------------------------------------------
// The full delivery matrix, table-driven: tier × quiet-hours × show-day ×
// opt-out. `IN_QUIET` = 23:30 UTC inside the 22:00-07:00 window; `OUT` =
// 10:00 UTC outside it.
// ---------------------------------------------------------------------------

const IN_QUIET = at("2026-07-01T23:30:00Z");
const OUT_QUIET = at("2026-07-01T10:00:00Z");

type Case = {
  name: string;
  kind: PushKind | undefined;
  optedOut?: boolean;
  showDay?: boolean;
  quiet?: QuietHours | null;
  now: Date;
  tierOverride?: PushTier;
  expect: GateDecision["action"];
  expectTier?: PushTier;
  expectDeferIso?: string;
};

const CASES: Case[] = [
  // -- interrupt tier ------------------------------------------------------
  {
    name: "crisis sends during quiet hours",
    kind: "crisis",
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "send",
    expectTier: "interrupt",
  },
  {
    name: "incident (interrupt) sends during quiet hours",
    kind: "incident",
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "send",
  },
  {
    name: "opt-out beats interrupt for a silenceable kind",
    kind: "incident",
    optedOut: true,
    now: OUT_QUIET,
    expect: "drop",
  },
  {
    name: "opt-out does NOT beat an unsilenceable kind",
    kind: "crisis",
    optedOut: true,
    now: IN_QUIET,
    quiet: QUIET_NIGHT_UTC,
    expect: "send",
  },
  // -- ambient tier --------------------------------------------------------
  {
    name: "ambient sends outside quiet hours",
    kind: "assignment",
    quiet: QUIET_NIGHT_UTC,
    now: OUT_QUIET,
    expect: "send",
    expectTier: "ambient",
  },
  {
    name: "ambient sends when quiet hours are unset",
    kind: "chat",
    quiet: null,
    now: IN_QUIET,
    expect: "send",
  },
  {
    name: "ambient sends when quiet hours are disabled",
    kind: "chat",
    quiet: { ...QUIET_NIGHT_UTC, enabled: false },
    now: IN_QUIET,
    expect: "send",
  },
  {
    name: "ambient defers during quiet hours until quiet end",
    kind: "chat",
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "defer",
    expectTier: "ambient",
    expectDeferIso: "2026-07-02T07:00:00.000Z",
  },
  {
    name: "opt-out beats ambient (no defer row for a muted kind)",
    kind: "chat",
    optedOut: true,
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "drop",
  },
  // -- show-day promotion --------------------------------------------------
  {
    name: "show-day promotes assignment through quiet hours",
    kind: "assignment",
    showDay: true,
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "send",
    expectTier: "interrupt",
  },
  {
    name: "show-day promotes assignment_scan through quiet hours",
    kind: "assignment_scan",
    showDay: true,
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "send",
  },
  {
    name: "show-day does not promote chat (still defers in quiet hours)",
    kind: "chat",
    showDay: true,
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "defer",
    expectTier: "ambient",
  },
  {
    name: "show-day never promotes digest (kudos stays bundled)",
    kind: "kudos",
    showDay: true,
    quiet: null,
    now: OUT_QUIET,
    expect: "defer",
    expectTier: "digest",
  },
  {
    name: "opt-out beats a show-day-promoted kind",
    kind: "assignment",
    optedOut: true,
    showDay: true,
    now: IN_QUIET,
    quiet: QUIET_NIGHT_UTC,
    expect: "drop",
  },
  // -- digest tier ---------------------------------------------------------
  {
    name: "digest accrues even outside quiet hours",
    kind: "badge",
    quiet: QUIET_NIGHT_UTC,
    now: OUT_QUIET,
    expect: "defer",
    expectTier: "digest",
    expectDeferIso: "2026-07-01T12:00:00.000Z", // midday window
  },
  {
    name: "digest during quiet hours accrues to quiet end",
    kind: "announcement",
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "defer",
    expectTier: "digest",
    expectDeferIso: "2026-07-02T07:00:00.000Z",
  },
  {
    name: "opt-out beats digest",
    kind: "kudos",
    optedOut: true,
    now: OUT_QUIET,
    expect: "drop",
  },
  // -- overrides + kindless ------------------------------------------------
  {
    name: "per-call interrupt override pushes ambient through quiet hours",
    kind: "approval",
    tierOverride: "interrupt",
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "send",
    expectTier: "interrupt",
  },
  {
    name: "per-call digest override demotes an ambient kind",
    kind: "chat",
    tierOverride: "digest",
    quiet: null,
    now: OUT_QUIET,
    expect: "defer",
    expectTier: "digest",
  },
  {
    name: "kindless system pings bypass discipline",
    kind: undefined,
    quiet: QUIET_NIGHT_UTC,
    now: IN_QUIET,
    expect: "send",
  },
];

describe("gatePush — tier × quiet-hours × show-day × opt-out matrix", () => {
  for (const c of CASES) {
    it(c.name, () => {
      const decision = gatePush({
        kind: c.kind,
        tierOverride: c.tierOverride,
        optedOut: c.optedOut ?? false,
        unsilenceable: c.kind ? UNSILENCEABLE_KINDS.has(c.kind) : false,
        showDay: c.showDay ?? false,
        quiet: c.quiet ?? null,
        now: c.now,
      });
      expect(decision.action).toBe(c.expect);
      if (c.expectTier && decision.action !== "drop") {
        expect(decision.tier).toBe(c.expectTier);
      }
      if (c.expectDeferIso && decision.action === "defer") {
        expect(decision.deferUntil.toISOString()).toBe(c.expectDeferIso);
      }
    });
  }
});
