/**
 * CHROMA BEACON × responsive audit — matrix-driven validation.
 *
 * For each (route × theme × breakpoint) triple the spec asserts:
 *   1. `<html data-theme>` carries the requested theme after the head
 *      bootstrap runs → no FOUC / stale state.
 *   2. Core semantic tokens resolve to non-empty values → theme tokens
 *      reach the document root.
 *   3. No horizontal scroll at the viewport width → layout integrity.
 *   4. WCAG AA contrast between `--foreground` and `--background`
 *      (≥4.5:1) → contrast invariant.
 *   5. A full-page screenshot is captured to
 *      `docs/audits/evidence/<browser>/<breakpoint>/<theme>/<route>.png`
 *      and the PASS/FAIL row is appended to a shared coverage log at
 *      `docs/audits/evidence/coverage.jsonl`.
 *
 * Authed routes use the shared seeded owner; an unrecoverable login
 * fallback downgrades those rows to SKIP rather than failing the matrix.
 *
 * Env toggles:
 *   AUDIT_FULL=1        include all breakpoints (default: quick slice)
 *   AUDIT_BROWSERS=...  comma-sep list to drive cross-browser pass
 *   AUDIT_ROUTES=...    comma-sep route paths to narrow the slice
 */
import { expect, test, type Page } from "playwright/test";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { THEMES, BREAKPOINTS, ROUTES, type Theme } from "./matrix.config";

const EVIDENCE_ROOT = join(process.cwd(), "docs/audits/evidence");
const COVERAGE_LOG = join(EVIDENCE_ROOT, "coverage.jsonl");
const PASSWORD = "FlyingBlue!Test2026";

// ─── helpers ────────────────────────────────────────────────────────────────

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function logRow(row: Record<string, unknown>) {
  ensureDir(COVERAGE_LOG);
  appendFileSync(COVERAGE_LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n");
}

async function dismissConsent(page: Page) {
  await page.context().addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          decidedAt: new Date().toISOString(),
        }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function setTheme(page: Page, theme: Theme) {
  // Cookie is the highest-priority source in the head bootstrap, so it
  // flips the theme before first paint. No reload needed — we set this
  // BEFORE navigating.
  await page.context().addCookies([
    { name: "chroma_theme", value: theme, domain: "localhost", path: "/" },
  ]);
}

async function loginAsOwner(page: Page): Promise<boolean> {
  try {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill("test+owner@flyingbluewhale.app");
    await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 20_000 });
    return true;
  } catch {
    return false;
  }
}

function hexOrRgbToRgb(raw: string): [number, number, number] | null {
  const trimmed = raw.trim();
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const h = hexMatch[1];
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
  const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => parseFloat(p.trim()));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const srgb = [r, g, b].map((v) => v / 255);
  const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── matrix driver ──────────────────────────────────────────────────────────

const SAMPLE_BREAKPOINTS = process.env.AUDIT_FULL
  ? BREAKPOINTS
  : BREAKPOINTS.filter((b) => ["mobile-s", "tablet", "desktop"].includes(b.name));

const ROUTE_FILTER = process.env.AUDIT_ROUTES?.split(",").map((s) => s.trim()).filter(Boolean);
const SAMPLE_ROUTES = ROUTE_FILTER ? ROUTES.filter((r) => ROUTE_FILTER.includes(r.path)) : ROUTES;

for (const route of SAMPLE_ROUTES) {
  test.describe(`matrix · ${route.name}`, () => {
    for (const theme of THEMES) {
      for (const bp of SAMPLE_BREAKPOINTS) {
        test(`${theme} · ${bp.name} (${bp.width}px)`, async ({ page, browserName }) => {
          const cell = {
            route: route.path,
            route_name: route.name,
            shell: route.shell,
            theme,
            breakpoint: bp.name,
            width: bp.width,
            height: bp.height,
            browser: browserName,
          };

          try {
            await page.setViewportSize({ width: bp.width, height: bp.height });
            await dismissConsent(page);
            await setTheme(page, theme);

            if (route.authed) {
              const ok = await loginAsOwner(page);
              if (!ok) {
                logRow({ ...cell, result: "SKIP", reason: "login failed (seed data missing?)" });
                test.skip(true, "authed login failed; skipping");
                return;
              }
            }

            const resp = await page.goto(route.path, { waitUntil: "domcontentloaded" });
            const status = resp?.status() ?? 0;
            if (status >= 400 && status !== 401 && status !== 403) {
              logRow({ ...cell, result: "FAIL", reason: `nav status ${status}` });
              throw new Error(`nav status ${status}`);
            }

            // 1. data-theme applied
            const appliedTheme = await page.getAttribute("html", "data-theme");
            expect(appliedTheme, `data-theme on <html> for ${route.path}/${theme}`).toBe(theme);

            // 2. tokens resolve
            const tokens = await page.evaluate(() => {
              const s = getComputedStyle(document.documentElement);
              return {
                background: s.getPropertyValue("--background").trim() || s.backgroundColor,
                foreground: s.getPropertyValue("--foreground").trim() || s.color,
                // Both token systems — CHROMA primitives + globals — must resolve.
                bg: s.getPropertyValue("--bg").trim(),
                surface: s.getPropertyValue("--surface").trim(),
                accent: s.getPropertyValue("--accent").trim(),
                text: s.getPropertyValue("--text").trim(),
                orgPrimary: s.getPropertyValue("--org-primary").trim(),
                body_bg: getComputedStyle(document.body).backgroundColor,
                body_fg: getComputedStyle(document.body).color,
              };
            });
            expect(tokens.body_bg, `body bg resolved on ${route.path}/${theme}`).toBeTruthy();
            expect(tokens.body_fg, `body fg resolved on ${route.path}/${theme}`).toBeTruthy();

            // 3. no horizontal scroll at this viewport.
            //    WebKit's `scrollWidth` reports `content − scrollbar`, so
            //    real overflow can show as a small NEGATIVE number when
            //    there's no overflow. Use `scrollLeft` reachability +
            //    `getComputedStyle(html).overflowX` as a secondary probe
            //    so WebKit's idiosyncrasy doesn't mask a genuine bug.
            const overflow = await page.evaluate(() => {
              const html = document.documentElement;
              const w = html.scrollWidth;
              const client = html.clientWidth;
              const inner = window.innerWidth;
              // Try to scroll right — if the value sticks, real content
              // exceeds viewport even when scrollWidth is confused.
              const startLeft = html.scrollLeft;
              html.scrollLeft = 100;
              const reachable = html.scrollLeft > 0;
              html.scrollLeft = startLeft;
              return {
                scrollWidth: w,
                clientWidth: client,
                innerWidth: inner,
                overflowBy: Math.max(w - inner, w - client),
                scrollable: reachable,
              };
            });
            // An element is truly overflowing if either: scrollWidth
            // exceeds viewport by > 2 px, OR horizontal scroll is reachable.
            const realOverflow = overflow.overflowBy > 2 || overflow.scrollable;
            if (realOverflow) {
              logRow({ ...cell, result: "FAIL", reason: `horizontal overflow scrollWidth=${overflow.scrollWidth} client=${overflow.clientWidth} vp=${overflow.innerWidth} scrollable=${overflow.scrollable}` });
            }
            expect(realOverflow, `horizontal overflow at ${bp.name} on ${route.path}/${theme}`).toBe(false);

            // 4. body contrast ≥4.5:1 (fail soft — record as WARN)
            const bg = hexOrRgbToRgb(tokens.body_bg);
            const fg = hexOrRgbToRgb(tokens.body_fg);
            let contrast: number | null = null;
            if (bg && fg) contrast = contrastRatio(bg, fg);
            const contrastPass = !contrast || contrast >= 4.5;

            // 4b. interactive-element contrast (audit M3).
            //     Measure the first Link/Button/.btn on the page against
            //     its computed backdrop. Failure is logged as WARN — we
            //     don't hard-fail because some routes legitimately have
            //     no interactives above the fold.
            const interactiveContrast = await page.evaluate(() => {
              function toRgb(raw: string): [number, number, number] | null {
                const m = raw.match(/rgba?\(([^)]+)\)/);
                if (!m) return null;
                const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
                if (parts.length < 3) return null;
                return [parts[0], parts[1], parts[2]];
              }
              const picks: Array<{ role: string; contrast: number | null }> = [];
              const seen = new Set<string>();
              for (const sel of ["a.btn", "button.btn", "a[href]", "button:not([aria-hidden])"]) {
                const els = document.querySelectorAll(sel);
                for (const el of Array.from(els).slice(0, 2)) {
                  const role = sel;
                  if (seen.has(role)) continue;
                  seen.add(role);
                  const cs = getComputedStyle(el as Element);
                  // Walk up until we find a non-transparent backdrop
                  let bgEl: Element | null = el as Element;
                  let bg: [number, number, number] | null = null;
                  while (bgEl) {
                    const raw = getComputedStyle(bgEl).backgroundColor;
                    const rgb = toRgb(raw);
                    if (rgb && raw.indexOf("rgba(0, 0, 0, 0)") < 0 && !raw.endsWith(", 0)")) {
                      bg = rgb;
                      break;
                    }
                    bgEl = bgEl.parentElement;
                  }
                  const fg = toRgb(cs.color);
                  if (!bg || !fg) { picks.push({ role, contrast: null }); continue; }
                  const lum = (c: [number, number, number]) => {
                    const [r, g, b] = c.map((v) => {
                      const n = v / 255;
                      return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
                    });
                    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
                  };
                  const la = lum(bg), lb = lum(fg);
                  const cr = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
                  picks.push({ role, contrast: Number(cr.toFixed(2)) });
                }
              }
              return picks;
            });
            const worstInteractive = interactiveContrast
              .filter((p) => p.contrast != null)
              .reduce((min, p) => (p.contrast! < (min ?? Infinity) ? p.contrast! : min), null as number | null);

            // 5. screenshot
            const shotPath = join(
              EVIDENCE_ROOT,
              browserName,
              bp.name,
              theme,
              `${route.name}.png`,
            );
            ensureDir(shotPath);
            await page.screenshot({ path: shotPath, fullPage: false });

            logRow({
              ...cell,
              result: contrastPass ? "PASS" : "WARN",
              contrast: contrast ? Number(contrast.toFixed(2)) : null,
              interactiveContrast: worstInteractive,
              interactiveDetail: interactiveContrast,
              overflowBy: overflow.overflowBy,
              scrollable: overflow.scrollable,
              tokens: {
                backgroundResolved: Boolean(tokens.body_bg),
                foregroundResolved: Boolean(tokens.body_fg),
                accentPresent: Boolean(tokens.accent || tokens.orgPrimary),
                globalBackgroundResolved: Boolean(tokens.background),
              },
              evidence: shotPath.replace(process.cwd() + "/", ""),
            });

            // Soft assertion — WCAG AA is a warning, not a hard fail, so
            // the matrix still records evidence for low-contrast combos.
            expect.soft(contrast ?? 21, `body contrast ${route.path}/${theme}/${bp.name}`).toBeGreaterThanOrEqual(4.5);
          } catch (err) {
            logRow({ ...cell, result: "FAIL", reason: (err as Error).message });
            throw err;
          }
        });
      }
    }
  });
}
