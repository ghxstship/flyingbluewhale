#!/usr/bin/env node
// Generate public/ia/ia-model.json — the single source of truth for the LEG3ND
// Architecture reference (/legend/architecture renders entirely from it).
//
// Like generate-sitemap.mjs, it derives from TWO truths and never hand-edits:
//   1. src/lib/nav.ts   — the curated nav rails (group labels + hrefs per shell)
//   2. the src/app tree  — which (group) route-groups actually exist on disk
//
// nav.ts has no imports (pure strings), so we transpile it with esbuild and
// call the real nav builders — no fragile regex over the source. The output
// shape mirrors the kit's ia/ia-model.json:
//   { meta, archetypes, newComponents, shells:[{ id,name,descriptor,kind,
//     color,host,routeGroup,groups:[{ label, routes:[{ path, arch[] }] }] }] }
//
// Run:  node scripts/gen-ia-map.mjs          (writes)
//       node scripts/gen-ia-map.mjs --check   (drift gate — exits 1 if stale)
// Re-run after any nav.ts edit or route-group add/rename.

import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src/app");
const NAV_TS = join(ROOT, "src/lib/nav.ts");
const OUT = join(ROOT, "public/ia/ia-model.json");

// ─────────────────────────────────────────────────────────────────────────
// Archetype vocabulary (fixed) + the lifecycle-gap component set. Both are
// metadata the interactive map renders; kept in sync with the kit manifest.
// ─────────────────────────────────────────────────────────────────────────
const ARCHETYPES = {
  SHELL: { name: "Global chrome", desc: "Wraps every page in a shell.", components: ["AppShell", "AppSwitcher", "Sidebar", "Breadcrumb", "CommandPalette", "Menu", "Avatar", "ToastProvider", "Tooltip", "Banner", "Skeleton"] },
  DASH: { name: "Dashboard / hub", desc: "KPI tiles, charts, activity.", components: ["StatCard", "Card", "BarChart", "LineChart", "DonutChart", "Sparkline", "ActivityTimeline", "ProgressBar", "EmptyState", "SkeletonCard", "Badge", "Tag", "Button", "CoordinateMatrix"] },
  LIST: { name: "List / index", desc: "Filterable, sortable, paginated table.", components: ["FilterBar", "DataTable", "Pagination", "BulkActionBar", "ExportMenu", "Menu", "Badge", "Tag", "Button", "EmptyState", "SkeletonTableRows"] },
  REC: { name: "Detail / record", desc: "Record header, tabs, status, activity.", components: ["RecordHeader", "Tabs", "Badge", "Tag", "ActivityTimeline", "ApprovalBar", "Steps", "Avatar", "Menu", "ConfirmDialog", "Button"] },
  FORM: { name: "Create / edit", desc: "Field-driven form with validation + uploads.", components: ["FormPanel", "Field", "Input", "Textarea", "Select", "Combobox", "Checkbox", "RadioGroup", "Switch", "UploadZone", "Banner", "Spinner", "Button"] },
  BOARD: { name: "Kanban / pipeline", desc: "Draggable columns of cards.", components: ["KanbanBoard", "Card", "Badge", "Tag", "Avatar", "FilterBar", "Menu", "EmptyState"] },
  CAL: { name: "Calendar / schedule", desc: "Month/week/day + timeline.", components: ["Calendar", "GanttChart", "SegmentedControl", "Tabs", "Badge", "Tag", "Menu", "Button"] },
  RPT: { name: "Report / analytics", desc: "Viz-heavy parametric report.", components: ["StatCard", "BarChart", "LineChart", "AreaChart", "DonutChart", "Sparkline", "DataTable", "ProgressBar", "SegmentedControl", "ExportMenu", "Button", "CoordinateMatrix"] },
  DOC: { name: "Document / editor", desc: "Authored doc, drawing, viewer, e-sign.", components: ["RecordHeader", "Tabs", "Breadcrumb", "RichTextEditor", "FileViewer", "SignaturePad", "ActivityTimeline", "UploadZone", "ShareSheet", "Menu", "Button"] },
  COMM: { name: "Messages / inbox", desc: "Threads, chat, announcements.", components: ["ChatBubble", "Avatar", "Badge", "Banner", "Field", "Input", "Menu", "EmptyState", "Button"] },
  AUTH: { name: "Auth", desc: "Split card: login, signup, invite.", components: ["AuthCard", "Field", "Input", "Checkbox", "Banner", "Spinner", "Button"] },
  MKTG: { name: "Marketing / landing", desc: "Hero, features, pricing, FAQ.", components: ["PlanCard", "MediaCard", "Card", "Accordion", "Tag", "Badge", "Banner", "Avatar", "Button"] },
  SHOP: { name: "Marketplace / store", desc: "Listing grid, detail, cart, checkout.", components: ["ProductTile", "MediaCard", "FilterBar", "Pagination", "RatingScale", "ReviewCard", "OrderTracker", "TicketCard", "QRCode", "Tag", "Badge", "Avatar", "Button"] },
  LMS: { name: "Course / knowledge", desc: "Lessons, progress, quiz, article.", components: ["MediaPlayer", "QuizQuestion", "Steps", "ProgressBar", "MediaCard", "AchievementBadge", "RatingScale", "SignIcon", "SignPanel", "Tabs", "Card", "Button"] },
  FIELD: { name: "Field surface", desc: "Single-task mobile screen.", components: ["ScanCapture", "Button", "Barcode", "QRCode", "UploadZone", "OrderTracker", "SignaturePad", "ConfirmDialog", "Banner", "Spinner", "Toast", "OnboardingStepper"] },
  SET: { name: "Settings", desc: "2-col admin.", components: ["Sidebar", "Field", "Input", "Select", "Switch", "Checkbox", "PermissionMatrix", "RoleSelect", "RoleBadge", "InviteRow", "ExportMenu", "ImportPanel", "ConfirmDialog", "Banner", "Button"] },
};
const NEW_COMPONENTS = ["LineChart", "AreaChart", "DonutChart", "Calendar", "GanttChart", "KanbanBoard", "RichTextEditor", "SignaturePad", "FileViewer", "ScanCapture", "FloorPlan", "MediaPlayer", "QuizQuestion", "Accordion", "AppSwitcher", "CoordinateMatrix", "Coordinate"];

// ─────────────────────────────────────────────────────────────────────────
// Shell identity + addressing. routeGroup/host track src/lib/urls.ts +
// src/proxy.ts — update here when those change (the /console→/studio rename
// and the LEG3ND shell promotion both move a value in this table).
// ─────────────────────────────────────────────────────────────────────────
const SHELL_META = {
  atlvs: { name: "ATLVS", descriptor: "Operator console — ERP × CRM × PM", kind: "product", color: "#E23414", host: "app.atlvs.pro", routeGroup: "/studio" },
  gvteway: { name: "GVTEWAY", descriptor: "Public interface & marketplace", kind: "product", color: "#2563EB", host: "gateway.atlvs.pro", routeGroup: "/p" },
  compvss: { name: "COMPVSS", descriptor: "Site & venue field ops", kind: "product", color: "#FFC400", host: "compass.atlvs.pro", routeGroup: "/m" },
  legend: { name: "LEG3ND", descriptor: "Knowledge · LMS · XPMS 2.0", kind: "product", color: "#ED6A1E", host: "legend.atlvs.pro", routeGroup: "/legend" },
  marketing: { name: "Marketing", descriptor: "Public site & positioning", kind: "surface", color: "#181B23", host: "atlvs.pro", routeGroup: "/" },
  auth: { name: "Auth", descriptor: "Login · signup · invites", kind: "surface", color: "#181B23", host: "atlvs.pro", routeGroup: "/auth" },
  personal: { name: "Personal", descriptor: "Any authed user — /me", kind: "surface", color: "#181B23", host: "atlvs.pro", routeGroup: "/me" },
};

// Route-pattern → archetype tags. Mirrors IMPLEMENTATION.md §6.1 (the small
// route→archetype map keyed by path pattern).
function archOf(href) {
  const path = href.split(/[?#]/)[0];
  const segs = path.split("/").filter(Boolean);
  const last = segs[segs.length - 1] ?? "";
  const t = new Set();
  if (["/", "/studio", "/m", "/p", "/legend", "/me"].includes(path)) t.add("SHELL");
  if (/^\[.+\]$/.test(last)) t.add("REC");
  else if (last === "new" || last === "create") t.add("FORM");
  if (/\/settings(\/|$)/.test(path)) t.add("SET");
  if (/report|insight|dashboard|analytic|metric|goals/.test(path)) t.add("RPT");
  if (/inbox|message|comms|announcement|thread|chat/.test(path)) t.add("COMM");
  if (/board|kanban|pipeline/.test(path)) t.add("BOARD");
  if (/calendar|schedule|timeline|gantt/.test(path)) t.add("CAL");
  if (/learn|course|lesson|quiz|knowledge|standard|certif/.test(path)) t.add("LMS");
  if (/marketplace|store|shop|ticket|events|catalog|gigs|jobs/.test(path)) t.add("SHOP");
  if (/document|drawing|envelope|sign|notes|spec|submittal|transmittal/.test(path)) t.add("DOC");
  if (/scan|clock|check-?in|punch|daily-log|advances|handover/.test(path)) t.add("FIELD");
  if (/login|signup|auth|invite|mfa|sso|welcome|onboard/.test(path)) t.add("AUTH");
  if (/pricing|for-institutions|compare|industries/.test(path)) t.add("MKTG");
  if (t.size === 0) t.add("LIST");
  return [...t];
}

// ─────────────────────────────────────────────────────────────────────────
// Load nav.ts via esbuild transpile (same approach as generate-sitemap.mjs).
// ─────────────────────────────────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), "iamap-"));
const tmpFile = join(tmp, "nav.mjs");
writeFileSync(tmpFile, esbuild.transformSync(readFileSync(NAV_TS, "utf8"), { loader: "ts", format: "esm" }).code);
const nav = await import(pathToFileURL(tmpFile).href);

// Which (group) route-groups exist on disk — so the model only emits shells
// that are real (the legend shell appears here automatically once it lands).
function routeGroups() {
  const out = new Set();
  for (const name of readdirSync(APP_DIR)) {
    const m = name.match(/^\(([a-z]+)\)$/);
    if (m && statSync(join(APP_DIR, name)).isDirectory()) out.add(m[1]);
  }
  return out;
}
const GROUPS_ON_DISK = routeGroups();

// Flatten a nav group ({ items? , sections:[{ items }] }) → [{ label, href }].
function flatten(group) {
  const items = [];
  // ADR-0011: navigable group headers carry the hub href — surface it as the
  // group's lead route so dropping the echo leaf doesn't lose the hub.
  if (group.href) items.push({ label: group.label, href: group.href });
  for (const it of group.items ?? []) if (it.href) items.push({ label: it.label, href: it.href });
  for (const sec of group.sections ?? []) for (const it of sec.items ?? []) if (it.href) items.push({ label: it.label, href: it.href });
  return items;
}
const toRoutes = (items) => items.map((it) => ({ path: it.href, arch: archOf(it.href) }));
const groupFrom = (label, items) => ({ label, routes: toRoutes(items) });

// ── atlvs (platform) — the domain-noun rails + Settings. ──────────────────
const atlvsGroups = [];
for (const g of nav.platformNavDomain ?? []) atlvsGroups.push(groupFrom(g.label, flatten(g)));
if (nav.settingsNav) {
  const settingsItems = [];
  for (const g of nav.settingsNav) settingsItems.push(...flatten(g));
  if (settingsItems.length) atlvsGroups.push(groupFrom("Settings", settingsItems));
}

// ── compvss (mobile) — tabs + the tools/surfaces drawer. ──────────────────
const compvssGroups = [
  groupFrom("Tabs", (nav.mobileTabs ?? []).map((it) => ({ label: it.label, href: it.href }))),
  groupFrom("Surfaces", (nav.mobileSurfaces ?? []).map((it) => ({ label: it.label, href: it.href }))),
];

// ── gvteway (portal) — the persona homes (per-slug, per-persona). ─────────
const personas = nav.PORTAL_PERSONAS ?? [];
const gvtewayGroups = [
  ...(nav.portalConsumerNav ?? []).map((g) => groupFrom(g.label, flatten(g))),
  groupFrom(
    "Portal personas (/p/[slug]/<persona>)",
    personas.map((p) => ({ label: p, href: `/p/[slug]/${p}` })),
  ),
];

// ── marketing — header groups + primary links. ────────────────────────────
const marketingGroups = [];
for (const g of nav.marketingHeaderGroups ?? []) marketingGroups.push(groupFrom(g.label ?? "Product", flatten(g)));
if ((nav.marketingHeaderPrimaryLinks ?? []).length)
  marketingGroups.push(groupFrom("Primary", nav.marketingHeaderPrimaryLinks.map((it) => ({ label: it.label, href: it.href }))));

// ── personal (/me) — the tabs. ────────────────────────────────────────────
const personalGroups = [];
for (const g of nav.personalNavGroups ?? []) personalGroups.push(groupFrom(g.label ?? "Account", flatten(g)));

// ── legend — the promoted LEG3ND shell (ADR-0011). ────────────────────────
const legendGroups = [];
for (const g of nav.legendNav ?? []) legendGroups.push(groupFrom(g.label, flatten(g)));

// ── auth — login/signup + the token flows (static, not rail-driven). ──────
const authGroups = [
  groupFrom("Entry", [
    { label: "Login", href: nav.marketingAuthLinks?.login?.href ?? "/login" },
    { label: "Signup", href: nav.marketingAuthLinks?.signup?.href ?? "/signup" },
  ]),
];

const SHELL_GROUPS = {
  atlvs: atlvsGroups,
  gvteway: gvtewayGroups,
  compvss: compvssGroups,
  legend: legendGroups,
  marketing: marketingGroups,
  personal: personalGroups,
  auth: authGroups,
};

// Emit only shells whose route-group is on disk (legend now its own (legend) group).
const DISK_FOR_SHELL = { atlvs: "platform", gvteway: "portal", compvss: "mobile", marketing: "marketing", personal: "personal", auth: "auth", legend: "legend" };
const shells = [];
for (const [id, meta] of Object.entries(SHELL_META)) {
  const disk = DISK_FOR_SHELL[id];
  if (disk && !GROUPS_ON_DISK.has(disk)) continue; // shell not (yet) a real route-group
  const groups = SHELL_GROUPS[id] ?? [];
  shells.push({ id, ...meta, groups });
}

const model = {
  meta: {
    title: "ATLVS Ecosystem — Information Architecture",
    version: "1.0.0",
    source: "Generated from src/lib/nav.ts + the src/app route tree. Do not hand-edit — run `npm run gen:ia-map`.",
    note: "Single source of truth for the LEG3ND Architecture reference. Any platform-level nav/route change regenerates this file and the interactive map re-renders from it.",
    addressing:
      "Subdomain is the canonical public boundary; routeGroup is the internal route-group name the host-rewrite middleware maps onto (and the path-prefix fallback for preview deploys). Production URLs never double the prefix.",
  },
  archetypes: ARCHETYPES,
  newComponents: NEW_COMPONENTS,
  shells,
};

const json = JSON.stringify(model, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== json) {
    console.error(`✗ ${relative(ROOT, OUT)} is stale — run \`npm run gen:ia-map\` and commit the result.`);
    process.exit(1);
  }
  console.log(`✓ ${relative(ROOT, OUT)} is up to date.`);
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, json);
const routeCount = shells.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.routes.length, 0), 0);
console.log(`✓ ${relative(ROOT, OUT)} — ${shells.length} shells, ${routeCount} routes, ${Object.keys(ARCHETYPES).length} archetypes`);
