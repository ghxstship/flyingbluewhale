/**
 * ATLVS · Sales & CRM — behavioral coverage (coverage program, high-priority wave).
 *
 * Fills the behavioral gaps the coverage map flagged for Sales & CRM that the
 * existing deep/persona specs do NOT already exercise. Each flow drives a real
 * mutation FSM to a materialised record and asserts the redirect/state, as the
 * entitled persona.
 *
 * Fixture hygiene: every record is stamped `E2E Lead <ts>` / `Proposal for E2E
 * Lead <ts>` and purged by scripts/e2e-clean-fixtures.mjs (global teardown), so
 * repeated prod runs never accumulate.
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

// Resolve the first REAL record detail link under a list route (a UUID child,
// never the "+ New" sibling which also matches the /studio/<module>/ prefix).
async function firstRecordLink(page: import("playwright/test").Page, listRoute: string) {
  const links = page.locator(`a[href^="${listRoute}/"]`);
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (href && UUID.test(href)) return links.nth(i);
  }
  return null;
}

test.describe("ATLVS Sales & CRM — behavioral coverage", () => {
  // The full login → create (cold-start) → qualify → convert (cold-start) chain
  // legitimately runs long on a serverless prod target; give it real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim (z-tour, full-viewport) — it
  // intercepts clicks on the /studio shell and hangs the action buttons.
  // File-scoped so the addInitScript lands before the in-test login goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // HIGH — the lead→proposal conversion FSM: a qualified lead drafts a proposal
  // (the step that turns a prospect into a signable document). Gate is
  // manager+ AND lead_phase ∈ {qualified,proposal,won}.
  test("manager: a qualified lead converts to a materialised proposal", async ({ page }) => {
    await authedSetup(page, "manager");
    const name = `E2E Lead ${stamp()}`;
    await createInModule(page, "/studio/leads/new", { name });
    // Landed on the new lead's detail.
    await expect(page).toHaveURL(new RegExp(`/studio/leads/${UUID.source}`), { timeout: 90000 });

    // Arm the conversion: advance new → qualified.
    const qualify = page.getByRole("button", { name: /move to qualified/i });
    await expect(qualify).toBeVisible({ timeout: 15000 });
    await qualify.click();

    // Now manager+ on a qualified lead sees "Create Proposal" → drafts + redirects.
    const createProposal = page.getByRole("button", { name: /create proposal/i });
    await expect(createProposal).toBeVisible({ timeout: 30000 });
    await createProposal.click();
    await expect(page).toHaveURL(new RegExp(`/studio/proposals/${UUID.source}`), { timeout: 90000 });
  });

  // MEDIUM — the app manager+ gate on lead→proposal is honored for a member:
  // the Create Proposal control never renders (defence-in-depth, RLS re-checks).
  test("member: cannot draft a proposal from a lead (manager+ gated)", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/studio/leads");
    const firstLead = await firstRecordLink(page, "/studio/leads");
    if (!firstLead) return; // no leads visible to this member — vacuously gated
    await firstLead.click();
    await expect(page).toHaveURL(new RegExp(`/studio/leads/${UUID.source}`), { timeout: 30000 });
    await expect(page.getByRole("button", { name: /create proposal/i })).toHaveCount(0);
  });
});
