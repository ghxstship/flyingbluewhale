import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Hardcoded-href guard (COMPVSS mobile parity audit, D5 / S9).
 *
 * The sitemap ratchet (`sitemap.test.ts`) reconciles the filesystem against
 * `nav.ts`. That is the right check for nav-reachable routes, but it is blind
 * to hrefs typed directly into a component — so `/m/expenses` and `/m/swaps`
 * shipped on the COMPVSS home screen as quick-action tiles, visible to every
 * role, and 404'd for months without tripping CI.
 *
 * This guard closes that hole from the other side: every internal `/m/...`
 * href literal in an app or component source file must resolve to a real
 * route directory containing a `page.tsx` (or a `route.ts` handler, for
 * redirect targets).
 *
 * Scope is deliberately the mobile tree — it is the shell with a flat, fully
 * enumerable route space and no dynamic route composition. Widen later if the
 * pattern proves itself.
 */
const ROOT = process.cwd();
const MOBILE_ROOT = join(ROOT, "src/app/(mobile)");

/**
 * Hrefs that legitimately have no page of their own. Keep this list short and
 * always give a reason — an entry here is an assertion that a human checked.
 */
const EXEMPT: { path: string; reason: string }[] = [
  // (none today — every /m href resolves)
];

const SKIP = [/\.test\.(ts|tsx)$/, /(^|\/)__tests__\//];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Resolve a `/m/...` href to a route directory, tolerating dynamic segments.
 * `/m/tasks/abc` matches `m/tasks/[taskId]`. Query strings and hashes are
 * stripped before matching.
 */
function routeExists(href: string): boolean {
  const clean = (href.split("?")[0] ?? "").split("#")[0]?.replace(/\/$/, "") ?? "";
  const segments = clean.split("/").filter(Boolean); // ["m", "tasks", ...]
  let dir = join(ROOT, "src/app/(mobile)");
  for (const seg of segments) {
    const literal = join(dir, seg);
    if (existsSync(literal)) {
      dir = literal;
      continue;
    }
    // Fall back to a dynamic segment at this level ([id], [...slug]).
    const dynamic = readdirSync(dir, { withFileTypes: true }).find((e) => e.isDirectory() && e.name.startsWith("["));
    if (!dynamic) return false;
    dir = join(dir, dynamic.name);
  }
  return existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "route.ts"));
}

describe("mobile component hrefs resolve to real routes", () => {
  const files = walk(MOBILE_ROOT).filter((f) => !SKIP.some((re) => re.test(relative(ROOT, f))));

  // href="/m/..." and href={"/m/..."} and plain "/m/..." string literals used
  // as link targets. Template literals with interpolation are skipped — they
  // are dynamic by construction and can't be statically resolved.
  const HREF = /href=\{?["'`](\/m(?:\/[a-zA-Z0-9._-]+)*)["'`]\}?/g;

  const offenders: string[] = [];

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const match of src.matchAll(HREF)) {
      const href = match[1];
      if (!href) continue;
      if (EXEMPT.some((e) => e.path === href)) continue;
      if (!routeExists(href)) {
        offenders.push(`${relative(ROOT, file)} → ${href}`);
      }
    }
  }

  it("has no href pointing at a route that does not exist", () => {
    expect(
      offenders,
      offenders.length
        ? `Hardcoded href(s) with no matching route — these 404 at runtime:\n  ${offenders.join(
            "\n  ",
          )}\n\nEither build the route, repoint the href, or add it to EXEMPT with a reason.`
        : undefined,
    ).toEqual([]);
  });
});
