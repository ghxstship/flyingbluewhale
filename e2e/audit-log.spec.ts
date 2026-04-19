import { expect, test, type Page, type BrowserContext } from "playwright/test";

/**
 * H2-07 / IK-046 — audit log for privileged auth actions.
 *
 * Proves that logging in through /auth/resolve emits an `auth.login` row
 * into `public.audit_log` with actor_id = user id, and that we can read
 * it back through the already-RLS-gated /api/v1/me/export bundle. Same
 * read path a GDPR request would use.
 */

const PASSWORD = "FlyingBlue!Test2026";
const TEST_EMAIL = (role: string) => `test+${role}@flyingbluewhale.app`;

async function dismissConsent(ctx: BrowserContext) {
  await ctx.addCookies([
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

async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL(role));
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15_000 });
}

test.describe("audit/auth.login emission", () => {
  test("hitting /auth/resolve after login emits an auth.login audit row", async ({ page, context }) => {
    await dismissConsent(context);
    const before = Date.now();
    await login(page, "owner");

    // /auth/resolve is called by the login button redirect on most flows;
    // call it explicitly to guarantee the emit path fires.
    await page.goto("/auth/resolve");
    await page.waitForLoadState("domcontentloaded");

    // Fetch the user's full GDPR export and look for an auth.login row
    // whose timestamp post-dates our login.
    const r = await page.request.get("/api/v1/me/export");
    expect(r.status()).toBe(200);
    const body = await r.json();
    // Export is served as a JSON blob attachment, not envelope-wrapped.
    // It's { exportedAt, user, <table>: rows[] }.
    const rows = body.audit_log as Array<{ action: string; at: string }> | undefined;
    expect(rows, "export bundle must include an audit_log key").toBeDefined();
    const logins = (rows ?? []).filter(
      (r) => r.action === "auth.login" && new Date(r.at).getTime() >= before - 5_000,
    );
    expect(logins.length).toBeGreaterThan(0);
  });
});
