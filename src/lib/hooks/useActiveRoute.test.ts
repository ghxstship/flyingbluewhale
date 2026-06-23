/**
 * Single-source-of-truth active-route matcher (§7 anti-pattern #2).
 */
import { describe, it, expect } from "vitest";
import { matchRoute } from "./useActiveRoute";

describe("matchRoute", () => {
  it("returns exact + active when the pathname equals the href", () => {
    expect(matchRoute("/studio/projects", "/studio/projects")).toEqual({
      isActive: true,
      isExact: true,
    });
  });

  it("returns active but not exact when pathname is a child of href", () => {
    expect(matchRoute("/studio/projects/123", "/studio/projects")).toEqual({
      isActive: true,
      isExact: false,
    });
  });

  it("does NOT mark as active when the prefix match is not at a segment boundary", () => {
    // `/studio/proposals` must never activate `/studio/proj` or
    // `/studio/projects` — this was the observed regression that
    // motivated the hook.
    expect(matchRoute("/studio/proposals", "/studio/projects")).toEqual({
      isActive: false,
      isExact: false,
    });
  });

  it("does not mark root as active on every page", () => {
    expect(matchRoute("/studio/projects", "/")).toEqual({
      isActive: false,
      isExact: false,
    });
  });

  it("marks root as active when we are actually at root", () => {
    expect(matchRoute("/", "/")).toEqual({ isActive: true, isExact: true });
  });

  it("returns inactive on empty href", () => {
    expect(matchRoute("/studio", "")).toEqual({ isActive: false, isExact: false });
  });
});
