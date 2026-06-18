#!/usr/bin/env node
// Workflow / CRUD efficiency audit. For every dataset (resource) in the route
// tree, derive which CRUD verbs exist, how deep it sits (click-cost proxy),
// whether its list is directly nav-reachable, and whether a delete action
// exists in the sibling actions. Flags asymmetric / deep / hard-to-reach CRUD.
//
//   node scripts/workflow-audit.mjs            → console digest + audit.json
//
// Click model (from an authed landing): a directly-nav-linked list = 2 clicks
// (open group + item). Each extra path level the resource sits below a
// nav-linked ancestor adds ~1 click (you navigate INTO a parent first). CRUD:
//   create  = reach list (+1 "New")        read = reach list (+1 row)
//   update  = reach detail (+1 "Edit")     delete = reach detail (+1 + confirm)

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APP = join(ROOT, "src/app");

// ── route tree ──────────────────────────────────────────────────────────
function walk(d) {
  const out = [];
  for (const n of readdirSync(d)) {
    const f = join(d, n);
    out.push(...(statSync(f).isDirectory() ? walk(f) : [f]));
  }
  return out;
}
const files = walk(APP);
const toRoute = (f) =>
  "/" +
  relative(APP, f)
    .replace(/\\/g, "/")
    .replace(/\/(page|route)\.tsx?$/, "")
    .split("/")
    .filter((s) => s && !/^\(.+\)$/.test(s))
    .join("/");
const pageDirs = new Set(files.filter((f) => /\/page\.tsx?$/.test(f)).map(toRoute));
const routes = [...pageDirs];

// ── directly-nav-linked routes (● in the generated sitemap) ─────────────
const sm = readFileSync(join(ROOT, "docs/ia/SITEMAP.md"), "utf8");
const navLinked = new Set([...sm.matchAll(/●\s+`([^`]+)`/g)].map((m) => m[1]));

// Map a route to its on-disk dir (resolve the route group).
function diskDir(routePath) {
  const seg = routePath.split("/").filter(Boolean);
  for (const g of ["(platform)", "(mobile)", "(portal)", "(personal)", "(marketing)", "(auth)"]) {
    const d = join(APP, g, ...seg);
    if (existsSync(d)) return d;
  }
  return null;
}

// All .ts/.tsx under a dir (recursive), for content scanning.
function filesUnder(dir) {
  if (!dir || !existsSync(dir)) return [];
  return walk(dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));
}

// Scan a dataset's surfaces for real create/update/delete capability — not just
// /new + /edit ROUTES, but inline forms, kanban/board controls, and status-
// transition / publish / approve actions anywhere in the resource's own dir,
// its /new, and its [param] detail subtree. This collapses false positives
// (board UIs like sprints, inline-managed lookup tables, transition-only
// detail pages) so the residual flags are genuine candidates. Bounded to the
// resource: the [param] detail subtree is scanned, but sibling nested
// resources are not (they have their own audit row).
function crudActions(routePath, detailRoute) {
  const verbs = { create: false, update: false, delete: false };
  const dir = diskDir(routePath);
  // resource dir (non-recursive — descendant resources excluded) + /new +
  // the [param] detail subtree (recursive — transitions/edit live there).
  const top = dir ? readdirSync(dir).map((n) => join(dir, n)).filter((f) => statSync(f).isFile() && /\.tsx?$/.test(f) && !/\.test\./.test(f)) : [];
  const files = [...top, ...filesUnder(diskDir(routePath + "/new")), ...filesUnder(detailRoute && diskDir(detailRoute))];
  const src = files.map((f) => readFileSync(f, "utf8")).join("\n");
  if (/\.insert\(|create\w*\s*\(|<FormShell|useActionState|Add\w*Form|New\w*Form|action=\{create/i.test(src)) verbs.create = true;
  if (/\.update\(|update\w*\s*\(|move\w*|toggle\w*|publish\w*|approve\w*|reject\w*|set\w*Action|transition|advance\w*|\bedit\b|Controls\b|Kanban/i.test(src)) verbs.update = true;
  if (/\.delete\(\)|delete\w*\s*\(|soft.?delete|deleted_at\s*[:=]|archive\w*\s*\(|void\w*\s*\(|remove\w*Action/i.test(src)) verbs.delete = true;
  return verbs;
}

// ── resource detection ──────────────────────────────────────────────────
const isParam = (s) => /^\[.+\]$/.test(s);
const resources = new Map();
for (const r of routes) {
  const segs = r.split("/").filter(Boolean);
  // a resource ROOT R is any route that has a /new or /[param] child route
  const childNew = pageDirs.has(r + "/new");
  const childParam = routes.some((o) => {
    const os = o.split("/").filter(Boolean);
    return os.length === segs.length + 1 && o.startsWith(r + "/") && isParam(os[os.length - 1]);
  });
  if (!(childNew || childParam)) continue;
  if (isParam(segs[segs.length - 1])) continue; // R itself shouldn't be a param
  if (segs[segs.length - 1] === "new") continue;

  const paramChild = routes.find((o) => {
    const os = o.split("/").filter(Boolean);
    return os.length === segs.length + 1 && o.startsWith(r + "/") && isParam(os[os.length - 1]);
  });
  const detail = paramChild ?? null;
  const edit = detail && pageDirs.has(detail + "/edit") ? detail + "/edit" : null;

  // shell + base — CRUD audit only covers data shells, not marketing/auth.
  const shell = r.startsWith("/console") ? "console" : (r === "/m" || r.startsWith("/m/")) ? "mobile" : r.startsWith("/p/") ? "portal" : (r === "/me" || r.startsWith("/me/")) ? "me" : "other";
  if (shell === "other") continue;
  const baseLen = shell === "console" ? 1 : shell === "mobile" ? 1 : shell === "portal" ? 2 : shell === "me" ? 1 : 0;
  const depth = segs.length - baseLen; // levels below the shell base

  // nearest nav-linked ancestor (incl. self) → click cost
  let navHops = null;
  for (let i = segs.length; i >= 1; i--) {
    const anc = "/" + segs.slice(0, i).join("/");
    if (navLinked.has(anc)) { navHops = segs.length - i; break; }
  }
  const reachClicks = navHops === null ? null : 2 + navHops; // 2 to the nav item + hops into descendants

  const verbs = crudActions(r, detail);
  resources.set(r, {
    resource: r, shell, depth,
    list: pageDirs.has(r),
    createRoute: childNew, detailRoute: !!detail, editRoute: !!edit,
    create: childNew || verbs.create,
    update: !!edit || verbs.update,
    del: verbs.delete,
    navLinkedList: navLinked.has(r),
    reachClicks,
  });
}

// ── flags ───────────────────────────────────────────────────────────────
const rows = [...resources.values()].map((x) => {
  const flags = [];
  if (x.list && x.create && x.detailRoute === false && !x.editRoute) flags.push("NO-DRILL-IN (list+create but no row detail/edit route — manage inline only)");
  if (x.list && x.detailRoute && !x.create) flags.push("NO-CREATE (no /new route and no create action — can't add from the UI)");
  if (x.detailRoute && !x.update && !x.del) flags.push("READ-ONLY (detail present but no update/delete action found)");
  if (x.reachClicks === null) flags.push("UNREACHABLE-FROM-NAV (no nav-linked ancestor — known only by URL/in-page link)");
  else if (x.reachClicks >= 4) flags.push(`DEEP (~${x.reachClicks} clicks just to reach the list)`);
  if (x.depth >= 3) flags.push(`NESTED (depth ${x.depth} below the shell base)`);
  return { ...x, flags };
});

const flagged = rows.filter((r) => r.flags.length).sort((a, b) => (b.reachClicks ?? 99) - (a.reachClicks ?? 99));
const byShell = rows.reduce((a, r) => ((a[r.shell] = (a[r.shell] || 0) + 1), a), {});

console.log(`Resources (datasets with CRUD routes): ${rows.length}`);
console.log("by shell:", byShell);
console.log(`Flagged: ${flagged.length}\n`);
const crud = (r) => `${r.list ? "L" : "-"}${r.create ? "C" : "-"}${r.detailRoute ? "R" : "-"}${r.update ? "U" : "-"}${r.del ? "D" : "-"}`;
for (const r of flagged) {
  console.log(`${crud(r)} reach=${r.reachClicks ?? "?"} d=${r.depth}  ${r.resource}`);
  for (const f of r.flags) console.log(`        ⚠ ${f}`);
}

// breakdown counts
const count = (pred) => rows.filter(pred).length;
console.log("\n── pattern counts (data shells only) ──");
console.log("NO-DRILL-IN (list+create, no detail) :", count((r) => r.list && r.create && !r.detailRoute && !r.editRoute));
console.log("NO-CREATE (detail, no create)        :", count((r) => r.list && r.detailRoute && !r.create));
console.log("READ-ONLY (detail, no update/delete) :", count((r) => r.detailRoute && !r.update && !r.del));
console.log("DEEP (reach >= 4 clicks)             :", count((r) => (r.reachClicks ?? 99) >= 4));
console.log("NESTED (depth >= 3)                  :", count((r) => r.depth >= 3));
console.log("UNREACHABLE from nav                 :", count((r) => r.reachClicks === null));

import { writeFileSync } from "node:fs";
writeFileSync(join(ROOT, "docs/audits/workflow-audit.json"), JSON.stringify({ rows, flagged }, null, 2));
console.log("\n→ docs/audits/workflow-audit.json");
