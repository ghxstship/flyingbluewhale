#!/usr/bin/env node
// Generate docs/ia/SITEMAP.md — the single source of truth for the ATLVS
// Technologies route surface across all four sub-products.
//
// It cross-references TWO independent truths and reconciles them:
//   1. The filesystem  — every `page.tsx` / `route.ts` under `src/app`
//      (what actually exists / is routable).
//   2. `src/lib/nav.ts` — every `href` the curated navigation IA exposes
//      (what a user can actually click to).
//
// A route is one of:
//   ● nav     — its exact path is a nav href (directly clickable)
//   ○ linked  — its module is in nav; the route itself is reached via an
//               in-page link / CRUD child (…/new, …/[id], …/[id]/edit, deep
//               sub-modules of a navigated list)
//   ⚠ orphan  — NOTHING in its module appears anywhere in nav.ts (invisible)
//
// `nav.ts` has no imports (pure strings), so we transpile it with esbuild
// and call the real nav builders — no fragile regex over the source.
//
// Run:  node scripts/generate-sitemap.mjs
// Re-run after any route add (`scripts/generate-stubs.sh`) or nav.ts edit.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdtempSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src/app");
const NAV_TS = join(ROOT, "src/lib/nav.ts");
const OUT = join(ROOT, "docs/ia/SITEMAP.md");

// ─────────────────────────────────────────────────────────────────────────
// 1. Filesystem truth — walk src/app for page.tsx (routes) + route.ts (API).
// ─────────────────────────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// "src/app/(platform)/studio/projects/[id]/page.tsx" → "/studio/projects/[id]"
function toRoute(absFile) {
  const rel = relative(APP_DIR, absFile)
    .replace(/\\/g, "/")
    .replace(/\/(page|route)\.tsx?$/, "");
  const segs = rel.split("/").filter((s) => s && !/^\(.+\)$/.test(s)); // drop (groups)
  return "/" + segs.join("/");
}

// First (group) segment under app/ — the authoritative shell.
function groupOf(absFile) {
  const rel = relative(APP_DIR, absFile).replace(/\\/g, "/");
  const m = rel.match(/\(([a-z]+)\)/);
  return m ? m[1] : "(none)";
}

const files = walk(APP_DIR);
const pageFiles = files.filter((f) => /\/page\.tsx?$/.test(f));
const apiFiles = files
  .filter((f) => /\/route\.tsx?$/.test(f))
  .map(toRoute)
  .filter((r) => r.startsWith("/api"))
  .sort();

const pages = [...new Set(pageFiles.map((f) => `${groupOf(f)}\t${toRoute(f)}`))]
  .map((s) => {
    const [group, route] = s.split("\t");
    return { group, route };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

// ─────────────────────────────────────────────────────────────────────────
// 2. Nav truth — transpile nav.ts, call every nav builder, harvest hrefs.
// ─────────────────────────────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), "navts-"));
const tmpFile = join(tmp, "nav.mjs");
const js = esbuild.transformSync(readFileSync(NAV_TS, "utf8"), {
  loader: "ts",
  format: "esm",
}).code;
writeFileSync(tmpFile, js);
const nav = await import(pathToFileURL(tmpFile).href);

const navHrefs = new Set();
const collect = (groups) => {
  for (const g of groups ?? []) {
    // ADR-0011: a navigable group header carries the hub href, so it must
    // count as nav reach (an echo leaf that points at the same hub was
    // dropped in favour of the header link).
    if (g.href) navHrefs.add(g.href);
    for (const it of g.items ?? []) if (it.href) navHrefs.add(it.href);
    for (const sec of g.sections ?? []) for (const it of sec.items ?? []) if (it.href) navHrefs.add(it.href);
  }
};
collect(nav.platformNavDomain);
// Kit 20 second shelf + utility surfaces: every tab is a real route, and
// the surfaces the verbatim rail does not carry stay nav-reached through
// platformUtility (⌘K + hubs) — the reshape retired zero URLs.
for (const fam of nav.platformTabs ?? []) {
  navHrefs.add(fam.owner);
  for (const tab of fam.tabs ?? []) if (tab.href) navHrefs.add(tab.href);
}
for (const it of nav.platformUtility ?? []) if (it.href) navHrefs.add(it.href);
collect(nav.settingsNav);
collect(nav.legendNav);
collect(nav.portalConsumerNav);
for (const persona of nav.PORTAL_PERSONAS) collect([nav.portalNav("[slug]", persona)]);
for (const it of nav.mobileTabs ?? []) navHrefs.add(it.href);
for (const it of nav.mobileSurfaces ?? []) navHrefs.add(it.href);
// Self-navigating shells (marketing + personal) — their nav DATA also lives in
// nav.ts now, so harvest it the same way (these drive MarketingHeader, the
// marketing footer, and the /me tabs).
const collectItems = (items) => {
  for (const it of items ?? []) if (it?.href) navHrefs.add(it.href);
};
const collectGroups = (groups) => {
  for (const g of groups ?? []) collectItems(g.items);
};
collectGroups(nav.marketingHeaderGroups);
collectItems(nav.marketingHeaderPrimaryLinks);
collectGroups(nav.marketingFooterGroups);
collectGroups(nav.personalNavGroups);
if (nav.marketingAuthLinks) {
  navHrefs.add(nav.marketingAuthLinks.login.href);
  navHrefs.add(nav.marketingAuthLinks.signup.href);
}

// Normalize: drop query/hash. (e.g. ".../hospitality?audience=guest")
const norm = (h) => h.split(/[?#]/)[0].replace(/\/$/, "") || "/";
const navSet = new Set([...navHrefs].map(norm));

// ─────────────────────────────────────────────────────────────────────────
// 3. Classification.
// ─────────────────────────────────────────────────────────────────────────
const SHELL = {
  platform: { label: "ATLVS — Operator Console", base: "/studio" },
  mobile: { label: "COMPVSS — Field PWA", base: "/m" },
  portal: { label: "GVTEWAY — External Portal", base: "/p" },
  legend: { label: "LEG3ND — Knowledge Shell", base: "/legend" },
  marketing: { label: "GVTEWAY — Public / Marketing", base: "" },
  personal: { label: "Personal (/me)", base: "/me" },
  auth: { label: "Auth", base: "" },
};

// Module key = (shell, first meaningful segment). Portal collapses [slug].
function moduleKey(group, route) {
  const segs = route.split("/").filter(Boolean);
  if (group === "portal") {
    // /p/[slug]/<persona|shared>/… → key on the persona/shared segment
    if (segs[0] === "p" && segs[1] === "[slug]") return "p:" + (segs[2] ?? "·root");
    if (segs[0] === "p") return "p:" + (segs[1] ?? "·root"); // /p/select
    return "p:·root";
  }
  if (group === "platform") return "console:" + (segs[1] ?? "·root");
  if (group === "mobile") return "m:" + (segs[1] ?? "·root");
  if (group === "legend") return "legend:" + (segs[1] ?? "·root");
  if (group === "personal") return "me:" + (segs[1] ?? "·root");
  return group + ":" + (segs[0] ?? "·root");
}

// Module keys that nav actually reaches.
const navModules = new Set();
const under = (h, base) => h === base || h.startsWith(base + "/");
for (const h of navSet) {
  // Infer group from the path so the key matches the page side. Use segment
  // boundaries so "/marketplace" and "/me/*" aren't mis-read as the "/m" shell.
  let group = "marketing";
  if (under(h, "/studio")) group = "platform";
  else if (under(h, "/legend")) group = "legend";
  else if (under(h, "/me")) group = "personal";
  else if (under(h, "/m")) group = "mobile";
  else if (under(h, "/p")) group = "portal";
  navModules.add(moduleKey(group, h));
}

// Every shell's navigation now lives in nav.ts: platform/mobile/portal via the
// rails, marketing via marketingHeaderGroups + marketingFooterGroups, personal
// via personalNavGroups. So all shells are reconciled — there is no unmeasured
// "self-nav" exemption left.

// Routes intentionally NOT in nav — reached by redirect, emailed/shared token
// link, locale routing, or contextual entry, never a nav click. `exact` matches
// one route; `prefix` matches the route and its descendants. Every entry carries
// a reason (rendered in the doc). Everything else unreachable from nav = orphan.
const EXEMPT = [
  // One Front Door (v7.8) — redirect resolver: picks the active production
  // and lands on its advancing new-assignment form. Reached from the global
  // "+" menu, never a sidebar item.
  {
    path: "/studio/advancing/request",
    type: "exact",
    reason: "One Front Door redirect — resolves the active production's advancing intake; reached from the global + menu.",
  },
  // Unified Schedule (CP·3) — the Dispatch Matrix was promoted to
  // /studio/operations/schedule; this route now 301s there (fleet/crew lens).
  {
    path: "/studio/operations/dispatch",
    type: "exact",
    reason: "Dispatch Matrix redirect — promoted to the unified /studio/operations/schedule; keeps old links resolving.",
  },
  // Portal infra — persona routing, not a nav target.
  {
    path: "/p/[slug]",
    type: "exact",
    reason: "Portal gateway — persona picker / redirect to the viewer's persona home.",
  },
  { path: "/p/select", type: "exact", reason: "Org/slug picker — reached when a portal user has no resolved slug." },
  { path: "/p", type: "exact", reason: "GVTEWAY home — the discovery/marketplace, reached via the gvteway.atlvs.pro subdomain root (not a path-prefix nav item)." },
  // Marketing home — reached via the logo lockup, not a nav item.
  { path: "/", type: "exact", reason: "Home — reached via the logo, not a nav entry." },
  // i18n locale roots.
  { path: "/es-ES", type: "prefix", reason: "i18n locale root." },
  { path: "/pt-BR", type: "prefix", reason: "i18n locale root." },
  // Standalone microsites / utilities — contextual entry, not primary nav.
  { path: "/api-docs", type: "prefix", reason: "API reference microsite." },
  { path: "/brand-kit", type: "prefix", reason: "Brand-kit microsite." },
  { path: "/demo", type: "prefix", reason: "Demo-booking flow." },
  { path: "/pitch", type: "prefix", reason: "pitch deck presenter surface" },
  { path: "/forms", type: "prefix", reason: "Embedded campaign/SEO form pages." },
  // Token-gated flows — entered via an emailed/shared link, never nav.
  { path: "/offer", type: "prefix", reason: "Token-gated offer flow." },
  { path: "/book", type: "prefix", reason: "Token-gated public scheduler booking flow (emailed / packet link)." },
  { path: "/proposals", type: "prefix", reason: "Token-gated proposal flow." },
  { path: "/msa", type: "prefix", reason: "Token-gated MSA flow." },
  { path: "/share", type: "prefix", reason: "Token-gated share link." },
  { path: "/sign", type: "prefix", reason: "Token-gated public e-signature flow (emailed signing link)." },
  { path: "/accept-invite", type: "prefix", reason: "Token-gated invite acceptance." },
  // Auth flows — entered via login / CTAs / emailed links, not nav.
  { path: "/auth", type: "prefix", reason: "Auth resolver / redirect." },
  { path: "/forgot-password", type: "prefix", reason: "Auth recovery flow." },
  { path: "/reset-password", type: "prefix", reason: "Auth recovery flow." },
  { path: "/magic-link", type: "prefix", reason: "Auth passwordless flow." },
  { path: "/mfa", type: "prefix", reason: "Auth MFA challenge." },
  { path: "/sso", type: "prefix", reason: "Auth SSO entry." },
  { path: "/verify-email", type: "prefix", reason: "Auth email verification." },
  { path: "/onboarding", type: "prefix", reason: "Post-signup org onboarding flow." },
  { path: "/home", type: "exact", reason: "Post-auth app launcher — reached via auth redirect, not a nav click." },
  // COMPVSS settings sub-page — reached from the More/Settings surface, not a primary tab.
  { path: "/m/changelog", type: "exact", reason: "COMPVSS What's New — reached from Settings, not a nav tab." },
  {
    path: "/m/settings/account",
    type: "exact",
    reason: "account lifecycle sub-screen, reached from /m/settings",
  },
  { path: "/social", type: "prefix", reason: "social image asset endpoint" },
  {
    path: "/studio/settings/impersonate",
    type: "exact",
    reason: "dev-only impersonation console (isDeveloper-gated, notFound otherwise)",
  },
];
const isExempt = (route) =>
  EXEMPT.some((e) => (e.type === "exact" ? route === e.path : route === e.path || route.startsWith(e.path + "/")));

function statusOf(group, route) {
  if (isExempt(route)) return "exempt";
  if (navSet.has(norm(route))) return "nav";
  if (navModules.has(moduleKey(group, route))) return "linked";
  return "orphan";
}

for (const p of pages) p.status = statusOf(p.group, p.route);

// Dangling nav: an href with no on-disk page (dynamic-aware match).
const pageSet = new Set(pages.map((p) => p.route));
const segMatch = (navPath, diskPath) => {
  const a = navPath.split("/"),
    b = diskPath.split("/");
  if (a.length !== b.length) return false;
  return a.every((s, i) => s === b[i] || /^\[.+\]$/.test(b[i]));
};
const dangling = [...navSet]
  .filter((h) => h.startsWith("/")) // skip externals if any
  .filter((h) => !pageSet.has(h) && !pages.some((p) => segMatch(h, p.route)))
  .sort();

// Unresolved priority refs: PHASE_PRIORITY_HREFS only *reorders* mobileSurfaces
// (filtered via byHref). An href listed there but absent from mobileSurfaces
// silently drops — the intent never renders. These are module-private, so
// harvest them straight from source.
const navSrc = readFileSync(NAV_TS, "utf8");
const blockHrefs = (name) => {
  const m = navSrc.match(new RegExp(`${name}[\\s\\S]*?\\{([\\s\\S]*?)\\n\\};`));
  return m ? [...m[1].matchAll(/"(\/m\/[^"]+)"/g)].map((x) => x[1]) : [];
};
const priorityHrefs = new Set([...blockHrefs("PHASE_PRIORITY_HREFS")]);
const mobileSurfaceSet = new Set((nav.mobileSurfaces ?? []).map((i) => i.href));
const deadPriority = [...priorityHrefs].filter((h) => !mobileSurfaceSet.has(h)).sort();

// ─────────────────────────────────────────────────────────────────────────
// 4. Render.
// ─────────────────────────────────────────────────────────────────────────
const MARK = { nav: "●", linked: "○", orphan: "⚠", exempt: "·" };
// Nav source per shell — every shell is now reconciled against nav.ts.
const NAV_SOURCE = {
  platform: "platformNav rail",
  mobile: "mobileTabs / mobileSurfaces",
  portal: "portalNav rail",
  legend: "legendNav rail",
  marketing: "marketingHeaderGroups + marketingFooterGroups",
  personal: "personalNavGroups (tabs)",
  auth: "marketing header auth links + token flows",
};
const byShell = (g) => pages.filter((p) => p.group === g);
const count = (arr, s) => arr.filter((p) => p.status === s).length;

function moduleBlocks(rows, stripBase) {
  // Group rows by their depth-1 module under stripBase, render each as a list.
  const groups = new Map();
  for (const r of rows) {
    const rest = stripBase ? r.route.slice(stripBase.length) : r.route;
    const segs = rest.split("/").filter(Boolean);
    const key = segs[0] ?? "·root";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  let out = "";
  for (const key of [...groups.keys()].sort()) {
    const rows = groups.get(key);
    const orphaned = rows.every((r) => r.status === "orphan");
    const tag = orphaned ? " ⚠️ **ORPHAN MODULE — not in nav**" : "";
    out += `\n<details><summary><code>${key}</code> · ${rows.length} route${rows.length > 1 ? "s" : ""}${tag}</summary>\n\n`;
    for (const r of rows.sort((a, b) => a.route.localeCompare(b.route))) out += `${MARK[r.status]} \`${r.route}\`\n`;
    out += `\n</details>\n`;
  }
  return out;
}

// No volatile timestamp in the output — the drift guard (gen:sitemap:check /
// sitemap.test.ts) must fire only on real route/nav changes, not date rollover.
let md = `# SITEMAP — single source of truth

> **GENERATED FILE — do not hand-edit.** Regenerate with
> \`node scripts/generate-sitemap.mjs\`. Derived from the filesystem
> (\`src/app/**/page.tsx\`) reconciled against the curated nav IA
> (\`src/lib/nav.ts\`). Supersedes \`docs/ia/02-route-inventory.md\` and the
> stale \`docs/ia/inventory/sitemap-workflow-inventory.*\` snapshots.
>
> Reconciliation strategy + backlog: \`docs/ia/SITEMAP_RECONCILIATION.md\`.

**Page routes:** ${pages.length} · **API route handlers:** ${apiFiles.length} · **Distinct nav hrefs:** ${navSet.size}

## Legend

| Mark | Status | Meaning |
|------|--------|---------|
| ● | \`nav\` | Exact path is a nav href — directly clickable from a rail/tab/header/footer. |
| ○ | \`linked\` | Module is in nav; route reached via in-page link or CRUD child (\`/new\`, \`/[id]\`, deep sub-modules, or dynamic SEO children). |
| ⚠ | \`orphan\` | **Nothing** in this module appears anywhere in \`nav.ts\` — invisible to navigation. |
| · | \`exempt\` | Intentionally not in nav — redirect / token / locale / contextual entry (see "Exempt routes" below). |

**Every shell is now reconciled against \`nav.ts\`** — the rails (platform/mobile/portal), the marketing header + footer (\`marketingHeaderGroups\` / \`marketingFooterGroups\`), and the \`/me\` tabs (\`personalNavGroups\`) all source their links from \`nav.ts\`, and the components render that data. There is no longer an unmeasured self-navigating shell.

## Reconciliation scorecard

| Shell | Nav source | Routes | ● nav | ○ linked | ⚠ orphan | · exempt |
|-------|------------|-------:|------:|---------:|---------:|---------:|
`;
for (const [g, meta] of Object.entries(SHELL)) {
  const rows = byShell(g);
  if (!rows.length) continue;
  md += `| ${meta.label} | ${NAV_SOURCE[g] ?? "—"} | ${rows.length} | ${count(rows, "nav")} | ${count(rows, "linked")} | ${count(rows, "orphan")} | ${count(rows, "exempt")} |\n`;
}
md += `| **TOTAL** | | **${pages.length}** | **${count(pages, "nav")}** | **${count(pages, "linked")}** | **${count(pages, "orphan")}** | **${count(pages, "exempt")}** |\n`;

// Orphan-module roll-up (the headline reconciliation gap).
const orphanModules = new Map();
for (const p of pages.filter((p) => p.status === "orphan")) {
  const k = `${p.group}\t${moduleKey(p.group, p.route).split(":")[1]}`;
  orphanModules.set(k, (orphanModules.get(k) ?? 0) + 1);
}
md += `\n## ⚠️ Orphan modules (${orphanModules.size}) — features with zero nav entry\n\n`;
md += `These trees exist on disk and are routable, but nothing in \`nav.ts\` links to them. They are the primary reconciliation target.\n\n`;
md += `| Shell | Module | Orphaned routes |\n|-------|--------|----------------:|\n`;
for (const [k, n] of [...orphanModules.entries()].sort((a, b) => b[1] - a[1])) {
  const [g, mod] = k.split("\t");
  md += `| ${SHELL[g]?.label ?? g} | \`${mod}\` | ${n} |\n`;
}

// Dangling nav (clickable links pointing at nothing on disk).
md += `\n## 🔗 Dangling nav hrefs (${dangling.length}) — links with no page on disk\n\n`;
if (!dangling.length) md += `_None — every nav href resolves to a page._\n`;
else {
  md += `Each is a nav entry that 404s (or relies on a route not yet built):\n\n`;
  for (const h of dangling) md += `- \`${h}\`\n`;
}

// Unresolved priority refs.
md += `\n## 🪫 Unresolved priority refs (${deadPriority.length}) — COMPVSS\n\n`;
if (!deadPriority.length) md += `_None — every role/phase priority href is a registered \`mobileSurfaces\` entry._\n`;
else {
  md += `These hrefs are listed in \`ROLE_PRIORITY_HREFS\`/\`PHASE_PRIORITY_HREFS\` (tools-drawer ordering) but are **not** in \`mobileSurfaces\`, so \`mobileSurfacesForRole()\` silently drops them — the surface never appears in the drawer:\n\n`;
  for (const h of deadPriority) md += `- \`${h}\`\n`;
}

// Exempt routes (intentional non-nav) — full disposition list.
const exemptCount = count(pages, "exempt");
md += `\n## · Exempt routes (${exemptCount}) — intentional non-nav, with reasons\n\n`;
md += `Reached by redirect, emailed/shared token link, locale routing, or contextual entry — never a nav click. Defined in \`EXEMPT\` in the generator.\n\n`;
md += `| Match | Type | Reason |\n|-------|------|--------|\n`;
for (const e of EXEMPT) md += `| \`${e.path}\` | ${e.type} | ${e.reason} |\n`;

// Per-shell full inventory.
const order = [
  ["platform", "ATLVS — Operator Console (`/studio`)", "/studio"],
  ["mobile", "COMPVSS — Field PWA (`/m`)", "/m"],
  ["portal", "GVTEWAY — External Portal (`/p/[slug]`)", "/p/[slug]"],
  ["legend", "LEG3ND — Knowledge Shell (`/legend`)", "/legend"],
  ["marketing", "GVTEWAY — Public / Marketing", ""],
  ["personal", "Personal (`/me`)", "/me"],
  ["auth", "Auth", ""],
];
md += `\n---\n\n# Full inventory by app\n`;
for (const [g, title, strip] of order) {
  const rows = byShell(g);
  if (!rows.length) continue;
  md += `\n## ${title}\n\n`;
  md += `${rows.length} routes — ● ${count(rows, "nav")} nav · ○ ${count(rows, "linked")} linked · ⚠ ${count(rows, "orphan")} orphan\n`;
  md += moduleBlocks(rows, strip ? strip : null);
}

// API surface.
md += `\n---\n\n## API surface (\`/api/v1\`) — ${apiFiles.length} route handlers\n\n`;
const apiGroups = new Map();
for (const r of apiFiles) {
  const segs = r.split("/").filter(Boolean); // api, v1, <group>, …
  const key = segs[2] ?? "·root";
  if (!apiGroups.has(key)) apiGroups.set(key, []);
  apiGroups.get(key).push(r);
}
for (const key of [...apiGroups.keys()].sort()) {
  const rows = apiGroups.get(key);
  md += `\n<details><summary><code>/api/v1/${key}</code> · ${rows.length}</summary>\n\n`;
  for (const r of rows) md += `- \`${r}\`\n`;
  md += `\n</details>\n`;
}

// Machine-readable summary (for the ratchet test). Computes only; writes nothing.
if (process.argv.includes("--json")) {
  process.stdout.write(
    JSON.stringify({
      pages: pages.length,
      nav: count(pages, "nav"),
      linked: count(pages, "linked"),
      orphan: count(pages, "orphan"),
      exempt: count(pages, "exempt"),
      orphanModules: orphanModules.size,
      dangling: dangling.length,
      deadPriority: deadPriority.length,
      api: apiFiles.length,
    }),
  );
  process.exit(0);
}

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== md) {
    console.error(`✗ ${relative(ROOT, OUT)} is stale — run \`npm run gen:sitemap\` and commit the result.`);
    process.exit(1);
  }
  console.log(`✓ ${relative(ROOT, OUT)} is up to date.`);
  process.exit(0);
}

writeFileSync(OUT, md);
console.log(
  `✓ ${relative(ROOT, OUT)} — ${pages.length} pages, ${count(pages, "orphan")} orphan, ${orphanModules.size} orphan modules, ${dangling.length} dangling nav, ${deadPriority.length} dead priority refs, ${apiFiles.length} API handlers`,
);
