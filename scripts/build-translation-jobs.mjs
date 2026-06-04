#!/usr/bin/env node
/**
 * Read every reports/i18n-locale-gaps/<locale>/<ns>.json shard and produce
 * a "job manifest" listing each translation unit. Big shards (> CHUNK_SIZE
 * keys) are split into multiple chunks so a single agent never has to
 * process too many keys at once.
 *
 * Also writes each chunk to its own file:
 *   reports/i18n-translation-input/<locale>/<ns>__chunk<i>of<n>.json
 * so agents can read them via the Read tool instead of passing a 700KB
 * args blob into the workflow.
 *
 * Output: reports/i18n-translation-jobs.json — array of:
 *   { locale, ns, chunk, chunkOf, count, inputPath, outputPath }
 *
 * Run: node scripts/build-translation-jobs.mjs [chunkSize]
 *   defaults to chunkSize=200
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CHUNK_SIZE = parseInt(process.argv[2] || "200", 10);
const GAP_DIR = join(ROOT, "reports/i18n-locale-gaps");
const INPUT_DIR = join(ROOT, "reports/i18n-translation-input");
const LOCALES = ["es", "fr", "de", "pt", "ja", "ar"];

const jobs = [];
const summary = { locales: {} };

for (const loc of LOCALES) {
  const dir = join(GAP_DIR, loc);
  const outDir = join(INPUT_DIR, loc);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const shardFiles = readdirSync(dir).filter((f) => f.endsWith(".json"));
  let totalJobs = 0;
  let totalKeys = 0;

  for (const f of shardFiles) {
    const ns = f.replace(/\.json$/, "").replace(/__/g, ".");
    const shard = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const entries = Object.entries(shard);
    if (entries.length === 0) continue;

    const nChunks = Math.ceil(entries.length / CHUNK_SIZE);
    for (let i = 0; i < nChunks; i++) {
      const slice = entries.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkData = Object.fromEntries(slice);
      const fileBase = `${ns.replace(/\./g, "__")}--chunk${i + 1}of${nChunks}`;
      const inputPath = `reports/i18n-translation-input/${loc}/${fileBase}.json`;
      const outputPath = `reports/i18n-translated/${loc}/${fileBase}.json`;
      writeFileSync(join(ROOT, inputPath), JSON.stringify(chunkData, null, 2) + "\n");
      jobs.push({
        locale: loc,
        ns,
        chunk: i + 1,
        chunkOf: nChunks,
        count: slice.length,
        inputPath,
        outputPath,
      });
      totalJobs++;
      totalKeys += slice.length;
    }
  }
  summary.locales[loc] = { jobs: totalJobs, keys: totalKeys };
}

summary.totalJobs = jobs.length;
summary.chunkSize = CHUNK_SIZE;

writeFileSync(join(ROOT, "reports/i18n-translation-jobs.json"), JSON.stringify(jobs, null, 2) + "\n");
writeFileSync(join(ROOT, "reports/i18n-translation-jobs-summary.json"), JSON.stringify(summary, null, 2) + "\n");

console.log(`build-translation-jobs:`);
console.log(`  chunk size: ${CHUNK_SIZE}`);
console.log(`  total jobs: ${jobs.length}`);
for (const loc of LOCALES) {
  const s = summary.locales[loc];
  console.log(`  ${loc}: ${s.jobs} jobs (${s.keys} keys)`);
}
console.log(`Input chunks at: reports/i18n-translation-input/<locale>/`);
console.log(`Job manifest: reports/i18n-translation-jobs.json`);
