import { test, expect } from "./helpers/base";
import { dismissConsent } from "./helpers/auth";

/**
 * T1-4 · Kiosk / shared-device punch mode — render-tier skeleton.
 *
 * The kiosk shell is SESSION-LESS by design (its credential is the httpOnly
 * device-token cookie), so its teaching states are reachable without any
 * login fixture. Full punch-path coverage (register device → set PIN →
 * PIN punch → lockout) needs the kiosk migration applied and a manager
 * fixture registering a device; those flows land once
 * `20260723150000_kiosk_shared_device_punch` is applied.
 */

test.beforeEach(async ({ page }) => {
  await dismissConsent(page);
});

test("kiosk · unregistered device gets the teaching screen, not an auth wall", async ({ page }) => {
  await page.goto("/m/kiosk", { waitUntil: "domcontentloaded" });
  // Session-less render: either the register teaching state (service role
  // configured) or the honest not-configured state — never a login redirect.
  await expect(page).toHaveURL(/\/m\/kiosk/);
  await expect(page.getByRole("heading", { name: /time clock kiosk/i })).toBeVisible();
});

test("kiosk · identify API refuses an unregistered device", async ({ request }) => {
  const res = await request.post("/api/v1/kiosk/identify", {
    data: { method: "pin", secret: "4827" },
  });
  // 401 device_unregistered (no cookie) or 503 when the deployment has no
  // service role — both are honest refusals; a 2xx here would mean the
  // device boundary is broken.
  expect([401, 503]).toContain(res.status());
});

test("kiosk · punch API refuses an unregistered device", async ({ request }) => {
  const res = await request.post("/api/v1/kiosk/punch", {
    data: { method: "pin", secret: "4827", action: "clock_in" },
  });
  expect([401, 503]).toContain(res.status());
});

test("kiosk · PIN self-serve page renders its form", async ({ page }) => {
  await page.goto("/m/kiosk/pin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /my punch pin/i })).toBeVisible();
  await expect(page.locator("#pin")).toBeVisible();
  await expect(page.locator("#confirm")).toBeVisible();
});
