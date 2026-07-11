import { test, expect } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace, suppressTour } from "./helpers/auth";
import { FIXTURE_PROJECT } from "./helpers/fixtures";

/**
 * Kit 27 — the advance merge engine's authoring + send surfaces (P2).
 *
 * Read/reachability coverage: the packet composer rides the project's
 * Advancing tab set, the merge console lives under Comms, and both teach
 * their first action instead of rendering a stub. Mutation flows (packet
 * → audience → live → batch → send) stay out of the shared fixture org —
 * they clobber durable fixtures and belong to a dedicated seeder pass.
 */
test.beforeEach(async ({ page }) => {
  await suppressTour(page);
});

test.describe("Advance merge engine — authoring + console (kit 27)", () => {
  test("the packet composer is the third Advancing tab and teaches packet creation", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
    await page.goto(`/studio/projects/${FIXTURE_PROJECT.id}/advancing/packet`);
    await expect(page.getByRole("heading", { name: "Advance Packet" }), "packet composer renders").toBeVisible({
      timeout: 15_000,
    });
    // Either the empty-state CTA (no packet yet) or the live composer
    // (packet exists) — both prove the surface, not a stub.
    const createCta = page.getByRole("button", { name: "Create Packet" });
    const sectionsHeading = page.getByRole("heading", { name: "Sections" });
    await expect(createCta.or(sectionsHeading).first()).toBeVisible({ timeout: 15_000 });
  });

  test("the Doc Specs tab links across to the Packet tab", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
    await page.goto(`/studio/projects/${FIXTURE_PROJECT.id}/advancing`);
    await expect(page.getByRole("link", { name: "Packet", exact: true }), "third tab present").toBeVisible({
      timeout: 15_000,
    });
  });

  test("the merge console lists send batches under Comms", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
    await page.goto("/studio/comms/advances");
    await expect(page.getByRole("heading", { name: "Advance Sends" }), "console renders").toBeVisible({
      timeout: 15_000,
    });
  });

  test("preparing a send requires a LIVE packet (S1 gate)", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
    await page.goto("/studio/comms/advances/new");
    await expect(page.getByRole("heading", { name: "Prepare Advance Send" })).toBeVisible({ timeout: 15_000 });
    // With no live packet in the fixture org the page teaches the path to
    // one; with a live packet it offers the picker. Both are honest states.
    const noneState = page.getByText("No Live Packets");
    const packetPicker = page.locator("select[name='packet_id']");
    await expect(noneState.or(packetPicker).first()).toBeVisible({ timeout: 15_000 });
  });

  test("org advancing presets settings page renders the matrix editor", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
    await page.goto("/studio/settings/advancing");
    await expect(page.getByRole("heading", { name: "Advancing Presets" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Add Preset Row")).toBeVisible({ timeout: 15_000 });
  });
});
