import { describe, it, expect } from "vitest";
import { filterNavByModuleScope, platformNav } from "./nav";

/**
 * Scope-gated rail filtering (kit 21 W4). A subcontractor membership carries a
 * module allow-list; the rail narrows to those groups + Home. Null/empty scope
 * (ordinary members) is a pass-through.
 */
describe("filterNavByModuleScope", () => {
  it("returns the full rail for null / empty scope", () => {
    expect(filterNavByModuleScope(platformNav, null)).toBe(platformNav);
    expect(filterNavByModuleScope(platformNav, [])).toBe(platformNav);
  });

  it("keeps only Home + the allow-listed groups", () => {
    const out = filterNavByModuleScope(platformNav, ["Finance", "Procurement"]);
    const labels = out.map((g) => g.label);
    expect(labels).toContain("Home");
    expect(labels).toContain("Finance");
    expect(labels).toContain("Procurement");
    expect(labels).not.toContain("Sales");
    expect(labels).not.toContain("Production");
  });

  it("always keeps Home even when it isn't in the allow-list", () => {
    const out = filterNavByModuleScope(platformNav, ["Finance"]);
    expect(out.map((g) => g.label)).toContain("Home");
  });

  it("drops every group when the allow-list matches nothing real", () => {
    const out = filterNavByModuleScope(platformNav, ["Nonexistent"]);
    expect(out.map((g) => g.label)).toEqual(["Home"]);
  });
});
