import { describe, expect, it } from "vitest";
import { findReportingCycle, wouldCreateReportingCycle, type ReportingEdges } from "./cycle";

const edges = (pairs: Array<[string, string | null]>): ReportingEdges => new Map(pairs);

describe("wouldCreateReportingCycle", () => {
  it("allows a fresh edge into an empty org", () => {
    expect(wouldCreateReportingCycle(edges([]), "jack", "elizabeth")).toBe(false);
  });

  it("refuses self-reporting", () => {
    expect(wouldCreateReportingCycle(edges([]), "jack", "jack")).toBe(true);
  });

  it("refuses a direct two-node cycle", () => {
    // captain already reports to jack; jack under captain would loop.
    expect(wouldCreateReportingCycle(edges([["captain", "jack"]]), "jack", "captain")).toBe(true);
  });

  it("refuses a deep cycle through a chain", () => {
    // ww → spiderman → captain → jack; jack under ww closes the loop.
    const e = edges([
      ["ww", "spiderman"],
      ["spiderman", "captain"],
      ["captain", "jack"],
    ]);
    expect(wouldCreateReportingCycle(e, "jack", "ww")).toBe(true);
  });

  it("allows a deep chain that never reaches the person", () => {
    const e = edges([
      ["captain", "jack"],
      ["jack", "elizabeth"],
    ]);
    expect(wouldCreateReportingCycle(e, "spiderman", "captain")).toBe(false);
  });

  it("treats a null manager edge as the top of the chain", () => {
    const e = edges([
      ["jack", "elizabeth"],
      ["elizabeth", null],
    ]);
    expect(wouldCreateReportingCycle(e, "captain", "jack")).toBe(false);
  });

  it("terminates on pre-existing bad data (a loop already in the store)", () => {
    // a ↔ b is already corrupt; assigning c under a must not hang and is
    // itself safe (the loop never reaches c).
    const e = edges([
      ["a", "b"],
      ["b", "a"],
    ]);
    expect(wouldCreateReportingCycle(e, "c", "a")).toBe(false);
  });
});

describe("findReportingCycle", () => {
  it("returns null for a safe batch", () => {
    const e = edges([["jack", "elizabeth"]]);
    expect(
      findReportingCycle(e, [
        { personId: "captain", managerId: "jack" },
        { personId: "spiderman", managerId: "jack" },
        { personId: "ww", managerId: "jack" },
      ]),
    ).toBeNull();
  });

  it("catches a cycle formed entirely within the batch", () => {
    expect(
      findReportingCycle(edges([]), [
        { personId: "a", managerId: "b" },
        { personId: "b", managerId: "a" },
      ]),
    ).not.toBeNull();
  });

  it("catches a batch edge that loops through existing edges", () => {
    const e = edges([
      ["captain", "jack"],
      ["jack", "elizabeth"],
    ]);
    expect(findReportingCycle(e, [{ personId: "elizabeth", managerId: "captain" }])).toBe("elizabeth");
  });

  it("flags self-assignment inside a batch", () => {
    expect(findReportingCycle(edges([]), [{ personId: "jack", managerId: "jack" }])).toBe("jack");
  });

  it("lets a batch re-parent an existing edge without a false positive", () => {
    // jack currently under elizabeth; moving jack under a new top-level
    // manager while his reports stay put must be allowed.
    const e = edges([
      ["jack", "elizabeth"],
      ["captain", "jack"],
    ]);
    expect(findReportingCycle(e, [{ personId: "jack", managerId: "fury" }])).toBeNull();
  });
});
