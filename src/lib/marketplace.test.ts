import { describe, it, expect } from "vitest";
import {
  RFQ_VISIBILITIES,
  MARKETPLACE_KINDS,
  TALENT_RIDER_KINDS,
  JOB_POSTING_STATUSES,
  JOB_POSTING_TYPES,
  JOB_APPLICATION_STATUSES,
  OPEN_CALL_STATUSES,
  SUBMISSION_STATUSES,
  TALENT_OFFER_STATUSES,
  REVIEW_TRANSACTIONS,
  REVIEW_SUBJECTS,
  INQUIRY_SUBJECT_KINDS,
  INQUIRY_STATES,
  INQUIRY_SUBJECT_PATHS,
  DEAL_TYPES,
  SETTLEMENT_STATUSES,
  TICKETING_PROVIDERS,
  TOUR_STATUSES,
  EVENT_MILESTONE_KINDS,
  STATUS_TONE,
  slugify,
  formatFeeRange,
  computeBreakEven,
} from "./marketplace";

const ALL_TUPLES: Record<string, readonly string[]> = {
  RFQ_VISIBILITIES,
  MARKETPLACE_KINDS,
  TALENT_RIDER_KINDS,
  JOB_POSTING_STATUSES,
  JOB_POSTING_TYPES,
  JOB_APPLICATION_STATUSES,
  OPEN_CALL_STATUSES,
  SUBMISSION_STATUSES,
  TALENT_OFFER_STATUSES,
  REVIEW_TRANSACTIONS,
  REVIEW_SUBJECTS,
  INQUIRY_SUBJECT_KINDS,
  INQUIRY_STATES,
  DEAL_TYPES,
  SETTLEMENT_STATUSES,
  TICKETING_PROVIDERS,
  TOUR_STATUSES,
  EVENT_MILESTONE_KINDS,
};

// Every tuple whose members render as a status badge somewhere.
const TONED_TUPLES: Record<string, readonly string[]> = {
  JOB_POSTING_STATUSES,
  JOB_APPLICATION_STATUSES,
  OPEN_CALL_STATUSES,
  SUBMISSION_STATUSES,
  TALENT_OFFER_STATUSES,
  INQUIRY_STATES,
  SETTLEMENT_STATUSES,
  TOUR_STATUSES,
  EVENT_MILESTONE_KINDS,
};

describe("marketplace tuples", () => {
  it("every tuple is non-empty and duplicate-free", () => {
    for (const [name, tuple] of Object.entries(ALL_TUPLES)) {
      expect(tuple.length, name).toBeGreaterThan(0);
      expect(new Set(tuple).size, `${name} has duplicates`).toBe(tuple.length);
    }
  });

  it("STATUS_TONE covers every status/state/milestone value", () => {
    const missing: string[] = [];
    for (const [name, tuple] of Object.entries(TONED_TUPLES)) {
      for (const value of tuple) {
        if (!(value in STATUS_TONE)) missing.push(`${name}.${value}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("INQUIRY_SUBJECT_PATHS maps every subject kind to a /marketplace list path", () => {
    for (const kind of INQUIRY_SUBJECT_KINDS) {
      expect(INQUIRY_SUBJECT_PATHS[kind], kind).toMatch(/^\/marketplace\//);
    }
    expect(Object.keys(INQUIRY_SUBJECT_PATHS).sort()).toEqual([...INQUIRY_SUBJECT_KINDS].sort());
  });
});

describe("slugify", () => {
  it("lowercases, strips diacritics, and collapses separator runs", () => {
    expect(slugify("Café Müller — Late Night!!")).toBe("cafe-muller-late-night");
    expect(slugify("  Hello,   World  ")).toBe("hello-world");
  });

  it("trims to 60 chars and falls back to untitled for empty input", () => {
    expect(slugify("x".repeat(80))).toHaveLength(60);
    expect(slugify("!!! ??? ***")).toBe("untitled");
    expect(slugify("")).toBe("untitled");
  });
});

describe("formatFeeRange", () => {
  it("renders all five shapes — range, equal bounds, from, up to, and empty", () => {
    expect(formatFeeRange(100_000, 250_000)).toBe("$1,000–$2,500");
    expect(formatFeeRange(100_000, 100_000)).toBe("$1,000");
    expect(formatFeeRange(100_000, null)).toBe("from $1,000");
    expect(formatFeeRange(null, 250_000)).toBe("up to $2,500");
    expect(formatFeeRange(null, undefined)).toBe("—");
  });
});

describe("computeBreakEven", () => {
  it("divides fixed costs by net-per-ticket and rounds up", () => {
    // 500k guarantee + 100k expenses at $50 tickets → 120 heads.
    expect(computeBreakEven({ guaranteeCents: 500_000, expenseCents: 100_000, avgTicketCents: 5_000 })).toBe(120);
    // 10% tax shaves the net to $45 → ceil(133.33) = 134.
    expect(
      computeBreakEven({
        guaranteeCents: 500_000,
        expenseCents: 100_000,
        avgTicketCents: 5_000,
        taxRateBps: 1_000,
      }),
    ).toBe(134);
  });

  it("handles degenerate inputs — no ticket price, zero fixed costs, fees at 100%", () => {
    expect(computeBreakEven({ guaranteeCents: 500_000, avgTicketCents: null })).toBeNull();
    expect(computeBreakEven({ guaranteeCents: 500_000, avgTicketCents: 0 })).toBeNull();
    expect(computeBreakEven({ guaranteeCents: 0, expenseCents: 0, avgTicketCents: 5_000 })).toBe(0);
    expect(
      computeBreakEven({
        guaranteeCents: 500_000,
        avgTicketCents: 5_000,
        taxRateBps: 5_000,
        ccFeeRateBps: 5_000,
      }),
    ).toBeNull();
  });
});
