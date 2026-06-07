/**
 * Personal (/me) self-service interactive flows. The /me shell is each user's
 * own profile/preferences surface — no cross-tenant fixtures needed; the logged
 * in user edits their own rows. Previously render-only. The personal shell wraps
 * content in <main>, so the FormShell submits via the same requestSubmit path the
 * console creates use.
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { stamp } from "./helpers/forms";

async function fillAndSubmit(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (await el.count()) {
      const tag = await el.evaluate((e) => e.tagName);
      if (tag === "SELECT") {
        const opts = await el
          .locator("option")
          .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
        if (opts[0]) await el.selectOption(opts[0]);
      } else {
        await el.fill(value);
      }
    }
  }
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  // The action revalidates in place (no redirect); assert no error surface.
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0, { timeout: 15000 });
}

test.describe("personal /me — self-service", () => {
  test.describe.configure({ timeout: 90000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Profile · update display name + bio", async ({ page }) => {
    await page.goto("/me/profile");
    await expect(page.locator('main [name="display_name"]')).toBeVisible({ timeout: 15000 });
    await fillAndSubmit(page, {
      display_name: `E2E Owner ${stamp()}`,
      bio: "End-to-end self-service profile update.",
    });
    // A saved confirmation or the persisted value confirms the write landed.
    await expect(page.locator("body")).toContainText(/saved|updated|E2E Owner/i, { timeout: 15000 });
  });

  test("Availability · add a slot", async ({ page }) => {
    await page.goto("/me/availability");
    const start = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16);
    const end = new Date(Date.now() + 8 * 86_400_000).toISOString().slice(0, 16);
    await fillAndSubmit(page, { starts_at: start, ends_at: end });
  });

  test("Saved searches · add a subscription", async ({ page }) => {
    await page.goto("/me/saved-searches");
    await fillAndSubmit(page, {
      label: `E2E Search ${stamp()}`,
      name: `E2E Search ${stamp()}`,
      query: "lighting",
    });
  });

  test("Talent EPK · update self-managed profile", async ({ page }) => {
    await page.goto("/me/talent");
    await expect(page.locator('main [name="act_name"]')).toBeVisible({ timeout: 15000 });
    await fillAndSubmit(page, { act_name: `E2E Act ${stamp()}`, tagline: "Self-managed EPK update." });
  });

  test("Crew profile · update self-managed profile", async ({ page }) => {
    await page.goto("/me/crew");
    await expect(page.locator('main [name="name"]')).toBeVisible({ timeout: 15000 });
    await fillAndSubmit(page, { name: `E2E Crew ${stamp()}`, bio: "Self-managed crew profile update." });
  });

  test("Preferences · update density + timezone", async ({ page }) => {
    await page.goto("/me/preferences");
    await expect(page.locator('main [name="timezone"]')).toBeVisible({ timeout: 15000 });
    // density is a 3-radio group (compact/comfortable/spacious) — pick one.
    const dens = page.locator('main input[name="density"][value="comfortable"]');
    if (await dens.count()) await dens.check();
    await fillAndSubmit(page, { timezone: "America/New_York" });
  });
});
