#!/usr/bin/env node
// Aggregate SEA TRIAL evidence: merge all results-*.json, compute coverage
// vs the route manifest, tally per shell, and surface FAIL/WARN with evidence.
// Read-only — emits a summary JSON + console digest the report is built from.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const EVID = join(ROOT, "docs/audits/evidence/sea-trial");

const shellOf = (u) =>
  u.includes("app.atlvs.pro") ? "ATLVS /console"
  : u.includes("compvss.atlvs.pro") ? "COMPVSS /m"
  : u.includes("gvteway.atlvs.pro") ? "GVTEWAY /p"
  : /atlvs\.pro\/me(\/|$)/.test(u) ? "Personal /me"
  : /atlvs\.pro\/(login|signup|forgot-password|reset-password|magic-link|mfa|sso|verify-email|onboarding|auth)/.test(u) ? "Auth"
  : "Marketing/public";

const files = readdirSync(EVID).filter((f) => /^results-.*\.json$/.test(f));
const byUrl = new Map();
for (const f of files) {
  const d = JSON.parse(readFileSync(join(EVID, f), "utf8"));
  for (const r of d.results) {
    // Prefer the most-recent / worst record per URL.
    const prev = byUrl.get(r.url);
    if (!prev || (prev.status === "PASS" && r.status !== "PASS")) byUrl.set(r.url, r);
  }
}
const all = [...byUrl.values()];

// Manifest denominator: route count from SITEMAP.md (page routes on disk).
const sm = readFileSync(join(ROOT, "docs/ia/SITEMAP.md"), "utf8");
const manifestTotal = parseInt((sm.match(/Page routes:\*\* (\d+)/) || [])[1] || "0", 10);

const shells = {};
for (const r of all) {
  const s = shellOf(r.url);
  (shells[s] ||= { total: 0, PASS: 0, WARN: 0, FAIL: 0 });
  shells[s].total++;
  shells[s][r.status]++;
}

const fails = all.filter((r) => r.status === "FAIL");
const warns = all.filter((r) => r.status === "WARN");
const slow = all.filter((r) => r.loadMs > 3000).sort((a, b) => b.loadMs - a.loadMs);
const axeIds = {};
for (const r of all) for (const v of r.axe?.violations || []) axeIds[v.id] = (axeIds[v.id] || 0) + 1;

const summary = {
  at: new Date().toISOString(),
  urlsWithEvidence: all.length,
  manifestTotal,
  tally: all.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {}),
  shells,
  axeViolationsById: axeIds,
  fails: fails.map((r) => ({ url: r.url, mainStatus: r.mainStatus, navErr: r.navErr, console: r.consoleErrors, page: r.pageErrors, net: r.net })),
  slowTop: slow.slice(0, 12).map((r) => ({ url: r.url, ms: r.loadMs })),
};
writeFileSync(join(EVID, "summary.json"), JSON.stringify(summary, null, 2));

console.log(`URLs with evidence: ${all.length}  (manifest page-routes on disk: ${manifestTotal})`);
console.log("Tally:", summary.tally);
console.log("\nPer shell:");
for (const [s, v] of Object.entries(shells)) console.log(`  ${s.padEnd(18)} total=${v.total} PASS=${v.PASS} WARN=${v.WARN} FAIL=${v.FAIL}`);
console.log("\naxe violations by id:", axeIds);
console.log(`\nFAIL: ${fails.length}`);
for (const r of fails) console.log("  ", r.mainStatus, r.url, r.navErr || (r.consoleErrors[0] || "").slice(0, 80));
console.log(`\nSlowest:`);
for (const r of slow.slice(0, 8)) console.log("  ", r.loadMs + "ms", r.url);
console.log(`\n→ ${join("docs/audits/evidence/sea-trial", "summary.json")}`);
