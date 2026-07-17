import { describe, expect, it } from "vitest";
import { buildReportingBranches, wouldCreateReportingCycle, type ReportingEdge } from "./reporting";

// The acceptance-scenario shape: ES → JS → {CA, SM, WW}.
const edges: ReportingEdge[] = [
  { id: "es", reportsTo: null },
  { id: "js", reportsTo: "es" },
  { id: "ca", reportsTo: "js" },
  { id: "sm", reportsTo: "js" },
  { id: "ww", reportsTo: "js" },
];

describe("wouldCreateReportingCycle", () => {
  it("allows a normal downward edge", () => {
    expect(wouldCreateReportingCycle(edges, "ww", "es")).toBe(false);
  });

  it("allows clearing the edge", () => {
    expect(wouldCreateReportingCycle(edges, "js", null)).toBe(false);
  });

  it("rejects a self-report", () => {
    expect(wouldCreateReportingCycle(edges, "js", "js")).toBe(true);
  });

  it("rejects a direct two-node loop", () => {
    // JS reports to ES; pointing ES at JS closes the loop.
    expect(wouldCreateReportingCycle(edges, "es", "js")).toBe(true);
  });

  it("rejects a deep loop through the chain", () => {
    // CA reports to JS reports to ES; pointing ES at CA is a 3-node cycle.
    expect(wouldCreateReportingCycle(edges, "es", "ca")).toBe(true);
  });

  it("allows re-parenting between siblings' subtrees", () => {
    expect(wouldCreateReportingCycle(edges, "sm", "ca")).toBe(false);
  });

  it("terminates on pre-existing corrupt cycles it is not part of", () => {
    const corrupt: ReportingEdge[] = [
      { id: "a", reportsTo: "b" },
      { id: "b", reportsTo: "a" },
      { id: "c", reportsTo: null },
    ];
    expect(wouldCreateReportingCycle(corrupt, "c", "a")).toBe(false);
  });

  it("treats a manager outside the edge set as a root chain", () => {
    expect(wouldCreateReportingCycle(edges, "ww", "unknown")).toBe(false);
  });
});

describe("buildReportingBranches", () => {
  it("builds the acceptance forest with counts", () => {
    const forest = buildReportingBranches(edges);
    expect(forest).toHaveLength(1);
    const es = forest[0]!;
    expect(es.node.id).toBe("es");
    expect(es.reportCount).toBe(1);
    const js = es.children[0]!;
    expect(js.node.id).toBe("js");
    expect(js.reportCount).toBe(3);
    expect(js.children.map((c) => c.node.id)).toEqual(["ca", "sm", "ww"]);
  });

  it("roots a node whose manager is outside the set", () => {
    const forest = buildReportingBranches([
      { id: "a", reportsTo: "gone" },
      { id: "b", reportsTo: "a" },
    ]);
    expect(forest.map((f) => f.node.id)).toEqual(["a"]);
    expect(forest[0]!.children.map((c) => c.node.id)).toEqual(["b"]);
  });

  it("emits every node exactly once even with a corrupt cycle", () => {
    const forest = buildReportingBranches([
      { id: "a", reportsTo: "b" },
      { id: "b", reportsTo: "a" },
    ]);
    const flat: string[] = [];
    const walk = (b: { node: { id: string }; children: { node: { id: string }; children: never[] }[] }) => {
      flat.push(b.node.id);
      for (const c of b.children) walk(c as never);
    };
    for (const f of forest) walk(f as never);
    expect(flat.sort()).toEqual(["a", "b"]);
  });
});
