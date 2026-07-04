import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  platformNavDomain,
  platformTabs,
  platformUtility,
  settingsNav,
  portalNav,
  mobileTabs,
  mobileSurfaces,
  PORTAL_PERSONAS,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";

/**
 * No-404 guard — every navigation `href` the app renders must resolve to a
 * real App Router route. A dangling nav link (a sidebar/tab entry pointing at
 * a path with no `page.tsx`) renders the 404 shell when clicked, which is the
 * exact "404 across a shell" failure this asserts against.
 *
 * Coverage is the four data-driven shells whose nav lives in src/lib/nav.ts:
 *   - ATLVS console (platformNavDomain) + console settings (settingsNav)
 *   - GVTEWAY portal (portalNav, every persona)
 *   - COMPVSS mobile (mobileTabs + mobileSurfaces)
 *
 * Marketing / auth / personal links are flat and runtime-covered by
 * routes-public-smoke + personal-self-service; this guard targets the
 * generated nav trees where a dangling href is easiest to introduce.
 */

const APP_DIR = join(process.cwd(), "src/app");
const SAMPLE_SLUG = "sample-project"; // stands in for a [slug] portal segment

/** Walk src/app → every route as a group-stripped segment array. */
function collectRoutePatterns(): string[][] {
  const patterns: string[][] = [];
  function walk(dir: string, segs: string[]) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        // Route groups `(x)` and parallel slots `@x` are transparent in the URL.
        const next = name.startsWith("(") || name.startsWith("@") ? segs : [...segs, name];
        walk(full, next);
      } else if (name === "page.tsx" || name === "page.ts") {
        patterns.push(segs);
      }
    }
  }
  walk(APP_DIR, []);
  return patterns;
}

const ROUTE_PATTERNS = collectRoutePatterns();

function isDynamic(seg: string): boolean {
  return seg.startsWith("[");
}
function isCatchAll(seg: string): boolean {
  return seg.startsWith("[...") || seg.startsWith("[[...");
}

/** Does a concrete href (segment array) match any route pattern? */
function hrefMatchesRoute(hrefSegs: string[]): boolean {
  return ROUTE_PATTERNS.some((route) => {
    for (let i = 0; i < route.length; i++) {
      if (isCatchAll(route[i]!)) return true; // matches this seg + everything after
      if (i >= hrefSegs.length) return false;
      if (!isDynamic(route[i]!) && route[i] !== hrefSegs[i]) return false;
    }
    return route.length === hrefSegs.length;
  });
}

/** Normalize an href to its path segments (strip query/hash, leading/trailing /). */
function toSegments(href: string): string[] {
  const path = href.split(/[?#]/)[0]!.replace(/\/+$/, "");
  return path.split("/").filter(Boolean);
}

/** Flatten a nav group (items + sections) to internal hrefs. */
function groupHrefs(group: NavGroup): string[] {
  const out: string[] = [];
  const push = (it: NavItem) => {
    if (it.href?.startsWith("/")) out.push(it.href);
  };
  // ADR-0011: a navigable group header carries a hub href — guard it too.
  if (group.href?.startsWith("/")) out.push(group.href);
  const sources = group.sections?.length ? group.sections : [{ items: group.items }];
  for (const s of sources) for (const it of s.items) push(it);
  return out;
}

/** Build the labelled href set for every shell. */
function allNavHrefs(): Array<{ shell: string; href: string }> {
  const out: Array<{ shell: string; href: string }> = [];
  const add = (shell: string, hrefs: string[]) => hrefs.forEach((href) => out.push({ shell, href }));

  for (const g of platformNavDomain) add("console", groupHrefs(g));
  // Kit 20 acceptance §4.2 — every second-shelf tab is a real route, and the
  // utility surfaces the verbatim rail dropped must never 404 either.
  for (const fam of platformTabs) {
    add(
      "console:tabs",
      [fam.owner, ...fam.tabs.map((t) => t.href)].filter((h) => h.startsWith("/")),
    );
  }
  add(
    "console:utility",
    platformUtility.filter((it) => it.href.startsWith("/")).map((it) => it.href),
  );
  for (const g of settingsNav) add("console:settings", groupHrefs(g));
  for (const persona of PORTAL_PERSONAS) add(`portal:${persona}`, groupHrefs(portalNav(SAMPLE_SLUG, persona)));
  add(
    "mobile",
    [...mobileTabs, ...mobileSurfaces].filter((it) => it.href?.startsWith("/")).map((it) => it.href),
  );
  return out;
}

describe("Navigation has no dangling links (no-404 guard)", () => {
  it("derives a non-trivial route + nav set", () => {
    expect(ROUTE_PATTERNS.length).toBeGreaterThan(500);
    expect(allNavHrefs().length).toBeGreaterThan(100);
  });

  it("every nav href across all shells resolves to a real route", () => {
    const offenders = allNavHrefs()
      .filter(({ href }) => !hrefMatchesRoute(toSegments(href)))
      // De-dupe (portal nav repeats hrefs across personas).
      .filter((v, i, a) => a.findIndex((x) => x.shell === v.shell && x.href === v.href) === i);

    expect(
      offenders.map((o) => `[${o.shell}] ${o.href}`),
      `Dangling nav links — these hrefs have no matching page.tsx and 404 when clicked:\n${offenders
        .map((o) => `  [${o.shell}] ${o.href}`)
        .join("\n")}`,
    ).toEqual([]);
  });
});
