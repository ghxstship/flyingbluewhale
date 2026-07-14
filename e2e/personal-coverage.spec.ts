/**
 * Personal · /me + marketing/auth — behavioral coverage (coverage program).
 *
 * Fills the mutation/transition gaps the coverage map flagged for the personal
 * shell + the public marketing/auth intakes that the existing personal-* and
 * marketplace-* specs do NOT already exercise. Each flow drives a real server
 * action (or a client confirm-gate) and asserts the resulting state, as the
 * entitled persona (anon for the public marketing intakes; a bare member for
 * the /me surfaces — every authed user is entitled here, none are role-gated).
 *
 * Fixture hygiene: the two create flows stamp their record (`E2E Contact <ts>`
 * / `E2E Integration <ts>`) so scripts/e2e-clean-fixtures.mjs (global teardown)
 * purges them; the notification transition is self-restoring (mark-done → undo)
 * and the delete-gate flow performs NO mutation (it asserts the confirm gate
 * blocks, then closes without firing the irreversible delete).
 *
 * Deliberately deferred (need seed/infra not present — see the task notes):
 *   MFA enroll/verify/unenroll + /mfa/challenge (needs a TOTP generator +
 *   MFA-enrolled fixture), password-reset + accept-invite (service-role token
 *   minting), org onboarding (fresh no-org user), org-switch (multi-org fixture
 *   + shared last_org_id race), offer decline (needs a live sent offer to the
 *   fixture recipient), signup fresh-email (creates un-teardownable auth.users),
 *   profile public-EPK toggle (mutates a shared user_profiles row other personal
 *   specs read, no per-test entity to purge), and store cart-edit (needs a
 *   seeded published store product + service role; low priority).
 */
import { expect, test } from "./helpers/base";
import { authedSetup, suppressTour } from "./helpers/auth";
import { stamp } from "./helpers/forms";

test.describe("Personal · /me + marketing/auth — behavioral coverage", () => {
  // Public intakes can pay a serverless cold-start on the first submit against a
  // remote target; give the chain real headroom.
  test.describe.configure({ timeout: 300000 });

  // Suppress the first-run ConsoleTour scrim so it can't intercept clicks on any
  // authed surface. File-scoped so addInitScript lands before the in-test goto.
  test.beforeEach(async ({ page }) => suppressTour(page));

  // ──────────────────────────────────────────────────────────────────────
  // Marketing · Contact / lead capture (anon)
  // ──────────────────────────────────────────────────────────────────────

  // MEDIUM — the contact intake writes a `leads` row against the house org (or
  // emails sales) and confirms in place. Anon; no auth. Stamped for teardown.
  test("anon: contact form submits and confirms lead capture", async ({ page }) => {
    await page.goto("/contact");
    const name = `E2E Contact ${stamp()}`;
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="email"]').fill("e2e@test.example");
    await page.locator('textarea[name="message"]').fill("E2E behavioral coverage — please ignore.");

    await page.locator('form button[type="submit"]').click();

    // Either the success confirmation (role=status) or an intake-unavailable
    // error surfaces. On a fully-configured target the success renders; in a
    // stripped env with neither a service client nor email we skip honestly.
    // Scope to <main>: the root layout mounts a global sr-only role=status AND
    // role=alert live region (LiveRegionProvider) OUTSIDE main — an unscoped
    // getByRole would always match those 1px-visible regions and break the race.
    const success = page.locator("main").getByRole("status");
    const alert = page.locator("main").getByRole("alert");
    await expect(success.or(alert)).toBeVisible({ timeout: 60000 });
    if (await alert.isVisible().catch(() => false)) {
      const txt = (await alert.innerText()).toLowerCase();
      test.skip(/record|unavailable|try again|couldn/i.test(txt), "contact intake backend unavailable in this env");
    }
    await expect(success).toBeVisible();
    await expect(success).toContainText(/touch|got it/i);
  });

  // MEDIUM — an empty submit is blocked by the required-field validation before
  // any network call (the name field stays :invalid, no confirmation renders).
  test("anon: contact form blocks an empty submit (required-field validation)", async ({ page }) => {
    await page.goto("/contact");
    await page.locator('form button[type="submit"]').click();
    // Native HTML5 constraint validation refuses the submit → the required name
    // input reports :invalid and no success status is rendered.
    await expect(page.locator('input[name="name"]:invalid')).toHaveCount(1);
    // Scope to <main> — the global sr-only role=status live region (root layout)
    // would otherwise register a phantom match here.
    await expect(page.locator("main").getByRole("status")).toHaveCount(0);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Marketing · Partner Integration submission (anon)
  // ──────────────────────────────────────────────────────────────────────

  // LOW — a partner-integration proposal writes `partner_integrations` (service
  // client) and redirects to the /thanks confirmation. Anon; stamped for teardown.
  test("anon: partner-integration submission lands on the thanks confirmation", async ({ page }) => {
    await page.goto("/integrations/submit");
    const st = stamp();
    await page.locator('input[name="name"]').fill(`E2E Integration ${st}`);
    await page.locator('input[name="slug"]').fill(`e2e-int-${st}`);
    await page.locator('input[name="partner_org_name"]').fill("E2E Partner Org");
    await page.locator('input[name="partner_contact_email"]').fill("e2e@test.example");
    await page.locator('input[name="short_description"]').fill("E2E behavioral coverage partner integration fixture.");
    // `category` defaults to "field"; the remaining fields are optional.

    await page.locator('form button[type="submit"]').click();

    // Success redirects to the thanks page; a stripped env (no service client)
    // surfaces "temporarily unavailable" in the FormShell error alert → skip.
    // Scope the error race to <main>: FormShell renders its error Alert inside
    // main, while the root layout's global sr-only role=alert live region sits
    // OUTSIDE main and is always 1px-"visible" — an unscoped waitFor would win
    // the race instantly on every run and defeat the thanks detection.
    const thanks = page.waitForURL(/\/integrations\/submit\/thanks/, { timeout: 60000 }).then(() => "thanks" as const);
    const errored = page
      .locator("main")
      .getByRole("alert")
      .waitFor({ state: "visible", timeout: 60000 })
      .then(() => "error" as const);
    const outcome = await Promise.race([thanks, errored]);
    if (outcome === "error") {
      const txt = (await page.locator("main").getByRole("alert").innerText()).toLowerCase();
      test.skip(/unavailable|try again/i.test(txt), "partner-integration intake unavailable in this env");
    }
    await expect(page).toHaveURL(/\/integrations\/submit\/thanks/, { timeout: 60000 });
  });

  // ──────────────────────────────────────────────────────────────────────
  // /me · Privacy — account-deletion confirm gate
  // ──────────────────────────────────────────────────────────────────────

  // LOW (gated-denial) — the destructive account delete is gated behind a typed
  // confirmation phrase. Assert the dialog's Delete button stays disabled until
  // the exact phrase is entered; NEVER fire the irreversible delete.
  test("member: account deletion requires the typed confirmation phrase", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/me/privacy");

    // The card action opens the confirm dialog (no dialog rendered yet, so this
    // matches only the card trigger).
    await page.getByRole("button", { name: /delete account/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const confirmBtn = dialog.getByRole("button", { name: /delete account/i });
    const phraseInput = dialog.getByRole("textbox");

    // Gate closed on open, and on a near-miss phrase.
    await expect(confirmBtn).toBeDisabled();
    await phraseInput.fill("delete my accounts");
    await expect(confirmBtn).toBeDisabled();

    // Exact phrase arms the control (but we do NOT click it).
    await phraseInput.fill("delete my account");
    await expect(confirmBtn).toBeEnabled();

    // Back out without deleting.
    await dialog.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
  });

  // ──────────────────────────────────────────────────────────────────────
  // /me · Notifications Inbox triage
  // ──────────────────────────────────────────────────────────────────────

  // MEDIUM — the mark-done → undo restore loop. Marking a row done drops it from
  // the active inbox; Undo restores it. Net-zero (self-restoring), so no
  // teardown; vacuously skips when the fixture has no active notifications.
  test("member: mark a notification done then undo restores it to the inbox", async ({ page }) => {
    await authedSetup(page, "member");
    await page.goto("/me/notifications/inbox?tab=all");

    const rows = page.locator("ul.surface > li");
    const before = await rows.count();
    test.skip(before === 0, "no active notifications for the fixture user — nothing to triage");

    // Only rows in the default (non-restoreable) state expose a Mark-done control;
    // snoozed/done rows show Undo instead. Skip if none are markable.
    const markDone = page.getByRole("button", { name: /^mark done$/i });
    const markable = await markDone.count();
    test.skip(markable === 0, "no markable notifications (all snoozed/restoreable) — nothing to triage");

    await markDone.first().click();
    // The row leaves the "all" list once done.
    await expect(rows).toHaveCount(before - 1, { timeout: 20000 });

    // The Done tab now carries at least the row we just marked; undo restores it.
    await page.goto("/me/notifications/inbox?tab=done");
    const doneRows = page.locator("ul.surface > li");
    await expect(doneRows.first()).toBeVisible({ timeout: 20000 });
    const doneBefore = await doneRows.count();

    await page.getByRole("button", { name: /restore to inbox/i }).first().click();
    await expect(doneRows).toHaveCount(doneBefore - 1, { timeout: 20000 });
  });
});
