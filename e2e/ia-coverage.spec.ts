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

const flatItemRoutes = (items: NavItem[]): Route[] =>
  dedupe(items.map((it) => ({ label: it.label, href: it.href })));

/** Visit one route and return a failure string, or null if it rendered. */
async function probe(
  page: import("playwright/test").Page,
  route: Route,
  opts: { public?: boolean } = {},
): Promise<string | null> {
  const pageErrors: string[] = [];
  const onError = (e: Error) => pageErrors.push(e.message);
  page.on("pageerror", onError);
  try {
    const res = await page.goto(route.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (!opts.public && /\/login(\?|$)/.test(page.url())) {
      return `${route.href} → bounced to /login (auth/role gate)`;
    }
    if (status >= 400) return `${route.href} → HTTP ${status}`;
    const h1 = page.locator("h1").first();
    await expect(h1, `${route.href} has no <h1>`).toBeVisible({ timeout: 15000 });
    if (pageErrors.length) return `${route.href} → uncaught: ${pageErrors[0]}`;
    return null;
  } catch (e) {
    return `${route.href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onError);
  }
}

async function assertGroup(
  page: import("playwright/test").Page,
  label: string,
  routes: Route[],
  opts: { public?: boolean } = {},
) {
  const failures: string[] = [];
  for (const route of routes) {
    const fail = await probe(page, route, opts);
    if (fail) failures.push(fail);
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
