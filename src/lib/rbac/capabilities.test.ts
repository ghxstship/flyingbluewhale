import { describe, expect, it } from "vitest";
import {
  CAPABILITY_LABEL,
  GRANTABLE_CAPABILITIES,
  isGrantableCapability,
  SCAN_CAPABILITIES,
  SCAN_MODE_CAPABILITY,
  SHIFT_DERIVABLE_BY_DEFAULT,
} from "./capabilities";
import { SCAN_MODES } from "@/lib/scan/formats";

describe("capability catalog", () => {
  it("every scan mode except `any` maps to exactly one capability", () => {
    // The enforcement point depends on this: the mode a surface is in IS the
    // capability it needs. A mode with no mapping would be an ungated surface.
    for (const mode of SCAN_MODES) {
      if (mode === "any") continue;
      const cap = SCAN_MODE_CAPABILITY[mode as keyof typeof SCAN_MODE_CAPABILITY];
      expect(cap, `mode "${mode}" has no capability`).toBeDefined();
      expect(SCAN_CAPABILITIES).toContain(cap);
    }
  });

  it("`any` is deliberately NOT a capability", () => {
    // Quick Scan resolves across domains; it requires *some* scan capability
    // and the resolver narrows the chain. A single `scan:any` capability would
    // either over-grant or lock out asset-only users.
    expect(SCAN_MODE_CAPABILITY).not.toHaveProperty("any");
  });

  it("every grantable capability has an operator-facing label", () => {
    // An unlabelled capability is unadministrable — it would render as a raw
    // string in the grant UI.
    for (const cap of GRANTABLE_CAPABILITIES) {
      expect(CAPABILITY_LABEL[cap], `no label for ${cap}`).toBeTruthy();
    }
  });

  it("rejects unknown capability strings", () => {
    // Guards the write path: a typo'd capability in a grant row grants nothing
    // while looking configured — the worst failure mode for a permission system.
    expect(isGrantableCapability("scan:asset")).toBe(true);
    expect(isGrantableCapability("scan:credential")).toBe(true);
    expect(isGrantableCapability("scan:everything")).toBe(false);
    expect(isGrantableCapability("projects:write")).toBe(false);
    expect(isGrantableCapability("")).toBe(false);
  });
});

describe("shift-derivable defaults — the scheduler is an authz surface", () => {
  it("NEVER lets a shift confer credential scanning", () => {
    // Shift-derived grants mean whoever can roster Bob can hand him the
    // capabilities of the role he's rostered onto. That is the intended
    // ergonomics for gear and stock. It is NOT acceptable for gate access,
    // which must be granted explicitly and attributably.
    expect(SHIFT_DERIVABLE_BY_DEFAULT).not.toContain("scan:credential");
  });

  it("does let a shift confer asset + product scanning", () => {
    expect(SHIFT_DERIVABLE_BY_DEFAULT).toContain("scan:asset");
    expect(SHIFT_DERIVABLE_BY_DEFAULT).toContain("scan:product");
  });

  it("only lists real capabilities", () => {
    for (const cap of SHIFT_DERIVABLE_BY_DEFAULT) {
      expect(isGrantableCapability(cap)).toBe(true);
    }
  });
});
