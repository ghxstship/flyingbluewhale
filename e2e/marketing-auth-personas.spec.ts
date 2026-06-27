/**
 * Marketing (anon visitor) + Auth shells — Phase 5 (final) supporting-shell
 * coverage (mirrors the STYLE of `e2e/atlvs-console-personas.spec.ts` et al).
 *
 * The marketing + auth shells have no role/persona axis — the persona is the
 * UNAUTHENTICATED VISITOR. Broad render coverage already lives in
 * `e2e/marketing.spec.ts` + `e2e/ia-coverage.spec.ts` (full nav-tree sweep) and
 * `e2e/auth.spec.ts` (form render + show/hide + validation); this spec is
 * deliberately LIGHT and adds only the gaps those don't cover:
 *
 *   MARKETING — the conversion JOURNEYS, not another render sweep:
 *     · home → /signup CTA (the hero "Start building free" click navigates)
 *     · /pricing → /signup (a tier CTA routes to signup)
 *     · /compare/[competitor] detail renders for a canonical competitor
 *     · /solutions/<product> renders for each of the four product pages
 *
 *   AUTH — the round-trip the render-only auth.spec.ts can't do:
 *     · a real LOGIN round-trip with a seeded fixture lands an authed shell
 *     · signup form validation surfaces a field error on bad input WITHOUT
 *       creating a durable auth user (assert the client/zod validation only —
 *       this spec never mass-creates accounts).
 *
 * Anon tests set the consent cookie (atlvs_consent) so the cookie banner doesn't
 * intercept CTA clicks — same idiom as helpers/auth.ts#dismissConsent.
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /application error|something went wrong|unhandled|digest:|client-side exception/i;

/** Set the essential-only consent cookie so the banner can't eat CTA clicks. */
async function consent(page: Page): Promise<void> {
  await page.context().addCookies([
    {
      name: "atlvs_consent",
      value: encodeURIComponent(
        JSON.stringify({ essential: true, analytics: false, marketing: false, decidedAt: new Date().toISOString() }),
      ),
      domain: "localhost",
      path: "/",
    },
  ]);
}

// ── Marketing visitor — conversion journeys ─────────────────────────────────
test.describe("marketing · visitor (anon) — conversion journeys", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => consent(page));

  test("home → /signup via the hero CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    // The hero primary CTA links to /signup (marketing home ctaPrimary).
    const cta = page.getByRole("link", { name: /start building free/i }).first();
    await expect(cta).toBeVisible({ timeout: 15_000 });
    await cta.click();
    await expect(page, "the hero CTA routes the visitor to signup").toHaveURL(/\/signup(\?|$)/, { timeout: 20_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
  });

  test("pricing → a tier CTA routes to /signup", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    // Every paid/free tier card CTA on the pricing page routes to signup; click
    // the first signup-bound CTA and assert the navigation.
    const signupCta = page.locator('a[href^="/signup"]').first();
    await expect(signupCta, "the pricing page exposes a signup CTA").toBeVisible({ timeout: 15_000 });
    await signupCta.click();
    await expect(page).toHaveURL(/\/signup(\?|$)/, { timeout: 20_000 });
  });

  test("compare/[competitor] detail renders for a canonical competitor", async ({ page }) => {
    // `asana` is a canonical COMPARE_LIST slug (src/lib/compare.ts).
    const r = await page.goto("/compare/asana");
    expect(r?.status() ?? 0, "compare detail is not a 5xx").toBeLessThan(500);
    await expect(page.locator("h1").first(), "compare detail renders a headline").toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    // The comparison table is the core artifact of the page.
    await expect(page.getByRole("table").first()).toBeVisible({ timeout: 15_000 });
  });

  for (const product of ["atlvs", "compvss", "gvteway"] as const) {
    test(`solutions/${product} product page renders`, async ({ page }) => {
      const r = await page.goto(`/solutions/${product}`);
      expect(r?.status() ?? 0, `/solutions/${product} is not a 5xx`).toBeLessThan(500);
      await expect(page.locator("h1").first(), `/solutions/${product} renders a heading`).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(ERROR_BOUNDARY), `/solutions/${product} has no error boundary`).toHaveCount(0);
    });
  }
});

// ── Auth — real login round-trip + signup validation (no durable user) ──────
test.describe("auth · login round-trip + signup validation", () => {
  test.describe.configure({ timeout: 120_000 });

  test("login round-trip — a seeded fixture lands an authed shell", async ({ page }) => {
    // authedSetup runs the real /login form flow and waits for the post-login
    // redirect off /login. owner resolves into the platform (ATLVS) shell.
    await authedSetup(page, "owner");
    await page.goto("/me");
    expect(page.url(), "the authed user reaches /me (not bounced to /login)").not.toMatch(/\/login/);
    await expect(page.locator("main h1").first(), "the authed /me shell rendered").toBeVisible({ timeout: 15_000 });
  });

  test("signup form surfaces validation on bad input (no account created)", async ({ page }) => {
    await consent(page);
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /start building/i })).toBeVisible({ timeout: 15_000 });
    // Submit deliberately-invalid input — a too-short password / bad email — and
    // assert the client/zod validation surfaces an error. We do NOT submit valid
    // data, so no durable auth user is created.
    await page.getByRole("textbox", { name: /name/i }).fill("E2E Probe");
    await page.getByRole("textbox", { name: /work email/i }).fill("not-an-email");
    await page.getByRole("textbox", { name: /password/i }).fill("x");
    await page.locator("form").first().evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(
      page.locator('[role="alert"], [aria-invalid="true"]').first(),
      "signup validation surfaced a field/error state on bad input",
    ).toBeVisible({ timeout: 10_000 });
    // Still on /signup — invalid input never advanced past the form.
    await expect(page).toHaveURL(/\/signup(\?|$)/);
  });
});
