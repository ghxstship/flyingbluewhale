/**
 * Console module create flows — extends console-core-flows.spec.ts with the
 * single-entity "create" interactions across more platform modules: Sales
 * (clients, leads), Operations (events), Production (equipment), Finance
 * (expenses), Settings (master catalog). Each test creates a record as the
 * seeded `owner` fixture and asserts the create action redirected off the
 * `/new` form (i.e. the server action ran + persisted), with no error surface.
 *
 * The helper fills the named fields it's given, then generically satisfies any
 * remaining `required` field by input type, so the form passes client + server
 * validation without hard-coding every field.
 */
import { expect, test, type Page, type Locator } from "playwright/test";
import { authedSetup } from "./helpers/auth";

const stamp = () => `${Date.now()}`;

async function fillSmart(el: Locator, value: string) {
  const tag = await el.evaluate((e) => e.tagName);
  if (tag === "SELECT") {
    // try by value, then by label, then first non-empty option
    const ok = await el.selectOption(value).then(
      () => true,
      () => false,
    );
    if (!ok) {
      const byLabel = await el.selectOption({ label: value }).then(
        () => true,
        () => false,
      );
      if (!byLabel) {
        const vals = await el
          .locator("option")
          .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
        if (vals[0]) await el.selectOption(vals[0]);
      }
    }
    return;
  }
  const type = (await el.getAttribute("type")) || "text";
  if (type === "checkbox") return el.check();
  if (type === "date") return el.fill(value.slice(0, 10));
  if (type === "datetime-local") return el.fill(value.includes("T") ? value : `${value}T10:00`);
  if (type === "number") return el.fill(value.replace(/[^\d.]/g, "") || "100");
  return el.fill(value);
}

/** Fill provided fields + auto-satisfy any remaining required field, then submit. */
async function createInModule(page: Page, route: string, fields: Record<string, string>) {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (await el.count()) await fillSmart(el, value);
  }
  const required = await page.locator("main form [required]").all();
  for (const el of required) {
    const current = await el.inputValue().catch(() => "x");
    if (current) continue; // already filled
    const tag = await el.evaluate((e) => e.tagName);
    if (tag === "SELECT") {
      const vals = await el
        .locator("option")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      if (vals[0]) await el.selectOption(vals[0]);
    } else {
      await fillSmart(el, "E2E Test");
    }
  }
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  // success = the create redirected away from the /new form, with no error alert
  // generous timeout: a cold dev server cold-compiles both this form and the
  // redirect target on the first hit, which can exceed 20s.
  await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 35000 });
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
}

test.describe("console modules — create flows", () => {
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("Sales · client create", async ({ page }) => {
    await createInModule(page, "/console/clients/new", { name: `E2E Client ${stamp()}` });
  });

  test("Sales · lead create", async ({ page }) => {
    await createInModule(page, "/console/leads/new", { name: `E2E Lead ${stamp()}` });
  });

  test("Operations · event create", async ({ page }) => {
    await createInModule(page, "/console/events/new", {
      name: `E2E Event ${stamp()}`,
      starts_at: "2030-01-01T10:00",
      ends_at: "2030-01-01T18:00",
    });
  });

  test("Production · equipment create", async ({ page }) => {
    await createInModule(page, "/console/production/equipment/new", { name: `E2E Equipment ${stamp()}` });
  });

  test("Finance · expense create", async ({ page }) => {
    await createInModule(page, "/console/finance/expenses/new", {
      description: `E2E Expense ${stamp()}`,
      amount: "500",
    });
  });

  test("Settings · master catalog SKU create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/console/settings/catalog/new", {
      name: `E2E SKU ${s}`,
      code: `E2E-${s}`,
      kind: "credential",
    });
  });

  test("Workforce · course create", async ({ page }) => {
    await createInModule(page, "/console/workforce/courses/new", { title: `E2E Course ${stamp()}` });
  });

  test("Operations · RFI create", async ({ page }) => {
    await createInModule(page, "/console/rfis/new", {
      subject: `E2E RFI ${stamp()}`,
      question: "E2E question body for the RFI.",
    });
  });

  test("Production · fabrication order create", async ({ page }) => {
    await createInModule(page, "/console/production/fabrication/new", { title: `E2E Fab ${stamp()}` });
  });

  test("Sales · sponsor deliverable create", async ({ page }) => {
    await createInModule(page, "/console/commercial/sponsors/new", { title: `E2E Sponsor ${stamp()}` });
  });
});
