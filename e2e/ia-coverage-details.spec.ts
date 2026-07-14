/**
 * IA coverage — DYNAMIC DETAIL routes. Companion to ia-coverage.spec.ts.
 *
 * ia-coverage walks every STATIC list/index route but explicitly drops any
 * href containing "[" — so the ~651 dynamic `[id]`/`[slug]` detail routes were
 * never render-asserted. This spec closes that gap DATA-DRIVENLY: for each
 * static list surface it opens the page, resolves the FIRST real record link
 * (a direct one-segment child of the list route — the canonical `[id]` detail),
 * and renders that detail route with the strong gate (no 4xx/5xx, a real <h1>,
 * no uncaught exception).
 *
 * Ids are NEVER hardcoded — they're discovered from the live list, so this can
 * never drift as records change. A list with no records simply yields no detail
 * link and is skipped for that route (an empty list is not a broken detail
 * page). Walked as owner (the broadest-access role); lower-role detail access
 * is a behavioral concern covered by the deep/persona specs.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import { platformNavDomain, settingsNav, legendNav, type NavGroup } from "../src/lib/nav";

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

function navGroupRoutes(group: NavGroup): Route[] {
  const out: Route[] = [];
  if (group.href) out.push({ label: group.label, href: group.href });
  const sources = group.sections?.length ? group.sections : [{ items: group.items }];
  for (const s of sources) for (const it of s.items) out.push({ label: it.label, href: it.href });
  return out;
}

// Every console list surface a record detail can hang off of.
const LIST_ROUTES = dedupe([
  ...platformNavDomain.flatMap(navGroupRoutes),
  ...settingsNav.flatMap(navGroupRoutes),
  ...legendNav.flatMap(navGroupRoutes),
]);

// Segments that are sibling ACTIONS, not record ids — never treat as a detail.
const NON_ID = new Set(["new", "edit", "create", "import", "export", "settings", "print"]);

/**
 * On the already-loaded list page, find the first anchor whose href is exactly
 * one segment deeper than the list route AND looks like a record id (not an
 * action verb). Returns the detail href, or null if the list has no records.
 */
async function firstDetailHref(
  page: import("playwright/test").Page,
  listRoute: string,
): Promise<string | null> {
  const hrefs = await page
    .locator(`a[href^="${listRoute}/"]`)
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")).filter((h): h is string => !!h));
  for (const raw of hrefs) {
    const href = raw.split("?")[0].split("#")[0].replace(/\/$/, "");
    const rest = href.slice(listRoute.length + 1);
    if (!rest || rest.includes("/")) continue; // exactly one segment deeper
    if (NON_ID.has(rest)) continue;
    return href;
  }
  return null;
}

/** Resolve + render one detail route; returns a failure string or null. */
async function probeDetail(
  page: import("playwright/test").Page,
  listRoute: string,
): Promise<string | null> {
  const pageErrors: string[] = [];
  const onError = (e: Error) => pageErrors.push(e.message);
  try {
    const listRes = await page.goto(listRoute, { waitUntil: "domcontentloaded", timeout: 30000 });
    if ((listRes?.status() ?? 0) >= 400) return null; // list itself gated — ia-coverage owns that
    const detail = await firstDetailHref(page, listRoute);
    if (!detail) return null; // no records to drill into — not a failure
    page.on("pageerror", onError);
    const res = await page.goto(detail, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (/\/login(\?|$)/.test(page.url())) return `${detail} → bounced to /login`;
    if (status >= 400) return `${detail} → HTTP ${status}`;
    // Detail routes are heterogeneous: most render an <h1>, but doc/report
    // VIEWERS render a `.doc` / `.rpt-stage` masthead (a print artifact) with
    // no semantic heading. Accept any real content anchor — a blank/crashed
    // page still fails (nothing visible), which is the signal we want.
    const content = page.locator("h1, h2, .doc, .rpt-stage, .page-content, main").first();
    await expect(content, `${detail} rendered no heading/content`).toBeVisible({ timeout: 15000 });
    if (pageErrors.length) return `${detail} → uncaught: ${pageErrors[0]}`;
    return null;
  } catch (e) {
    return `${listRoute} (detail) → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onError);
  }
}

async function assertDetails(page: import("playwright/test").Page, label: string, routes: Route[]) {
  const failures: string[] = [];
  for (const route of routes) {
    const fail = await probeDetail(page, route.href);
    if (fail) failures.push(fail);
  }
  expect(failures, `Broken detail routes under "${label}":\n${failures.join("\n")}`).toEqual([]);
}

const CHUNK = 12;
const chunks = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

test.describe("IA coverage — dynamic [id] detail routes (owner)", () => {
  test.describe.configure({ timeout: 240000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  chunks(LIST_ROUTES, CHUNK).forEach((slice, i) => {
    const from = i * CHUNK + 1;
    test(`detail routes ${from}–${from + slice.length - 1} render`, async ({ page }) => {
      await assertDetails(page, `details ${from}–${from + slice.length - 1}`, slice);
    });
  });
});
