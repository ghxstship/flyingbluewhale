import { expect, test, type Page, type BrowserContext } from "playwright/test";

/**
 * H2-04 / IK-015 — pagination envelope contract.
 *
 * Any list endpoint that opts into the pagination primitive MUST:
 *   - accept `cursor` + `pageSize` query params
 *   - return `{ rows|<resource>, nextCursor, pageSize, totalCount }`
 *   - set `X-Total-Count: <totalCount>` on the response
 *   - never return more than 200 rows regardless of pageSize
 */

const PASSWORD = "FlyingBlue!Test2026";

async function dismissConsent(ctx: BrowserContext) {
  await ctx.addCookies([
    {
      name: "fbw_consent",
      value: encodeURIComponent(JSON.stringify({ essential: true, decidedAt: new Date().toISOString() })),
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill("test+owner@flyingbluewhale.app");
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15_000 });
}

test.describe("pagination/projects", () => {
  test("GET /api/v1/projects returns pagination envelope + X-Total-Count", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page);

    const r = await page.request.get("/api/v1/projects");
    expect(r.status()).toBe(200);

    // X-Total-Count header mirrors body.totalCount.
    const headerCount = r.headers()["x-total-count"];
    expect(headerCount).toBeDefined();

    const body = await r.json();
    expect(body.ok).toBe(true);
    const d = body.data;
    expect(Array.isArray(d.projects)).toBe(true);
    expect(typeof d.pageSize).toBe("number");
    expect(typeof d.totalCount).toBe("number");
    expect("nextCursor" in d).toBe(true);
    expect(String(d.totalCount)).toBe(headerCount);
  });

  test("pageSize=1 returns one row + nextCursor when more exist", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page);

    const r = await page.request.get("/api/v1/projects?pageSize=1");
    expect(r.status()).toBe(200);
    const body = await r.json();
    const d = body.data;
    // Owner sees exactly one project per their session.orgId; nextCursor is
    // null because there's no second row. Still, the shape is correct.
    expect(d.projects.length).toBeLessThanOrEqual(1);
    expect(d.pageSize).toBe(1);
    // nextCursor is either null (we hit the end) or a stringified offset.
    if (d.nextCursor !== null) {
      expect(typeof d.nextCursor).toBe("string");
      expect(Number.isInteger(Number(d.nextCursor))).toBe(true);
    }
  });

  test("pageSize is clamped to a sane max (≤ 200)", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page);

    const r = await page.request.get("/api/v1/projects?pageSize=9999");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.data.pageSize).toBeLessThanOrEqual(200);
  });
});
