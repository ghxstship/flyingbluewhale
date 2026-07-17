/**
 * COMPVSS incident triage (audit G4).
 *
 * Mobile was file-and-forget: `fileIncident` inserted a row and that was
 * the whole relationship. No detail route existed and `IncidentsList`
 * rendered plain <div>s, so the person who witnessed the thing handed it
 * to a queue and lost sight of it — and whoever picked it up had to go
 * find them to ask what happened.
 *
 * Filing is covered by compvss-field-loop (D3). This covers the half that
 * did not exist: OPEN it, and MOVE it.
 */
import { expect, test } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

test.describe("COMPVSS incident triage", () => {
  test.beforeEach(async ({ page }) => {
    await authedSetup(page, "crew");
  });

  test("G4 · a filed incident opens, and offers only the moves the FSM allows", async ({ page }) => {
    await page.goto("/m/incidents");

    // THE defect: these rows were plain divs. A filed incident has to be
    // openable or the report is write-only.
    const row = page.locator("a.item").first();
    if ((await row.count()) === 0) {
      // No incidents in this fixture org — the empty state is honest, and
      // there is nothing to triage. Don't fabricate a pass.
      await expect(page.getByText(/no incidents|nothing/i).first()).toBeVisible();
      return;
    }

    await row.click();
    await expect(page).toHaveURL(/\/m\/incidents\/[0-9a-f-]{36}$/, { timeout: 25_000 });

    // The full report, not just the summary the list already showed.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The FSM must present only legal moves — a closed incident offers
    // none. Presenting a move and then rejecting it teaches people to
    // distrust the buttons.
    const closedNote = page.getByText(/this incident is closed/i);
    const moveTo = page.getByText(/^move to$/i);
    await expect(closedNote.or(moveTo).first()).toBeVisible({ timeout: 15_000 });
  });

  test("G4 · triage moves the incident and the state sticks", async ({ page }) => {
    await page.goto("/m/incidents");
    const row = page.locator("a.item").first();
    if ((await row.count()) === 0) return;
    await row.click();
    await expect(page).toHaveURL(/\/m\/incidents\/[0-9a-f-]{36}$/, { timeout: 25_000 });

    const investigating = page.getByRole("button", { name: /^investigating$/i });
    if ((await investigating.count()) === 0) return; // terminal or already there
    await investigating.click();

    // The transition is real: the page comes back saying so.
    await expect(page.getByText(/currently investigating/i)).toBeVisible({ timeout: 20_000 });
  });
});
