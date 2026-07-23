import { describe, expect, it } from "vitest";
import {
  buildPositionForest,
  selfAndDescendants,
  wouldCreatePositionCycle,
  type ChartPosition,
} from "./org-chart";

const pos = (
  id: string,
  title: string,
  reports_to_position_id: string | null = null,
  seat_count = 1,
): ChartPosition => ({ id, title, department_code: null, seat_count, reports_to_position_id });

describe("wouldCreatePositionCycle", () => {
  const edges = new Map<string, string | null>([
    ["ceo", null],
    ["ops", "ceo"],
    ["stage", "ops"],
  ]);

  it("flags self-reporting as a cycle of length one", () => {
    expect(wouldCreatePositionCycle(edges, "ceo", "ceo")).toBe(true);
  });

  it("flags a direct two-node loop", () => {
    // ops already reports to ceo; ceo -> ops would close the loop
    expect(wouldCreatePositionCycle(edges, "ceo", "ops")).toBe(true);
  });

  it("flags a deep loop through the chain", () => {
    // stage -> ops -> ceo; ceo -> stage closes a 3-cycle
    expect(wouldCreatePositionCycle(edges, "ceo", "stage")).toBe(true);
  });

  it("allows a legal edge", () => {
    expect(wouldCreatePositionCycle(edges, "stage", "ceo")).toBe(false);
  });

  it("allows re-parenting within the tree", () => {
    // stage moves from ops to ceo — no loop
    expect(wouldCreatePositionCycle(edges, "stage", "ceo")).toBe(false);
  });

  it("terminates on a pre-existing loop that never reaches the position", () => {
    const bad = new Map<string, string | null>([
      ["a", "b"],
      ["b", "a"], // corrupt store: a <-> b
      ["x", null],
    ]);
    // new edge x -> a walks into the a/b loop; must terminate and allow
    expect(wouldCreatePositionCycle(bad, "x", "a")).toBe(false);
  });
});

describe("selfAndDescendants", () => {
  const positions = [
    pos("ceo", "CEO"),
    pos("ops", "Ops Director", "ceo"),
    pos("stage", "Stage Manager", "ops"),
    pos("fin", "Finance Director", "ceo"),
  ];

  it("collects the whole subtree including self", () => {
    expect(selfAndDescendants(positions, "ceo")).toEqual(new Set(["ceo", "ops", "stage", "fin"]));
    expect(selfAndDescendants(positions, "ops")).toEqual(new Set(["ops", "stage"]));
  });

  it("a leaf excludes only itself", () => {
    expect(selfAndDescendants(positions, "stage")).toEqual(new Set(["stage"]));
  });

  it("terminates on cyclic data", () => {
    const bad = [pos("a", "A", "b"), pos("b", "B", "a")];
    expect(selfAndDescendants(bad, "a")).toEqual(new Set(["a", "b"]));
  });
});

describe("buildPositionForest", () => {
  it("a flat org is all roots with zero edges", () => {
    const { roots, edgeCount } = buildPositionForest([pos("a", "A"), pos("b", "B")]);
    expect(edgeCount).toBe(0);
    expect(roots.map((r) => r.position.id)).toEqual(["a", "b"]);
    expect(roots.every((r) => r.children.length === 0)).toBe(true);
  });

  it("builds nested trees with title-sorted children", () => {
    const { roots, edgeCount } = buildPositionForest([
      pos("ceo", "CEO"),
      pos("z", "Zulu Lead", "ceo"),
      pos("a", "Alpha Lead", "ceo"),
      pos("crew", "Crew Chief", "a"),
    ]);
    expect(edgeCount).toBe(3);
    expect(roots).toHaveLength(1);
    expect(roots[0]?.children.map((c) => c.position.title)).toEqual(["Alpha Lead", "Zulu Lead"]);
    expect(roots[0]?.children[0]?.children[0]?.position.id).toBe("crew");
  });

  it("an edge to a parent outside the set degrades to a root (orphan handling)", () => {
    const { roots, edgeCount } = buildPositionForest([pos("orphan", "Orphan", "archived-away")]);
    expect(edgeCount).toBe(0);
    expect(roots.map((r) => r.position.id)).toEqual(["orphan"]);
  });

  it("a self-edge is ignored, the node stays a root", () => {
    const { roots, edgeCount } = buildPositionForest([pos("weird", "Weird", "weird")]);
    expect(edgeCount).toBe(0);
    expect(roots.map((r) => r.position.id)).toEqual(["weird"]);
  });

  it("cycle members are promoted to roots, appear exactly once, and the walk terminates", () => {
    const { roots } = buildPositionForest([
      pos("ceo", "CEO"),
      pos("a", "A", "b"),
      pos("b", "B", "a"), // corrupt 2-cycle alongside a healthy root
    ]);
    const flatten = (nodes: ReturnType<typeof buildPositionForest>["roots"]): string[] =>
      nodes.flatMap((n) => [n.position.id, ...flatten(n.children)]);
    const ids = flatten(roots);
    expect(ids.slice().sort()).toEqual(["a", "b", "ceo"]);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    // the first cycle member (input order) is promoted; its mate hangs under it
    const promoted = roots.find((r) => r.position.id === "a");
    expect(promoted?.children.map((c) => c.position.id)).toEqual(["b"]);
  });

  it("every node appears exactly once in a large mixed forest", () => {
    const positions = [
      pos("r1", "Root One"),
      pos("r2", "Root Two"),
      pos("c1", "Child 1", "r1"),
      pos("c2", "Child 2", "r1"),
      pos("g1", "Grand 1", "c1"),
      pos("o1", "Orphan", "gone"),
      pos("x", "X", "y"),
      pos("y", "Y", "x"),
    ];
    const { roots } = buildPositionForest(positions);
    const flatten = (nodes: ReturnType<typeof buildPositionForest>["roots"]): string[] =>
      nodes.flatMap((n) => [n.position.id, ...flatten(n.children)]);
    const ids = flatten(roots);
    expect(ids.slice().sort()).toEqual(positions.map((p) => p.id).sort());
    expect(new Set(ids).size).toBe(positions.length);
  });
});
