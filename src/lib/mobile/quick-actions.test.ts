import { describe, it, expect } from "vitest";
import {
  QUICK_ACTIONS,
  QUICK_ACTION_IDS,
  DEFAULT_QUICK_ACTIONS,
  isQuickActionId,
  resolveQuickActions,
} from "./quick-actions";

describe("quick-actions registry", () => {
  it("every registry entry is self-consistent (id matches key, has icon/tint/href)", () => {
    for (const id of QUICK_ACTION_IDS) {
      const def = QUICK_ACTIONS[id];
      expect(def.id).toBe(id);
      expect(def.icon.length).toBeGreaterThan(0);
      expect(def.href.startsWith("/m/")).toBe(true);
      expect(["danger", "accent", "info", "warning", "success"]).toContain(def.tint);
    }
  });

  it("the default set is a subset of the registry, in registry order-agnostic form", () => {
    for (const id of DEFAULT_QUICK_ACTIONS) expect(QUICK_ACTION_IDS).toContain(id);
    // The default set is smaller than the registry so AVAILABLE is non-empty.
    expect(DEFAULT_QUICK_ACTIONS.length).toBeLessThan(QUICK_ACTION_IDS.length);
  });

  it("isQuickActionId guards unknown ids", () => {
    expect(isQuickActionId("report")).toBe(true);
    expect(isQuickActionId("nope")).toBe(false);
    expect(isQuickActionId(42)).toBe(false);
    expect(isQuickActionId(undefined)).toBe(false);
  });
});

describe("resolveQuickActions", () => {
  it("falls back to the default set for absent / non-array / empty input", () => {
    expect(resolveQuickActions(undefined)).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(resolveQuickActions(null)).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(resolveQuickActions("report")).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(resolveQuickActions([])).toEqual(DEFAULT_QUICK_ACTIONS);
    expect(resolveQuickActions(["nope", 1, {}])).toEqual(DEFAULT_QUICK_ACTIONS);
  });

  it("keeps a customized order, drops unknowns, and de-dupes", () => {
    expect(resolveQuickActions(["scan", "report"])).toEqual(["scan", "report"]);
    expect(resolveQuickActions(["scan", "nope", "report", "scan"])).toEqual(["scan", "report"]);
  });

  it("returns a fresh array (never the shared default reference)", () => {
    const a = resolveQuickActions(undefined);
    a.push("po");
    expect(resolveQuickActions(undefined)).toEqual(DEFAULT_QUICK_ACTIONS);
  });
});
