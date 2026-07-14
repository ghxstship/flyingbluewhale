/**
 * IA coverage — ROLE MATRIX. The companion to ia-coverage.spec.ts.
 *
 * ia-coverage crawls the entire navigation tree of every shell as ONE role
 * (owner) and asserts the strong render gate (h1 present, no bounce). That
 * proves the happy path renders, but it never exercises the surface as a
 * LOWER-privilege role — so an RBAC mistake that 500s a console page for an
 * admin/controller/collaborator (instead of cleanly gating it) would ship
 * unseen.
 *
 * This spec re-walks the SAME canonical nav trees (src/lib/nav.ts) as every
 * non-owner internal role, plus /me and /m as the field/external roles, with a
 * deliberately ROLE-AWARE assertion:
 *
 *   A lower role hitting a surface it isn't entitled to may LEGITIMATELY be
 *   gated — a clean 4xx, a redirect to /login or /studio, or a rendered
 *   "no access" empty state are all CORRECT. What is NEVER correct is a hard
 *   failure: an HTTP 5xx, or an uncaught client exception (a crashed render).
 *
 * So the failure rule here is "no role may CRASH any surface" — defence-in-
 * depth on RBAC. (The owner render gate stays in ia-coverage; tenant breadth
 * is in multitenant-matrix.spec.ts.)
 *
 * Seeded fixtures (see roles.spec.ts): every user is a member of every test
 * org; internal roles are developer/owner/admin/controller/collaborator, field
 * are crew/contractor, external are client/viewer/community.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";
import {
  platformNavDomain,
  settingsNav,
  legendNav,
  mobileTabs,
  mobileSurfaces,
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

function navGroupRoutes(group: NavGroup): Route[] {
  const out: Route[] = [];
  if (group.href) out.push({ label: group.label, href: group.href });
  const sources = group.sections?.length ? group.sections : [{ items: group.items }];
  for (const s of sources) for (const it of s.items) out.push({ label: it.label, href: it.href });
  return out;
}

const flatItemRoutes = (items: NavItem[]): Route[] => items.map((it) => ({ label: it.label, href: it.href }));

/**
 * Visit a route and return a failure string ONLY for a HARD error (5xx or an
 * uncaught client exception). 4xx, /login or /studio redirects, and rendered
 * empty states are all acceptable for a role that lacks entitlement.
 */
// A deployed target under parallel load aborts/times-out some navigations (load
// shedding, not a render failure). Retry the goto once on that signature so the
// "no role crashes any surface" assertion stays about real 5xx/crashes.
const THROTTLE = /ERR_ABORTED|ERR_NETWORK_CHANGED|ERR_CONNECTION|Timeout|interrupted/i;
async function gotoResilient(page: import("playwright/test").Page, href: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === 0 && THROTTLE.test(msg)) {
        await page.waitForTimeout(800);
        continue;
      }
      throw e;
    }
  }
  return null;
}

async function probeNoCrash(page: import("playwright/test").Page, route: Route): Promise<string | null> {
  const pageErrors: string[] = [];
  const onError = (e: Error) => pageErrors.push(e.message);
  page.on("pageerror", onError);
  try {
    const res = await gotoResilient(page, route.href);
    const status = res?.status() ?? 0;
    if (status >= 500) return `${route.href} → HTTP ${status}`;
    // Give a client-side error boundary a beat to throw after DOM-ready.
    await page.waitForTimeout(250);
    if (pageErrors.length) return `${route.href} → uncaught: ${pageErrors[0]}`;
    return null;
  } catch (e) {
    return `${route.href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onError);
  }
}

async function assertNoCrash(page: import("playwright/test").Page, label: string, routes: Route[]) {
  const failures: string[] = [];
  for (const route of routes) {
    const fail = await probeNoCrash(page, route);
    if (fail) failures.push(fail);
  }
  expect(failures, `Surfaces that CRASHED (5xx / uncaught) for "${label}":\n${failures.join("\n")}`).toEqual([]);
}

// The full console surface (platform sidebar + settings + LEG3ND), flattened
// and deduped once — the union a privileged internal role could reach.
const CONSOLE_ROUTES = dedupe([
  ...platformNavDomain.flatMap(navGroupRoutes),
  ...settingsNav.flatMap(navGroupRoutes),
  ...legendNav.flatMap(navGroupRoutes),
]);

const CHUNK = 15;
const chunks = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ── Console surface as EVERY non-owner role ──────────────────────────────────
// owner is already covered (strong gate) by ia-coverage.spec.ts. This walks the
// full console union as every other seeded persona — internal, field, AND
// external — so the "no role crashes any surface" gate holds for the complete
// persona set (not just the three privileged internal roles it started with).
// Lower/external roles will legitimately be gated on most console routes (4xx /
// redirect / empty state — all PASS); only a 5xx or uncaught crash fails.
const CONSOLE_ROLES = [
  "developer",
  "admin",
  "controller",
  "collaborator",
  "contractor",
  "crew",
  "client",
  "viewer",
  "community",
] as const;
for (const role of CONSOLE_ROLES) {
  test.describe(`IA role-matrix — console as ${role}`, () => {
    test.describe.configure({ timeout: 180000 });
    test.beforeEach(async ({ page }) => authedSetup(page, role));

    chunks(CONSOLE_ROUTES, CHUNK).forEach((slice, i) => {
      const from = i * CHUNK + 1;
      test(`${role}: console routes ${from}–${from + slice.length - 1} never crash`, async ({ page }) => {
        await assertNoCrash(page, `${role} console ${from}–${from + slice.length - 1}`, slice);
      });
    });
  });
}

// ── Personal (/me) as field + external roles (per-user, should serve anyone) ──
const ME_ROUTES = dedupe(personalNavGroups.flatMap((g) => g.items.map((it) => ({ label: it.fallback, href: it.href }))));
// /me is per-user and must serve ANY authenticated persona — walk it as every
// seeded role (owner is covered by ia-coverage's strong gate).
for (const role of ["admin", "controller", "collaborator", "contractor", "crew", "client", "viewer", "community"] as const) {
  test.describe(`IA role-matrix — /me as ${role}`, () => {
    test.describe.configure({ timeout: 120000 });
    test.beforeEach(async ({ page }) => authedSetup(page, role));
    test(`${role}: ${ME_ROUTES.length} personal route(s) never crash`, async ({ page }) => {
      await assertNoCrash(page, `${role} /me`, ME_ROUTES);
    });
  });
}

// ── Mobile (/m, COMPVSS field) as every deskless field role ───────────────────
const MOBILE_ROUTES = dedupe([...flatItemRoutes(mobileTabs), ...flatItemRoutes(mobileSurfaces)]);
for (const role of ["crew", "contractor"] as const) {
  test.describe(`IA role-matrix — mobile (/m) as ${role}`, () => {
    test.describe.configure({ timeout: 240000 });
    test.beforeEach(async ({ page }) => authedSetup(page, role));
    chunks(MOBILE_ROUTES, CHUNK).forEach((slice, i) => {
      const from = i * CHUNK + 1;
      test(`${role}: mobile surfaces ${from}–${from + slice.length - 1} never crash`, async ({ page }) => {
        await assertNoCrash(page, `${role} /m ${from}–${from + slice.length - 1}`, slice);
      });
    });
  });
}
