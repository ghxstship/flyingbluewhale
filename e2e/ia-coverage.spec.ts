/**
 * IA coverage — data-driven render smoke across the ENTIRE navigation tree.
 *
 * This spec imports the canonical nav config (src/lib/nav.ts) directly and
 * walks every list/index route the console + settings sidebars expose, so it
 * can never fall behind the IA: a new module added to `platformNavDomain`
 * is automatically asserted here the moment it ships. (nav.ts has zero
 * imports — pure data — so it loads cleanly in the Playwright runtime.)
 *
 * Covers the v4/v5/deferred expansions (Collaborate, AI/RAG corpus, meeting
 * notes, LEG3ND knowledge/signage/resources, Goals/OKRs, Sprints, function
 * diary, BEOs, reservations, store commerce, box office, discounts, the
 * marketplace host console, …) without enumerating them by hand.
 *
 * Per route we assert (kit MIGRATION.md §7 render gates):
 *   - the navigation did not bounce to /login (auth held),
 *   - the response was not a 4xx/5xx,
 *   - a real <h1> rendered (not a blank/stub shell),
 *   - no uncaught page exception fired during load.
 *
 * Grouped one test per nav group: every route in the group is visited and
 * ALL failures are collected before the assertion, so a single run surfaces
 * every broken surface in that group at once (not just the first).
 */
import { expect, test } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { platformNavDomain, settingsNav, type NavGroup } from "../src/lib/nav";

type Route = { label: string; href: string };

/** Flatten a nav group to its routes, honoring the sections-vs-items rule. */
function groupRoutes(group: NavGroup): Route[] {
  const seen = new Set<string>();
  const out: Route[] = [];
  const push = (label: string, href: string) => {
    // Only static list/index routes live in nav; skip anything dynamic.
    if (!href.startsWith("/") || href.includes("[")) return;
    if (seen.has(href)) return;
    seen.add(href);
    out.push({ label, href });
  };
  const sources = group.sections?.length ? group.sections : [{ items: group.items }];
  for (const s of sources) for (const it of s.items) push(it.label, it.href);
  return out;
}

/** Visit one route and return a failure string, or null if it rendered. */
async function probe(page: import("playwright/test").Page, route: Route): Promise<string | null> {
  const pageErrors: string[] = [];
  const onError = (e: Error) => pageErrors.push(e.message);
  page.on("pageerror", onError);
  try {
    const res = await page.goto(route.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    const url = page.url();
    if (/\/login(\?|$)/.test(url)) return `${route.href} → bounced to /login (auth/role gate)`;
    if (status >= 400) return `${route.href} → HTTP ${status}`;
    // Every real surface renders an <h1> (ModuleHeader / PageStub-free canon).
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

test.describe("IA coverage — console (platform sidebar)", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of platformNavDomain) {
    const routes = groupRoutes(group);
    if (routes.length === 0) continue;
    test(`group "${group.label}" — ${routes.length} route(s) render`, async ({ page }) => {
      const failures: string[] = [];
      for (const route of routes) {
        const fail = await probe(page, route);
        if (fail) failures.push(fail);
      }
      expect(failures, `Broken console routes in "${group.label}":\n${failures.join("\n")}`).toEqual([]);
    });
  }
});

test.describe("IA coverage — console settings", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  for (const group of settingsNav) {
    const routes = groupRoutes(group);
    if (routes.length === 0) continue;
    test(`settings "${group.label}" — ${routes.length} route(s) render`, async ({ page }) => {
      const failures: string[] = [];
      for (const route of routes) {
        const fail = await probe(page, route);
        if (fail) failures.push(fail);
      }
      expect(failures, `Broken settings routes in "${group.label}":\n${failures.join("\n")}`).toEqual([]);
    });
  }
});
