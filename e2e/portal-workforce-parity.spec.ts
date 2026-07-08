/**
 * Render guard for the workforce-parity surfaces backfilled into the portal
 * crew + vendor personas (ADR-0008 Moves 2/3, commit 73f9844): the desktop
 * crew/vendor user gets the full feed/chat/kudos/learning/docs/directory/
 * schedule/time-off workflow without installing the COMPVSS PWA.
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
const SHARED = ["feed", "chat", "kudos", "docs", "directory", "schedule", "time-off"] as const;
// Persona-specific extras.
const CREW_ONLY = ["learning"] as const;

type Probe = { persona: "crew" | "vendor"; surface: string };

const PROBES: Probe[] = [
  ...SHARED.map((s) => ({ persona: "crew" as const, surface: s })),
  ...CREW_ONLY.map((s) => ({ persona: "crew" as const, surface: s })),
  ...SHARED.map((s) => ({ persona: "vendor" as const, surface: s })),
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
    const body = (await page.locator("body").innerText().catch(() => "")).slice(0, 1500);
    if (/application error|unhandled runtime|digest:/i.test(body)) return `${href} → error boundary rendered`;
    if (errs.length) return `${href} → uncaught: ${errs[0]}`;
    return null;
  } catch (e) {
    return `${href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onErr);
  }
}

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
