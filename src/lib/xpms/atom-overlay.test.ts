import { describe, it, expect } from "vitest";
import { mergeAtomOverlay, type AtomOverlaySetting } from "@/lib/xpms/atom-overlay";
import {
  DEPARTMENT_APPS,
  DEPT_CODE_APP,
  APP_LABEL,
  APP_TOKEN,
  appForDeptCode,
  isDepartmentApp,
  type DepartmentApp,
} from "@/lib/xpms/app-ownership";

/**
 * P4 ratchets (LEG3ND readiness program):
 *
 * 1. The org overlay NEVER masks catalog rows structurally — the master
 *    catalog is the immutable SSOT; disable is a flag, not a delete.
 * 2. The app-ownership chip maps ALL FOUR apps (the Record<DepartmentApp, …>
 *    shape already enforces this at compile time; the runtime walk keeps the
 *    values non-empty and token-only).
 */

const atoms = [
  { xpms_atom_id: "0000.10.01-001", name: "Executive Producer Day" },
  { xpms_atom_id: "5000.10.05-014", name: "Line Array Hang" },
  { xpms_atom_id: "6000.20.02-003", name: "Overnight Security Post" },
];

describe("mergeAtomOverlay — settings-over-catalog, never a mask", () => {
  it("returns every catalog atom, in order, regardless of overlay content", () => {
    const settings: AtomOverlaySetting[] = [
      { xpms_atom_id: "5000.10.05-014", enabled: false, org_label: null },
      { xpms_atom_id: "6000.20.02-003", enabled: false, org_label: "Night Watch" },
      // Overlay rows for atoms outside the slice must be ignored, not added.
      { xpms_atom_id: "9000.99.99-999", enabled: false, org_label: "Ghost" },
    ];
    const merged = mergeAtomOverlay(atoms, settings);
    expect(merged).toHaveLength(atoms.length);
    expect(merged.map((a) => a.xpms_atom_id)).toEqual(atoms.map((a) => a.xpms_atom_id));
  });

  it("flags disabled atoms instead of dropping them", () => {
    const merged = mergeAtomOverlay(atoms, [
      { xpms_atom_id: "5000.10.05-014", enabled: false, org_label: null },
    ]);
    const disabled = merged.find((a) => a.xpms_atom_id === "5000.10.05-014");
    expect(disabled).toBeDefined();
    expect(disabled!.enabled).toBe(false);
    // Everything without an overlay row defaults to enabled.
    expect(merged.filter((a) => a.enabled)).toHaveLength(2);
  });

  it("applies the org label as display override without touching the canonical name", () => {
    const merged = mergeAtomOverlay(atoms, [
      { xpms_atom_id: "6000.20.02-003", enabled: true, org_label: "Night Watch" },
    ]);
    const overridden = merged.find((a) => a.xpms_atom_id === "6000.20.02-003")!;
    expect(overridden.displayName).toBe("Night Watch");
    expect(overridden.orgLabel).toBe("Night Watch");
    expect(overridden.name).toBe("Overnight Security Post");
    // Blank / whitespace overrides fall back to the canonical name.
    const blank = mergeAtomOverlay(atoms, [
      { xpms_atom_id: "6000.20.02-003", enabled: true, org_label: "   " },
    ]).find((a) => a.xpms_atom_id === "6000.20.02-003")!;
    expect(blank.displayName).toBe("Overnight Security Post");
    expect(blank.orgLabel).toBeNull();
  });

  it("with no overlay at all, every atom is enabled under its canonical name", () => {
    const merged = mergeAtomOverlay(atoms, []);
    expect(merged.every((a) => a.enabled && a.displayName === a.name && a.orgLabel === null)).toBe(true);
  });
});

describe("app-ownership canon — all four apps, token-only colors", () => {
  it("maps every app to a label and brand tokens (compile-level Record + runtime walk)", () => {
    // The Record<DepartmentApp, …> types make a missing app a compile error;
    // this walk keeps the VALUES honest.
    for (const app of DEPARTMENT_APPS) {
      expect(APP_LABEL[app]).toBeTruthy();
      expect(APP_TOKEN[app].fg).toMatch(/^var\(--brand-/);
      expect(APP_TOKEN[app].base).toMatch(/^var\(--brand-/);
    }
    expect(DEPARTMENT_APPS).toHaveLength(4);
  });

  it("mirrors the dim_department seed: 10 classes, §2a ownership bands", () => {
    expect(Object.keys(DEPT_CODE_APP)).toHaveLength(10);
    const bands: Record<DepartmentApp, string[]> = {
      legend: ["0000"],
      atlvs: ["1000", "2000", "3000"],
      compvss: ["4000", "5000", "6000"],
      gvteway: ["7000", "8000", "9000"],
    };
    for (const app of DEPARTMENT_APPS) {
      for (const code of bands[app]) expect(DEPT_CODE_APP[code]).toBe(app);
    }
  });

  it("resolves sub-codes to their thousand-class and rejects junk", () => {
    expect(appForDeptCode("5100")).toBe("compvss");
    expect(appForDeptCode("0000")).toBe("legend");
    expect(appForDeptCode("9999")).toBe("gvteway");
    expect(appForDeptCode("")).toBeNull();
    expect(appForDeptCode(null)).toBeNull();
    expect(appForDeptCode("X100")).toBeNull();
  });

  it("isDepartmentApp guards the live dim_department.app column values", () => {
    for (const app of DEPARTMENT_APPS) expect(isDepartmentApp(app)).toBe(true);
    expect(isDepartmentApp("ghxstship")).toBe(false);
    expect(isDepartmentApp(null)).toBe(false);
  });
});
