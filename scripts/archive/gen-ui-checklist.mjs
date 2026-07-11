// Enumerate every UI page.tsx → URL route + metadata. Emits JSON for the checklist.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const APP = "src/app";
const pages = [];
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (e === "page.tsx") pages.push(p);
  }
}
walk(APP);

const SHELL_OF = (segs) => {
  const g = segs.find((s) => /^\(.*\)$/.test(s));
  const map = { "(marketing)":"marketing","(auth)":"auth","(personal)":"personal","(platform)":"platform","(portal)":"portal","(mobile)":"mobile" };
  return map[g] || "root";
};

const rows = pages.map((file) => {
  const rel = relative(APP, file).replace(/\/page\.tsx$/, "");
  const segs = rel.split("/").filter(Boolean);
  const shell = SHELL_OF(segs);
  // URL = segments minus route groups; keep [param] segments
  const urlSegs = segs.filter((s) => !/^\(.*\)$/.test(s));
  const route = "/" + urlSegs.join("/");
  const dynamic = /\[.*\]/.test(route);
  return { file, shell, route: route === "/" ? "/" : route, dynamic };
}).sort((a,b) => a.shell.localeCompare(b.shell) || a.route.localeCompare(b.route));

const byShell = {};
for (const r of rows) (byShell[r.shell] ??= []).push(r);

const summary = Object.fromEntries(Object.entries(byShell).map(([k,v]) => [k, { total:v.length, static:v.filter(x=>!x.dynamic).length, dynamic:v.filter(x=>x.dynamic).length }]));
writeFileSync("/tmp/ui-pages.json", JSON.stringify({ total: rows.length, summary, rows }, null, 2));
console.log("total pages:", rows.length);
console.log(JSON.stringify(summary, null, 2));
