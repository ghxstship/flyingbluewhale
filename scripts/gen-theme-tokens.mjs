#!/usr/bin/env node
/**
 * Theme token generator (alignment Move D1).
 *
 * `src/app/theme/tokens.json` is the single hand-authored source of truth for
 * COLOR. This script emits the color-identity CSS blocks of the generated
 * theme — brand-identity tokens, light/dark surfaces, per-product accent, and
 * the accent-intensity source values — DIRECTLY FROM tokens.json into two
 * marked regions of `src/app/theme/themes/atlvs-product.css`:
 *
 *     /* @gen:brand:start *\/ … /* @gen:brand:end *\/
 *     /* @gen:tokens:start *\/ … /* @gen:tokens:end *\/
 *
 * Everything else in that file (type/radii/spacing/elevation/motion
 * scaffolding, the accent-intensity color-mix formulas, the type axis,
 * density, and the entire .ps-* component layer) is hand-authored and lives
 * OUTSIDE the markers — it is not color-token-derived, so it is not generated.
 *
 * Usage:
 *   node scripts/gen-theme-tokens.mjs --write   # regenerate the marked regions
 *   node scripts/gen-theme-tokens.mjs --check    # exit 1 if regions are stale
 *   node scripts/gen-theme-tokens.mjs --emit <brand|tokens>  # print a region
 *
 * The "generated file is dirty" guard lives in
 * src/lib/theme/gen-theme.test.ts and runs in CI via `npm run test`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const TOKENS_PATH = join(ROOT, "src/app/theme/tokens.json");
export const THEME_PATH = join(ROOT, "src/app/theme/themes/atlvs-product.css");

const PRODUCTS = ["atlvs", "compvss", "gvteway", "legend", "ghxstship"];
const lc = (hex) => String(hex).toLowerCase();

/** Selector lists — fixed structure (only the VALUES come from tokens.json). */
const SEL = {
  light: [
    `[data-ui="saas"]`,
    `[data-ui="saas"][data-mode="light"]`,
    `[data-theme="atlvs-product"]`,
    `[data-mode="light"] [data-theme="atlvs-product"]`,
  ],
  dark: [
    `[data-ui="saas"][data-mode="dark"]`,
    `[data-mode="dark"] [data-ui="saas"]`,
    `[data-mode="dark"] [data-theme="atlvs-product"]`,
  ],
  product: (p) => [`[data-ui="saas"][data-product="${p}"]`, `[data-theme="atlvs-product"][data-platform="${p}"]`],
  productDark: (p) => [
    `[data-ui="saas"][data-product="${p}"][data-mode="dark"]`,
    `[data-mode="dark"] [data-ui="saas"][data-product="${p}"]`,
    `[data-mode="dark"] [data-theme="atlvs-product"][data-platform="${p}"]`,
  ],
};

const block = (selectors, lines) => `${selectors.join(",\n")} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`;

/** Resolve a per-product `focus` hex to the var() alias it mirrors. Prefer the
 *  bright `--p-accent` (the brand-color ring) where they're equal; fall back to
 *  the deepened `--p-accent-cta` (COMPVSS/LEG3ND, whose bright accent is <3:1). */
function focusValue(modeBlock) {
  const f = lc(modeBlock.focus);
  if (f === lc(modeBlock.accent)) return "var(--p-accent)";
  if (f === lc(modeBlock["accent-cta"])) return "var(--p-accent-cta)";
  console.warn(`[gen-theme] focus ${f} matches neither accent nor accent-cta — emitting literal`);
  return f;
}

export function renderBrandRegion(tokens) {
  const b = tokens.color.brand;
  const lines = [];
  for (const p of PRODUCTS) {
    lines.push(`--brand-${p}: ${lc(b[p].base)};`);
    lines.push(`--brand-${p}-ink: ${lc(b[p].ink)};`);
    lines.push(`--brand-${p}-on: ${lc(b[p].on)};`);
  }
  return [
    "/* Brand-identity tokens (mode-agnostic, for multi-product displays). */",
    block([":root"], lines),
  ].join("\n");
}

/** Surface-token → neutral-ramp-step map (v7.0). Light is ordered
 *  lightest→darkest, dark darkest→lightest, so only bg/surface differ by mode
 *  (the page recedes from the card consistently in both). */
const NEUTRAL_MAP = {
  light: { bg: 50, surface: 0, "surface-2": 100, border: 200, "border-2": 300, "text-1": 1000, "text-2": 700, "text-3": 600 },
  dark: { bg: 0, surface: 50, "surface-2": 100, border: 200, "border-2": 300, "text-1": 1000, "text-2": 700, "text-3": 600 },
};
const RAMP_STEPS = ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"];

function surfaceBlock(selectors, s, mode, ramp) {
  const map = NEUTRAL_MAP[mode];
  return block(selectors, [
    // v7.0 — 12-step neutral ramp is the authoring seed; the surface tokens map onto it.
    ...RAMP_STEPS.map((k) => `--p-neutral-${k}: ${lc(ramp[k])};`),
    `--p-bg: var(--p-neutral-${map.bg});`,
    `--p-surface: var(--p-neutral-${map.surface});`,
    `--p-surface-2: var(--p-neutral-${map["surface-2"]});`,
    `--p-border: var(--p-neutral-${map.border});`,
    `--p-border-2: var(--p-neutral-${map["border-2"]});`,
    `--p-text-1: var(--p-neutral-${map["text-1"]});`,
    `--p-text-2: var(--p-neutral-${map["text-2"]});`,
    `--p-text-3: var(--p-neutral-${map["text-3"]});`,
    `--p-accent-contrast: ${lc(s["accent-contrast"])};`,
    `--p-focus: var(--p-accent);`,
    `color-scheme: ${mode};`,
  ]);
}

function accentBlock(selectors, a) {
  const lines = [`--p-accent: ${lc(a.accent)};`];
  if (a["accent-hover"]) lines.push(`--p-accent-hover: ${lc(a["accent-hover"])};`);
  lines.push(`--p-accent-text: ${lc(a["accent-text"])};`);
  lines.push(`--p-accent-weak: ${a["accent-weak"]};`);
  if (a["accent-contrast"]) lines.push(`--p-accent-contrast: ${lc(a["accent-contrast"])};`);
  lines.push(`--p-accent-cta: ${lc(a["accent-cta"])};`);
  lines.push(`--p-accent-cta-contrast: ${lc(a["accent-cta-contrast"])};`);
  lines.push(`--p-focus: ${focusValue(a)};`);
  return block(selectors, lines);
}

export function renderTokenRegion(tokens) {
  const acc = tokens.color.accent;
  const out = [];

  out.push("/* ---------- Neutral ramp + surfaces (light default + dark) ---------- */");
  out.push(surfaceBlock(SEL.light, tokens.color.surface.light, "light", tokens.color.neutral.light));
  out.push("");
  out.push(surfaceBlock(SEL.dark, tokens.color.surface.dark, "dark", tokens.color.neutral.dark));
  out.push("");
  out.push("/* ---------- Per-product accent (reads data-product OR data-platform) ---------- */");
  for (const p of PRODUCTS) {
    out.push(`/* ${p.toUpperCase()} */`);
    out.push(accentBlock(SEL.product(p), acc[p].light));
    out.push(accentBlock(SEL.productDark(p), acc[p].dark));
  }
  out.push("");
  out.push("/* ---------- Accent-intensity sources (--k-acc / --k-acc-text mirror the resolved accent) ---------- */");
  for (const p of PRODUCTS) {
    out.push(block(SEL.product(p), [`--k-acc: ${lc(acc[p].light.accent)};`, `--k-acc-text: ${lc(acc[p].light["accent-text"])};`]));
    out.push(block(SEL.productDark(p), [`--k-acc: ${lc(acc[p].dark.accent)};`, `--k-acc-text: ${lc(acc[p].dark["accent-text"])};`]));
  }
  return out.join("\n");
}

const MARKERS = {
  brand: ["/* @gen:brand:start */", "/* @gen:brand:end */"],
  tokens: ["/* @gen:tokens:start */", "/* @gen:tokens:end */"],
};

export function regionBody(fileText, id) {
  const [start, end] = MARKERS[id];
  const i = fileText.indexOf(start);
  const j = fileText.indexOf(end);
  if (i === -1 || j === -1 || j < i) throw new Error(`markers for "${id}" not found in theme file`);
  return fileText.slice(i + start.length, j).replace(/^\n/, "").replace(/\n\s*$/, "");
}

export function renderRegion(tokens, id) {
  return id === "brand" ? renderBrandRegion(tokens) : renderTokenRegion(tokens);
}

function splice(fileText, id, body) {
  const [start, end] = MARKERS[id];
  const i = fileText.indexOf(start);
  const j = fileText.indexOf(end);
  if (i === -1 || j === -1) throw new Error(`markers for "${id}" not found`);
  return fileText.slice(0, i + start.length) + "\n" + body + "\n" + fileText.slice(j);
}

function main() {
  const args = process.argv.slice(2);
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));

  if (args[0] === "--emit") {
    process.stdout.write(renderRegion(tokens, args[1] === "brand" ? "brand" : "tokens") + "\n");
    return;
  }

  const file = readFileSync(THEME_PATH, "utf8");
  if (args.includes("--check")) {
    const stale = ["brand", "tokens"].filter((id) => regionBody(file, id) !== renderRegion(tokens, id));
    if (stale.length) {
      console.error(`[gen-theme] STALE regions: ${stale.join(", ")} — run \`npm run gen:theme\``);
      process.exit(1);
    }
    console.log("[gen-theme] regions in sync with tokens.json");
    return;
  }

  // default: --write
  let next = file;
  for (const id of ["brand", "tokens"]) next = splice(next, id, renderRegion(tokens, id));
  writeFileSync(THEME_PATH, next);
  console.log("[gen-theme] wrote brand + tokens regions from tokens.json");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
