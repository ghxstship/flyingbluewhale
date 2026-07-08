/**
 * Console module create flows — extends console-core-flows.spec.ts with the
 * single-entity "create" interactions across more platform modules: Sales
 * (clients, leads), Operations (events), Production (assets), Finance
 * (expenses), Settings (master catalog). Each test creates a record as the
 * seeded `owner` fixture and asserts the create action redirected off the
 * `/new` form (i.e. the server action ran + persisted), with no error surface.
 *
 * The helper fills the named fields it's given, then generically satisfies any
 * remaining `required` field by input type, so the form passes client + server
 * validation without hard-coding every field.
 */
import { expect, test, type Page, type Locator } from "./helpers/base";
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
      continue;
    }
    // type-appropriate default so date/datetime/number/email required fields
    // don't get filled with an invalid generic string.
    const type = (await el.getAttribute("type")) || "text";
    const defaults: Record<string, string> = {
      date: "2030-01-01",
      "datetime-local": "2030-01-01T10:00",
      time: "10:00",
      number: "100",
      email: "e2e@test.example",
      url: "https://example.com",
      tel: "305-555-0100",
    };
    if (type === "checkbox") await el.check();
    else await el.fill(defaults[type] ?? "E2E Test");
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
    await createInModule(page, "/studio/clients/new", { name: `E2E Client ${stamp()}` });
  });

  test("Sales · lead create", async ({ page }) => {
    await createInModule(page, "/studio/leads/new", { name: `E2E Lead ${stamp()}` });
  });

  test("Operations · event create", async ({ page }) => {
    await createInModule(page, "/studio/events/new", {
      name: `E2E Event ${stamp()}`,
      starts_at: "2030-01-01T10:00",
      ends_at: "2030-01-01T18:00",
    });
  });

  test("Production · asset create", async ({ page }) => {
    // Equipment folded into the unified assets store (kit-20 Phase A);
    // /studio/production/equipment is now a read-only Fleet lens and the
    // canonical create form is /studio/assets/new (redirects to /studio/assets/{id}).
    await createInModule(page, "/studio/assets/new", {
      display_name: `E2E Asset ${stamp()}`,
      asset_kind: "e2e-gear",
    });
  });

  test("Finance · expense create", async ({ page }) => {
    await createInModule(page, "/studio/finance/expenses/new", {
      description: `E2E Expense ${stamp()}`,
      amount: "500",
    });
  });

  test("Settings · master catalog SKU create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/settings/catalog/new", {
      name: `E2E SKU ${s}`,
      code: `E2E-${s}`,
      kind: "credential",
    });
  });

  // "Workforce · course create" removed — courses migrated to the LEG3ND
  // learning spine (LEG3ND-only); the /studio/workforce/courses admin no longer
  // exists. LEG3ND has its own coverage (legend migrations + e2e).

  test("Operations · RFI create", async ({ page }) => {
    await createInModule(page, "/studio/rfis/new", {
      subject: `E2E RFI ${stamp()}`,
      question: "E2E question body for the RFI.",
    });
  });

  test("Production · fabrication order create", async ({ page }) => {
    await createInModule(page, "/studio/production/fabrication/new", { title: `E2E Fab ${stamp()}` });
  });

  test("Sales · sponsor deliverable create", async ({ page }) => {
    await createInModule(page, "/studio/commercial/sponsors/new", { title: `E2E Sponsor ${stamp()}` });
  });

  // Batch 3 — more single-entity creates across safety, ops, knowledge, programs,
  // marketing, finance, legal, workforce.
  test("Safety · crisis create", async ({ page }) => {
    await createInModule(page, "/studio/safety/crisis/new", { title: `E2E Crisis ${stamp()}` });
  });

  test("Safety · threat create", async ({ page }) => {
    await createInModule(page, "/studio/safety/threats/new", {
      title: `E2E Threat ${stamp()}`,
      code: `THR-${stamp().slice(-7)}`,
    });
  });

  test("Safety · briefing create", async ({ page }) => {
    await createInModule(page, "/studio/safety/briefings/new", {
      topic: `E2E Briefing ${stamp()}`,
      scheduled_for: "2030-01-01T10:00",
    });
  });

  test("Operations · meeting create", async ({ page }) => {
    await createInModule(page, "/studio/meetings/new", {
      title: `E2E Meeting ${stamp()}`,
      starts_at: "2030-01-01T10:00",
      ends_at: "2030-01-01T11:00",
    });
  });

  test("Knowledge · article create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/knowledge/new", {
      title: `E2E Article ${s}`,
      slug: `e2e-article-${s}`,
      body_markdown: "E2E article body content.",
    });
  });

  test("Programs · risk create", async ({ page }) => {
    await createInModule(page, "/studio/programs/risk/new", { title: `E2E Risk ${stamp()}` });
  });

  test("Marketing · campaign create", async ({ page }) => {
    await createInModule(page, "/studio/campaigns/new", { name: `E2E Campaign ${stamp()}` });
  });

  test("Finance · cost code create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/finance/cost-codes/new", {
      code: `E2E-${s}`,
      name: `E2E Cost Code ${s}`,
      description: "E2E cost code",
    });
  });

  test("Specs · spec section create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/specs/new", {
      section_number: `09 ${s.slice(-4)}`,
      title: `E2E Spec ${s}`,
    });
  });

  test("Legal · IP / trademark create", async ({ page }) => {
    await createInModule(page, "/studio/legal/ip/new", { mark: `E2E Mark ${stamp()}` });
  });

  test("Workforce · staff create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/workforce/staff/new", {
      full_name: `E2E Staff ${s}`,
      email: `e2e-staff-${s}@test.example`,
    });
  });

  test("Workforce · volunteer create", async ({ page }) => {
    const s = stamp();
    await createInModule(page, "/studio/workforce/volunteers/new", {
      full_name: `E2E Volunteer ${s}`,
      email: `e2e-vol-${s}@test.example`,
    });
  });
});
