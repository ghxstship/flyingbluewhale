#!/usr/bin/env node
/**
 * i18n catalog delta tooling for the audit Phase 5 translation batch.
 *
 *   node scripts/i18n-missing.mjs export <locale> <chunks> <outdir>
 *     Writes the keys present in en.json but missing in <locale>.json as
 *     <chunks> flat JSON files ({ "dotted.key": "english value" }) under
 *     <outdir>/<locale>-<n>.json.
 *
 *   node scripts/i18n-missing.mjs merge <locale> <indir>
 *     Reads every <indir>/<locale>-*.json (flat { key: translated }) and
 *     deep-merges into src/messages/<locale>.json, preserving existing
 *     entries (existing translations win over incoming ones).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MESSAGES = "src/messages";

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null || Array.isArray(cur[parts[i]])) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  if (!(parts[parts.length - 1] in cur)) cur[parts[parts.length - 1]] = value;
}

const [, , cmd, locale, a, b] = process.argv;
const en = flatten(JSON.parse(readFileSync(join(MESSAGES, "en.json"), "utf8")));

if (cmd === "export") {
  const chunks = Number(a);
  const outdir = b;
  let existing = {};
  try {
    existing = flatten(JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), "utf8")));
  } catch {}
  const missing = Object.entries(en).filter(([k]) => !(k in existing));
  const per = Math.ceil(missing.length / chunks);
  for (let i = 0; i < chunks; i++) {
    const slice = Object.fromEntries(missing.slice(i * per, (i + 1) * per));
    if (Object.keys(slice).length === 0) break;
    writeFileSync(join(outdir, `${locale}-${i + 1}.json`), JSON.stringify(slice, null, 2));
  }
  console.log(`${locale}: ${missing.length} missing keys -> ${Math.min(chunks, Math.ceil(missing.length / per))} chunks in ${outdir}`);
} else if (cmd === "merge") {
  const indir = a;
  const target = JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), "utf8"));
  let merged = 0;
  const files = readdirSync(indir).filter((f) => f.startsWith(`${locale}-`) && f.endsWith(".json"));
  for (const f of files.sort()) {
    const flat = JSON.parse(readFileSync(join(indir, f), "utf8"));
    for (const [k, v] of Object.entries(flat)) {
      if (typeof v === "string") {
        setDeep(target, k, v);
        merged++;
      }
    }
  }
  writeFileSync(join(MESSAGES, `${locale}.json`), JSON.stringify(target, null, 2) + "\n");
  console.log(`${locale}: merged ${merged} keys from ${files.length} chunk files`);
} else {
  console.error("usage: i18n-missing.mjs export <locale> <chunks> <outdir> | merge <locale> <indir>");
  process.exit(1);
}
