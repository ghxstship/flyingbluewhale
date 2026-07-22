/**
 * LEG3ND ONBOARDING GATE — "organizations are born in LEG3ND on the web;
 * COMPVSS is login/join-only" (marketing rebuild plan §10, decision 4:
 * app-tier guard only — the create_org_with_owner RPC stays open for
 * console/admin/e2e).
 *
 * The channel guard (src/app/(auth)/onboarding/org/channel.ts) reads the
 * request's COMPVSS signals: a compvss.* Host, the proxy's post-rewrite
 * x-pathname, or an /m origin/referer. The referer signal is the one that
 * behaves identically in local path-prefix mode AND against a deployed
 * subdomain target, so these specs drive it — no environment forks needed.
 *
 * Safe against prod: nothing here creates an org (the guard test renders the
 * refusal screen; the invite test submits a bogus token whose RPC validation
 * fails server-side before any write).
 */
import { expect, test } from "./helpers/base";
import { authedSetup, dismissConsent } from "./helpers/auth";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const COMPVSS_REFERER = `${BASE}/m`;
const GUARD_COPY = /Organizations are created in LEG3ND on the web/i;

test.describe("LEG3ND onboarding gate — COMPVSS is join-only", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
  });

  test("org create is refused from the COMPVSS channel (anon gets the join-only screen)", async ({ page }) => {
    await page.goto("/onboarding/org", { referer: COMPVSS_REFERER });
    // The join-only screen carries the exact refusal copy...
    await expect(page.getByText(GUARD_COPY).first()).toBeVisible();
    // ...and NO workspace-create form.
    await expect(page.getByRole("textbox", { name: /workspace name/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /create workspace/i })).toHaveCount(0);
    // The outbound path to the LEG3ND web flow is offered instead.
    await expect(
      page.getByRole("link", { name: /create your organization in LEG3ND/i }),
    ).toBeVisible();
    // And the join paths are taught: sign in + the COMPVSS access-code step.
    await expect(page.getByRole("link", { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /open compvss/i })).toBeVisible();
  });

  test("web channel is untouched (control): anon still bounces to /login", async ({ page }) => {
    // No COMPVSS signal → the pre-existing behavior holds; the create flow
    // stays reachable for the web onboarding path.
    await page.goto("/onboarding/org");
    await expect(page).toHaveURL(/\/login/);
  });

  test("the COMPVSS channel wins even for an authed user", async ({ page }) => {
    // An org-holding member would normally be redirected off this page to
    // /auth/resolve — through the COMPVSS channel they get the join-only
    // screen instead, proving the guard runs before every other gate.
    await authedSetup(page, "member");
    await page.goto("/onboarding/org", { referer: COMPVSS_REFERER });
    await expect(page.getByText(GUARD_COPY).first()).toBeVisible();
  });

  test("COMPVSS entry is login/join-only: no org-create affordance on /m", async ({ page }) => {
    // Anonymous /m renders the kit's own auth + onboarding flow — splash offers
    // account signup and sign-in only; org creation is never offered.
    await page.goto("/m");
    await expect(page.getByRole("button", { name: /get started/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /i already have an account/i })).toBeVisible();
    await expect(page.getByText(/create (a |an |your )?(organization|workspace)/i)).toHaveCount(0);
  });

  test("join-by-invite from COMPVSS entry still works and validates honestly", async ({ page }) => {
    // The invite-accept surface must stay open to COMPVSS-channel arrivals
    // (joining is exactly what the shell is for). A bogus token exercises the
    // full submit loop and must surface the honest RPC validation error —
    // no org or membership is created.
    await authedSetup(page, "member");
    await page.goto("/accept-invite/e2e-bogus-token-0000", { referer: COMPVSS_REFERER });
    const accept = page.getByRole("button", { name: /accept invite/i });
    await expect(accept).toBeVisible();
    await accept.click();
    // Error renders as toast + Alert — match the first occurrence.
    await expect(page.getByText(/invalid or expired/i).first()).toBeVisible({ timeout: 20000 });
  });

  test("LEG3ND /start renders its onboarding sequence shell for an authed user", async ({ page }) => {
    // Smoke only: the 8-step wizard at src/app/(legend)/legend/start is built
    // in a concurrent wave — assert the sequence shell (heading + progress
    // rail) renders, with deliberately loose selectors.
    await authedSetup(page, "owner");
    const res = await page.goto("/legend/start");
    expect(res?.status(), "the LEG3ND start route serves").toBeLessThan(400);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/start|step|organization/i);
  });
});
