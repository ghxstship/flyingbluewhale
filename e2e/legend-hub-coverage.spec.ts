/**
 * LEG3ND Organization Hub (/legend/hub) + /legend/start — behavioral coverage.
 *
 * Companion to `e2e/legend-personas.spec.ts` (legendNav render sweep) and
 * `e2e/legend-deep-coverage.spec.ts` (engine/signage/certs/resources/store).
 * Neither visits the Organization Hub pillars — the hub is NOT in `legendNav`'s
 * learner rail, so the sweeps never land there. This file covers the hub
 * surfaces end-to-end for the owner band:
 *
 *   1. Hub landing — every pillar tile renders and navigates to a real page.
 *   2. Organization pillar — positions list ⇄ ?view=chart toggle, a real
 *      create → chart-nesting → seat-holder assign (RecordCombobox over
 *      parties) → vacancy-badge → end-assignment round trip.
 *   3. Template library — the four-family index, unified search, the doc-type
 *      configurator (disable a type → /studio/documents hides it → restore),
 *      job-templates editor reachability.
 *   4. Brand Studio — org editor + event kits + resolved preview + the three
 *      white-label modes.
 *   5. XPMS Catalog — the 406-atom census, a stable known atom row, the class
 *      facet, app-ownership chips for all four apps, org-label override
 *      set + clear.
 *   6. Finance Codes — cost-center create → rename → deactivate, app chip.
 *   7. Locations — location create → geofence create/toggle/delete on the
 *      detail → location delete (self-tearing).
 *   8. /start — the 8-step wizard with data-derived completion (read-only:
 *      NOTHING here creates an org).
 *
 * Personas by FIXTURE (same as the sibling legend specs): `owner` (role=owner,
 * manager+) and `crew` (role=member) both resolve to org f4509a5f (Test
 * Professional Org). Writes use `stamp()` so re-runs never collide; every
 * created fixture is either deleted in-test (location, geofence) or purged by
 * the e2e:clean globalTeardown (positions "E2E Position%", cost centers
 * "E2E Cost Center%", locations "E2E Location%", the doc-configurator +
 * atom-label heals — see scripts/e2e-clean-fixtures.mjs).
 *
 * KNOWN-RISK assertions (deliberate, flagged in the authoring report):
 *   • the "406 atoms" census figure pins the live xpms_catalog active count —
 *     an intentional canary; a catalog reseed moves it.
 *   • atom 0000.01.01-001 "Executive Producer / Project Lead" is asserted as
 *     the stable first atom of the census (immutable append-only catalog).
 */
import { expect, test, type Locator, type Page } from "./helpers/base";
import { authedSetup, dismissConsent, suppressTour } from "./helpers/auth";
import { createInModule, stamp } from "./helpers/forms";

const RLS_ERROR = /violates row-level security|permission denied|not authorized/i;
const UUID = /[0-9a-f-]{36}/;

/** Pull the record id out of the current detail URL (…/<segment>/<uuid>). */
function idFromUrl(page: Page): string {
  const m = page.url().match(/\/([0-9a-f-]{36})(?:\?|#|$)/);
  expect(m?.[1], `URL ${page.url()} carries a record uuid`).toBeTruthy();
  return m![1]!;
}

/** The stable seed party used for the seat-holder assign (Test Professional Org). */
const SEED_PARTY = "test+crew";

/** The census canary + the stable first atom of the immutable catalog. */
const ATOM_CENSUS = "406 atoms";
const KNOWN_ATOM_ID = "0000.01.01-001";
const KNOWN_ATOM_NAME = "Executive Producer / Project Lead";

/** Doc type the configurator round-trip toggles (LEG3ND-owned, low-traffic). */
const CONFIG_DOC_TYPE = "syllabus";
const CONFIG_DOC_TITLE = "Course Syllabus";

/** The DataView toolbar search box (the only type=search input on hub lists). */
function dataViewSearch(page: Page): Locator {
  return page.locator('input[type="search"]').first();
}

// ══════════════════════════════════════════════════════════════════════════
// Operator (owner = manager+) — the hub is theirs end-to-end
// ══════════════════════════════════════════════════════════════════════════
test.describe("LEG3ND hub coverage (operator · owner)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ page }) => {
    // /studio/documents (templates test) lives in the console shell — keep the
    // first-run ConsoleTour scrim from ever mounting.
    await suppressTour(page);
    await authedSetup(page, "owner");
  });

  test("hub landing: every pillar tile renders and navigates", async ({ page }) => {
    await page.goto("/legend/hub");
    await expect(page.getByRole("heading", { name: "Organization Hub" }).first()).toBeVisible({ timeout: 15_000 });

    // All nine tiles render with their pillar titles.
    const tiles: { href: string; title: string }[] = [
      { href: "/legend/hub/brand", title: "Brand Studio" },
      { href: "/legend/hub/organization", title: "Organization" },
      { href: "/legend/hub/finance-codes", title: "Finance Codes" },
      { href: "/legend/hub/locations", title: "Locations" },
      { href: "/legend/hub/catalogs", title: "Catalogs" },
      { href: "/legend/hub/xpms", title: "XPMS Catalog" },
      { href: "/legend/hub/templates", title: "Templates" },
      { href: "/legend/resources", title: "Knowledge" },
      { href: "/legend/learn", title: "Academy" },
    ];
    for (const tile of tiles) {
      // Scope to main — the legend sidebar carries its own /legend/resources
      // and /legend/learn links, which would trip strict mode.
      const link = page.locator(`main a[href="${tile.href}"]`).first();
      await expect(link, `pillar tile ${tile.title} renders`).toBeVisible();
      await expect(link, `tile carries the ${tile.title} title`).toContainText(tile.title);
    }

    // Each of the seven HUB pillars navigates to a real page (h1 = the pillar,
    // never a 404 / error boundary). Knowledge + Academy are covered by the
    // legend-personas render sweep already.
    const destinations: { href: string; h1: string | RegExp }[] = [
      { href: "/legend/hub/brand", h1: "Brand Studio" },
      { href: "/legend/hub/organization", h1: "Organization" },
      { href: "/legend/hub/finance-codes", h1: "Finance Codes" },
      { href: "/legend/hub/locations", h1: "Locations" },
      { href: "/legend/hub/catalogs", h1: "Master Catalog" },
      { href: "/legend/hub/xpms", h1: "XPMS Catalog" },
      { href: "/legend/hub/templates", h1: "Templates" },
    ];
    for (const dest of destinations) {
      await page.goto(dest.href);
      await expect(
        page.getByRole("heading", { name: dest.h1 }).first(),
        `${dest.href} renders its pillar heading`,
      ).toBeVisible({ timeout: 20_000 });
    }
  });

  test("org chart: create positions → chart nests → assign holder → vacancy → end", async ({ page }) => {
    const s = stamp();
    const chiefTitle = `E2E Position Chief ${s}`;
    const aideTitle = `E2E Position Aide ${s}`;

    // ── Create the parent (1 seat, 0000 Executive) ─────────────────────────
    await createInModule(page, "/legend/hub/organization/new", {
      title: chiefTitle,
      department_code: "0000",
      seat_count: "1",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/hub/organization/${UUID.source}`), { timeout: 35_000 });

    // ── Create the child reporting into it (2 seats) ───────────────────────
    // reports_to_position_id is a native select whose option LABELS are the
    // position titles — fillSmart matches by label.
    await createInModule(page, "/legend/hub/organization/new", {
      title: aideTitle,
      department_code: "0000",
      reports_to_position_id: chiefTitle,
      seat_count: "2",
    });
    await expect(page).toHaveURL(new RegExp(`/legend/hub/organization/${UUID.source}`), { timeout: 35_000 });
    const aideId = idFromUrl(page);

    // ── Positions list view: grouped by XPMS department ────────────────────
    await page.goto("/legend/hub/organization");
    await expect(
      page.getByRole("heading", { name: /0000 · Executive/ }).first(),
      "the 0000 Executive department group renders",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: aideTitle, exact: true })).toBeVisible();
    // The view toggle is present in the header.
    await expect(page.getByRole("link", { name: "Org chart", exact: true })).toBeVisible();

    // ── Chart view: the child nests under its parent ───────────────────────
    await page.goto("/legend/hub/organization?view=chart");
    const parentNode = page
      .locator("details")
      .filter({ has: page.getByRole("link", { name: chiefTitle, exact: true }) })
      .first();
    await expect(parentNode, "the parent renders as a collapsible chart node").toBeVisible({ timeout: 15_000 });
    await expect(
      parentNode.getByRole("link", { name: aideTitle, exact: true }),
      "the child renders INSIDE the parent's subtree",
    ).toBeVisible();
    const aideCard = page.locator("div.surface").filter({ hasText: aideTitle }).first();
    await expect(aideCard, "the unstaffed child reads Vacant").toContainText("Vacant");
    await expect(aideCard, "both seats are open").toContainText("2 open seats");

    // ── Assign a holder through the party RecordCombobox ───────────────────
    await page.goto(`/legend/hub/organization/${aideId}`);
    await expect(page.getByRole("heading", { name: aideTitle, exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    // The party picker trigger is the cmdk BUTTON combobox — the page's native
    // selects (department / reports-to) also carry the combobox role, so
    // target the button element specifically.
    await page.locator('main button[role="combobox"]').first().click();
    const search = page
      .locator('[cmdk-input], input[cmdk-input=""], [role="dialog"] input, [data-radix-popper-content-wrapper] input')
      .first();
    await search.fill(SEED_PARTY);
    await page
      .locator('[cmdk-item], [role="option"]')
      .filter({ hasText: SEED_PARTY })
      .first()
      .click({ timeout: 15_000 });
    await page.getByRole("button", { name: "Assign", exact: true }).click();

    // The insert redirects back to the detail; the holder card + the updated
    // vacancy badge are the proof the position_assignments row landed.
    const holderRow = page.locator("li.surface").filter({ hasText: SEED_PARTY }).first();
    await expect(holderRow, "the seat holder renders after the assign").toBeVisible({ timeout: 35_000 });
    await expect(
      page.getByText("1 open seat", { exact: true }),
      "the vacancy badge recomputed (2 seats − 1 holder)",
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);

    // ── End the assignment ─────────────────────────────────────────────────
    await holderRow.getByRole("button", { name: "End", exact: true }).click();
    await expect(
      page.getByText(/nobody holds this position yet/i),
      "the seat empties after the end action",
    ).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText("2 open seats", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/1 past holder/),
      "the ended assignment is kept as history, not deleted",
    ).toBeVisible();
    // Teardown: globalTeardown purges positions "E2E Position%" (assignments cascade).
  });

  test("template library: families, search, doc-type configurator round-trip", async ({ page }) => {
    await page.goto("/legend/hub/templates");
    await expect(page.getByRole("heading", { name: "Templates" }).first()).toBeVisible({ timeout: 15_000 });

    // All four family filter chips render.
    const familyFilter = page.getByRole("group", { name: "Filter by family" });
    for (const family of ["Document templates", "Job templates", "Field templates", "Advance packet presets"]) {
      await expect(familyFilter.getByRole("button", { name: family }), `${family} filter chip`).toBeVisible();
    }

    // Family sections render with counts. Doc templates are registry-fixed
    // (always present); job templates are seeded in this org. Field/advance
    // sections only render when the org has rows — an empty family honestly
    // renders NO section, so assert those conditionally.
    const docSection = page.locator("section[aria-label='Document templates']");
    await expect(docSection, "the doc family section renders").toBeVisible();
    await expect(docSection.locator(".ps-id").first()).toContainText(/\d+ templates?/);
    const jobSection = page.locator("section[aria-label='Job templates']");
    await expect(jobSection, "the job family section renders (seeded org)").toBeVisible();
    await expect(jobSection.locator(".ps-id").first()).toContainText(/\d+ templates?/);
    for (const family of ["Field templates", "Advance packet presets"]) {
      const section = page.locator(`section[aria-label='${family}']`);
      if (await section.count()) {
        await expect(section.locator(".ps-id").first(), `${family} count`).toContainText(/\d+ templates?/);
      }
    }

    // ── Unified search filters across families ─────────────────────────────
    const searchBox = page.getByRole("searchbox", { name: "Search templates" });
    await searchBox.fill(CONFIG_DOC_TITLE);
    await expect(page.getByRole("link", { name: CONFIG_DOC_TITLE, exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Proposal & SOW", exact: true }),
      "non-matching templates are filtered out",
    ).toHaveCount(0);

    // ── Doc-type configurator: disable → console picker hides it → restore ─
    // (The globalTeardown heal deletes enabled=false rows for the fixture org,
    // so a mid-test failure can never strand the type disabled.)
    const card = page
      .locator("li")
      .filter({ has: page.getByRole("link", { name: CONFIG_DOC_TITLE, exact: true }) })
      .first();
    const offered = card.getByRole("checkbox");
    await expect(offered, "the manager-band Offered toggle renders").toBeVisible();
    await expect(offered).toBeChecked();
    // .click(), not .uncheck(): the input is CONTROLLED off the server value —
    // it only flips after the action + refresh land, which would make
    // uncheck()'s post-click state assertion race the round-trip.
    await offered.click();
    await expect(
      card.getByText("Hidden from pickers", { exact: true }),
      "the disabled badge renders after the setting persists",
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/studio/documents");
    await expect(
      page.locator(`a[href="/studio/documents/${CONFIG_DOC_TYPE}"]`),
      "the disabled type is hidden from the console creation picker",
    ).toHaveCount(0);
    await expect(
      page.getByText(/disabled for your organization/),
      "the hub explains the hidden types and points back at the library",
    ).toBeVisible();

    // Restore (same card, same toggle).
    await page.goto("/legend/hub/templates");
    await searchBox.fill(CONFIG_DOC_TITLE);
    await expect(card.getByRole("checkbox")).not.toBeChecked();
    await card.getByRole("checkbox").click(); // controlled input — see above
    await expect(card.getByText("Hidden from pickers", { exact: true })).toHaveCount(0, { timeout: 20_000 });
    await page.goto("/studio/documents");
    await expect(
      page.locator(`a[href="/studio/documents/${CONFIG_DOC_TYPE}"]`),
      "the restored type is offered again",
    ).toBeVisible({ timeout: 15_000 });

    // ── Job-templates editor reachable ─────────────────────────────────────
    await page.goto("/legend/hub/templates/job-templates");
    await expect(page.getByRole("heading", { name: "Job Templates" }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("brand studio: editor, event kits, resolved preview, white-label modes", async ({ page }) => {
    await page.goto("/legend/hub/brand");
    await expect(page.getByRole("heading", { name: "Brand Studio" }).first()).toBeVisible({ timeout: 15_000 });

    // The org branding editor renders its identity + color fields.
    await expect(page.getByLabel("Product Name Override")).toBeVisible();
    await expect(page.getByText("Accent Color", { exact: true }).first()).toBeVisible();

    // Event brand kits section: the heading always renders; the body is either
    // the kit list or the honest empty copy plus the create-for chip strip.
    await expect(page.getByRole("heading", { name: "Event brand kits" })).toBeVisible();
    const kitEdit = page.getByText("Edit kit").first();
    const kitEmpty = page.getByText(/no project carries a brand kit yet/i);
    await expect(kitEdit.or(kitEmpty).first(), "kits list OR the empty state renders").toBeVisible();

    // Resolved preview — the same resolver that paints documents/portals.
    await expect(page.getByRole("heading", { name: "Resolved brand preview" })).toBeVisible();
    await expect(page.getByText("Document masthead", { exact: true })).toBeVisible();
    await expect(page.getByText("Portal chrome", { exact: true })).toBeVisible();
    await expect(page.getByText("Ticket and pass", { exact: true })).toBeVisible();

    // The three document white-label modes, with their data-brand codes.
    await expect(page.getByRole("heading", { name: "Document white-label modes" })).toBeVisible();
    for (const mode of ["ATLVS", "Co-brand", "White label"]) {
      await expect(page.getByText(mode, { exact: true }).first(), `${mode} mode card`).toBeVisible();
    }
    for (const code of ["atlvs", "co", "white"]) {
      await expect(page.getByText(`data-brand="${code}"`).first(), `data-brand ${code} shown`).toBeVisible();
    }
  });

  test("xpms census: 406 atoms, known atom, app chips, org-label round-trip, class facet", async ({ page }) => {
    await page.goto("/legend/hub/xpms");
    await expect(page.getByRole("heading", { name: "XPMS Catalog" }).first()).toBeVisible({ timeout: 20_000 });
    // KNOWN-RISK census canary: the immutable XPMS 2.5 base kit is 406 active
    // atoms. A reseed that moves this number should be a conscious event.
    await expect(page.getByText(ATOM_CENSUS).first(), "the 406-atom census renders").toBeVisible();

    // ── The stable first atom of the census ────────────────────────────────
    const search = dataViewSearch(page);
    await search.fill(KNOWN_ATOM_ID);
    const atomRow = page.getByRole("row").filter({ hasText: KNOWN_ATOM_ID }).first();
    await expect(atomRow, "the known atom row surfaces via search").toBeVisible({ timeout: 15_000 });
    await expect(atomRow).toContainText(KNOWN_ATOM_NAME);
    await expect(atomRow, "0000 Executive is LEG3ND-owned").toContainText("LEG3ND");

    // ── Org label override: set, verify, clear (self-tearing) ──────────────
    const override = `E2E Atom Label ${stamp()}`;
    await atomRow.getByRole("button", { name: "Edit", exact: true }).click();
    const labelInput = atomRow.getByRole("textbox");
    await expect(labelInput).toBeVisible();
    await labelInput.fill(override);
    await atomRow.getByRole("button", { name: "Save", exact: true }).click();
    await expect(atomRow.getByText(override), "the org label override renders").toBeVisible({ timeout: 20_000 });
    await expect(atomRow.getByText("org", { exact: true }), "the override carries the org marker").toBeVisible();

    await atomRow.getByRole("button", { name: "Edit", exact: true }).click();
    await atomRow.getByRole("textbox").fill("");
    await atomRow.getByRole("button", { name: "Save", exact: true }).click();
    await expect(atomRow.getByText(override), "clearing restores the catalog name").toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(atomRow.getByText(KNOWN_ATOM_NAME)).toBeVisible();
    await expect(atomRow.getByText("org", { exact: true })).toHaveCount(0);

    // ── App-ownership chips: all four apps, one page load ──────────────────
    // (LEG3ND asserted on the 0000 atom above.) The department accessor is
    // "<code> <label>", so searching a class code narrows to that class.
    const chipByClass: [string, string][] = [
      ["1000", "ATLVS"],
      ["4000", "COMPVSS"],
      ["7000", "GVTEWAY"],
    ];
    for (const [cls, app] of chipByClass) {
      await search.fill(cls);
      await expect(
        page.getByRole("row").filter({ hasText: app }).first(),
        `${cls}-class atoms carry the ${app} ownership chip`,
      ).toBeVisible({ timeout: 15_000 });
    }
    await search.fill("");

    // ── Class facet: the URL-backed FilterBar select drives ?class= ────────
    await page
      .locator("label")
      .filter({ hasText: "Class" })
      .locator("select")
      .first()
      .selectOption("5000");
    await expect(page).toHaveURL(/class=5000/, { timeout: 15_000 });
    await expect(
      page.getByText(/^5\d{3}\.\d{2}\.\d{2}-\d+$/).first(),
      "5000-class atoms render under the facet",
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("row").filter({ hasText: KNOWN_ATOM_ID }),
      "atoms outside the class are filtered out server-side",
    ).toHaveCount(0);
  });

  test("finance codes: create → rename → deactivate, app chip renders", async ({ page }) => {
    const s = stamp();
    // 4-digit code on the XPMS canon, never a X000 class code: 4100–4999
    // (COMPVSS-owned, so the app chip is deterministic). Re-run safe: the
    // globalTeardown purges "E2E Cost Center%" rows.
    const code = `4${String(100 + (Date.now() % 900))}`;
    const name = `E2E Cost Center ${s}`;

    await page.goto("/legend/hub/finance-codes");
    await expect(page.getByRole("heading", { name: "Finance Codes" }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "+ New Cost Center" }).first()).toBeVisible();

    // ── Create (validation: 4 digits, unique per org) ──────────────────────
    await createInModule(page, "/legend/hub/finance-codes/new", { code, name });
    await expect(page).toHaveURL(new RegExp(`/legend/hub/finance-codes/${UUID.source}`), { timeout: 35_000 });
    await expect(page.getByRole("heading", { name: `${code} · ${name}` }).first()).toBeVisible({
      timeout: 15_000,
    });

    // ── Rename (the code itself is immutable — name only) ──────────────────
    const renamed = `${name} EDITED`;
    const renamedHeading = page.getByRole("heading", { name: `${code} · ${renamed}` }).first();
    // Retry the submit once: a click landing before FormShell hydrates can be
    // stranded (the known controlled-hydration trap).
    for (let attempt = 0; attempt < 2 && !(await renamedHeading.isVisible().catch(() => false)); attempt++) {
      await page.locator('main [name="name"]').fill(renamed);
      await page.getByRole("button", { name: "Save Name" }).click();
      await renamedHeading.waitFor({ state: "visible", timeout: 25_000 }).catch(() => {});
    }
    await expect(renamedHeading).toBeVisible({ timeout: 10_000 });

    // ── Deactivate (facet flip, not a delete) ──────────────────────────────
    await page.getByRole("button", { name: "Deactivate", exact: true }).click();
    await expect(page.getByRole("button", { name: "Reactivate", exact: true })).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText("Inactive", { exact: true }).first()).toBeVisible();

    // ── The list row: code, name, app chip, state badge ────────────────────
    await page.goto("/legend/hub/finance-codes");
    await dataViewSearch(page).fill(renamed);
    const row = page.getByRole("row").filter({ hasText: code }).first();
    await expect(row, "the created cost center is listed").toBeVisible({ timeout: 15_000 });
    await expect(row, "a 4xxx code rolls up to the COMPVSS-owned 4000 class").toContainText("COMPVSS");
    await expect(row).toContainText("Inactive");
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("locations: create → geofence create/toggle/delete → location delete", async ({ page }) => {
    const s = stamp();
    const name = `E2E Location ${s}`;
    const fence = `E2E Fence ${s}`;

    // ── Create (redirects to the LIST, not a detail) ───────────────────────
    await createInModule(page, "/legend/hub/locations/new", { name, city: "Miami" });
    await expect(page).toHaveURL(/\/legend\/hub\/locations(\?|$)/, { timeout: 35_000 });

    // Find it via the DataView search (the registry is 39+ rows) and open it.
    await dataViewSearch(page).fill(name);
    await page.getByRole("link", { name, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`/legend/hub/locations/${UUID.source}`), { timeout: 35_000 });
    await expect(page.getByRole("heading", { name, exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // ── The geofence admin renders on the canonical space-registry detail ──
    await expect(page.getByRole("heading", { name: "Capture Geofences" })).toBeVisible();

    // Create a fence (the location has no coordinates, so enter them).
    // Retry the submit once — hydration-trap discipline (see the rename step).
    const fenceRow = page.locator("div.px-5.py-3").filter({ hasText: fence }).first();
    for (let attempt = 0; attempt < 2 && !(await fenceRow.isVisible().catch(() => false)); attempt++) {
      await page.locator('main [name="label"]').fill(fence);
      await page.locator('main [name="center_lat"]').fill("25.7907");
      await page.locator('main [name="center_lng"]').fill("-80.13");
      await page.locator('main [name="radius_m"]').fill("150");
      await page.getByRole("button", { name: "Add Geofence" }).click();
      await fenceRow.waitFor({ state: "visible", timeout: 25_000 }).catch(() => {});
    }
    await expect(fenceRow, "the geofence row renders after the insert").toBeVisible({ timeout: 10_000 });
    await expect(fenceRow.getByText("Active", { exact: true })).toBeVisible();
    await expect(fenceRow).toContainText("150 m");

    // Toggle off.
    await fenceRow.getByRole("button", { name: "Turn Off" }).click();
    await expect(fenceRow.getByText("Off", { exact: true }), "the fence deactivates").toBeVisible({
      timeout: 35_000,
    });
    await expect(fenceRow.getByRole("button", { name: "Turn On" })).toBeVisible();

    // Delete the fence (Radix confirm dialog, no native prompt).
    await fenceRow.getByRole("button", { name: "Delete", exact: true }).click();
    const fenceDialog = page.getByRole("dialog");
    await expect(fenceDialog).toBeVisible();
    await expect(fenceDialog).toContainText(/delete this geofence/i);
    await fenceDialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText(fence), "the fence row is gone").toHaveCount(0, { timeout: 35_000 });

    // ── Self-teardown: delete the location itself ──────────────────────────
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const locDialog = page.getByRole("dialog");
    await expect(locDialog).toContainText(name);
    await locDialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page).toHaveURL(/\/legend\/hub\/locations(\?|$)/, { timeout: 35_000 });
    await dataViewSearch(page).fill(name);
    await expect(page.getByRole("link", { name, exact: true }), "the deleted location left the registry").toHaveCount(
      0,
    );
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("/start: the 8-step wizard renders with data-derived completion (read-only)", async ({ page }) => {
    await page.goto("/legend/start");
    await expect(page.getByRole("heading", { name: "Start", exact: true }).first()).toBeVisible({
      timeout: 20_000,
    });

    // The progress rail: 8 step tiles over 7 REQUIRED steps (Templates is the
    // soft review step) — completion derives from live data, never stored.
    const progress = page.getByRole("navigation", { name: "Setup progress" });
    await expect(progress).toBeVisible();
    await expect(progress.locator("a")).toHaveCount(8);
    await expect(progress.getByText(/of 7 steps complete/)).toBeVisible();

    // Every step section heading renders, numbered 1–8.
    for (const heading of [
      "1. Identity",
      "2. Base kit install",
      "3. Organization",
      "4. Finance codes",
      "5. Locations",
      "6. Catalogs",
      "7. Templates",
      "8. Crew invites",
    ]) {
      await expect(page.getByRole("heading", { name: heading }), `${heading} step renders`).toBeVisible();
    }

    // Derived completion for the org-holding owner fixture: identity is done
    // (NO create-org form — this spec must never create an org), the seeded
    // registry/catalog steps read Done, and the soft Templates step reads
    // Review. Steps 2/3/4/8 depend on sibling-test fixtures, so they stay
    // unasserted here.
    await expect(page.getByRole("button", { name: "Create organization" })).toHaveCount(0);
    await expect(progress.locator('a[href="#step-1"]')).toContainText("Done");
    await expect(progress.locator('a[href="#step-5"]')).toContainText("Done");
    await expect(progress.locator('a[href="#step-6"]')).toContainText("Done");
    await expect(progress.locator('a[href="#step-7"]')).toContainText("Review");

    // Deep links out of the wizard resolve to the hub it configures.
    await expect(page.locator('main a[href="/legend/hub"]').first()).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Member (crew) — the hub is readable, authoring refuses at the action
// ══════════════════════════════════════════════════════════════════════════
test.describe("LEG3ND hub coverage (member · crew)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "crew"));

  test("hub landing is member-readable", async ({ page }) => {
    await page.goto("/legend/hub");
    await expect(page.getByRole("heading", { name: "Organization Hub" }).first()).toBeVisible({ timeout: 20_000 });
    // The read floor: pillar tiles render for every org member.
    await expect(page.locator('main a[href="/legend/hub/brand"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/legend/hub/organization"]').first()).toBeVisible();
    await expect(page.getByText(RLS_ERROR)).toHaveCount(0);
  });

  test("position authoring refuses a member at the action layer", async ({ page }) => {
    // Today the /new page renders for members (page-level read) and the
    // SERVER ACTION holds the manager gate — submit and expect the honest
    // refusal, with no positions row created. If a page-level AccessDenied
    // gate lands later (the L-P6d pattern), that is the same boundary moved
    // earlier, so it also passes.
    await page.goto("/legend/hub/organization/new");
    const accessDenied = page.getByText(/you don'?t have access/i).first();
    if (await accessDenied.isVisible().catch(() => false)) {
      await expect(page.getByRole("button", { name: "Create Position" })).toHaveCount(0);
      expect(page.url(), "AccessDenied is a render, not an auth bounce").not.toMatch(/\/login/);
      return;
    }
    const title = page.locator('main [name="title"]');
    await expect(title).toBeVisible({ timeout: 15_000 });
    const denial = page.getByText(/only manager\+ can create positions/i).first();
    // Retry the submit: a click that lands before FormShell hydrates does a
    // native reload back onto /new with no error (the known controlled-
    // hydration trap) — re-fill and re-click until the action answers.
    for (let attempt = 0; attempt < 3 && !(await denial.isVisible().catch(() => false)); attempt++) {
      await title.fill(`E2E Member Denied ${stamp()}`);
      await page.getByRole("button", { name: "Create Position" }).click();
      await denial.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    }
    await expect(denial, "the action refuses the member honestly").toBeVisible({ timeout: 5_000 });
    expect(page.url(), "no redirect happened — nothing was created").toMatch(/\/legend\/hub\/organization\/new/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Anonymous — the hub + wizard are session-gated
// ══════════════════════════════════════════════════════════════════════════
test.describe("LEG3ND hub coverage (anonymous)", () => {
  test("/legend/start bounces an anonymous visitor to /login", async ({ page }) => {
    // (/legend/hub's anon bounce is covered by legend-persona-floor.spec.ts.)
    await dismissConsent(page);
    await page.goto("/legend/start");
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });
});
