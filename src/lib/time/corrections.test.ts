import { describe, expect, it } from "vitest";
import {
  CORRECTION_KINDS,
  CORRECTION_STATES,
  canTransitionCorrection,
  isUsableCorrectionReason,
  requiredProposals,
  validateCorrectionShape,
  type CorrectionKind,
} from "./corrections";

const T0 = "2026-07-15T08:00:00.000Z";
const T1 = "2026-07-15T17:00:00.000Z";

describe("correction FSM", () => {
  it("lets a manager approve, deny, or the worker withdraw an open request", () => {
    expect(canTransitionCorrection("requested", "approved")).toBe(true);
    expect(canTransitionCorrection("requested", "denied")).toBe(true);
    expect(canTransitionCorrection("requested", "withdrawn")).toBe(true);
  });

  // approved -> applied is separate because applying can fail (posted-sheet
  // lock, concurrent edit). A decision is not an effect.
  it("treats applying as a step beyond approving", () => {
    expect(canTransitionCorrection("approved", "applied")).toBe(true);
    expect(canTransitionCorrection("requested", "applied")).toBe(false);
  });

  it("makes denied, applied, and withdrawn terminal", () => {
    for (const s of ["denied", "applied", "withdrawn"] as const) {
      for (const to of CORRECTION_STATES) {
        expect(canTransitionCorrection(s, to), `${s} -> ${to}`).toBe(false);
      }
    }
  });

  it("never allows a request to re-open once decided", () => {
    expect(canTransitionCorrection("denied", "requested")).toBe(false);
    expect(canTransitionCorrection("applied", "requested")).toBe(false);
  });
});

describe("requiredProposals", () => {
  it("asks only for the times a kind actually changes", () => {
    expect(requiredProposals("edit_in")).toEqual({ start: true, end: false });
    expect(requiredProposals("edit_out")).toEqual({ start: false, end: true });
    expect(requiredProposals("edit_both")).toEqual({ start: true, end: true });
    expect(requiredProposals("missing_entry")).toEqual({ start: true, end: true });
    expect(requiredProposals("delete_entry")).toEqual({ start: false, end: false });
    expect(requiredProposals("zone_override")).toEqual({ start: false, end: false });
  });

  it("covers every kind", () => {
    for (const kind of CORRECTION_KINDS) {
      expect(() => requiredProposals(kind)).not.toThrow();
    }
  });
});

describe("validateCorrectionShape", () => {
  const base = { timeEntryId: "entry-1", reason: "Clocked out an hour late, forgot to tap out" };

  it("accepts a well-formed edit_out", () => {
    expect(validateCorrectionShape({ ...base, kind: "edit_out", proposedEndedAt: T1 })).toBeNull();
  });

  it("rejects a stub reason", () => {
    expect(validateCorrectionShape({ ...base, kind: "edit_out", reason: "oops", proposedEndedAt: T1 })).toBe(
      "reason_too_short",
    );
  });

  it("requires an entry for every kind except missing_entry", () => {
    const kinds = CORRECTION_KINDS.filter((k) => k !== "missing_entry") as CorrectionKind[];
    for (const kind of kinds) {
      const r = validateCorrectionShape({
        ...base,
        kind,
        timeEntryId: null,
        proposedStartedAt: T0,
        proposedEndedAt: T1,
      });
      expect(r, kind).toBe("kind_needs_entry");
    }
  });

  it("requires a start for a missing shift and no entry id", () => {
    expect(validateCorrectionShape({ ...base, kind: "missing_entry", timeEntryId: null })).toBe(
      "missing_entry_needs_start",
    );
    expect(
      validateCorrectionShape({
        ...base,
        kind: "missing_entry",
        timeEntryId: null,
        proposedStartedAt: T0,
        proposedEndedAt: T1,
      }),
    ).toBeNull();
  });

  it("asks for the times the kind needs", () => {
    expect(validateCorrectionShape({ ...base, kind: "edit_in" })).toBe("needs_proposed_start");
    expect(validateCorrectionShape({ ...base, kind: "edit_out" })).toBe("needs_proposed_end");
    expect(validateCorrectionShape({ ...base, kind: "edit_both", proposedStartedAt: T0 })).toBe("needs_proposed_end");
  });

  it("refuses a shift that ends before it starts", () => {
    expect(
      validateCorrectionShape({ ...base, kind: "edit_both", proposedStartedAt: T1, proposedEndedAt: T0 }),
    ).toBe("end_before_start");
  });

  it("refuses a zero-length shift", () => {
    expect(
      validateCorrectionShape({ ...base, kind: "edit_both", proposedStartedAt: T0, proposedEndedAt: T0 }),
    ).toBe("end_before_start");
  });

  it("needs no times for delete_entry or zone_override", () => {
    expect(validateCorrectionShape({ ...base, kind: "delete_entry" })).toBeNull();
    expect(validateCorrectionShape({ ...base, kind: "zone_override" })).toBeNull();
  });
});

describe("isUsableCorrectionReason", () => {
  it("matches the DB's length CHECK", () => {
    expect(isUsableCorrectionReason("123456789")).toBe(false); // 9
    expect(isUsableCorrectionReason("1234567890")).toBe(true); // 10
    expect(isUsableCorrectionReason("          x")).toBe(false); // trims
    expect(isUsableCorrectionReason(null)).toBe(false);
  });
});
