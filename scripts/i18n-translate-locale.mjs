#!/usr/bin/env node
/**
 * Apply pre-computed locale translations to src/messages/{locale}.json.
 *
 * Pairs with the translation workflow (workflows/i18n-translate-locales.js):
 * the workflow writes its outputs to reports/i18n-translated/<locale>/<ns>.json
 * as flat key→target-locale-value maps; this script reads those, deep-merges
 * each map into the corresponding locale catalog, and reports.
 *
 * Run:
 *   node scripts/i18n-translate-locale.mjs es
 *   node scripts/i18n-translate-locale.mjs es fr de pt ja ar   # multiple at once
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MESSAGES_DIR = join(ROOT, "src/messages");
const TRANS_DIR = join(ROOT, "reports/i18n-translated");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/i18n-translate-locale.mjs <locale> [<locale> ...]");
  process.exit(1);
}

function setDeep(obj, path, value) {
  const parts = path.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    const next = node[seg];
    if (next === undefined) node[seg] = {};
    else if (typeof next === "string") return false;
    node = node[seg];
  }
  const leaf = parts[parts.length - 1];
  if (typeof node[leaf] === "object") return false;
  node[leaf] = value;
  return true;
}

for (const loc of args) {
  const catPath = join(MESSAGES_DIR, `${loc}.json`);
  const shardDir = join(TRANS_DIR, loc);

  if (!existsSync(catPath)) {
    console.error(`No catalog: ${catPath}`);
    continue;
  }
  if (!existsSync(shardDir)) {
    console.error(`No translated shards for ${loc} at ${shardDir}`);
    continue;
  }

  const cat = JSON.parse(readFileSync(catPath, "utf8"));
  const shardFiles = readdirSync(shardDir).filter((f) => f.endsWith(".json"));
  let added = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const f of shardFiles) {
    const shard = JSON.parse(readFileSync(join(shardDir, f), "utf8"));
    for (const [k, v] of Object.entries(shard)) {
      if (typeof v !== "string" || !v) {
        skipped++;
        continue;
      }
      if (setDeep(cat, k, v)) added++;
      else conflicts++;
    }
  }

  writeFileSync(catPath, JSON.stringify(cat, null, 2) + "\n");
  console.log(`${loc}: ${added} keys added, ${skipped} skipped, ${conflicts} intermediate conflicts`);

  try {
    JSON.parse(readFileSync(catPath, "utf8"));
  } catch (e) {
    console.error(`ERROR: ${catPath} no longer parses: ${e.message}`);
    process.exit(1);
  }
}

console.log("Done.");
