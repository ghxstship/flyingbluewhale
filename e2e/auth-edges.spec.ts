/**
 * AUTH EDGES — the surfaces the 2026-07 lifecycle audit found with ZERO e2e.
 *
 * Auth implementation is complete (14/14 surfaces full-stack, no stubs), but
 * coverage clustered on password login + persona routing. The security-sensitive
 * edges — the OAuth callback's failure branches and the SSO provider guard —
 * shipped entirely unexercised. These are anonymous, fast, and have NO side
 * effects (no session is minted, nothing is written), so they're safe to run
 * against prod on every pass.
 *
 * Not covered here, deliberately:
 *  - The callback SUCCESS path + its `next` open-redirect guard: reaching line
 *    50 needs a real provider-issued code, which can't be forged headless. The
 *    same-origin property is still asserted below via the failure paths.
 *  - MFA challenge/recovery: needs a TOTP generator + an enrolled factor fixture.
 *  - /onboarding/org: creating an org is durable prod pollution with a heavy
 *    cascade, and it rewrites the creator's active workspace.
 */
import { expect, test } from "./helpers/base";

test.describe("Auth edges — OAuth callback + SSO guard", () => {
  test.describe.configure({ timeout: 120000 });

  // The provider bounced us (user denied consent, provider disabled). The
  // callback must surface it on /login, never 500 or strand the user.
  test("callback: a provider error redirects to /login carrying the reason", async ({ page }) => {
    const res = await page.goto("/auth/callback?error=access_denied&error_description=User%20denied%20access");
    expect(res?.status(), "no server error").toBeLessThan(400);
    await expect(page).toHaveURL(/\/login\?error=/);
    expect(decodeURIComponent(page.url()), "the provider's reason reaches the user").toContain("User denied access");
  });

  // A bare hit with no `?code` (bot, stale bookmark, half-finished handshake).
  test("callback: a missing code redirects to /login?error=missing_code", async ({ page }) => {
    const res = await page.goto("/auth/callback");
    expect(res?.status(), "no server error").toBeLessThan(400);
    await expect(page).toHaveURL(/\/login\?error=missing_code/);
  });

  // A forged/expired code must fail closed at exchangeCodeForSession — landing
  // back on /login, never minting a session.
  test("callback: a bogus code fails closed to /login with no session", async ({ page }) => {
    const res = await page.goto("/auth/callback?code=not-a-real-oauth-code");
    expect(res?.status(), "no server error").toBeLessThan(400);
    await expect(page).toHaveURL(/\/login\?error=/);
    // Fails CLOSED: still anonymous, so a protected surface bounces to /login.
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/login/);
  });

  // Open-redirect: even with a crafted `next`, the callback must never send the
  // browser off-origin. (`//evil.example` is rejected by the NextSchema regex,
  // which requires a single leading slash.)
  test("callback: a crafted next never escapes the origin", async ({ page }) => {
    const expectedHost = new URL(process.env.E2E_BASE_URL || "http://localhost:3000").host;
    await page.goto("/auth/callback?code=bogus&next=//evil.example/pwned");
    expect(new URL(page.url()).host, "stayed on our origin").toBe(expectedHost);
    expect(page.url(), "never bounced to the attacker host").not.toContain("evil.example");
  });

  // The SSO entrypoint whitelists providers; anything else hits notFound()
  // BEFORE any handshake is attempted.
  //
  // Asserts the behaviour, not the status: the page streams, so by the time
  // notFound() runs the shell headers are already flushed and Next can't change
  // the code — it's a soft-404 (200 + the not-found UI). That's an SEO/crawler
  // nit, not a security issue; the property that matters is that an unsupported
  // provider never reaches signInWithOAuth.
  test("sso: an unsupported provider is refused before any handshake", async ({ page }) => {
    await page.goto("/sso/definitely-not-a-provider");
    // Never redirected off to a provider — still on the entrypoint URL.
    expect(page.url(), "no provider handshake was attempted").toContain("/sso/definitely-not-a-provider");
    // notFound() short-circuited BEFORE signInWithOAuth: the SSO error UI (which
    // only renders once isSupported() passes) is absent. We assert its absence
    // rather than the not-found page's copy — that copy lives in the streamed
    // RSC payload as well as the DOM, so matching it is unreliable.
    await expect(page.getByText(/make sure the provider is enabled/i)).toHaveCount(0);
    await expect(page.getByText(/couldn.t start sso/i)).toHaveCount(0);
  });
});
