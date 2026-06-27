import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Voice + type regression guards (Phase 5 of the 2026-06-27 conformance pass).
 *
 * These fail CI on the anti-patterns we just paid to clean up:
 *  - em/en-dashes in UI copy (brand rule: never a dash in shipped copy; use a
 *    colon, period, comma, or restructure). Sanctioned: the emDash/dash helper
 *    tokens, bare "—" empty-value placeholders, and the compare/alternatives
 *    competitor copy.
 *  - AI-slop lexicon in the message catalogs.
 *  - hand-rolled headings (must use the Anton .hed-* scale) and overlines (must
 *    use .eyebrow) on the marketing surface.
 *  - hand-rolled accent-CTA buttons on marketing (must use <Button variant="cta">).
 *  - inline hex color literals on marketing (must resolve from --p-* tokens).
 *
 * Narrow, documented allowlists cover the legitimate exceptions (stat/price
 * display numbers, the customer-logo wordmark, brand-kit color swatches).
 */

const REPO_ROOT = process.cwd();
const MESSAGES = join(REPO_ROOT, "src", "messages");
const MARKETING = join(REPO_ROOT, "src", "app", "(marketing)");
const rel = (f: string) => relative(REPO_ROOT, f);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (st.isFile()) {
      out.push(full);
    }
  }
  return out;
}

type StringEntry = { path: string[]; value: string };
function collectStrings(obj: unknown, path: string[], acc: StringEntry[]) {
  if (typeof obj === "string") {
    acc.push({ path, value: obj });
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) collectStrings(v, [...path, k], acc);
  }
}

const MESSAGE_FILES = walk(MESSAGES).filter((f) => f.endsWith(".json"));
const MARKETING_TSX = walk(MARKETING).filter((f) => f.endsWith(".tsx"));
const ALL_TSX = walk(join(REPO_ROOT, "src")).filter((f) => f.endsWith(".tsx") && !/\.test\.tsx?$/.test(f));

// ── Voice: no em/en-dashes in UI copy ───────────────────────────────────────
const DASH = /[—–]/; // em-dash, en-dash
function dashSanctioned(p: string[], value: string): boolean {
  const key = p[p.length - 1];
  if (key === "emDash" || key === "dash") return true; // helper tokens
  if (value.trim() === "—" || value.trim() === "–") return true; // empty-value placeholder
  if (p.some((seg) => seg === "compare" || seg === "alternatives")) return true; // sanctioned compare/alternatives copy
  return false;
}

describe("Voice guard — no em-dashes in UI copy", () => {
  for (const file of MESSAGE_FILES) {
    it(`${rel(file)} has no unsanctioned em/en-dashes`, () => {
      const acc: StringEntry[] = [];
      collectStrings(JSON.parse(readFileSync(file, "utf8")), [], acc);
      const offenders = acc
        .filter((e) => DASH.test(e.value) && !dashSanctioned(e.path, e.value))
        .map((e) => `${e.path.join(".")} = ${JSON.stringify(e.value)}`);
      expect(offenders, `Replace dashes with a colon/period/comma or restructure:\n${offenders.join("\n")}`).toEqual([]);
    });
  }
});

// ── Voice: no AI-slop lexicon ────────────────────────────────────────────────
const SLOP =
  /\b(synerg\w*|streamlines?|streamlining|seamless\w*|leverages?|leveraging|empowers?|empowering|best-in-class|enterprise-grade|cutting-edge|game-?chang\w*|revolutioniz\w*)\b/i;

describe("Voice guard — no marketing-slop lexicon", () => {
  for (const file of MESSAGE_FILES) {
    it(`${rel(file)} avoids banned slop words`, () => {
      const acc: StringEntry[] = [];
      collectStrings(JSON.parse(readFileSync(file, "utf8")), [], acc);
      const offenders = acc
        .filter((e) => SLOP.test(e.value) && !e.path.some((s) => s === "compare" || s === "alternatives"))
        .map((e) => `${e.path.join(".")} = ${JSON.stringify(e.value)}`);
      expect(offenders, offenders.join("\n")).toEqual([]);
    });
  }
});

// ── Type: marketing headings use the Anton .hed-* scale ──────────────────────
const AD_HOC_HEADING = /text-(3|4|5|6)xl font-(semi)?bold tracking-tight/;
const headingAllowed = (line: string) => /s\.big|tier\.price/.test(line); // stat value / price display, not headings

describe("Type guard — marketing uses the .hed-* scale", () => {
  it("no ad-hoc display headings (text-Nxl font-bold tracking-tight)", () => {
    const offenders: string[] = [];
    for (const f of MARKETING_TSX) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (AD_HOC_HEADING.test(line) && !headingAllowed(line)) offenders.push(`${rel(f)}:${i + 1}`);
        });
    }
    expect(offenders, `Use .hed-3xl/2xl/xl/lg instead:\n${offenders.join("\n")}`).toEqual([]);
  });
});

// ── Type: marketing overlines use the .eyebrow class ─────────────────────────
const AD_HOC_EYEBROW = /(tracking-\[0\.[0-9]+em\][^"]*uppercase|uppercase[^"]*tracking-\[0\.[0-9]+em\])/;
const eyebrowAllowed = (line: string) => /logo-marquee/.test(line); // customer-logo wordmark treatment

describe("Type guard — marketing uses the .eyebrow class", () => {
  it("no hand-rolled overlines (tracking-[0.NNem] uppercase)", () => {
    const offenders: string[] = [];
    for (const f of MARKETING_TSX) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (AD_HOC_EYEBROW.test(line) && !eyebrowAllowed(line)) offenders.push(`${rel(f)}:${i + 1}`);
        });
    }
    expect(offenders, `Use class "eyebrow" / "eyebrow eyebrow-accent" instead:\n${offenders.join("\n")}`).toEqual([]);
  });
});

// ── Components: every CTA goes through <Button variant="cta"> ────────────────
describe("Component guard — CTAs use the Button primitive", () => {
  it("no hand-rolled bg-[var(--p-accent-cta)] CTAs anywhere in src", () => {
    const offenders: string[] = [];
    for (const f of ALL_TSX) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.includes("bg-[var(--p-accent-cta)]")) offenders.push(`${rel(f)}:${i + 1}`);
        });
    }
    expect(offenders, `Use <Button variant="cta"> (focus ring + :active):\n${offenders.join("\n")}`).toEqual([]);
  });
});

// ── Color: marketing resolves color from --p-* tokens ────────────────────────
const INLINE_HEX = /style=\{\{[^}]*#[0-9a-fA-F]{3,6}/;

describe("Color guard — marketing resolves color from tokens", () => {
  it("no hardcoded hex in inline style props (brand-kit swatches excepted)", () => {
    const offenders: string[] = [];
    for (const f of MARKETING_TSX) {
      if (f.includes("/brand-kit/")) continue; // brand-kit pages demonstrate literal colors
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (INLINE_HEX.test(line) && !line.includes("eslint-disable")) offenders.push(`${rel(f)}:${i + 1}`);
        });
    }
    expect(offenders, `Color from var(--p-*) instead of a hex literal:\n${offenders.join("\n")}`).toEqual([]);
  });
});
