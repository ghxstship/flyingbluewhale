import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { TRADEMARK_LINE } from "@/lib/brand";

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

// ── Voice: no em/en-dashes in (platform) console copy ────────────────────────
const PLATFORM = join(REPO_ROOT, "src", "app", "(platform)");
const PLATFORM_SRC = walk(PLATFORM).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));

// Sanctioned spans, stripped before flagging: comments, bare "—" empty-value
// placeholder strings, separators joining two runtime values (`${a} — ${b}` /
// JSX `{a} – {b}`), and JSX-text placeholder cells (`>—<`, or a lone "—" line).
const DASH_LINE_STRIPS: RegExp[] = [
  /(["'`])\s*[—–]\s*\1/g, // a string that IS just a dash — empty-value placeholder
  /\}\s*[—–]\s*\$?\{/g, // data-join separator between two interpolations
  />\s*[—–]\s*</g, // JSX-text placeholder cell
];

// String-aware comment stripper: `/*` or `//` INSIDE a string literal (glob
// patterns like "/api/v1/ai/*", URLs) must not open a comment — the naive
// regex approach silently swallowed the rest of such files. Comment bodies are
// blanked but newlines kept so reported line numbers stay true.
function stripComments(src: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | '"' | "'" | "`" = "code";
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line";
        i += 2;
      } else if (ch === "/" && next === "*") {
        mode = "block";
        i += 2;
      } else {
        if (ch === '"' || ch === "'" || ch === "`") mode = ch;
        out += ch;
        i++;
      }
    } else if (mode === "line") {
      if (ch === "\n") {
        mode = "code";
        out += ch;
      }
      i++;
    } else if (mode === "block") {
      if (ch === "*" && next === "/") {
        mode = "code";
        i += 2;
      } else {
        if (ch === "\n") out += ch;
        i++;
      }
    } else {
      // inside a string/template literal
      if (ch === "\\") {
        out += ch + (next ?? "");
        i += 2;
      } else {
        if (ch === mode) mode = "code";
        out += ch;
        i++;
      }
    }
  }
  return out;
}

function platformDashOffenders(file: string): string[] {
  const offenders: string[] = [];
  stripComments(readFileSync(file, "utf8"))
    .split("\n")
    .forEach((raw, i) => {
      let line = raw;
      if (line.trim() === "—" || line.trim() === "–") return; // lone JSX-text placeholder line
      for (const re of DASH_LINE_STRIPS) line = line.replace(re, " ");
      if (DASH.test(line)) offenders.push(`${rel(file)}:${i + 1}`);
    });
  return offenders;
}

describe("Voice guard — no em-dashes in (platform) console copy", () => {
  it("no unsanctioned em/en-dashes in string literals or JSX text", () => {
    const offenders = PLATFORM_SRC.flatMap(platformDashOffenders);
    expect(
      offenders,
      `Move the qualifier into subtitle/sub/hint, use "·" or "(…)", or restructure with a period/comma:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});

// ── Voice: GH-4 scope extension — components/ + ALL shells (pinned) ─────────
// The em-dash guard covered messages + (platform) only; src/components/** —
// the layer that renders on every shell — and the other route groups were
// unscanned (lane-F GH-4). Several component t() fallbacks had already
// drifted from their cleaned catalog twins. This ratchet extends the same
// line scanner to src/components + every src/app route group. The existing
// debt (W3's sweep, not W1's) is pinned at the current measured count (433 at landing, 339 after W3a, 2026-07-22); the pin may
// ONLY SHRINK — new dashes fail immediately, and W3 drives the pin to 0.
const LEGACY_DASH_PIN = 0;
const VOICE_EXT_SCOPES = [join(REPO_ROOT, "src", "components"), join(REPO_ROOT, "src", "app")];
const VOICE_EXT_SRC = VOICE_EXT_SCOPES.flatMap((d) => walk(d)).filter(
  (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.startsWith(PLATFORM),
);

describe("Voice guard — em-dash scope extension to components/ + all shells (GH-4)", () => {
  it(`dash lines may only shrink below the pinned legacy count (${LEGACY_DASH_PIN})`, () => {
    const offenders = VOICE_EXT_SRC.flatMap(platformDashOffenders);
    expect(
      offenders.length,
      `Em/en-dash lines outside (platform) grew past the pinned legacy count (${LEGACY_DASH_PIN}). ` +
        `New copy must not use dashes (standing rule); if you cleaned lines, shrink the pin. Sample:\n` +
        offenders.slice(0, 40).join("\n"),
    ).toBeLessThanOrEqual(LEGACY_DASH_PIN);
  });
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

// ── Type: GH-6 heading-ramp bypass ratchet (repo-wide, pinned) ───────────────
// "A bare heading lands on the ramp" (Type v8.0) — but nothing guarded h1-h4
// elements hand-setting display sizes outside (marketing) (lane-F GH-6:
// ModuleHeader's own h1 + 15 shared components). This flags any h1-h4 that
// sets a text-xl..text-6xl utility in the same tag — those must be a bare
// heading (the element wiring sizes it) or a .hed-* ramp class. Existing debt
// is W2's sweep; pinned, shrink-only.
const LEGACY_HEADING_BYPASS_PIN = 0;
const HEADING_BYPASS = /<h[1-4][^>]*className="[^"]*\btext-(xl|2xl|3xl|4xl|5xl|6xl)\b/;

describe("Type guard — h1-h4 heading-ramp bypass may only shrink (GH-6)", () => {
  it(`heading-size bypass lines stay at or below the pin (${LEGACY_HEADING_BYPASS_PIN})`, () => {
    const offenders: string[] = [];
    for (const f of ALL_TSX) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (HEADING_BYPASS.test(line)) offenders.push(`${rel(f)}:${i + 1}`);
        });
    }
    expect(
      offenders.length,
      `h1-h4 elements hand-setting display sizes grew past the pin (${LEGACY_HEADING_BYPASS_PIN}). ` +
        `Use a bare heading (the ramp sizes it) or a .hed-* class; if you cleaned spots, shrink the pin. Sample:\n` +
        offenders.slice(0, 40).join("\n"),
    ).toBeLessThanOrEqual(LEGACY_HEADING_BYPASS_PIN);
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

// DS conformance — root metadata + brand SSOT language (the layers the other
// guards don't scan). Prevents the retired-era drift this remediation fixed.
describe("DS conformance — brand language", () => {
  const layout = readFileSync(join(REPO_ROOT, "src/app/layout.tsx"), "utf8");

  it("root metadata description is dash-free and voyage-free", () => {
    const meta = layout.match(/description:\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
    expect(meta.length, "could not find root metadata description").toBeGreaterThan(0);
    expect(/[—–]/.test(meta), "em/en-dash in meta description").toBe(false);
    expect(/\b(voyage|bridge|instruments?|set sail|harbor|cast off)\b/i.test(meta), "voyage lexicon in meta").toBe(
      false,
    );
  });

  it("metadata title derives from BRAND.tagline (no frozen tagline)", () => {
    expect(layout).toMatch(/default:\s*`\$\{BRAND\.legalName\}[^`]*\$\{BRAND\.tagline\}/);
    expect(layout, "retired 'Production Runs On It' tagline literal").not.toContain("Production Runs On It");
  });

  it("trademark line names all four products", () => {
    for (const p of ["ATLVS", "COMPVSS", "GVTEWAY", "LEG3ND"]) {
      expect(TRADEMARK_LINE, `trademark line missing ${p}`).toContain(p);
    }
  });

  it("theme README carries no retired mono-green #2edb3a", () => {
    const readme = readFileSync(join(REPO_ROOT, "src/app/theme/README.md"), "utf8");
    expect(readme, "retired mono-green #2edb3a in theme README").not.toMatch(/#2edb3a/i);
  });
});
