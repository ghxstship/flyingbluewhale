/**
 * Full-sitemap authenticated crawl (opt-in: CRAWL=1).
 *
 * Drives a real Chromium browser, authenticated with the seeded fixture
 * matrix, across every page in the master sitemap and captures per-page
 * runtime health: HTTP status, uncaught page exceptions, console errors, and
 * error-boundary renders. Dynamic [param] routes are filled from real demo
 * data injected via CRAWL_PARAMS (JSON: { slug, ids: {paramName: value} }).
 *
 * Heavy by design — gated behind CRAWL=1 so it never runs in the normal suite.
 *   CRAWL=1 E2E_PROD=1 npx playwright test sitemap-crawl
 */
import { test, expect, type Page } from "playwright/test";
import { readdirSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { authedSetup, dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";

const CRAWL = process.env.CRAWL === "1";
const CRAWL_ORG = process.env.CRAWL_ORG; // switch the session to this org so injected IDs resolve
const APP_DIR = join(process.cwd(), "src/app");
const PARAMS: { slug?: string; ids?: Record<string, string> } = JSON.parse(process.env.CRAWL_PARAMS ?? "{}");

type Route = { shell: string; pattern: string; segs: string[] };

function walk(dir: string, segs: string[], shell: string, out: Route[]) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      let nextShell = shell;
      let nextSegs = segs;
      if (name.startsWith("(") && name.endsWith(")")) nextShell = name.slice(1, -1);
      else if (name.startsWith("@")) {
        /* parallel slot — transparent */
      } else nextSegs = [...segs, name];
      walk(full, nextSegs, nextShell, out);
    } else if (name === "page.tsx" || name === "page.ts") {
      out.push({ shell, pattern: "/" + segs.join("/"), segs });
    }
  }
}

function allRoutes(): Route[] {
  const out: Route[] = [];
  walk(APP_DIR, [], "root", out);
  return out;
}

// Valid-format placeholders so EVERY dynamic route is exercised (never skipped).
// An unmatched id/token yields a canonical notFound (a pass), not a crash.
const PLACEHOLDER_UUID = "00000000-0000-4000-8000-000000000000";
const NO_SKIP = process.env.CRAWL_NO_SKIP === "1";

/**
 * Fill [param] / [...param] segments. Resolution order:
 *   1. [slug] → PARAMS.slug
 *   2. [id]   → PARAMS.ids["@<parentSegment>"] (per-parent table id)
 *   3. [xxx]  → PARAMS.ids[xxx] (named param)
 *   4. NO_SKIP fallback: UUID for *Id/id/token-ish, else the param name —
 *      guarantees a concrete path (canonical 404 if unknown). Without NO_SKIP,
 *      returns null (route skipped) as before.
 */
function concretePath(segs: string[]): string | null {
  const ids = PARAMS.ids ?? {};
  const filled: string[] = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]!;
    if (!s.startsWith("[")) {
      filled.push(s);
      continue;
    }
    const name = s.replace(/^\[+\.*/, "").replace(/\]+$/, "");
    let val: string | undefined;
    if (name === "slug") val = PARAMS.slug;
    else if (name === "id") val = ids[`@${segs[i - 1] ?? ""}`] ?? ids.id;
    else val = ids[name];
    if (!val && NO_SKIP) {
      val = /id$|^id$|token/i.test(name) ? PLACEHOLDER_UUID : (ids[name] ?? name);
    }
    if (!val) return null;
    filled.push(val);
  }
  return "/" + filled.join("/");
}

async function probe(page: Page, path: string): Promise<string | null> {
  const errs: string[] = [];
  const onPageErr = (e: Error) => {
    const m = e.message.split("\n")[0] ?? e.message;
    // Same navigation-abort artifacts as the console filter (React Suspense/
    // hydration boundaries interrupted by the crawl's next goto).
    if (/Minified React error #41[89]|Minified React error #423|hydrat|AbortError|Failed to fetch/i.test(m)) return;
    errs.push("pageerror: " + m);
  };
  const onConsole = (m: { type: () => string; text: () => string }) => {
    if (m.type() === "error") {
      const t = m.text();
      // Ignore benign noise: favicon/resource 404s, third-party, hydration-attr,
      // and "Failed to fetch"/AbortError — these are client islands (e.g.
      // RealtimeRefresh's Supabase connection) whose in-flight request is
      // aborted when the crawl navigates to the next route. Verified as a
      // navigation artifact: the same page idle for 6s logs zero errors. Real
      // API failures resolve with response.ok=false (covered by api-* specs).
      // React #418/#419/#423 are hydration/Suspense-boundary errors that fire
      // when the crawl navigates away mid-stream — verified benign (isolated
      // load of the same route is a clean 200, zero pageerrors).
      if (
        /favicon|net::ERR|Failed to load resource|preload|hydrat|Failed to fetch|AbortError|Minified React error #41[89]|Minified React error #423/i.test(
          t,
        )
      )
        return;
      errs.push("console: " + t.slice(0, 140));
    }
  };
  page.on("pageerror", onPageErr);
  page.on("console", onConsole);
  try {
    const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (status >= 500) return `${path} → HTTP ${status}`;
    if (status === 404) return `${path} → 404`;
    // Error boundary / crash text.
    const body = (await page.locator("body").innerText().catch(() => "")).slice(0, 2000);
    if (/application error|something went wrong|unhandled runtime|digest:/i.test(body))
      return `${path} → error boundary rendered`;
    if (errs.length) return `${path} → ${errs[0]}`;
    return null;
  } catch (e) {
    return `${path} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onPageErr);
    page.off("console", onConsole);
  }
}

// Shell → fixture persona to authenticate as.
const SHELL_PERSONA: Record<string, string | null> = {
  platform: "owner",
  personal: "owner",
  mobile: "crew",
  portal: "owner", // owner has full org access; [slug] supplied via CRAWL_PARAMS
  marketing: null, // anonymous
  auth: null,
};

const ROUTES = allRoutes();

for (const shell of ["platform", "personal", "mobile", "portal", "marketing"]) {
  const persona = SHELL_PERSONA[shell];
  const routes = ROUTES.filter((r) => r.shell === shell);

  test.describe(`crawl · ${shell} (${routes.length} routes)`, () => {
    test.skip(!CRAWL, "opt-in: set CRAWL=1");
    test.describe.configure({ timeout: 1_800_000 });

    test(`${shell} pages render without runtime errors`, async ({ page }) => {
      if (persona && CRAWL_ORG) {
        await dismissConsent(page);
        await loginAndSwitchWorkspace(page, persona, CRAWL_ORG);
      } else if (persona) await authedSetup(page, persona);
      const findings: string[] = [];
      let crawled = 0;
      let skipped = 0;
      for (const r of routes) {
        const path = concretePath(r.segs);
        if (path === null) {
          skipped++;
          continue;
        }
        crawled++;
        const f = await probe(page, path);
        if (f) findings.push(f);
      }
      console.log(`[crawl:${shell}] crawled=${crawled} skipped(unresolved-dynamic)=${skipped} findings=${findings.length}`);
      const out = process.env.CRAWL_FINDINGS_FILE;
      if (out) appendFileSync(out, findings.map((f) => `[${shell}] ${f}`).join("\n") + (findings.length ? "\n" : ""));
      for (const f of findings) console.log(`  FINDING ${f}`);
      expect(findings, `Runtime findings in ${shell}:\n${findings.join("\n")}`).toEqual([]);
    });
  });
}
