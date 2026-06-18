#!/usr/bin/env node
/**
 * Build clean English source chunks of the keys missing from every non-English
 * locale (the missing set is identical across locales). Groups keys by depth-2
 * namespace, then greedily packs namespaces into N balanced bins so each
 * translation agent gets coherent, feature-scoped context.
 *
 * Output: reports/i18n-src-chunks/chunk-NN.json  (flat { keyPath: englishValue })
 *
 * Run: node scripts/i18n-make-chunks.mjs [bins=5]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BINS = parseInt(process.argv[2] || "5", 10);
const OUT = join(ROOT, "reports/i18n-src-chunks");

function flatten(o, p, out) {
  for (const k in o) {
    const np = p ? `${p}.${k}` : k;
    if (o[k] && typeof o[k] === "object") flatten(o[k], np, out);
    else out[np] = o[k];
  }
  return out;
}

const en = flatten(JSON.parse(readFileSync(join(ROOT, "src/messages/en.json"), "utf8")), "", {});
// All non-English locales share the same missing set; use es as the reference.
const ref = flatten(JSON.parse(readFileSync(join(ROOT, "src/messages/es.json"), "utf8")), "", {});

const missing = {};
for (const k in en) if (!(k in ref) && typeof en[k] === "string") missing[k] = en[k];

// group by depth-2 namespace
const groups = {};
for (const k of Object.keys(missing)) {
  const ns = k.split(".").slice(0, 2).join(".");
  (groups[ns] = groups[ns] || []).push(k);
}
// greedy pack namespaces into BINS balanced bins
const nsList = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
const bins = Array.from({ length: BINS }, () => ({ keys: [], count: 0 }));
for (const [, keys] of nsList) {
  const target = bins.reduce((m, b) => (b.count < m.count ? b : m), bins[0]);
  target.keys.push(...keys);
  target.count += keys.length;
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

let total = 0;
bins.forEach((b, i) => {
  const obj = {};
  for (const k of b.keys.sort()) obj[k] = missing[k];
  const name = `chunk-${String(i + 1).padStart(2, "0")}.json`;
  writeFileSync(join(OUT, name), JSON.stringify(obj, null, 2) + "\n");
  total += b.keys.length;
  console.log(`${name}: ${b.keys.length} keys`);
});
console.log(`Total: ${total} keys across ${BINS} chunks -> ${OUT}`);
