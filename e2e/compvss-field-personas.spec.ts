/**
 * COMPVSS field PWA (/m) — per-persona CRUD journeys.
 *
 * Phase 2 of the per-product / per-persona suite (mirrors the STYLE of
 * `e2e/atlvs-console-personas.spec.ts`). Persona = `crew`: the deskless
 * field-workforce user that resolveShell lands in the COMPVSS mobile shell
 * (`data-platform="compvss"`).
 *
 * Unlike the ATLVS console (which gates writes by ROLE BAND via isManagerPlus),
 * the /m surfaces are the crew's OWN-record workspace — clock punches, time-off
 * asks, daily logs, quick-filed incidents. The journeys below do each mutation
 * and assert it took (state flip / redirect / no error surface).
 *
 * Form shapes on /m are NOT uniform:
 *   • Clock        — button journey (CheckInControls: "Clock In" / "Clock Out").
 *   • Time-off     — kit FormScreen (data-driven; no native <form>/name attrs,
 *                    submit is the CTA labelled by def.submit = "Submit Request").
 *   • Daily log    — native <form action> with name= fields + "Save Log" CTA.
 *   • Incident     — native <form action> one textarea + "File Incident" CTA.
 *
 * Fixture: the seeded `test+crew@flyingbluewhale.app` user (persona=crew,
 * member of "Test Professional Org", which is its last_org_id → active org).
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

const ERROR_BOUNDARY = /something went wrong|application error|unhandled|digest:/i;

/** Assert the page rendered a heading and no error boundary / action error. */
async function expectRendered(page: Page) {
  await expect(page.locator(".scr-h, h1").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
}

test.describe("COMPVSS field · crew", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  // ── Shell + auth ────────────────────────────────────────────────────────
  test("crew lands in /m with the COMPVSS shell", async ({ page }) => {
    await page.goto("/m");
    expect(page.url(), "crew persona resolves to the mobile shell").toMatch(/\/m(\/|\?|$)/);
    await expect(page.locator('[data-platform="compvss"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test("cleared-session /m renders the COMPVSS onboarding shell (not /login)", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/m");
    await expect(page.locator(".compvss-onboarding-shell").first()).toBeVisible({ timeout: 15_000 });
    expect(page.url(), "logged-out /m owns the screen — it must not bounce to /login").not.toMatch(/\/login/);
  });

  // ── Clock (button journey) ──────────────────────────────────────────────
  test("Clock: clock in → clock out", async ({ page }) => {
    await page.goto("/m/clock");
    await expectRendered(page);

    // Normalize to a clocked-OUT baseline: if a prior run left an entry open,
    // the CTA reads "Clock out". The toggle's optimistic state is driven by a
    // server prop refreshed via router.refresh(), so a single click can race a
    // still-settling refresh and leave an entry open. Drive the journey off the
    // SERVER truth: reload between toggles and drain to a clocked-OUT baseline.
    const clockInBtn = page.getByRole("button", { name: /^clock in$/i });
    const clockOutBtn = page.getByRole("button", { name: /^clock out$/i });

    // Drain any open entries to a clean clocked-OUT baseline (up to 5).
    for (let i = 0; i < 5; i++) {
      if (!(await clockOutBtn.count())) break;
      await clockOutBtn.first().click();
      await page.waitForLoadState("load");
      await page.reload();
      await expectRendered(page);
    }
    await expect(clockInBtn, "drained to a clocked-out baseline").toBeVisible({ timeout: 15_000 });

    // Clock IN — the CTA flips to "Clock out" once a time_entries row opens.
    await clockInBtn.click();
    await expect(
      clockOutBtn,
      "clock-in opened a time entry (CTA flipped to Clock out)",
    ).toBeVisible({ timeout: 15_000 });
    // No RLS / action error surfaced (the .te-clock danger alert).
    await expect(page.getByRole("alert").filter({ hasText: /already|not clocked|violates|error/i })).toHaveCount(0);
    // Confirm the open entry on the server, not just the optimistic UI.
    await page.reload();
    await expectRendered(page);
    await expect(clockOutBtn, "open entry persisted server-side").toBeVisible({ timeout: 15_000 });

    // Clock OUT — drain to clocked-out (server truth). The toggle is optimistic
    // and a single tab can hold at most one open entry, but reloading between
    // clicks guarantees each clock-out targets the freshly-confirmed open row.
    for (let i = 0; i < 5; i++) {
      if (!(await clockOutBtn.count())) break;
      await clockOutBtn.first().click();
      await page.waitForLoadState("load");
      await page.reload();
      await expectRendered(page);
    }
    await expect(
      clockInBtn,
      "clock-out closed the entry (CTA flipped back to Clock in)",
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── Time-off request (kit FormScreen) ───────────────────────────────────
  test("Time-off: request → lands on /m/time-off with no error", async ({ page }) => {
    await page.goto("/m/time-off/new");
    await expectRendered(page);

    // Kit FormScreen has no name= attrs; fill controls by type. timeoff =
    // From (date, req) · To (date, req) · Type (select) · Notes (textarea).
    const dates = page.locator(".formscreen input[type='date']");
    await expect(dates.first()).toBeVisible({ timeout: 10_000 });
    await dates.nth(0).fill("2030-03-01"); // From
    await dates.nth(1).fill("2030-03-03"); // To
    const notes = page.locator(".formscreen textarea").first();
    if (await notes.count()) await notes.fill(`E2E crew time-off ${Date.now()}`);

    // The CTA is enabled only once required fields are set; def.submit text.
    await page.getByRole("button", { name: /submit request/i }).click();

    // Success routes back to the list; failure keeps /new + shows the alert.
    await expect(page).toHaveURL(/\/m\/time-off(\?|$)/, { timeout: 20_000 });
    await expect(
      page.locator(".ps-alert--danger"),
      "no policy/RLS error on the time-off request",
    ).toHaveCount(0);
  });

  // ── Daily log (native form) ─────────────────────────────────────────────
  test("Daily log: create → lands on /m/daily-log with no error", async ({ page }) => {
    await page.goto("/m/daily-log/new");
    await expectRendered(page);

    // The form only renders when the org has projects (it does for the crew
    // org). Project select + date are pre-filled defaults; add notes for a
    // recognizable row, then submit.
    const form = page.locator("main form, .screen form").first();
    await expect(form).toBeVisible({ timeout: 10_000 });
    await page.locator("textarea[name='notes']").fill(`E2E crew daily log ${Date.now()}`);
    await page.getByRole("button", { name: /save log/i }).click();

    await expect(page).toHaveURL(/\/m\/daily-log(\?|$)/, { timeout: 20_000 });
    await expect(page.locator(".ps-alert--danger"), "no error on daily-log save").toHaveCount(0);
  });

  // ── Incident quick-file (native form) ───────────────────────────────────
  test("Incident: quick-file → lands on /m/incident with no error", async ({ page }) => {
    await page.goto("/m/incident/new");
    await expectRendered(page);

    await page.locator("textarea[name='summary']").fill(`E2E crew incident ${Date.now()}`);
    await page.getByRole("button", { name: /file incident/i }).click();

    await expect(page).toHaveURL(/\/m\/incident(\?|$)/, { timeout: 20_000 });
    await expect(page.locator(".ps-alert--danger"), "no RLS error on incident file").toHaveCount(0);
  });

  // ── Read / hydration surfaces ───────────────────────────────────────────
  for (const route of ["/m/feed", "/m/advances", "/m/docs", "/m/directory", "/m/check-in", "/m/tasks"]) {
    test(`renders without an error boundary: ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(route);
      await expectRendered(page);
      expect(errors, `${route} threw a client-side error`).toEqual([]);
    });
  }
});
