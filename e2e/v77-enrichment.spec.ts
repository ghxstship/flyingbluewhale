/**
 * v7.7 enrichment coverage — the data-engine + enrichment additions landed in
 * this pass: the activation checklist (GET /api/v1/setup + SetupChecklist on the
 * dashboard), the unified triage inbox (GET /api/v1/inbox + /studio/triage), and
 * the ThemeStudio WCAG guard on the white-label branding surface.
 *
 * API tests assert the envelope + shape; surface tests assert the page renders
 * (auth held, h1 present, no crash). Navigation is throttle-resilient (a deployed
 * target sheds some requests under load — retry once before failing).
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const THROTTLE = /ERR_ABORTED|ERR_NETWORK_CHANGED|ERR_CONNECTION|Timeout|interrupted/i;
async function gotoResilient(page: Page, href: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === 0 && THROTTLE.test(msg)) {
        await page.waitForTimeout(800);
        continue;
      }
      throw e;
    }
  }
  return null;
}

test.describe("v7.7 — activation checklist", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("GET /api/v1/setup returns the 4-step derived activation progress", async ({ page }) => {
    const r = await page.request.get("/api/v1/setup");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.steps)).toBe(true);
    expect(body.data.steps).toHaveLength(4);
    const ids = body.data.steps.map((s: { id: string }) => s.id).sort();
    expect(ids).toEqual(["create_project", "go_live", "import_data", "invite_team"]);
    for (const s of body.data.steps) expect(typeof s.done).toBe("boolean");
    expect(typeof body.data.complete).toBe("boolean");
    expect(body.data.total).toBe(4);
  });

  test("dashboard renders (SetupCard never crashes it)", async ({ page }) => {
    const res = await gotoResilient(page, "/studio");
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("v7.7 — unified triage inbox", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("GET /api/v1/inbox returns a well-formed item list", async ({ page }) => {
    const r = await page.request.get("/api/v1/inbox");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(typeof body.data.count).toBe("number");
    // If any items exist, each carries the documented shape.
    for (const it of body.data.items.slice(0, 5)) {
      expect(["notification", "task"]).toContain(it.source);
      expect(typeof it.title).toBe("string");
      expect(typeof it.slaOverdue).toBe("boolean");
    }
  });

  test("/studio/triage renders (auth held, h1 present)", async ({ page }) => {
    const res = await gotoResilient(page, "/studio/triage");
    expect(res?.status() ?? 0).toBeLessThan(500);
    expect(/\/login(\?|$)/.test(page.url())).toBe(false);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("v7.7 — ThemeStudio WCAG guard", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("branding surface renders with the live contrast guard", async ({ page }) => {
    const res = await gotoResilient(page, "/studio/settings/branding");
    expect(res?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    // The WcagGuard is a role=status region announcing the contrast level.
    const guard = page.getByRole("status").filter({ hasText: /:1|AA|AAA|Fail/ });
    await expect(guard.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("v7.7 — Copilot (grounded)", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("/studio/copilot renders (auth held, h1 present)", async ({ page }) => {
    const res = await gotoResilient(page, "/studio/copilot");
    expect(res?.status() ?? 0).toBeLessThan(500);
    expect(/\/login(\?|$)/.test(page.url())).toBe(false);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("POST /api/v1/ai/copilot validates the question (400, no model spend)", async ({ page }) => {
    // A too-short question fails BodySchema before any embedding/model call —
    // proves the endpoint is wired + guarded without spending AI credit.
    const r = await page.request.post("/api/v1/ai/copilot", { data: { question: "hi" } });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(body.ok).toBe(false);
  });
});
