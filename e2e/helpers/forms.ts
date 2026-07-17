/**
 * Shared create-form helper for the console-module Playwright specs.
 *
 * `createInModule(page, route, fields)` navigates to a `/new` form, fills the
 * named fields it's given, then generically satisfies any remaining `required`
 * field by input type (so the form passes client + server validation without
 * hard-coding every field), submits, and asserts the create redirected off the
 * `/new` route with no error surface.
 */
import { expect, type Page, type Locator } from "playwright/test";

export const stamp = () => `${Date.now()}`;

const TYPE_DEFAULTS: Record<string, string> = {
  date: "2030-01-01",
  "datetime-local": "2030-01-01T10:00",
  time: "10:00",
  number: "100",
  email: "e2e@test.example",
  url: "https://example.com",
  tel: "305-555-0100",
};

async function fillSmart(el: Locator, value: string) {
  const tag = await el.evaluate((e) => e.tagName);
  if (tag === "SELECT") {
    // Resolve the target option WITHOUT a failing selectOption (which would
    // retry for the full action timeout). Match the passed value by option
    // value or label; otherwise pick the first non-empty option.
    const opts = await el
      .locator("option")
      .evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, l: (o.textContent || "").trim() })));
    const match = opts.find((o) => o.v === value || o.l === value);
    const target = match?.v ?? opts.find((o) => o.v)?.v;
    if (target) await el.selectOption(target);
    return;
  }
  const type = (await el.getAttribute("type")) || "text";
  if (type === "checkbox") return el.check();
  if (type === "date") return el.fill(value.slice(0, 10));
  if (type === "datetime-local") return el.fill(value.includes("T") ? value : `${value}T10:00`);
  if (type === "number") return el.fill(value.replace(/[^\d.]/g, "") || "100");
  return el.fill(value);
}

export async function createInModule(page: Page, route: string, fields: Record<string, string> = {}) {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (!(await el.count())) continue;
    // RecordCombobox (audit A-06) renders the named field as a HIDDEN input
    // beside a cmdk combobox — fillSmart would wait forever on visibility
    // (this ate the PO chain on prod, 2026-07-17). Drive the combobox: open
    // the trigger in the same container, type the label, pick the option.
    if ((await el.getAttribute("type")) === "hidden") {
      const wrapper = el.locator("xpath=..");
      await wrapper.locator('button[role="combobox"]').first().click();
      const search = page.locator('[cmdk-input], input[cmdk-input=""], [role="dialog"] input, [data-radix-popper-content-wrapper] input').first();
      await search.fill(value);
      await page
        .locator('[cmdk-item], [role="option"]')
        .filter({ hasText: value })
        .first()
        .click({ timeout: 15_000 });
      continue;
    }
    await fillSmart(el, value);
  }
  const required = await page.locator("main form [required]").all();
  for (const el of required) {
    const current = await el.inputValue().catch(() => "x");
    if (current) continue;
    const tag = await el.evaluate((e) => e.tagName);
    if (tag === "SELECT") {
      const vals = await el
        .locator("option")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      if (vals[0]) await el.selectOption(vals[0]);
      continue;
    }
    const type = (await el.getAttribute("type")) || "text";
    if (type === "checkbox") await el.check();
    else await el.fill(TYPE_DEFAULTS[type] ?? "E2E Test");
  }
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  // Redirect-off-/new can be slow on a remote target: the FIRST create against a
  // heavy surface pays a serverless cold-start (observed ~54s for a cold finance
  // invoice create; the same create is ~5s warm). 75s clears the cold case; it's
  // a ceiling, not a delay, so warm creates still return in <1s.
  await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 75000 });
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
}
