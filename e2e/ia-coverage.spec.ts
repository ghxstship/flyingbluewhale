/**
 * IA coverage — data-driven render smoke across the ENTIRE navigation tree of
 * EVERY shell. This spec imports the canonical nav config (src/lib/nav.ts)
 * directly and walks every static list/index route each shell's nav exposes,
 * so it can never fall behind the IA: a new module added to any nav tree is
 * automatically asserted here the moment it ships. (nav.ts has zero imports —
 * pure data — so it loads cleanly in the Playwright runtime.)
 *
 * Shells covered (full codebase coverage):
 *   - marketing  (public)            — marketingHeaderGroups + marketingFooterGroups
 *   - platform   (/studio, authed)   — platformNavDomain
 *   - settings   (/studio/settings)  — settingsNav
 *   - legend     (/legend, authed)   — legendNav
 *   - personal   (/me, authed)       — personalNavGroups
 *   - portal     (/p, authed)        — portalConsumerNav
 *   - mobile     (/m, authed)        — mobileTabs + mobileSurfaces
 *
 * Per route we assert (kit MIGRATION.md §7 render gates):
 *   - the navigation did not bounce to /login (auth held; skipped for public),
 *   - the response was not a 4xx/5xx,
 *   - a real <h1> rendered (not a blank/stub shell),
 *   - no uncaught page exception fired during load.
 *
 * Grouped one test per nav group: every route in the group is visited and ALL
 * failures are collected before the assertion, so a single run surfaces every
 * broken surface in that group at once (not just the first).
 */
import { expect, test } from "./helpers/base";
import { authedSetup, dismissConsent } from "./helpers/auth";
import {
  platformNavDomain,
  settingsNav,
  legendNav,
  mobileTabs,
  mobileSurfaces,
  marketingHeaderGroups,
  marketingFooterGroups,
  personalNavGroups,
  portalConsumerNav,
  type NavGroup,
  type NavItem,
} from "../src/lib/nav";

type Route = { label: string; href: string };

const isStatic = (href: string | undefined): href is string =>
  !!href && href.startsWith("/") && !href.includes("[") && !href.includes("#");

function dedupe(routes: Route[]): Route[] {
  const seen = new Set<string>();
  const out: Route[] = [];
  for (const r of routes) {
    if (!isStatic(r.href) || seen.has(r.href)) continue;
    seen.add(r.href);
    out.push(r);
  }
  return out;
}

/** Flatten a NavGroup (sections-or-items) to its static routes. */
function navGroupRoutes(group: NavGroup): Route[] {
  const out: Route[] = [];
  if (group.href) out.push({ label: group.label, href: group.href });
  const sources = group.sections?.length ? group.sections : [{ items: group.items }];
  for (const s of sources) for (const it of s.items) out.push({ label: it.label, href: it.href });
  return dedupe(out);
}

const flatItemRoutes = (items: NavItem[]): Route[] => dedupe(items.map((it) => ({ label: it.label, href: it.href })));

/** An uncaught page exception, tagged with the URL the page was actually on
 *  when it fired. */
type PageError = { url: string; message: string };

/**
 * Record uncaught exceptions for a whole group, tagging each with `page.url()`
 * at fire time.
 *
 * Why not a listener per route: `probe()` returns as soon as the route hits
 * `domcontentloaded` + paints an <h1> — which is BEFORE hydration finishes. A
 * route's hydration error therefore often fires while the NEXT route's goto is
 * already in flight. A per-route listener charges that error to whichever probe
 * happens to hold the listener, so the blame lands on the neighbouring route
 * (and the LAST route's errors were dropped entirely — nothing was listening).
 * Tagging at fire time and reconciling once, after the group has settled, puts
 * every error on the route that actually produced it.
 *
 * This is not hypothetical: a `/p/community` "router-init race" was chased at
 * length on the strength of a single mis-attributed sighting that never
 * reproduced. See the memory note "Portal consumer e2e gap".
 */
function recordPageErrors(page: import("playwright/test").Page): {
  errors: PageError[];
  dispose: () => void;
} {
  const errors: PageError[] = [];
  const onError = (e: Error) => errors.push({ url: page.url(), message: e.message });
  page.on("pageerror", onError);
  return { errors, dispose: () => page.off("pageerror", onError) };
}

/** Resolve a fire-time URL back to the group's route that owns it. */
function attribute(url: string, routes: Route[]): string {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return url;
  }
  // Longest match wins so a shallow href doesn't swallow a deeper one when a
  // group carries both.
  const hit = routes
    .filter((r) => pathname === r.href || pathname.startsWith(`${r.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return hit ? hit.href : url;
}

/**
 * Visit one route and return a failure string, or null if it rendered.
 * Uncaught exceptions are NOT checked here — see `recordPageErrors`; the group
 * reconciles them once at the end, by fire-time URL.
 */
async function probe(
  page: import("playwright/test").Page,
  route: Route,
  opts: { public?: boolean } = {},
): Promise<string | null> {
  try {
    const res = await page.goto(route.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (!opts.public && /\/login(\?|$)/.test(page.url())) {
      return `${route.href} → bounced to /login (auth/role gate)`;
    }
    if (status >= 400) return `${route.href} → HTTP ${status}`;
    const h1 = page.locator("h1").first();
    await expect(h1, `${route.href} has no <h1>`).toBeVisible({ timeout: 15000 });
    return null;
  } catch (e) {
    return `${route.href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  }
}

async function assertGroup(
  page: import("playwright/test").Page,
  label: string,
  routes: Route[],
  opts: { public?: boolean } = {},
) {
  const failures: string[] = [];
  const recorder = recordPageErrors(page);
  try {
    for (const route of routes) {
      const fail = await probe(page, route, opts);
      if (fail) failures.push(fail);
    }
    // Let the final route finish hydrating before draining, so its late errors
    // are seen at all rather than racing the end of the test.
    await page.waitForLoadState("load").catch(() => {});
    for (const err of recorder.errors) {
      failures.push(`${attribute(err.url, routes)} → uncaught: ${err.message}`);
    }
  } finally {
    recorder.dispose();
  }
  expect(failures, `Broken routes in "${label}":\n${failures.join("\n")}`).toEqual([]);
}

// ── Marketing (public, no auth) ──────────────────────────────────────────────
test.describe("IA coverage — marketing (public)", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => dismissConsent(page));

  const marketing = dedupe([
    ...marketingHeaderGroups.flatMap((g) => g.items.map((it) => ({ label: it.labelKey, href: it.href }))),
    ...marketingFooterGroups.flatMap((g) => g.items.map((it) => ({ label: it.labelKey, href: it.href }))),
  ]);
  test(`marketing — ${marketing.length} public route(s) render`, async ({ page }) => {
    await assertGroup(page, "marketing", marketing, { public: true });
  });
});

// ── Console platform (/studio, authed) ───────────────────────────────────────
test.describe("IA coverage — console (platform sidebar)", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of platformNavDomain) {
    const routes = navGroupRoutes(group);
    if (routes.length === 0) continue;
    test(`group "${group.label}" — ${routes.length} route(s) render`, async ({ page }) => {
      await assertGroup(page, group.label, routes);
    });
  }
});

// ── Console settings (/studio/settings, authed) ──────────────────────────────
test.describe("IA coverage — console settings", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of settingsNav) {
    const routes = navGroupRoutes(group);
    if (routes.length === 0) continue;
    test(`settings "${group.label}" — ${routes.length} route(s) render`, async ({ page }) => {
      await assertGroup(page, group.label, routes);
    });
  }
});

// ── LEG3ND shell (/legend, authed) ───────────────────────────────────────────
test.describe("IA coverage — LEG3ND (legend shell)", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of legendNav) {
    const routes = navGroupRoutes(group);
    if (routes.length === 0) continue;
    test(`legend "${group.label}" — ${routes.length} route(s) render`, async ({ page }) => {
      await assertGroup(page, group.label, routes);
    });
  }
});

// ── Personal (/me, authed) ───────────────────────────────────────────────────
test.describe("IA coverage — personal (/me)", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of personalNavGroups) {
    const routes = dedupe(group.items.map((it) => ({ label: it.fallback, href: it.href })));
    if (routes.length === 0) continue;
    test(`me "${group.fallback}" — ${routes.length} route(s) render`, async ({ page }) => {
      await assertGroup(page, group.fallback, routes);
    });
  }
});

// ── Portal consumer (/p, authed) ─────────────────────────────────────────────
// The slug-free GVTEWAY consumer surfaces (RESERVED_PORTAL_SEGMENTS): discover,
// onsite, community, scenes, lists, saved, account, welcome. `/p/onsite` was
// rehomed here from the COMPVSS tab bar 2026-07-15 — this block is now its only
// coverage.
test.describe("IA coverage — portal consumer (GVTEWAY /p)", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of portalConsumerNav) {
    const routes = navGroupRoutes(group);
    if (routes.length === 0) continue;
    test(`portal "${group.label}" — ${routes.length} route(s) render`, async ({ page }) => {
      await assertGroup(page, group.label, routes);
    });
  }
});

// ── Mobile (/m, authed) ──────────────────────────────────────────────────────
test.describe("IA coverage — mobile (COMPVSS /m)", () => {
  test.describe.configure({ timeout: 240000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  const mobile = dedupe([...flatItemRoutes(mobileTabs), ...flatItemRoutes(mobileSurfaces)]);
  // Split into chunks so a single test isn't unboundedly long.
  const CHUNK = 12;
  for (let i = 0; i < mobile.length; i += CHUNK) {
    const slice = mobile.slice(i, i + CHUNK);
    test(`mobile surfaces ${i + 1}–${i + slice.length} render`, async ({ page }) => {
      await assertGroup(page, `mobile ${i + 1}–${i + slice.length}`, slice);
    });
  }
});
