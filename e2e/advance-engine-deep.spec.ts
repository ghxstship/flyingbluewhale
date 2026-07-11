import { test, expect, type Page } from "./helpers/base";
import { dismissConsent, loginAndSwitchWorkspace, suppressTour } from "./helpers/auth";
import { FIXTURE_PROJECT, ADVANCING_FIXTURE } from "./helpers/fixtures";

/**
 * Kit 27 — the advance merge engine, exercised at full depth: one SERIAL
 * lifecycle that drives every layer the kit added, in the order the
 * product uses them.
 *
 *   packet (create → sections → audience → scoping matrix → voice → live,
 *   which seeds the chase ladder) → merge batch (prepare → queued →
 *   send → delivered via honest skip-send) → recipient portal (token
 *   scoping → opened → structured row → section submit → funnel
 *   submitted) → operator close (complete) → API graph (scopes + token
 *   non-exposure) → presets round-trip → scheduler (event type → default
 *   windows → anonymous /book flow → booked → admin cancel) → the
 *   COMPVSS packet card derived from the same live packet.
 *
 * Serial by design: later tests consume state built by earlier ones (a
 * failed link skips the rest instead of cascading noise). All residue is
 * tagged ("E2E Adv …", "E2E Scheduler …", e2e-book-*) and purged by
 * globalTeardown → scripts/e2e-clean-fixtures.mjs (advance_packets
 * cascade + chase-ladder automations + scheduler rows), so each run
 * starts from a packet-less fixture project.
 */

test.describe.configure({ mode: "serial" });

const AUDIENCE_COMPANY = "E2E Adv LaserNet";
const AUDIENCE_TEAM = "Lasers";
const RECIPIENT_EMAIL = "e2e-adv-recipient@flyingbluewhale.app";
const RECIPIENT_NAME = "E2E Adv Contact";
const EVENT_TYPE_NAME = "E2E Scheduler Orientation Call";
const BOOK_GUEST_EMAIL = "e2e-book-guest@flyingbluewhale.app";

const PACKET_PATH = `/studio/projects/${FIXTURE_PROJECT.id}/advancing/packet`;

// State threaded through the serial chain (same worker, module scope).
let batchUrl = "";
let batchId = "";
let portalPath = "";
let bookPath = "";
let eventTypeUrl = "";

// The recipient portal + public booking flows resolve tokens through the
// service-role client. A target without SUPABASE_SERVICE_ROLE_KEY (bare
// local dev) can't run them — probe once and skip those links honestly
// (prod/CI carries the key, so the canonical run exercises everything).
let serviceReady: boolean | null = null;
async function probeService(page: Page): Promise<boolean> {
  if (serviceReady !== null) return serviceReady;
  const res = await page.request.get("/book/probe-service-availability-00000000");
  const body = await res.text();
  serviceReady = !body.includes("Booking is unavailable right now");
  return serviceReady;
}

async function loginOwner(page: Page): Promise<void> {
  await dismissConsent(page);
  await loginAndSwitchWorkspace(page, "owner", FIXTURE_PROJECT.orgId);
}

test.beforeEach(async ({ page }) => {
  await suppressTour(page);
});

test.describe("Advance engine — full lifecycle (kit 27 deep)", () => {
  test("S0 · packet creation lays down the default Mochakk-shaped sections", async ({ page }) => {
    await loginOwner(page);
    await page.goto(PACKET_PATH);
    await expect(page.getByRole("heading", { name: "Advance Packet" })).toBeVisible({ timeout: 30_000 });

    // Teardown wiped any prior packet, so the empty state teaches creation.
    // Tolerate a pre-existing packet (interrupted prior run) by skipping the
    // create click — the rest of the chain works either way.
    const createCta = page.getByRole("button", { name: "Create Packet" });
    if (await createCta.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createCta.click();
    }
    // The 8 default sections land in one insert, Overview first, Tech last.
    await expect(page.getByRole("heading", { name: "Sections" })).toBeVisible({ timeout: 30_000 });
    for (const title of ["Overview", "Schedule & Milestones", "Crew List", "Production Advance", "Tech & Riders"]) {
      await expect(page.locator("table").first().getByText(title, { exact: true })).toBeVisible();
    }
    // State badge + version chip: the packet header row. Draft on a fresh
    // create; Live when a serial retry re-enters after S3 flipped it.
    await expect(page.getByText(/^(Draft|Live)$/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("S1 · audience add parses Name <email> contacts and derives no Contract ID without a job", async ({ page }) => {
    await loginOwner(page);
    await page.goto(PACKET_PATH);
    // Re-entrant under serial retries: only add the audience once.
    const audienceSection = page.locator("section", { hasText: "Audiences" });
    const already = await audienceSection
      .locator("tr", { hasText: AUDIENCE_COMPANY })
      .first()
      .isVisible()
      .catch(() => false);
    if (!already) {
      await page.locator("summary", { hasText: "Add Audience" }).click();
      await page.getByLabel("Company").fill(AUDIENCE_COMPANY);
      await page.getByLabel("Team").fill(AUDIENCE_TEAM);
      await page.getByLabel("Scope").fill("load-in wk4");
      await page.locator('textarea[name="contacts"]').fill(`${RECIPIENT_NAME} <${RECIPIENT_EMAIL}>`);
      await page.getByRole("button", { name: "Add Audience" }).click();
    }

    const row = audienceSection.locator("tr", { hasText: AUDIENCE_COMPANY }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    // One parsed contact; Contract ID stays em-dash — the fixture packet has
    // no job_id, and Contract IDs are DERIVED, never typed (decision #1).
    await expect(row.getByText("1", { exact: true })).toBeVisible();
    await expect(row.getByText("—").first()).toBeVisible();
  });

  test("S2 · scoping matrix assigns Crew List as required with a due date", async ({ page }) => {
    await loginOwner(page);
    await page.goto(PACKET_PATH);
    const matrix = page.locator("section", { hasText: "Scoping Matrix" });
    await matrix.locator('select[name="audience_id"]').selectOption({ label: `${AUDIENCE_TEAM} · ${AUDIENCE_COMPANY}` });
    await matrix.locator('select[name="section_id"]').selectOption({ label: "Crew List" });
    await matrix.locator('select[name="requirement"]').selectOption("required");
    // Far-future due date: deadline events materialize on go-live but none
    // come due during the run (T-5 of 2027-01-06 is far ahead).
    await matrix.locator('input[name="due_at"]').fill("2027-01-06T11:00");
    // exact: the "Clear assignment" (×) button's aria-label also contains
    // "assign" and would trip strict mode once a cell exists (retry chains).
    await matrix.getByRole("button", { name: "Assign", exact: true }).click();

    // The audience row in the matrix now carries the Req chip.
    const matrixRow = matrix.locator("tr", { hasText: AUDIENCE_COMPANY });
    await expect(matrixRow.getByText("Req", { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test("S3 · go-live flips the ledgered state and seeds the chase ladder in Automation Studio", async ({ page }) => {
    await loginOwner(page);
    await page.goto(PACKET_PATH);
    const goLive = page.getByRole("button", { name: "Go Live" });
    if (await goLive.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await goLive.click();
    }
    await expect(page.getByText("Live", { exact: true }).first()).toBeVisible({ timeout: 30_000 });

    // Idempotent seed: four enabled event automations, named per packet.
    await page.goto("/studio/ai/automations");
    await expect(page.getByText(`Advance Chase · T-5 · ${"Test Professional Show"}`)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`Advance Chase · Lapse · ${"Test Professional Show"}`)).toBeVisible();
    await expect(page.getByText(`Advance Confirm · T-2 Arrival · ${"Test Professional Show"}`)).toBeVisible();
  });

  test("S4 · prepare batch resolves every audience contact into a queued recipient", async ({ page }) => {
    await loginOwner(page);
    await page.goto("/studio/comms/advances/new");
    // The live packet appears in the picker (S1 gate passed).
    const picker = page.locator('select[name="packet_id"]');
    await expect(picker).toBeVisible({ timeout: 30_000 });
    await picker.selectOption({ index: 0 });
    await page.getByRole("button", { name: "Prepare Batch" }).click();

    await page.waitForURL(/\/studio\/comms\/advances\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    batchUrl = new URL(page.url()).pathname;
    batchId = batchUrl.split("/").pop() ?? "";
    const row = page.locator("tr", { hasText: RECIPIENT_EMAIL }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText("queued", { exact: true })).toBeVisible();
    await expect(row.getByText(`${AUDIENCE_TEAM} · ${AUDIENCE_COMPANY}`)).toBeVisible();
  });

  test("S5 · send batch advances queued → delivered (honest skip-send) and closes the batch as sent", async ({ page }) => {
    await loginOwner(page);
    await page.goto(batchUrl);
    await page.getByRole("button", { name: "Send Batch" }).click();

    const row = page.locator("tr", { hasText: RECIPIENT_EMAIL }).first();
    await expect(row.getByText("delivered", { exact: true })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Sent", { exact: true }).first()).toBeVisible();
    // The portal token link is minted per recipient — extract the TOKEN and
    // rebuild the apex path so the assertion is host-agnostic (the href is
    // subdomain-absolute in prod, path-prefixed locally).
    const href = await row.getByRole("link", { name: "Open Link" }).getAttribute("href");
    expect(href).toBeTruthy();
    const token = href!.match(/[?&]t=([0-9a-f]+)/)?.[1] ?? "";
    expect(token.length).toBeGreaterThanOrEqual(32);
    portalPath = `/p/${FIXTURE_PROJECT.slug}/advancing?t=${token}`;
  });

  test("S6 · the portal token renders ONLY the audience's assigned sections and funnels to opened", async ({ page }) => {
    await dismissConsent(page);
    test.skip(!(await probeService(page)), "token resolution needs SUPABASE_SERVICE_ROLE_KEY on the target");
    // No login: the token IS the credential.
    await page.goto(portalPath);
    await expect(page.getByRole("heading", { name: "Test Professional Show" })).toBeVisible({ timeout: 30_000 });
    // Scoping: the audience was assigned ONLY Crew List — Overview and the
    // other seven defaults must not render for this recipient.
    await expect(page.getByRole("heading", { name: "Crew List" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Production Advance" })).toHaveCount(0);
    await expect(page.getByText("Required", { exact: true })).toBeVisible();

    // First open advanced the funnel (delivered → opened) on the board.
    await loginOwner(page);
    await page.goto(batchUrl);
    await expect(page.locator("tr", { hasText: RECIPIENT_EMAIL }).first().getByText("opened", { exact: true })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("S7 · structured crew-list row + section submit funnels the recipient to submitted", async ({ page }) => {
    await dismissConsent(page);
    test.skip(!(await probeService(page)), "portal submissions need SUPABASE_SERVICE_ROLE_KEY on the target");
    await page.goto(portalPath);
    // The crew_list schema grid: fill the required columns, add one row.
    await page.locator('input[name="name"]').fill("E2E Adv Crew Lead");
    await page.locator('input[name="role"]').fill("Laser Op");
    await page.locator('input[name="email"]').fill("e2e-adv-crew@flyingbluewhale.app");
    await page.getByRole("button", { name: "Add Row" }).click();
    await expect(page.locator("td", { hasText: "E2E Adv Crew Lead" })).toBeVisible({ timeout: 30_000 });

    const submitSection = page.getByRole("button", { name: "Submit Section" });
    if (await submitSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitSection.click();
    }
    // The section badge flips and the line-item-delta affordance appears.
    await expect(page.getByText("submitted", { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("New rows reopen the section for review.")).toBeVisible();

    // All required sections are in → the recipient funnel reads submitted.
    await loginOwner(page);
    await page.goto(batchUrl);
    await expect(
      page.locator("tr", { hasText: RECIPIENT_EMAIL }).first().getByText(/^(submitted|complete)$/),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("S8 · operator closes the loop: Mark Complete is the terminal funnel edge", async ({ page }) => {
    await loginOwner(page);
    test.skip(!(await probeService(page)), "depends on the S7 portal submission (service-role target only)");
    await page.goto(batchUrl);
    const row = page.locator("tr", { hasText: RECIPIENT_EMAIL }).first();
    const markComplete = row.getByRole("button", { name: "Mark Complete" });
    if (await markComplete.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await markComplete.click();
    }
    await expect(row.getByText("complete", { exact: true })).toBeVisible({ timeout: 30_000 });
    // Forward-only: no further action is offered on a complete recipient.
    await expect(row.getByRole("button", { name: "Mark Complete" })).toHaveCount(0);
  });

  test("S9 · the API exposes the packet graph and the batch funnel, but never portal tokens", async ({ page }) => {
    await loginOwner(page);
    const packetRes = await page.request.get(`/api/v1/projects/${FIXTURE_PROJECT.id}/advance-packets`);
    expect(packetRes.status()).toBe(200);
    const packetJson = (await packetRes.json()) as {
      ok: boolean;
      data: {
        packet: { packet_state: string } | null;
        sections: unknown[];
        audiences: Array<{ company: string }>;
      };
    };
    expect(packetJson.ok).toBe(true);
    expect(packetJson.data.packet?.packet_state).toBe("live");
    expect(packetJson.data.sections.length).toBeGreaterThanOrEqual(8);
    expect(packetJson.data.audiences.some((a) => a.company === AUDIENCE_COMPANY)).toBe(true);

    const batchRes = await page.request.get(`/api/v1/advance-batches/${batchId}`);
    expect(batchRes.status()).toBe(200);
    const batchJson = (await batchRes.json()) as {
      ok: boolean;
      data: { batch: { batch_state: string }; recipients: Array<Record<string, unknown>> };
    };
    expect(batchJson.data.batch.batch_state).toBe("sent");
    expect(batchJson.data.recipients.length).toBeGreaterThanOrEqual(1);
    // The recipient's portal token is their credential — the API must not
    // serialize it (checked on every recipient row, not just the first).
    for (const recipient of batchJson.data.recipients) {
      expect(recipient).not.toHaveProperty("portal_token");
      // With the service-gated portal chain: delivered → … → complete; on a
      // bare target the funnel stops at the send edge.
      expect(recipient.delivery_state).toBe(serviceReady ? "complete" : "delivered");
    }
  });

  test("S10 · org preset matrix round-trip: add, render grouped, remove", async ({ page }) => {
    await loginOwner(page);
    await page.goto("/studio/settings/advancing");
    // The add form's <details> defaults OPEN when no presets exist — a
    // summary click would close it. Toggle only when the field is hidden.
    const typeField = page.getByLabel("Audience Type");
    if (!(await typeField.isVisible({ timeout: 3_000 }).catch(() => false))) {
      await page.locator("summary", { hasText: "Add Preset Row" }).click();
    }
    await typeField.fill("e2e_vendor");
    await page.locator('select[name="section_key"]').selectOption({ label: "Travel & Lodging" });
    await page.locator('select[name="requirement"]').selectOption("optional");
    await page.getByLabel("Due Offset (days before anchor)").fill("5");
    await page.getByRole("button", { name: "Save Preset" }).click();

    const group = page.locator("section", { hasText: "e2e_vendor" });
    await expect(group.getByText("Travel & Lodging")).toBeVisible({ timeout: 30_000 });
    await expect(group.getByText("optional", { exact: true })).toBeVisible();
    await expect(group.getByText("5d before anchor")).toBeVisible();

    await group.getByRole("button", { name: "Remove" }).click();
    await expect(page.locator("section", { hasText: "e2e_vendor" })).toHaveCount(0, { timeout: 30_000 });
  });

  test("S11 · scheduler event type creation seeds the Mon-Fri default windows and a public link", async ({ page }) => {
    await loginOwner(page);
    await page.goto("/studio/scheduler/new");
    await page.getByLabel("Name").first().fill(EVENT_TYPE_NAME);
    await page.getByLabel("Timezone (IANA)").fill("UTC");
    await page.getByRole("button", { name: "Create Event Type" }).click();

    await page.waitForURL(/\/studio\/scheduler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    eventTypeUrl = new URL(page.url()).pathname;
    // Five weekday windows, 09:00-17:00 each.
    for (const day of ["Monday", "Wednesday", "Friday"]) {
      await expect(page.locator("tr", { hasText: day }).getByText("09:00-17:00")).toBeVisible({ timeout: 30_000 });
    }
    const bookingHref = await page.getByRole("link", { name: "Public Booking Link" }).getAttribute("href");
    expect(bookingHref).toBeTruthy();
    const bookToken = bookingHref!.match(/\/book\/([0-9a-f]{64})/)?.[1] ?? "";
    expect(bookToken).toHaveLength(64);
    bookPath = `/book/${bookToken}`;
  });

  test("S12 · anonymous public booking: slot grid → confirm → booked, visible on the admin board", async ({ browser }) => {
    // A genuinely anonymous context — the invitee has no account.
    const context = await browser.newContext();
    const anon = await context.newPage();
    await dismissConsent(anon);
    test.skip(!(await probeService(anon)), "anonymous booking needs SUPABASE_SERVICE_ROLE_KEY on the target");
    await anon.goto(bookPath);
    await expect(anon.getByRole("heading", { name: EVENT_TYPE_NAME })).toBeVisible({ timeout: 30_000 });

    // Pick the first open slot (min-notice 240m + Mon-Fri windows guarantee
    // one inside the 14-day scan).
    await anon.locator("a.ps-btn").first().click();
    await anon.getByLabel("Your Name").fill("E2E Book Guest");
    await anon.getByLabel("Email").fill(BOOK_GUEST_EMAIL);
    await anon.getByRole("button", { name: "Confirm Booking" }).click();
    await expect(anon.getByRole("heading", { name: "You're Booked" })).toBeVisible({ timeout: 45_000 });
    await context.close();
  });

  test("S13 · admin board carries the booking; cancel is a ledgered transition", async ({ page }) => {
    await loginOwner(page);
    test.skip(!(await probeService(page)), "depends on the S12 booking (service-role target only)");
    await page.goto(eventTypeUrl);
    const row = page.locator("tr", { hasText: BOOK_GUEST_EMAIL }).filter({ hasText: "Booked" }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText("Booked", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(row.getByText("Cancelled", { exact: true })).toBeVisible({ timeout: 30_000 });
    // Terminal: no further transition buttons on a cancelled booking.
    await expect(row.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
  });

  test("S14 · COMPVSS: the crew party sees the live-packet card with THEIR credential status", async ({ page }) => {
    await dismissConsent(page);
    await loginAndSwitchWorkspace(page, ADVANCING_FIXTURE.partyRole, FIXTURE_PROJECT.orgId);
    await page.goto("/m/advances");
    // The packet went live in S3 on the crew user's project (they hold the
    // seeded issued credential), so the field card renders with a real
    // credential tally derived from the same assignment rows listed below.
    await expect(page.getByText("Advance Live")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/of \d+ credentials issued/)).toBeVisible();
  });
});
