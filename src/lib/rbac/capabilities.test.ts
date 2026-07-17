import { describe, expect, it } from "vitest";
import {
  CAPABILITY_LABEL,
  GRANTABLE_CAPABILITIES,
  isGrantableCapability,
  isShiftDerivable,
  SCAN_CAPABILITIES,
  SCAN_MODE_CAPABILITY,
  SHIFT_DERIVABLE_BY_DEFAULT,
  SHIFT_DERIVATION_EXCLUDED,
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

describe("shift-derivation ceiling — isShiftDerivable / SHIFT_DERIVATION_EXCLUDED", () => {
  // The exclusion list is stronger than the defaults list: a default is a UI
  // suggestion an admin can override per row; an exclusion is a ceiling the
  // resolver enforces regardless of the row's shift_derivable flag. The SQL
  // side (20260717130531_shift_derived_grants.sql) hard-codes the same
  // exclusion; these tests pin the TS mirror.

  it("scan:credential stays derivation-excluded, permanently", () => {
    expect(SHIFT_DERIVATION_EXCLUDED).toContain("scan:credential");
    expect(isShiftDerivable("scan:credential")).toBe(false);
  });

  it("the defaults and the exclusion never overlap", () => {
    // A capability that is simultaneously "derive by default" and "never
    // derive" is a configuration paradox — one list is lying.
    for (const cap of SHIFT_DERIVABLE_BY_DEFAULT) {
      expect(SHIFT_DERIVATION_EXCLUDED, `${cap} is both default-derivable and excluded`).not.toContain(cap);
    }
  });

  it("asset/product/document scanning and asset custody remain derivable (flag decides)", () => {
    // asset:custody is NOT in the defaults but IS derivable — the org opts a
    // role in per row. That distinction is the whole point of two lists.
    expect(isShiftDerivable("scan:asset")).toBe(true);
    expect(isShiftDerivable("scan:product")).toBe(true);
    expect(isShiftDerivable("scan:document")).toBe(true);
    expect(isShiftDerivable("asset:custody")).toBe(true);
  });

  it("unknown capability strings are never derivable", () => {
    expect(isShiftDerivable("scan:everything")).toBe(false);
    expect(isShiftDerivable("projects:write")).toBe(false);
    expect(isShiftDerivable("")).toBe(false);
  });

  it("only lists real capabilities", () => {
    for (const cap of SHIFT_DERIVATION_EXCLUDED) {
      expect(isGrantableCapability(cap)).toBe(true);
    }
  });
});
