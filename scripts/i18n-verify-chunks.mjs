#!/usr/bin/env node
/**
 * Verify the translated chunk outputs before merging them back.
 * For every locale × source chunk, assert the output exists, parses, has the
 * EXACT same key set as the source chunk, and contains no `$` (no leaked
 * `${...}` template literals and no stray placeholder corruption).
 *
 * Run: node scripts/i18n-verify-chunks.mjs
 * Exit 0 iff every locale is fully covered and clean.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "reports/i18n-src-chunks");
const OUT = join(ROOT, "reports/i18n-translated");
const LOCALES = ["es", "fr", "de", "pt", "ja", "ar"];

const srcChunks = readdirSync(SRC).filter((f) => f.endsWith(".json")).sort();
const srcKeys = Object.fromEntries(
  srcChunks.map((f) => [f, Object.keys(JSON.parse(readFileSync(join(SRC, f), "utf8")))]),
);

let ok = true;
for (const loc of LOCALES) {
  const problems = [];
  let translated = 0;
  for (const f of srcChunks) {
    const p = join(OUT, loc, f);
    if (!existsSync(p)) {
      problems.push(`${f}: MISSING`);
      continue;
    }
    let obj;
    try {
      obj = JSON.parse(readFileSync(p, "utf8"));
    } catch (e) {
      problems.push(`${f}: INVALID JSON (${e.message})`);
      continue;
    }
    const want = new Set(srcKeys[f]);
    const got = new Set(Object.keys(obj));
    const missing = [...want].filter((k) => !got.has(k));
    const extra = [...got].filter((k) => !want.has(k));
    const dollar = Object.entries(obj).filter(([, v]) => typeof v === "string" && v.includes("$")).map(([k]) => k);
    const empty = Object.entries(obj).filter(([, v]) => typeof v !== "string" || v.trim() === "").map(([k]) => k);
    if (missing.length) problems.push(`${f}: missing ${missing.length} keys (e.g. ${missing.slice(0, 3).join(", ")})`);
    if (extra.length) problems.push(`${f}: ${extra.length} extra keys (e.g. ${extra.slice(0, 3).join(", ")})`);
    if (dollar.length) problems.push(`${f}: ${dollar.length} values contain '$' (e.g. ${dollar.slice(0, 3).join(", ")})`);
    if (empty.length) problems.push(`${f}: ${empty.length} empty/non-string values`);
    translated += Object.keys(obj).length;
  }
  if (problems.length) {
    ok = false;
    console.log(`✗ ${loc}: ${problems.length} problem(s)`);
    problems.forEach((p) => console.log(`    ${p}`));
  } else {
    console.log(`✓ ${loc}: ${translated} keys across ${srcChunks.length} chunks, clean`);
  }
}
console.log(ok ? "\nALL LOCALES CLEAN — safe to merge." : "\nFAILURES present — fix before merge.");
process.exit(ok ? 0 : 1);
