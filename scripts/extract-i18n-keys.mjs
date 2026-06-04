#!/usr/bin/env node
/**
 * Extract every `t(key, vars?, fallback?)` call site from the codebase and
 * emit a flat JSON catalog mapping each dot-path key to its English fallback.
 *
 * Why: Phases 1c-1i wrapped ~11,000 user-facing strings in the form
 *   t("namespace.path.to.key", undefined, "English fallback")
 * The runtime falls back to the English string when the catalog is missing
 * the key, so the UI ships correctly. But for translation to actually flip
 * the visible text under es/fr/de/pt/ja/ar, those keys need to land in
 * src/messages/en.json (and their translations in the locale catalogs).
 *
 * This script runs the extraction once after every t()-wrapping phase
 * completes. It writes:
 *   - reports/i18n-extracted-keys.json      — flat { keyPath: english } map
 *   - reports/i18n-extracted-by-namespace.json — grouped by top-level namespace
 *
 * Strategy: use a TypeScript-aware regex match (not full AST parsing — too
 * slow, and the fallback pattern is regular enough). We tolerate JSX-tag
 * placeholder usage and multi-line t() calls with backtick / single / double
 * quoted fallbacks.
 *
 * Run: node scripts/extract-i18n-keys.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC_DIRS = ["src/app", "src/components", "src/lib"];
const REPORTS_DIR = "reports";

// Match either single, double or backtick-delimited literals in the third arg.
// We accept whitespace + newlines around the args. Groups: 1=key, 2=fallback.
//
// Pattern shape, simplified:
//   t(   "key.path"   ,   varsExpr  ,   "English fallback"   )
//
// Strategy: anchor on `t(` followed by a quoted key literal, then a comma,
// then ANY second argument (vars or undefined), then a comma, then a quoted
// fallback literal. Use ungreedy match for the middle "vars" segment so we
// stop at the second comma.
//
// JS regex doesn't support recursive grouping; we approximate the second
// argument by matching either a bare identifier, `undefined`, an object
// literal `{ ... }`, or a nested t() call. For object literals we count
// braces — handled in post-processing if a simple regex fails.
//
// For now we use a tolerant pattern that catches the 95% case and we'll
// log misses.

const KEY_QUOTE = `["'\`]`;
const RE_T_CALL = new RegExp(
  // `t(` + maybe whitespace
  `\\bt\\s*\\(\\s*` +
    // group 1: key literal
    `${KEY_QUOTE}([\\w.-]+)${KEY_QUOTE}` +
    // comma + second arg (vars or undefined) — match across newlines, non-greedy
    `\\s*,\\s*(?:undefined|null|\\{[^{}]*\\}|\\{[^{}]*\\{[^{}]*\\}[^{}]*\\}|[\\w.()]+(?:\\([^)]*\\))?)\\s*,\\s*` +
    // group 2: fallback literal — accept all three quote types
    `(?:` +
    `"((?:\\\\.|[^"\\\\])*)"` +
    `|` +
    `'((?:\\\\.|[^'\\\\])*)'` +
    `|` +
    "`((?:\\\\.|[^`\\\\])*)`" +
    `)\\s*\\)`,
  "g",
);

function walk(dir, out = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs)) {
    const p = join(dir, entry);
    const ap = join(ROOT, p);
    const s = statSync(ap);
    if (s.isDirectory()) {
      // Skip node_modules and build artifacts.
      if (entry === "node_modules" || entry === ".next" || entry === "test-results") continue;
      walk(p, out);
    } else if (s.isFile()) {
      if (/\.(tsx?|jsx?)$/.test(entry)) out.push(p);
    }
  }
  return out;
}

function unescape(s, kind) {
  // Reverse JS string escapes — minimal but covers \n, \", \', \`, \\, \t.
  return s.replace(/\\(.)/g, (_, c) => {
    if (c === "n") return "\n";
    if (c === "t") return "\t";
    if (c === "r") return "\r";
    return c;
  });
}

const keys = {};
const collisions = [];
let scanned = 0;
let matched = 0;

for (const dir of SRC_DIRS) {
  for (const file of walk(dir)) {
    scanned++;
    const src = readFileSync(join(ROOT, file), "utf8");
    let m;
    RE_T_CALL.lastIndex = 0;
    while ((m = RE_T_CALL.exec(src)) !== null) {
      const key = m[1];
      const fb = m[2] ?? m[3] ?? m[4];
      if (fb == null) continue;
      const value = unescape(fb);
      matched++;
      if (key in keys && keys[key] !== value) {
        collisions.push({ key, existing: keys[key], incoming: value, file });
      } else {
        keys[key] = value;
      }
    }
  }
}

// Group by top-level namespace for reviewability.
const grouped = {};
for (const [k, v] of Object.entries(keys)) {
  const top = k.split(".")[0];
  (grouped[top] ||= {})[k] = v;
}

// Counts per namespace.
const summary = Object.fromEntries(
  Object.entries(grouped)
    .map(([ns, m]) => [ns, Object.keys(m).length])
    .sort(([, a], [, b]) => b - a),
);

if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(join(REPORTS_DIR, "i18n-extracted-keys.json"), JSON.stringify(keys, null, 2) + "\n");
writeFileSync(
  join(REPORTS_DIR, "i18n-extracted-by-namespace.json"),
  JSON.stringify(grouped, null, 2) + "\n",
);
writeFileSync(
  join(REPORTS_DIR, "i18n-extraction-summary.json"),
  JSON.stringify(
    {
      filesScanned: scanned,
      callSitesMatched: matched,
      uniqueKeys: Object.keys(keys).length,
      collisions: collisions.length,
      perNamespace: summary,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `extract-i18n-keys: scanned ${scanned} files, matched ${matched} t() call sites → ${Object.keys(keys).length} unique keys`,
);
console.log(`Namespaces:`);
for (const [ns, n] of Object.entries(summary)) console.log(`  ${ns.padEnd(20)} ${n}`);
if (collisions.length) {
  console.log(`\n${collisions.length} key collisions (same key, different fallback):`);
  for (const c of collisions.slice(0, 10)) {
    console.log(`  ${c.key}`);
    console.log(`    existing: ${JSON.stringify(c.existing).slice(0, 80)}`);
    console.log(`    incoming: ${JSON.stringify(c.incoming).slice(0, 80)} (${c.file})`);
  }
  if (collisions.length > 10) console.log(`  …+${collisions.length - 10} more`);
}
