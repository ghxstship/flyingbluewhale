#!/usr/bin/env node
/**
 * One-off: resolve i18n namespace collisions where a scalar label call site
 * and a page-content subtree fight over the same dotted key path.
 *
 * Two collision classes (both detected dynamically):
 *   - intermediate-leaf: en.json[R] is a STRING, but new pages reference R.*
 *   - object-vs-leaf:     en.json[R] is an OBJECT, but a call site uses t("R")
 *
 * Resolution (uniform): the page subtree OWNS the namespace; the single label
 * call site moves to a sibling `<seg>Label` key. Stale scalar strings are
 * removed from all 7 catalogs so the subtree can form.
 *
 * Special case: `common.configureSupabase` is a shared leaf used in 39 files
 * (the owner); the 2 nested keys in ConfigureSupabase.tsx are the intruder and
 * move to `components.configureSupabase.*` instead.
 *
 * Dry run:  node scripts/i18n-resolve-collisions.mjs
 * Apply:    node scripts/i18n-resolve-collisions.mjs --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const MESSAGES = ["en", "es", "fr", "de", "pt", "ja", "ar"];
const flat = JSON.parse(readFileSync(join(ROOT, "reports/i18n-extracted-keys.json"), "utf8"));
const cats = Object.fromEntries(
  MESSAGES.map((l) => [l, JSON.parse(readFileSync(join(ROOT, `src/messages/${l}.json`), "utf8"))]),
);

function resolve(obj, path) {
  let n = obj;
  for (const p of path.split(".")) {
    if (n && typeof n === "object" && p in n) n = n[p];
    else return { found: false };
  }
  return { found: true, val: n };
}
function setDeep(obj, path, value) {
  const parts = path.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    if (node[seg] === undefined) node[seg] = {};
    else if (typeof node[seg] === "string") throw new Error(`intermediate string at ${parts.slice(0, i + 1).join(".")} for ${path}`);
    node = node[seg];
  }
  node[parts[parts.length - 1]] = value;
}
function delDeep(obj, path) {
  const parts = path.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node || typeof node[parts[i]] !== "object") return false;
    node = node[parts[i]];
  }
  const leaf = parts[parts.length - 1];
  if (node && leaf in node) {
    delete node[leaf];
    return true;
  }
  return false;
}

// --- Discover collision roots dynamically against the (already merged) en.json
const en = cats.en;
const stillMissing = [];
for (const k of Object.keys(flat)) {
  const r = resolve(en, k);
  if (!r.found || typeof r.val === "object") stillMissing.push(k);
}
const roots = new Set();
for (const k of stillMissing) {
  const r = resolve(en, k);
  if (r.found && typeof r.val === "object") {
    roots.add(k); // object-vs-leaf: the leaf usage path itself is the root
    continue;
  }
  // intermediate-leaf: find the string prefix
  const parts = k.split(".");
  for (let i = 1; i < parts.length; i++) {
    const pr = resolve(en, parts.slice(0, i).join("."));
    if (pr.found && typeof pr.val === "string") {
      roots.add(parts.slice(0, i).join("."));
      break;
    }
  }
}

const callSiteEdits = []; // { file, from, to }
const actions = [];

function findFiles(root) {
  const esc = root.replace(/[.[\]]/g, "\\$&");
  // leaf usage = quoted key immediately followed by , or ) (end of key string arg)
  try {
    const out = execSync(`grep -rlE '"${esc}"[),]' src 2>/dev/null || true`).toString().trim();
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

for (const root of [...roots].sort()) {
  if (root === "common.configureSupabase") {
    // Special: relocate the two nested keys, keep the shared leaf.
    const file = "src/components/ui/ConfigureSupabase.tsx";
    for (const sub of ["title", "description"]) {
      callSiteEdits.push({
        file,
        from: `"common.configureSupabase.${sub}"`,
        to: `"components.configureSupabase.${sub}"`,
      });
    }
    setDeep(en, "components.configureSupabase.title", flat["common.configureSupabase.title"] || "Configure Supabase");
    setDeep(en, "components.configureSupabase.description", flat["common.configureSupabase.description"] || "Configure Supabase.");
    actions.push(`common.configureSupabase: nested keys -> components.configureSupabase.* (leaf kept)`);
    continue;
  }

  const parts = root.split(".");
  const seg = parts[parts.length - 1];
  const labelKey = [...parts.slice(0, -1), `${seg}Label`].join(".");
  const labelText = flat[root] ?? (typeof resolve(en, root).val === "string" ? resolve(en, root).val : null);
  if (labelText == null) throw new Error(`no label text for ${root}`);
  if (resolve(en, labelKey).found) throw new Error(`labelKey already exists: ${labelKey}`);

  const files = findFiles(root);
  if (files.length === 0) throw new Error(`no call site file found for ${root}`);
  for (const f of files) {
    callSiteEdits.push({ file: f, from: `"${root}",`, to: `"${labelKey}",` });
    callSiteEdits.push({ file: f, from: `"${root}")`, to: `"${labelKey}")` });
  }

  // catalogs: remove stale scalar string (class intermediate-leaf) from all locales
  for (const l of MESSAGES) {
    const r = resolve(cats[l], root);
    if (r.found && typeof r.val === "string") delDeep(cats[l], root);
  }
  // add the relocated label text to en only (locales pick it up as a gap)
  setDeep(en, labelKey, labelText);
  actions.push(`${root} -> ${labelKey}  (${files.length} file${files.length > 1 ? "s" : ""}, "${labelText}")`);
}

// --- Apply source edits
const fileBuf = new Map();
let editsApplied = 0;
let editsMissed = 0;
for (const { file, from, to } of callSiteEdits) {
  const abs = join(ROOT, file);
  let txt = fileBuf.has(abs) ? fileBuf.get(abs) : readFileSync(abs, "utf8");
  if (txt.includes(from)) {
    txt = txt.split(from).join(to);
    fileBuf.set(abs, txt);
    editsApplied++;
  } else {
    editsMissed++;
  }
}

console.log(`Collision roots: ${roots.size}`);
console.log(actions.map((a) => "  " + a).join("\n"));
console.log(`\nSource edits: ${editsApplied} applied, ${editsMissed} patterns not present (ok if alt form matched).`);
console.log(`Files touched: ${fileBuf.size}`);

if (!WRITE) {
  console.log("\n(dry run — re-run with --write to apply)");
  process.exit(0);
}

for (const [abs, txt] of fileBuf) writeFileSync(abs, txt);
for (const l of MESSAGES) writeFileSync(join(ROOT, `src/messages/${l}.json`), JSON.stringify(cats[l], null, 2) + "\n");
console.log("\nApplied. Source files + 7 catalogs written.");
