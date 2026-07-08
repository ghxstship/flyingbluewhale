/**
 * ATLVS operator console (/studio) — per-persona CRUD journeys.
 *
 * Phase 1 of the per-product / per-persona suite. Covers every OPERATOR
 * persona that lands in the platform shell (resolveShell → /studio):
 *
 *   owner · admin · developer (role=admin) · manager · controller (role=manager)
 *   · collaborator · contractor · member (all role=member, distinct personas)
 *
 * The console authorizes mutations by ROLE BAND (not the persona capability
 * matrix — 108 studio action files gate on `isManagerPlus`, 0 on `can()`), so
 * the journeys are organized as a capability LADDER and each operator is tested
 * both for what it CAN do (full create→edit) and what it must be BLOCKED from:
 *
 *   • requireSession tier — any operator: create a Task.
 *   • isManagerPlus tier  — manager+: create→edit a Project + Finance/invoices.
 *                            collaborator is blocked (action error / AccessDenied).
 *   • admin tier          — owner/admin only: org Settings.
 *                            manager + collaborator get AccessDenied.
 *
 * Fixtures are the seeded `test+<role>@flyingbluewhale.app` users (members of
 * the Test Professional Show org). AccessDenied renders EmptyState
 * "You Don't Have Access" (src/components/ui/AccessDenied.tsx).
 */
import { expect, test, type Page } from "playwright/test";
import { authedSetup } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

type Tier = "admin" | "manager" | "collaborator" | "member";
type Operator = { fixture: string; tier: Tier };

// Resolved from the live DB: developer→role=admin, controller→role=manager,
// collaborator/contractor/member→role=member with distinct personas. The three
// role=member personas share the SAME role band (neither manager+ nor admin),
// so each must be BLOCKED from Project create / Finance / Settings — H3 closes
// the audit gap that contractor + bare member never reached /studio at all.
const OPERATORS: Operator[] = [
  { fixture: "owner", tier: "admin" },
  { fixture: "admin", tier: "admin" },
  { fixture: "developer", tier: "admin" },
  { fixture: "manager", tier: "manager" },
  { fixture: "controller", tier: "manager" },
  { fixture: "collaborator", tier: "collaborator" },
  { fixture: "contractor", tier: "member" },
  { fixture: "member", tier: "member" },
];

const isManagerPlus = (t: Tier) => t === "admin" || t === "manager";
const isAdmin = (t: Tier) => t === "admin";
const ACCESS_DENIED = /you don'?t have access/i;

/** Fill a /new form's named + required fields and submit, WITHOUT asserting
 * success — used for negative (blocked) cases where the action returns an error. */
async function fillAndSubmit(page: Page, route: string, fields: Record<string, string>) {
  await page.goto(route);
  for (const [name, value] of Object.entries(fields)) {
    const el = page.locator(`main [name="${name}"]`).first();
    if (await el.count()) await el.fill(value).catch(() => {});
  }
  await page
    .locator("main form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
}

for (const op of OPERATORS) {
  test.describe(`ATLVS console · ${op.fixture} (${op.tier})`, () => {
    test.describe.configure({ timeout: 180_000 });
    test.beforeEach(async ({ page }) => authedSetup(page, op.fixture));

    test("lands in /studio with the ATLVS shell", async ({ page }) => {
      await page.goto("/studio");
      expect(page.url(), "operator persona resolves to the platform shell").toMatch(/\/studio(\/|\?|$)/);
      await expect(page.locator('[data-platform="atlvs"]').first()).toBeVisible({ timeout: 10_000 });
    });

    // ── requireSession tier — every operator can create a task ──────────────
    test("Task: create (requireSession tier — all operators)", async ({ page }) => {
      await createInModule(page, "/studio/tasks/new", { title: `E2E Task ${op.fixture} ${stamp()}` });
    });

    // ── isManagerPlus tier — Project create → edit ──────────────────────────
    test(`Project: create → edit (${isManagerPlus(op.tier) ? "allowed" : "blocked: manager+ only"})`, async ({
      page,
    }) => {
      if (isManagerPlus(op.tier)) {
        await createInModule(page, "/studio/projects/new", { name: `E2E Project ${op.fixture} ${stamp()}` });
        const m = page.url().match(/\/studio\/projects\/([0-9a-f-]{36})/i);
        expect(m, "landed on the new project detail (id in URL)").toBeTruthy();
        // Edit leg of the CRUD journey.
        await page.goto(`/studio/projects/${m![1]}/edit`);
        const form = page.locator("main form").first();
        await expect(form).toBeVisible({ timeout: 15_000 });
        await form.evaluate((f: HTMLFormElement) => f.requestSubmit());
        await expect(
          page.getByRole("alert").filter({ hasText: /error|failed|invalid/i }),
          "edit save surfaced no error",
        ).toHaveCount(0);
      } else {
        // collaborator (role=member): the create action returns
        // "Only manager+ can create projects" and stays on /new.
        await fillAndSubmit(page, "/studio/projects/new", { name: `E2E Blocked ${stamp()}` });
        await expect(page).toHaveURL(/\/projects\/new(\?|$)/, { timeout: 15_000 });
        await expect(page.getByText(/manager\+? can create projects|manager access/i).first()).toBeVisible({
          timeout: 10_000,
        });
      }
    });

    // ── isManagerPlus tier — Finance (layout AccessDenied gate) ─────────────
    test(`Finance: ${isManagerPlus(op.tier) ? "accessible + invoice create" : "AccessDenied"}`, async ({ page }) => {
      await page.goto("/studio/finance/invoices");
      if (isManagerPlus(op.tier)) {
        await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
        await createInModule(page, "/studio/finance/invoices/new", {});
      } else {
        await expect(page.getByText(ACCESS_DENIED).first()).toBeVisible({ timeout: 10_000 });
      }
    });

    // ── admin tier — org Settings (rank ≥ admin) ────────────────────────────
    test(`Settings/organization: ${isAdmin(op.tier) ? "accessible" : "AccessDenied"}`, async ({ page }) => {
      await page.goto("/studio/settings/organization");
      if (isAdmin(op.tier)) {
        await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
      } else {
        await expect(page.getByText(ACCESS_DENIED).first()).toBeVisible({ timeout: 10_000 });
      }
    });
  });
}
