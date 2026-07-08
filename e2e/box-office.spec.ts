/**
 * GVTEWAY first-party box office — cross-shell, per-persona coverage.
 *
 * The first-party box office is GVTEWAY's self-fulfilled ticketing spine: the
 * org authors a published `event_listing` (fulfillment=first_party), opens sales
 * via ticket types, the public buys on /events, the door scans at the gate, and
 * settlement lands in /studio/revenue/payouts. This spec exercises that spine
 * across all three live surfaces (mirrors the STYLE of the per-persona suite —
 * `e2e/atlvs-console-personas.spec.ts` et al):
 *
 *   ATLVS  (operators)  — the organizer console: listings index → OrgConsole
 *     detail (Ticket Types / Payouts / Gross-Net) + the revenue payout ledger +
 *     the box-office hub. The "New ticket type" create gates on isManagerPlus,
 *     so it's a capability ladder: manager+ can submit, collaborator is blocked.
 *   COMPVSS (field)     — the /m/door gate scanner (heading + manual code entry).
 *   GVTEWAY (public)    — the anon /events list + the first-party checkout flow
 *     (tier, price, quantity stepper / buy CTA).
 *
 * SEEDED FIXTURE (in the Test Professional org, which the test+<role> users
 * belong to): a first-party listing slug `e2e-warehouse-02` ("E2E Warehouse 02",
 * published, fulfillment=first_party) with one ticket type "General Admission"
 * ($25) and one payout "E2E Settlement".
 *
 * Fixtures are the seeded `test+<role>@flyingbluewhale.app` users. The console
 * "New ticket type" action returns "Only manager+ can add ticket types" for a
 * collaborator (role=member), surfaced by FormShell as an Alert (role="alert").
 */
import { expect, test } from "./helpers/base";
import { authedSetup, dismissConsent, loginAndSwitchWorkspace } from "./helpers/auth";
import { stamp } from "./helpers/forms";

const SLUG = "e2e-warehouse-02";
const EVENT_TITLE = "E2E Warehouse 02";
const TIER = "General Admission";
const PAYOUT = "E2E Settlement";
// The fixture (e2e-warehouse-02) lives in the test-professional org; the seeded
// test+<role> users belong to multiple tier orgs and their DEFAULT active
// workspace isn't necessarily this one, so pin it (mirrors booking-canon /
// marketplace-canon, which use the same switch for the same reason).
const PROF_ORG = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";

const ACCESS_DENIED = /you don'?t have access/i;
const ERROR_BOUNDARY = /application error|something went wrong|unhandled|digest:|client-side exception/i;

type Tier = "manager" | "collaborator";
type Operator = { fixture: string; tier: Tier };

// owner/manager sit in the isManagerPlus band; collaborator (role=member) is
// blocked from the create-ticket-type action.
const OPERATORS: Operator[] = [
  { fixture: "owner", tier: "manager" },
  { fixture: "manager", tier: "manager" },
  { fixture: "collaborator", tier: "collaborator" },
];

const isManagerPlus = (t: Tier) => t === "manager";

// ── ATLVS operator console ──────────────────────────────────────────────────
for (const op of OPERATORS) {
  test.describe(`box office · ATLVS console · ${op.fixture} (${op.tier})`, () => {
    test.describe.configure({ timeout: 300_000 });
    test.beforeEach(async ({ page }) => {
      await dismissConsent(page);
      await loginAndSwitchWorkspace(page, op.fixture, PROF_ORG);
    });

    test("listings index renders for operators + lists the seeded event", async ({ page }) => {
      await page.goto("/studio/marketplace/box-office/listings");
      await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
      await expect(
        page.getByText(EVENT_TITLE, { exact: false }).first(),
        "the seeded first-party listing is in the index",
      ).toBeVisible({ timeout: 15_000 });
    });

    test("OrgConsole detail renders its Ticket-Types + Payouts + Gross/Net sections", async ({ page }) => {
      // Find the listing link straight from the listings index — never hardcode
      // the id, so this can't drift from the seed.
      await page.goto("/studio/marketplace/box-office/listings");
      const link = page.getByRole("link", { name: EVENT_TITLE }).first();
      await expect(link, "the seeded listing exposes a detail link").toBeVisible({ timeout: 15_000 });
      await link.click();

      await expect(page).toHaveURL(/\/box-office\/listings\/[0-9a-f-]{36}/i, { timeout: 20_000 });
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
      // Ticket Types section: the eyebrow + the seeded tier row.
      await expect(page.getByText(/ticket types/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(TIER, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
      // Payouts section.
      await expect(page.getByText(/^payouts$/i).first()).toBeVisible({ timeout: 15_000 });
      // The revenue summary surfaces a gross/net figure (Overview MetricCards +
      // the Payouts settlement grid both render formatted money).
      await expect(page.getByText(/gross/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/net/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/\$[\d,]+(\.\d{2})?/).first(), "a formatted money figure renders").toBeVisible({
        timeout: 15_000,
      });
    });

    test("revenue payouts ledger renders the seeded payout + the settlement summary", async ({ page }) => {
      await page.goto("/studio/revenue/payouts");
      await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
      // The Gross / Fees / Refunds / Paid-out summary cards.
      await expect(page.getByText(/gross/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/fees/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/refunds/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/paid out/i).first()).toBeVisible({ timeout: 15_000 });
      // The seeded payout row.
      await expect(page.getByText(PAYOUT, { exact: false }).first(), "the seeded payout is in the ledger").toBeVisible({
        timeout: 15_000,
      });
    });

    test("box-office hub exposes the Ticketed events link", async ({ page }) => {
      await page.goto("/studio/marketplace/box-office");
      await expect(page.getByText(ACCESS_DENIED)).toHaveCount(0);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole("link", { name: /ticketed events/i }).first(),
        "the hub links out to the listings index",
      ).toBeVisible({ timeout: 15_000 });
    });

    // ── isManagerPlus gate — "New ticket type" on the OrgConsole ──────────────
    test(`New ticket type: ${isManagerPlus(op.tier) ? "allowed (manager+)" : "blocked (collaborator)"}`, async ({
      page,
    }) => {
      // Reach the OrgConsole detail via the listings index (no hardcoded id).
      await page.goto("/studio/marketplace/box-office/listings");
      const link = page.getByRole("link", { name: EVENT_TITLE }).first();
      await expect(link).toBeVisible({ timeout: 15_000 });
      await link.click();
      await expect(page).toHaveURL(/\/box-office\/listings\/[0-9a-f-]{36}/i, { timeout: 20_000 });

      // The "New ticket type" FormShell: name + price (USD) are required.
      const name = `E2E Tier ${op.fixture} ${stamp()}`;
      const form = page.locator("form:has([name='name']):has([name='price'])").first();
      await expect(form, "the New ticket type form is present").toBeVisible({ timeout: 15_000 });
      await form.locator("[name='name']").fill(name);
      await form.locator("[name='price']").fill("30");
      const submit = form.getByRole("button", { name: /add ticket type/i });
      await submit.scrollIntoViewIfNeeded();
      await submit.click();

      if (isManagerPlus(op.tier)) {
        // Success: the action revalidates and the new tier row renders. No
        // action error surfaced (FormShell Alert role="alert").
        await expect(
          page.getByRole("alert").filter({ hasText: /error|failed|manager|not found/i }),
          "manager+ create surfaced no error",
        ).toHaveCount(0);
        await page.reload();
        await expect(
          page.getByText(name, { exact: false }).first(),
          "the created ticket type persisted + renders",
        ).toBeVisible({ timeout: 15_000 });
      } else {
        // collaborator (role=member): the action returns "Only manager+ can add
        // ticket types", surfaced by FormShell as an error Alert. No new row.
        await expect(
          page
            .getByRole("alert")
            .filter({ hasText: /manager\+? can add ticket types|manager/i })
            .first(),
          "collaborator is blocked with a manager-band action error",
        ).toBeVisible({ timeout: 15_000 });
        await page.reload();
        await expect(page.getByText(name, { exact: false }), "the blocked create added no ticket type row").toHaveCount(
          0,
        );
      }
    });
  });
}

// ── COMPVSS field · door scanner ────────────────────────────────────────────
test.describe("box office · COMPVSS field · door scanner", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("crew opens /m/door — the gate scanner UI renders", async ({ page }) => {
    await page.goto("/m/door");
    // Heading "Door" (the DoorScanner masthead; falls back to "Door Scanner"
    // when the org has no first-party listings — the seed guarantees one).
    await expect(page.locator(".scr-h").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /door/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    // The always-available manual redeem path: a code input + the Redeem CTA.
    await expect(page.locator("input[name='code']").first()).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /redeem ticket/i }).first(),
      "the door exposes a redeem affordance",
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ── GVTEWAY public · anon checkout ──────────────────────────────────────────
test.describe("box office · GVTEWAY public · anon", () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test("/events lists the seeded first-party event", async ({ page }) => {
    const r = await page.goto("/events");
    expect(r?.status() ?? 0, "/events is not a 5xx").toBeLessThan(500);
    await expect(page.locator("h1").first(), "/events renders a heading").toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    await expect(
      page.getByText(EVENT_TITLE, { exact: false }).first(),
      "the seeded published event is on the public board",
    ).toBeVisible({ timeout: 15_000 });
  });

  test("/events/<slug>/tickets renders the first-party checkout", async ({ page }) => {
    const r = await page.goto(`/events/${SLUG}/tickets`);
    expect(r?.status() ?? 0, "the tickets page is not a 5xx").toBeLessThan(500);
    await expect(page.getByText(/not found/i)).toHaveCount(0);
    await expect(page.locator("h1").first(), "the tickets page renders the event title").toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(ERROR_BOUNDARY)).toHaveCount(0);
    // The seeded tier + a formatted price.
    await expect(page.getByText(TIER, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\$[\d,]+(\.\d{2})?/).first(), "a ticket price renders").toBeVisible({
      timeout: 15_000,
    });
    // First-party checkout: the quantity stepper (+/- per tier) and the Checkout
    // CTA. (Sold-out tiers replace the stepper with a label — tolerate either by
    // asserting the buy affordance OR the stepper is present.)
    // A first-party listing renders BOTH the per-tier quantity stepper and the
    // Checkout CTA; assert the stepper directly (an `.or()` over two present
    // elements trips Playwright strict mode).
    await expect(
      page.getByRole("button", { name: /add one/i }).first(),
      "the first-party checkout exposes a per-tier quantity stepper",
    ).toBeVisible({ timeout: 15_000 });
  });
});
