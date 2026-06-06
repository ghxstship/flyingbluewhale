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

export async function createInModule(page: Page, route: string, fields: Record<string, string> = {}) {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (await el.count()) await fillSmart(el, value);
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
  await expect(page).not.toHaveURL(/\/new(\?|$)/, { timeout: 35000 });
  await expect(page.getByRole("alert").filter({ hasText: /error|failed|invalid/i })).toHaveCount(0);
}
