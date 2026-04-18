import { expect, test, type Page, type BrowserContext } from "playwright/test";

/**
 * End-to-end CMS → portal roundtrip.
 *
 * Proves that a real authoring action in /console mutates event_guides and is
 * reflected on /p/<slug>/guide within the same session, going through the
 * actual server action path (not service_role seed). This catches regressions
 * in:
 *   - `upsertGuideAction` server action
 *   - RLS on event_guides (owner role → UPDATE allowed)
 *   - Cache invalidation / revalidation after write
 *   - Portal render pipeline (`getGuideByPersona` under RLS)
 */

const PASSWORD = "FlyingBlue!Test2026";
const OWNER_EMAIL = "test+owner@flyingbluewhale.app";

// test+owner belongs to all 4 test orgs, but session.orgId resolves to exactly
// one of them. Probe /api/v1/projects to discover which (project_id, slug)
// pair the owner can actually reach — then drive the roundtrip against that.
const TEST_PROJECTS: Array<{ slug: string; id: string }> = [
  { slug: "test-portal-show", id: "8597e953-22c0-48d1-abfd-6060f848aba5" },
  { slug: "test-starter-show", id: "871fc1db-6bc6-43b1-8218-43c1716185d9" },
  { slug: "test-professional-show", id: "f62d1228-dd83-49bf-baa4-b82242bd3056" },
  { slug: "test-enterprise-show", id: "e4340ab4-d105-4b49-ab84-90b038542f89" },
];

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

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15_000 });
}

test.describe("handoff/cms-roundtrip: owner edit → portal render", () => {
  test("editing client persona title in console shows up on /p/<slug>/guide", async ({ page, context }) => {
    await dismissConsent(context);
    await login(page, OWNER_EMAIL);

    // Discover which project is visible to this owner session.
    let project: { slug: string; id: string } | null = null;
    for (const candidate of TEST_PROJECTS) {
      const r = await page.request.get(`/api/v1/projects/${candidate.id}`);
      if (r.status() === 200) {
        project = candidate;
        break;
      }
    }
    expect(project, "owner must be able to reach at least one test project").not.toBeNull();

    const marker = `ROUNDTRIP_${Date.now()}`;

    // Navigate to the guide editor for the client persona.
    await page.goto(`/console/projects/${project!.id}/guides/client`);
    await expect(page.locator('[data-platform="atlvs"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /save guide/i })).toBeVisible({ timeout: 10_000 });

    // Overwrite the title with a unique marker. Selected by `name` attribute
    // since the Input component's label wiring varies across variants.
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill(`Handoff roundtrip · ${marker}`);

    // Ensure "Published" is checked so the portal reader can see it without
    // requiring org membership on the portal side.
    const publishedCheckbox = page.locator('input[name="published"]');
    if (!(await publishedCheckbox.isChecked())) await publishedCheckbox.check();

    // Submit. The server action writes to event_guides under RLS.
    await page.getByRole("button", { name: /save guide/i }).click();

    // Toast confirms the save fired on the server.
    await expect(page.getByText(/guide saved/i)).toBeVisible({ timeout: 10_000 });

    // Portal fetch — same session (owner → staff persona), but we want to
    // assert the client guide specifically. Easiest: log out, log in as
    // a client in the same org, view the portal.
    await context.clearCookies();
    await dismissConsent(context);
    await login(page, "test+client@flyingbluewhale.app");

    await page.goto(`/p/${project!.slug}/guide`);
    await expect(page.locator('[data-platform="gvteway"]').first()).toBeVisible({ timeout: 10_000 });
    // The marker written through the console must surface on the portal.
    await expect(page.locator("body")).toContainText(marker, { timeout: 10_000 });
  });
});
