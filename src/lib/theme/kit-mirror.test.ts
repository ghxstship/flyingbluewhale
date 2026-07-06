import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Kit ⇄ repo mirror guard (v8.1 parity landing — REPO_PARITY_HANDOFF §9).
 *
 * The ATLVS Ecosystem kit and this repo are a bidirectional mirror. This guard
 * pins the four value families a repo⇄kit parity audit found drifting so they
 * can never silently re-open: the machined radius scale (2/3/4/6/10), the kit
 * breakpoints (sm 480 · content-max 1200), the 5-step elevation scale, and the
 * version stamp. The canonical kit values are checked in below as a snapshot;
 * the assertions read the three repo sources (tokens.json, the generated
 * atlvs-product.css, and the globals.css @theme-inline Tailwind mirror) and
 * require them to agree with the snapshot AND each other.
 */

const ROOT = process.cwd();
const TOKENS = JSON.parse(readFileSync(join(ROOT, "src/app/theme/tokens.json"), "utf8")) as {
  version: string;
  typeSystem: string;
  radiusSystem: string;
  radii: Record<string, string>;
  breakpoints: Record<string, string>;
  elevation: Record<string, unknown>;
};
const THEME = readFileSync(join(ROOT, "src/app/theme/themes/atlvs-product.css"), "utf8");
const GLOBALS = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

/** Canonical kit v8.1 snapshot — the SSOT this repo mirrors. */
const KIT = {
  version: "8.1",
  typeSystem: "Wired Scale (v8.0)",
  radiusSystem: "machined (v7.9)",
  radii: {
    "r-sm": "2px",
    r: "3px",
    "r-md": "4px",
    "r-lg": "6px",
    "r-xl": "10px",
    "r-pill": "999px",
  } as Record<string, string>,
  breakpoints: {
    "bp-sm": "480px",
    "bp-md": "768px",
    "bp-lg": "1024px",
    "bp-xl": "1280px",
    "bp-2xl": "1536px",
    "content-max": "1200px",
  } as Record<string, string>,
  elevation: ["elev-xs", "elev-1", "elev-2", "elev-3", "elev-2xl"],
};

describe("kit ⇄ repo mirror — version stamp", () => {
  it("tokens.json carries the reconciled v8.1 version + type/radius system stamps", () => {
    expect(TOKENS.version).toBe(KIT.version);
    expect(TOKENS.typeSystem).toBe(KIT.typeSystem);
    expect(TOKENS.radiusSystem).toBe(KIT.radiusSystem);
  });
});

describe("kit ⇄ repo mirror — machined radius scale (2/3/4/6/10)", () => {
  it("tokens.json#radii equals the kit machined scale", () => {
    for (const [name, value] of Object.entries(KIT.radii)) {
      expect(TOKENS.radii[name], `tokens.json radii.${name}`).toBe(value);
    }
  });

  it("atlvs-product.css emits the same --p-r-* values", () => {
    // r-sm → --p-r-sm, r → --p-r, r-md → --p-r-md, etc.
    for (const [name, value] of Object.entries(KIT.radii)) {
      const cssVar = name === "r" ? "--p-r" : `--p-${name}`;
      const re = new RegExp(`${cssVar.replace(/[-]/g, "\\$&")}:\\s*${value.replace(".", "\\.")}\\s*;`);
      expect(re.test(THEME), `${cssVar}: ${value}; missing from atlvs-product.css`).toBe(true);
    }
  });

  it("globals.css @theme-inline maps large radii onto the machined tokens (no collapse to r-lg)", () => {
    // The pre-v8.1 shim collapsed --radius-md/xl/2xl/3xl onto smaller tokens.
    expect(/--radius-md:\s*var\(--p-r-md\)/.test(GLOBALS)).toBe(true);
    expect(/--radius-lg:\s*var\(--p-r-lg\)/.test(GLOBALS)).toBe(true);
    expect(/--radius-xl:\s*var\(--p-r-xl\)/.test(GLOBALS)).toBe(true);
    expect(/--radius-2xl:\s*var\(--p-r-xl\)/.test(GLOBALS)).toBe(true);
    expect(/--radius-3xl:\s*var\(--p-r-xl\)/.test(GLOBALS)).toBe(true);
  });
});

describe("kit ⇄ repo mirror — breakpoints (sm 480 · content-max 1200)", () => {
  it("tokens.json#breakpoints equals the kit values", () => {
    for (const [name, value] of Object.entries(KIT.breakpoints)) {
      expect(TOKENS.breakpoints[name], `tokens.json breakpoints.${name}`).toBe(value);
    }
  });

  it("atlvs-product.css emits --bp-* + --p-content-max verbatim", () => {
    for (const [name, value] of Object.entries(KIT.breakpoints)) {
      const cssVar = name === "content-max" ? "--p-content-max" : `--${name}`;
      const re = new RegExp(`${cssVar.replace(/[-]/g, "\\$&")}:\\s*${value};`);
      expect(re.test(THEME), `${cssVar}: ${value}; missing from atlvs-product.css`).toBe(true);
    }
  });

  it("globals.css @theme-inline Tailwind mirror uses sm 480 (not the Tailwind default 640)", () => {
    expect(/--breakpoint-sm:\s*480px/.test(GLOBALS)).toBe(true);
    expect(GLOBALS.includes("--breakpoint-sm: 640px")).toBe(false);
    // The @media literals that mirror --breakpoint-sm must move together.
    expect(GLOBALS.includes("min-width: 640px")).toBe(false);
  });
});

describe("kit ⇄ repo mirror — 5-step elevation", () => {
  it("tokens.json#elevation carries all five members", () => {
    for (const member of KIT.elevation) {
      expect(TOKENS.elevation[member], `tokens.json elevation.${member}`).toBeTruthy();
    }
  });

  it("atlvs-product.css declares all five --p-elev-* tokens", () => {
    for (const member of KIT.elevation) {
      expect(THEME.includes(`--p-${member}:`), `--p-${member}: missing from atlvs-product.css`).toBe(true);
    }
  });

  it("globals.css exposes the full 5-step elevation utility ladder (incl. -xs and -2xl)", () => {
    for (const cls of [".elevation-xs", ".elevation-1", ".elevation-2", ".elevation-3", ".elevation-2xl"]) {
      expect(GLOBALS.includes(cls), `${cls} utility missing from globals.css`).toBe(true);
    }
  });
});
