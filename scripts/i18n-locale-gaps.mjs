#!/usr/bin/env node
/**
 * For each non-English locale catalog, find keys present in en.json but
 * missing from that locale, and bucket them by top-level + second-level
 * namespace so the translation workflow can shard the work.
 *
 * Output:
 *   reports/i18n-locale-gaps/<locale>.json   — flat { keyPath: english } map of missing keys
 *   reports/i18n-locale-gaps-summary.json    — counts per locale + per-namespace breakdown
 *
 * Why bucket: 10k+ missing keys per locale would blow context if sent to
 * one translator agent. Splitting by ns gives the workflow natural shards
 * (console.workforce, console.finance, p.artist, m.gate, etc.).
 *
 * Run: node scripts/i18n-locale-gaps.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MESSAGES_DIR = join(ROOT, "src/messages");
const LOCALES = ["es", "fr", "de", "pt", "ja", "ar"];

const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf8"));

// Flatten a nested object into dotted-key map.
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, path, out);
    } else if (typeof v === "string") {
      out[path] = v;
    }
  }
  return out;
}

function bucketByNamespace(flat, depth = 2) {
  const out = {};
  for (const [k, v] of Object.entries(flat)) {
    const segs = k.split(".");
    const ns = segs.slice(0, depth).join(".");
    (out[ns] ||= {})[k] = v;
  }
  return out;
}

const enFlat = flatten(en);
const summary = { totalEnKeys: Object.keys(enFlat).length, locales: {} };

const outDir = join(ROOT, "reports/i18n-locale-gaps");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const loc of LOCALES) {
  const path = join(MESSAGES_DIR, `${loc}.json`);
  if (!existsSync(path)) {
    console.warn(`Missing catalog: ${path}`);
    continue;
  }
  const cat = JSON.parse(readFileSync(path, "utf8"));
  const flat = flatten(cat);
  const missing = {};
  for (const [k, v] of Object.entries(enFlat)) {
    if (!(k in flat)) missing[k] = v;
  }
  writeFileSync(join(outDir, `${loc}.json`), JSON.stringify(missing, null, 2) + "\n");

  const buckets = bucketByNamespace(missing, 2);
  const bucketCounts = Object.fromEntries(
    Object.entries(buckets)
      .map(([ns, m]) => [ns, Object.keys(m).length])
      .sort(([, a], [, b]) => b - a),
  );
  summary.locales[loc] = {
    totalKeysInLocale: Object.keys(flat).length,
    missing: Object.keys(missing).length,
    coverage: Number(((1 - Object.keys(missing).length / Object.keys(enFlat).length) * 100).toFixed(1)),
    topBuckets: bucketCounts,
  };

  // Per-locale buckets (depth=2) — used by the translation workflow.
  const buckDir = join(outDir, loc);
  if (!existsSync(buckDir)) mkdirSync(buckDir, { recursive: true });
  for (const [ns, m] of Object.entries(buckets)) {
    writeFileSync(join(buckDir, `${ns.replace(/\./g, "__")}.json`), JSON.stringify(m, null, 2) + "\n");
  }
}

writeFileSync(
  join(ROOT, "reports/i18n-locale-gaps-summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
);

console.log(`i18n-locale-gaps:`);
console.log(`  total keys in en.json: ${summary.totalEnKeys}`);
for (const loc of LOCALES) {
  const s = summary.locales[loc];
  if (!s) continue;
  console.log(`  ${loc}: ${s.missing} missing of ${summary.totalEnKeys} (${s.coverage}% covered)`);
}
console.log(`Per-locale bucket files: reports/i18n-locale-gaps/<locale>/<ns>.json`);
