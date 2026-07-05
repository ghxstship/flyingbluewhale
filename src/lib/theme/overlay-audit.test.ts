import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Overlay audit (kit 21 wave W0) — every overlay primitive sits on the
 * --p-z-* ladder (src/app/theme/kit-layers.css) over the single
 * --overlay-backdrop scrim. Literal z-index utilities (z-50, z-[60], …) and
 * restated rgba/black scrims in overlay code regress the stacking SSOT, so
 * this suite greps them to zero. Camera-viewfinder chrome (CameraScanner)
 * and image-hover affordances are out of scope — those tint media, not the
 * page, and are intentionally mode-independent.
 */
const ROOT = process.cwd();

const OVERLAY_FILES = [
  "src/components/ui/Dialog.tsx",
  "src/components/ui/Sheet.tsx",
  "src/components/ui/Popover.tsx",
  "src/components/ui/Tooltip.tsx",
  "src/components/ui/DropdownMenu.tsx",
  "src/components/ui/Select.tsx",
  "src/components/ui/Combobox.tsx",
  "src/components/ui/DatePicker.tsx",
  "src/components/ui/Toast.tsx",
  "src/components/ui/Coachmark.tsx",
  "src/components/ui/RowActions.tsx",
  "src/components/ui/ConfirmDialog.tsx",
  "src/components/CommandPalette.tsx",
  "src/components/NotificationsBell.tsx",
];

/** Matches literal z utilities (z-50, z-[60]) but not the ladder-token form
 *  (a z arbitrary value wrapping var(--p-z-NAME)). Comments are stripped so
 *  prose mentions don't trip the gate. NOTE: no bracketed z-token example is
 *  written here — Tailwind's source scanner would extract it as a real class
 *  candidate and emit invalid CSS. */
const LITERAL_Z = /\bz-(\d|\[\d)/;
const LITERAL_SCRIM = /bg-black\/\d/;

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("overlay audit — z-index ladder + scrim SSOT (W0)", () => {
  for (const rel of OVERLAY_FILES) {
    const src = stripComments(readFileSync(join(ROOT, rel), "utf8"));

    it(`${rel} has no literal z-index utilities`, () => {
      const hit = src.match(LITERAL_Z);
      expect(hit, `found literal z utility "${hit?.[0]}" — use a --p-z-* ladder token instead`).toBeNull();
    });

    it(`${rel} has no hardcoded black scrim`, () => {
      const hit = src.match(LITERAL_SCRIM);
      expect(hit, `found "${hit?.[0]}" — use bg-[var(--overlay-backdrop)]`).toBeNull();
    });
  }

  it("modal primitives paint the shared --overlay-backdrop scrim", () => {
    for (const rel of ["src/components/ui/Dialog.tsx", "src/components/ui/Sheet.tsx"]) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src, `${rel} must use var(--overlay-backdrop)`).toContain("var(--overlay-backdrop)");
    }
  });

  it("kit-layers.css defines --overlay-backdrop from the scrim opacity steps", () => {
    const css = readFileSync(join(ROOT, "src/app/theme/kit-layers.css"), "utf8").replace(/\s+/g, " ");
    expect(css).toContain("--overlay-backdrop:");
    expect(css).toMatch(/--overlay-backdrop:[^;]*--p-o-scrim/);
    expect(css).toMatch(/--overlay-backdrop:[^;]*--p-o-scrim-dark/);
  });

  it("dirty-state guard: Dialog + Sheet expose onBeforeClose", () => {
    for (const rel of ["src/components/ui/Dialog.tsx", "src/components/ui/Sheet.tsx"]) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src, `${rel} must expose onBeforeClose`).toContain("onBeforeClose");
    }
  });

  it("Sheet renders as a bottom sheet below 720px (responsive opt-out)", () => {
    const src = readFileSync(join(ROOT, "src/components/ui/Sheet.tsx"), "utf8");
    expect(src).toContain("max-width: 719px");
    expect(src).toContain("responsive");
  });
});
