#!/usr/bin/env node
/**
 * Merge the flat key→English map from extract-i18n-keys.mjs into the
 * nested src/messages/en.json catalog.
 *
 * Rules:
 *   - The flat key "console.finance.invoices.title" → nested
 *     en.json.console.finance.invoices.title = value.
 *   - If a key already exists in en.json with the SAME value: skip.
 *   - If a key already exists in en.json with a DIFFERENT value:
 *     prefer the existing en.json value (assume it's the canonical
 *     translation) and log the discrepancy.
 *   - Intermediate path segments must be objects; if the existing
 *     value at an intermediate path is a string, log a conflict
 *     and skip the new key (don't clobber the existing tree).
 *
 * Run: node scripts/merge-i18n-into-en.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const EN_PATH = join(ROOT, "src/messages/en.json");
const FLAT_PATH = join(ROOT, "reports/i18n-extracted-keys.json");
const REPORT_PATH = join(ROOT, "reports/i18n-merge-report.json");

const en = JSON.parse(readFileSync(EN_PATH, "utf8"));
const flat = JSON.parse(readFileSync(FLAT_PATH, "utf8"));

const stats = {
  totalKeys: 0,
  added: 0,
  skippedAlreadyExact: 0,
  skippedDifferentValue: 0,
  skippedIntermediateConflict: 0,
};
const differentValues = [];
const intermediateConflicts = [];

function setDeep(obj, path, value) {
  const parts = path.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    const next = node[seg];
    if (next === undefined) {
      node[seg] = {};
    } else if (typeof next === "string") {
      // Intermediate path collides with an existing leaf.
      return { ok: false, reason: "intermediate-leaf", at: parts.slice(0, i + 1).join(".") };
    }
    node = node[seg];
  }
  const leaf = parts[parts.length - 1];
  const existing = node[leaf];
  if (existing === undefined) {
    node[leaf] = value;
    return { ok: true, action: "added" };
  }
  if (typeof existing === "object") {
    return { ok: false, reason: "object-vs-leaf", at: path };
  }
  if (existing === value) return { ok: true, action: "skip-exact" };
  return { ok: false, reason: "different-value", existing };
}

for (const [k, v] of Object.entries(flat)) {
  stats.totalKeys++;
  const r = setDeep(en, k, v);
  if (!r.ok) {
    if (r.reason === "intermediate-leaf" || r.reason === "object-vs-leaf") {
      stats.skippedIntermediateConflict++;
      intermediateConflicts.push({ key: k, reason: r.reason, at: r.at });
    } else if (r.reason === "different-value") {
      stats.skippedDifferentValue++;
      differentValues.push({ key: k, existing: r.existing, incoming: v });
    }
    continue;
  }
  if (r.action === "added") stats.added++;
  else if (r.action === "skip-exact") stats.skippedAlreadyExact++;
}

writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + "\n");

if (!existsSync(join(ROOT, "reports"))) mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(
  REPORT_PATH,
  JSON.stringify(
    {
      ...stats,
      differentValues: differentValues.slice(0, 100),
      differentValueCountTotal: differentValues.length,
      intermediateConflicts: intermediateConflicts.slice(0, 50),
    },
    null,
    2,
  ) + "\n",
);

console.log(`merge-i18n-into-en:`);
console.log(`  total keys in flat:                ${stats.totalKeys}`);
console.log(`  added to en.json:                  ${stats.added}`);
console.log(`  skipped (already present, exact):  ${stats.skippedAlreadyExact}`);
console.log(`  skipped (different value, kept):   ${stats.skippedDifferentValue}`);
console.log(`  skipped (intermediate conflict):   ${stats.skippedIntermediateConflict}`);
console.log(`Report: ${REPORT_PATH}`);

// Validate the resulting JSON parses.
try {
  JSON.parse(readFileSync(EN_PATH, "utf8"));
  console.log(`en.json parses cleanly.`);
} catch (e) {
  console.error(`ERROR: en.json no longer parses: ${e.message}`);
  process.exit(1);
}
