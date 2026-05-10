#!/usr/bin/env node
/**
 * F4 — Bundle-size budget gate.
 *
 * Reads .next/build-manifest.json (post-build) and computes the gzipped
 * size of the JS payload for each route's first-load (page + shared
 * chunks). Compares against budgets/bundles.json:
 *
 *   {
 *     "routes": {
 *       "/": { "maxFirstLoadKb": 250 },
 *       "/console": { "maxFirstLoadKb": 350 },
 *       ...
 *     },
 *     "default": { "maxFirstLoadKb": 400 }
 *   }
 *
 * A route over budget fails the run. Routes without a specific budget
 * fall back to `default`. To raise a budget, edit budgets/bundles.json
 * — the diff is the audit trail in git blame.
 *
 * Usage: `node scripts/ci/bundle-size-gate.mjs`
 */
import { readFileSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const BUDGET_PATH = resolve(ROOT, "budgets/bundles.json");
const NEXT_DIR = resolve(ROOT, ".next");
const MANIFEST = resolve(NEXT_DIR, "build-manifest.json");

if (!existsSync(MANIFEST)) {
  console.error(`::error::No .next/build-manifest.json — did 'npm run build' run first?`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const budget = existsSync(BUDGET_PATH)
  ? JSON.parse(readFileSync(BUDGET_PATH, "utf8"))
  : { routes: {}, default: { maxFirstLoadKb: 400 } };

function gzKb(absPath) {
  if (!existsSync(absPath)) return 0;
  // For very large files we don't want to gzip in memory, but Next chunks
  // are well under that ceiling. Read + gzipSync is fine.
  const raw = readFileSync(absPath);
  return Math.round((gzipSync(raw).byteLength / 1024) * 10) / 10;
}

// Pages map (Pages Router) is rare in the App Router setup but we read it
// for completeness. App Router routes show up in `manifest.rootMainFiles`
// (shared chunks every page loads) plus per-page entries under `pages`
// (which legacy App Router builds also populate for some entries).
const sharedFiles = manifest.rootMainFiles ?? manifest.rootMainFilesTree ?? [];
const sharedKb = sharedFiles.reduce((sum, f) => sum + gzKb(join(NEXT_DIR, f)), 0);

const pages = manifest.pages ?? {};
const offenders = [];
const reports = [];

for (const [route, files] of Object.entries(pages)) {
  if (!Array.isArray(files)) continue;
  const routeKb = files.reduce((sum, f) => sum + gzKb(join(NEXT_DIR, f)), 0);
  const firstLoadKb = Math.round((routeKb + sharedKb) * 10) / 10;
  const cap = budget.routes?.[route]?.maxFirstLoadKb ?? budget.default?.maxFirstLoadKb ?? 400;
  reports.push({ route, firstLoadKb, cap });
  if (firstLoadKb > cap) offenders.push({ route, firstLoadKb, cap });
}

reports.sort((a, b) => b.firstLoadKb - a.firstLoadKb);
console.log(`Bundle-size report (shared baseline: ${sharedKb} kb gz):`);
for (const r of reports.slice(0, 30)) {
  const flag = r.firstLoadKb > r.cap ? "❌" : "✓ ";
  console.log(`  ${flag} ${r.route.padEnd(50)} ${String(r.firstLoadKb).padStart(6)} kb / ${r.cap} kb`);
}

if (offenders.length > 0) {
  console.error(`::error::${offenders.length} route(s) over bundle budget:`);
  for (const o of offenders) {
    console.error(`  - ${o.route}: ${o.firstLoadKb} kb gz (cap ${o.cap} kb)`);
  }
  console.error(
    `If these are accepted-by-design, raise the cap in budgets/bundles.json — the diff is the audit trail.`,
  );
  process.exit(1);
}

// App Router fallback: build-manifest.json's `pages` map is mostly empty for
// pure App Router builds. As a baseline guarantee in that case, check that
// no individual chunk under .next/static/chunks/ exceeds the per-chunk cap
// (default 600 kb gz — chunks larger than that almost always indicate an
// accidentally-included heavy dep that should be dynamic-imported).
import { readdirSync } from "node:fs";

const chunkDir = join(NEXT_DIR, "static/chunks");
if (existsSync(chunkDir)) {
  const chunkCap = budget.maxChunkKb ?? 600;
  const chunkOffenders = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
        continue;
      }
      if (!entry.name.endsWith(".js")) continue;
      const kb = gzKb(p);
      if (kb > chunkCap) chunkOffenders.push({ name: p.slice(chunkDir.length + 1), kb });
    }
  }
  walk(chunkDir);
  if (chunkOffenders.length > 0) {
    console.error(`::error::${chunkOffenders.length} static chunk(s) over per-chunk cap (${chunkCap} kb gz):`);
    chunkOffenders.sort((a, b) => b.kb - a.kb);
    for (const o of chunkOffenders.slice(0, 20)) {
      console.error(`  - ${o.name}: ${o.kb} kb gz`);
    }
    process.exit(1);
  }
}

console.log(`✓ ${reports.length} routes + all static chunks within budget.`);
