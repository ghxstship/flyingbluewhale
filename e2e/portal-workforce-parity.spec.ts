/**
 * Render guard for the workforce-parity surfaces backfilled into the portal
 * crew + vendor personas (ADR-0008 Moves 2/3, commit 73f9844): the desktop
 * crew/vendor user gets the feed/chat/learning/docs/directory/schedule/time-off
 * workflow without installing the COMPVSS PWA.
 *
 * Kudos was removed from both personas 2026-07-15 — peer recognition is
 * org-internal COMPVSS/crew tooling (it renders in `/m/feed`) and had no
 * business being writable by external counterparties from the portal.
 *
 * These live under `/p/[slug]/<persona>/*` — DYNAMIC routes that the
 * data-driven `ia-coverage` sweep skips (it only walks static hrefs). The
 * existing `portal.spec` covers a couple of legacy persona subpages; this
 * fills in the eight new shared surfaces per persona.
 *
 * Owner login: an owner can view any persona portal within their org. We
 * assert the route never 5xx's and the (portal) error boundary did not render
 * (some surfaces may legitimately empty-state or 404 for the demo slug, so we
 * accept < 500 rather than demanding a 200).
 */
import { expect, test, type Page } from "./helpers/base";
import { dismissConsent, loginAs } from "./helpers/auth";

const PROJECT_SLUG = "test-professional-show";

// Shared workforce-parity surfaces present on BOTH crew and vendor rails.
const SHARED = ["feed", "chat", "docs", "directory", "schedule", "time-off"] as const;
// Persona-specific extras.
const CREW_ONLY = ["learning"] as const;
// Portal-native WRITE forms (ADR-0008 Amendment 4). These are the surfaces the
// portal used to deep-link into `/m/**` for — the read was on desktop and the
// write was in a PWA the vendor persona has no entitlement to open at all.
// They exist on both rails and are the whole point of the amendment, so they
// get the same render gate as the reads.
const WRITE_FORMS = ["time-off/new", "docs/new"] as const;

type Probe = { persona: "crew" | "vendor"; surface: string };

const PROBES: Probe[] = [
  ...SHARED.map((s) => ({ persona: "crew" as const, surface: s })),
  ...CREW_ONLY.map((s) => ({ persona: "crew" as const, surface: s })),
  ...WRITE_FORMS.map((s) => ({ persona: "crew" as const, surface: s })),
  ...SHARED.map((s) => ({ persona: "vendor" as const, surface: s })),
  ...WRITE_FORMS.map((s) => ({ persona: "vendor" as const, surface: s })),
];

async function check(page: Page, p: Probe): Promise<string | null> {
  const href = `/p/${PROJECT_SLUG}/${p.persona}/${p.surface}`;
  const errs: string[] = [];
  const onErr = (e: Error) => errs.push(e.message.split("\n")[0] ?? e.message);
  page.on("pageerror", onErr);
  try {
    const res = await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (status >= 500) return `${href} → HTTP ${status}`;
    const body = (
      await page
        .locator("body")
        .innerText()
        .catch(() => "")
    ).slice(0, 1500);
    if (/application error|unhandled runtime|digest:/i.test(body)) return `${href} → error boundary rendered`;
    if (errs.length) return `${href} → uncaught: ${errs[0]}`;
    return null;
  } catch (e) {
    return `${href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onErr);
  }
}

test.describe("portal — the shell contract (ADR-0008 Amendment 4)", () => {
  test.describe.configure({ timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  // The `shell-contract` vitest guard proves no portal SOURCE file spells a
  // `/m/**` href. This proves the rendered DOM agrees — a link could still
  // arrive via a shared component's prop, which source-grepping can't see.
  test("no rendered portal workforce surface links into the COMPVSS /m shell", async ({ page }) => {
    const offenders: string[] = [];
    for (const p of PROBES) {
      const href = `/p/${PROJECT_SLUG}/${p.persona}/${p.surface}`;
      await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });
      // The one legitimate exception is the crew clock-in signpost, which is
      // asserted on purpose in the next test.
      const mobileLinks = await page
        .locator('a[href^="/m/"]:not([href="/m/clock"])')
        .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""));
      if (mobileLinks.length) offenders.push(`${href} → ${[...new Set(mobileLinks)].join(", ")}`);
    }
    expect(offenders, `Portal surfaces rendered links into COMPVSS:\n${offenders.join("\n")}`).toEqual([]);
  });

  test("vendor is never pointed at COMPVSS; crew gets the clock-in signpost", async ({ page }) => {
    // Vendor: the `partner` band is {gvteway: full, cvrgo: ro} — no COMPVSS
    // reach at all, so advertising the punch would link them into a locked
    // door. This is the sharper half of the defect the amendment closed.
    await page.goto(`/p/${PROJECT_SLUG}/vendor/schedule`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.locator('a[href="/m/clock"]')).toHaveCount(0);

    // Crew: entitled to COMPVSS, so the punch is signposted rather than
    // hidden — the portal is honest about where the geofenced punch lives
    // instead of shipping a worse one on desktop.
    await page.goto(`/p/${PROJECT_SLUG}/crew/schedule`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.locator('a[href="/m/clock"]')).toHaveCount(1);
  });
});

test.describe("portal — crew/vendor workforce-parity surfaces render", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
  });

  test("all backfilled crew + vendor surfaces render without 5xx/error boundary", async ({ page }) => {
    const failures: string[] = [];
    for (const p of PROBES) {
      const fail = await check(page, p);
      if (fail) failures.push(fail);
    }
    expect(failures, `Broken portal workforce-parity surfaces:\n${failures.join("\n")}`).toEqual([]);
  });
});
