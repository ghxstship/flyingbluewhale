import { expect, test, type Page, type BrowserContext } from "playwright/test";

/**
 * H2-10 / IK-017 — application-layer capability gate on mutating endpoints.
 *
 * Proves that `withAuth` alone is insufficient — a role lacking the mapped
 * capability hits a 403 `forbidden` envelope before any DB mutation runs.
 * This is defence-in-depth on top of RLS: even if a role somehow got past
 * the database policy, the application layer would still reject the call.
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

test.describe("capability/projects:write", () => {
  // POST /api/v1/projects requires projects:write. crew, client, viewer,
  // community lack it. contractor has projects:read but not write.
  const UNAUTHORIZED: string[] = ["crew", "client", "viewer", "community", "contractor"];

  for (const role of UNAUTHORIZED) {
    test(`${role} cannot POST /api/v1/projects → 403 forbidden`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      const r = await page.request.post("/api/v1/projects", {
        data: { name: `gate-probe-${Date.now()}`, slug: `gate-probe-${Date.now()}` },
      });
      expect(r.status()).toBe(403);
      const body = await r.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("forbidden");
      // Message must include the role + capability so operators can audit.
      expect(body.error.message).toContain(role);
      expect(body.error.message).toContain("projects:write");
    });
  }

  test(`collaborator CAN POST /api/v1/projects → 201 or duplicate conflict`, async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "collaborator");
    const r = await page.request.post("/api/v1/projects", {
      data: {
        name: `gate-allowed-${Date.now()}`,
        slug: `gate-allowed-${Date.now()}`,
      },
    });
    // 201 created OR 409 conflict if slug collides; never 403.
    expect([201, 409]).toContain(r.status());
    const body = await r.json();
    expect(body.ok !== undefined).toBe(true);
    if (!body.ok) expect(body.error.code).not.toBe("forbidden");
  });
});

test.describe("capability/check-in:write", () => {
  // Scanning is restricted to crew/contractor + internal roles (via "*").
  // Clients and community have no business scanning tickets.
  const UNAUTHORIZED: string[] = ["client", "community", "viewer"];

  for (const role of UNAUTHORIZED) {
    test(`${role} cannot POST /api/v1/tickets/scan → 403 forbidden`, async ({ page, context }) => {
      await dismissConsent(context);
      await login(page, role);
      const r = await page.request.post("/api/v1/tickets/scan", {
        data: { code: `probe-${Date.now()}` },
      });
      expect(r.status()).toBe(403);
      const body = await r.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("forbidden");
      expect(body.error.message).toContain("check-in:write");
    });
  }

  test("crew CAN POST /api/v1/tickets/scan (no forbidden error)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "crew");
    const r = await page.request.post("/api/v1/tickets/scan", {
      data: { code: `probe-${Date.now()}` },
    });
    // May 404 (no such ticket), 200, or 500 on downstream but NOT 403.
    expect(r.status()).not.toBe(403);
  });
});

test.describe("capability/invoices:write", () => {
  // Clients should never be able to initiate a Stripe checkout — they pay
  // through the resulting URL but don't create sessions.
  test("client cannot POST /api/v1/stripe/checkout → 403 forbidden", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, "client");
    const r = await page.request.post("/api/v1/stripe/checkout", {
      data: { invoiceId: "00000000-0000-0000-0000-000000000000" },
    });
    // 403 if capability gate fires before we hit Stripe; 401 if session
    // expired between login and call.
    expect([401, 403]).toContain(r.status());
    if (r.status() === 403) {
      const body = await r.json();
      expect(body.error.code).toBe("forbidden");
      expect(body.error.message).toContain("invoices:write");
    }
  });
});
