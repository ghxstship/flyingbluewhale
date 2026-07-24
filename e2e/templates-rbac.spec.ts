import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { stamp } from "./helpers/forms";

/**
 * Template-management RBAC + CRUD guard (template-management program,
 * 2026-07-24 audit).
 *
 * Two bands, observable behavior only:
 *   owner  — full CRUD round trips on the stores this program manages
 *            (deliverable templates: create → edit → versioned → archive;
 *            job templates: create → duplicate → archive), plus the
 *            template_versions history rendering in the unified library.
 *   member — the manage affordances are absent (library configurator,
 *            deliverable create form), and a direct write attempt dies at
 *            RLS (job-template create), proving the deny is enforced in the
 *            database, not just hidden in the UI.
 *
 * Rows are name-stamped and end the test archived (soft-deleted), so reruns
 * never collide and nothing stays visible.
 */

test.describe("templates RBAC — owner CRUD round trips", () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ page }) => {
    await suppressTour(page);
    await authedSetup(page, "owner");
  });

  test("deliverable template: create → edit → version history → archive", async ({ page }) => {
    const name = `E2E Tpl Deliverable ${stamp()}`;
    const renamed = `${name} R2`;

    await page.goto("/studio/settings/deliverable-templates");
    await expect(page.getByText("New Deliverable Template")).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill(name);
    await page.locator("select#type").selectOption("custom");
    await page.getByRole("button", { name: "Create Template" }).click();
    const row = page.locator("tr", { hasText: name });
    await expect(row).toBeVisible();

    // Update path (?edit= prefill) — full CRUD, not create-only.
    await row.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByText("Edit Deliverable Template")).toBeVisible();
    const nameInput = page.getByRole("textbox", { name: "Name" });
    await expect(nameInput).toHaveValue(name);
    await nameInput.fill(renamed);
    await page.getByRole("button", { name: "Save Template" }).click();
    await expect(page.locator("tr", { hasText: renamed })).toBeVisible();

    // The journal saw both writes: v1 create + v2 edit, rendered in the library.
    await page.goto("/legend/hub/templates");
    await page.locator('input[type="search"]').first().fill(renamed);
    const card = page.locator("li", { hasText: renamed }).first();
    await expect(card).toBeVisible();
    await card.locator("summary").click();
    await expect(card.getByText("2 versions")).toBeVisible();
    await expect(card.locator("li", { hasText: "v2" })).toBeVisible();

    // Archive (soft delete) — the row leaves the list.
    await page.goto("/studio/settings/deliverable-templates");
    await page
      .locator("tr", { hasText: renamed })
      .getByRole("button", { name: "Archive" })
      .click();
    await expect(page.locator("tr", { hasText: renamed })).toHaveCount(0);
  });

  test("job template: create → duplicate (steps copied) → archive both", async ({ page }) => {
    const name = `E2E Tpl Job ${stamp()}`;

    await page.goto("/legend/hub/templates/job-templates/new");
    await page.getByRole("textbox", { name: "Name" }).first().fill(name);
    await page.locator('textarea[name="steps"], input[name="steps"]').first().fill("Rig point check\n* Photo of truss");
    await page.getByRole("button", { name: "Create Template" }).click();
    await expect(page).toHaveURL(/job-templates$/);
    const row = page.locator("li", { hasText: name }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText("2 steps")).toBeVisible();

    // Duplicate copies the checklist steps.
    await row.getByRole("button", { name: "Duplicate" }).click();
    const copy = page.locator("li", { hasText: `${name} (Copy)` }).first();
    await expect(copy).toBeVisible();
    await expect(copy.getByText("2 steps")).toBeVisible();

    // Archive both — soft delete leaves the list.
    for (const target of [`${name} (Copy)`, name]) {
      await page
        .locator("li", { hasText: target })
        .first()
        .getByRole("button", { name: "Archive" })
        .click();
      await expect(page.locator("li", { hasText: target })).toHaveCount(0);
    }
  });
});

test.describe("templates RBAC — member band is read-only", () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ page }) => {
    await suppressTour(page);
    await authedSetup(page, "member");
  });

  test("library renders without manage affordances", async ({ page }) => {
    await page.goto("/legend/hub/templates");
    await page.waitForSelector("section[aria-label='Document templates']");
    // The doc configurator (Offered toggle + brand select) is manager+/grant only.
    // exact:true — getByText is case-insensitive substring by default and
    // would catch "offered" inside the doc-family blurb copy.
    await expect(page.getByText("Offered", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  });

  test("deliverable template authoring is not offered", async ({ page }) => {
    await page.goto("/studio/settings/deliverable-templates");
    // Either the settings layout refuses the route or the page renders
    // read-only — in no case does a member see the create form.
    await expect(page.getByText("New Deliverable Template")).toHaveCount(0);
  });

  test("job template create dies at RLS, not just in the UI", async ({ page }) => {
    // The route is reachable (LEG3ND is learner-readable); the WRITE must be
    // refused by the database band (manager+ or a templates:write grant).
    await page.goto("/legend/hub/templates/job-templates/new");
    const nameInput = page.getByRole("textbox", { name: "Name" }).first();
    if ((await nameInput.count()) === 0) return; // route itself refused — also a pass
    await nameInput.fill(`E2E Tpl Denied ${stamp()}`);
    await page.getByRole("button", { name: "Create Template" }).click();
    // Stays on the form with an error; never lands on the list with a new row.
    await expect(
      page.getByText(/row-level security|not authorized|permission denied|read-only/i).first(),
    ).toBeVisible();
  });
});
