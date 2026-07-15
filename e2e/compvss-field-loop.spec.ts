/**
 * COMPVSS Phase 2 — the daily field loop.
 *
 * Guards the parity work from `docs/compvss/MOBILE_PARITY_AUDIT.md`:
 *
 *   G6  /m/schedule answers "when and where do I work?" from `shifts`,
 *       scoped to the viewer — it used to list org-wide `events` with no
 *       user predicate and call every row a shift.
 *   G13 A crew member can CREATE a task. Mobile was complete-only, so
 *       anything spotted on site had to survive until someone found a desk.
 *   D3  The incident form captures real photos (a real file input, not the
 *       counter that rendered "3 photos added" and stored none).
 *
 * These are browser-driven on purpose. The capture and form paths are
 * controlled React state behind the kit FormScreen: setting `input.value`
 * from devtools updates the DOM but not the component, so only real user
 * input proves the flow. Playwright's fill/click generate genuine events.
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

async function expectNoError(page: Page) {
  await expect(page.locator("body")).not.toHaveText(ERROR_BOUNDARY);
}

test.describe("COMPVSS daily field loop", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "crew");
  });

  test("G6 · schedule leads with the viewer's own shift, not the org calendar", async ({ page }) => {
    await page.goto("/m/schedule");
    await expectNoError(page);

    // The viewer's shift section is the first thing on the page — the org
    // calendar is demoted to context beneath it.
    const sections = page.locator(".sech h2");
    await expect(sections.first()).toHaveText(/your shift today/i);
    await expect(page.locator(".sech h2", { hasText: /production calendar/i })).toBeVisible();

    // The eyebrow counts SHIFTS (the viewer's), never org events.
    await expect(page.locator(".scr-eye")).toHaveText(/\d+ shifts?$/i);

    // Whichever branch renders, it must be honest: either a real shift card
    // with a clock-in path, or an explicit "no shift" state. Never a
    // fabricated row.
    const card = page.locator(".te-clock");
    const empty = page.getByText(/no shift today/i);
    await expect(card.or(empty).first()).toBeVisible();
    if (await card.count()) {
      await expect(card.locator('a[href="/m/clock"]')).toBeVisible();
    }
  });

  test("G13 · a crew member can create a task from the field", async ({ page }) => {
    await page.goto("/m/tasks");
    await expectNoError(page);

    await page.getByRole("link", { name: /new task/i }).click();
    await expect(page).toHaveURL(/\/m\/tasks\/new$/);

    const title = `E2E field task ${Date.now()}`;
    await page.getByPlaceholder("What needs doing?").fill(title);

    // The submit is gated on required fields; with a title it must arm.
    const submit = page.getByRole("button", { name: /create task/i });
    await submit.click();

    // Server action redirects to the list on success, and the new task is
    // there — assigned to the caller, so it lands in their own list.
    await expect(page).toHaveURL(/\/m\/tasks$/, { timeout: 15_000 });
    await expect(page.getByText(title)).toBeVisible();
  });

  test("G13 · the task form does not offer invented assignees", async ({ page }) => {
    await page.goto("/m/tasks/new");
    await expectNoError(page);
    // The kit spec used to ship fabricated people ("Cy R.", "Lo M.") in an
    // assignee select that read no roster.
    await expect(page.locator("body")).not.toHaveText(/Cy R\.|Lo M\.|Load-out crew/);
  });

  test("D3 · the incident form exposes a real file input, not a counter", async ({ page }) => {
    await page.goto("/m/incidents/new");
    await expectNoError(page);

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
    await expect(fileInput).toHaveAttribute("accept", /image/);

    // Attaching a real image must surface a real attachment, and the label
    // must not claim more than was captured.
    await fileInput.setInputFiles({
      name: "evidence.png",
      mimeType: "image/png",
      // 1x1 PNG.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
    });

    await expect(page.locator(".dropz")).toHaveText(/1 photo attached/i);
    // A thumbnail of the actual bytes, not a count.
    await expect(page.locator('img[alt="evidence.png"]')).toBeVisible();
  });
});

test.describe("COMPVSS daily log", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "crew");
  });

  test("G9 · a draft log can be submitted from the field", async ({ page }) => {
    await page.goto("/m/daily-log/new");
    await expectNoError(page);

    // The form is a native multipart form, so the photo field must be a
    // real input — the site diary is the one artifact the phone should be
    // best at.
    await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(1);

    const notes = `E2E daily log ${Date.now()}`;
    await page.locator('textarea[name="notes"]').fill(notes);
    await page.getByRole("button", { name: /save log/i }).click();

    await expect(page).toHaveURL(/\/m\/daily-log$/, { timeout: 15_000 });

    // A draft must offer Submit — that path did not exist on mobile at all,
    // so a log authored on site had to wait for a desktop.
    const submit = page.getByRole("button", { name: /^submit$/i }).first();
    await expect(submit).toBeVisible();
    await submit.click();

    // The row leaves draft. Approval is the console's step, so the field
    // must NOT be offered it.
    await expect(page.getByText("submitted").first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("COMPVSS shift swap", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "crew");
  });

  test("G8 · the swap ask exists on the viewer's own shift, or there is no shift to ask about", async ({ page }) => {
    await page.goto("/m/schedule");
    await expectNoError(page);

    // Both shells could DECIDE a swap and neither could FILE one — every
    // shift_swaps call site was a select or an update. The ask now hangs
    // off the shift card itself.
    const swapCta = page.getByRole("button", { name: /can't make it/i });
    const noShift = page.getByText(/no shift today/i);

    if ((await swapCta.count()) === 0) {
      // Honest branch: no rostered shift for this fixture user, so there is
      // nothing to swap. The card must say so rather than offer a dead CTA.
      await expect(noShift).toBeVisible();
      return;
    }

    // Two-tap: the CTA opens a reason field, not an immediate file.
    await swapCta.first().click();
    await expect(page.getByRole("button", { name: /^send$/i })).toBeVisible();
    await expect(page.locator('textarea[id^="swap-reason-"]')).toBeVisible();
  });
});
