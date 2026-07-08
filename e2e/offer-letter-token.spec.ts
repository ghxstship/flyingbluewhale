import { test, expect } from "./helpers/base";
import { dismissConsent } from "./helpers/auth";
import { OFFER_LETTER_FIXTURE as O } from "./helpers/fixtures";

/**
 * H7 — the public offer-letter token flow. The audit found forms-public only
 * exercised the NEGATIVE (nonexistent token renders the unlock form) — no real
 * letter was ever seeded, so the access-code GATE and the unlock→accept/decline
 * positive path had no coverage.
 *
 * Bound to a seeded `sent` letter with a real frozen snapshot (token +
 * access-code in e2e/helpers/fixtures.ts). Non-destructive: the correct-code
 * test opens the letter and asserts the sign-off controls render but never
 * accepts or declines, so the fixture stays `sent` across runs.
 *
 * (The dead public-forms surface — 0 of 37 form_defs have fields, 2 submissions
 * ever — is intentionally NOT covered; the legacy v1 form renderer was removed.)
 */
const url = `/offer/${O.token}`;

test.describe("Public offer letter — token unlock gate (H7)", () => {
  test("a real locked letter renders the access-code gate", async ({ page }) => {
    await dismissConsent(page);
    const res = await page.goto(url);
    expect(res?.status(), "the offer surface is publicly reachable").toBe(200);
    await expect(page.locator('input[name="access_code"]'), "the access-code gate is shown").toBeVisible({
      timeout: 15_000,
    });
  });

  test("a WRONG access code is refused", async ({ page }) => {
    await dismissConsent(page);
    await page.goto(url);
    await page.locator('input[name="access_code"]').fill("WRONGCODE");
    await page.getByRole("button", { name: /open letter/i }).click();
    await expect(
      page.getByText(/invalid token or access code|withdrawn/i).first(),
      "the gate refuses a wrong code",
    ).toBeVisible({ timeout: 10_000 });
  });

  test("the CORRECT access code unlocks the letter + accept/decline controls", async ({ page }) => {
    await dismissConsent(page);
    await page.goto(url);
    await page.locator('input[name="access_code"]').fill(O.accessCode);
    await page.getByRole("button", { name: /open letter/i }).click();
    // Unlocked: no invalid-code error, and the sign-off controls (Accept and
    // Sign / Decline) render for a `sent` letter. Non-destructive — neither is
    // submitted, so the fixture stays `sent`.
    await expect(page.getByText(/invalid token or access code/i)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /accept and sign/i }),
      "the accept control renders after unlock",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /^decline$/i }), "the decline control renders").toBeVisible();
  });
});
