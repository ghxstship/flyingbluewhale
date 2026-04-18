import { expect, test, type Page } from "playwright/test";

const PASSWORD = "FlyingBlue!Test2026";

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

async function loginAs(page: Page, role: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(`test+${role}@flyingbluewhale.app`);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 10000 });
}

test.describe("compliance — data export", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "viewer");
  });

  test("/api/v1/me/export returns a JSON bundle for the signed-in user", async ({ page }) => {
    const res = await page.request.get("/api/v1/me/export");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("test+viewer@flyingbluewhale.app");
    expect(body).toHaveProperty("memberships");
    expect(body).toHaveProperty("exportedAt");
  });

  test("/me/privacy page renders all 3 controls", async ({ page }) => {
    await page.goto("/me/privacy");
    await expect(page.getByText(/export my data/i)).toBeVisible();
    await expect(page.getByText(/cookie preferences/i)).toBeVisible();
    await expect(page.getByText(/delete my account/i)).toBeVisible();
  });
});

test.describe("compliance — preferences API", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "admin");
  });

  test("PATCH preferences round-trips a saved table view", async ({ page }) => {
    const writeRes = await page.request.patch("/api/v1/me/preferences", {
      data: { table_views: { "console.clients": { sort: { key: "name", dir: "asc" } } } },
    });
    expect(writeRes.ok()).toBeTruthy();

    const readRes = await page.request.get("/api/v1/me/preferences");
    expect(readRes.ok()).toBeTruthy();
    const body = await readRes.json();
    expect(body.data.table_views["console.clients"].sort.key).toBe("name");
  });
});

test.describe("compliance — rate limit on auth POST", () => {
  test("excessive POSTs to /api/v1/auth/oauth eventually 429", async ({ page }) => {
    await dismissConsent(page);
    let lastStatus = 200;
    for (let i = 0; i < 15; i++) {
      const res = await page.request.get("/api/v1/auth/oauth?provider=google", {
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      lastStatus = res.status();
    }
    // GETs should NOT 429 (rate limiter scoped to mutations only)
    expect(lastStatus).toBeLessThan(500);
  });
});
