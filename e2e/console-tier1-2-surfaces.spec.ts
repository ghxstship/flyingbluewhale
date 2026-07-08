/**
 * Always-on render guard for the Tier 1+2 domains shipped in commit 73f9844
 * (Procurement Receiving, GL Ledger, Asset Lifecycle, Approvals engine,
 * Contracts/CLM). Their LIST/index pages are wired into `nav.ts` and so are
 * already swept by `ia-coverage.spec.ts`. This spec covers the segments that
 * IA-coverage CANNOT reach:
 *
 *   - the `/new` create pages (not in the sidebar nav), and
 *   - the Approvals sub-domain index pages (policies / delegations) that hang
 *     off `/studio/governance/approvals` rather than appearing as their own
 *     nav entries.
 *
 * All carry no dynamic id, so they're verifiable without seeded fixtures.
 * (Detail `[id]` pages need live rows — covered by the opt-in sitemap crawl.)
 *
 * Per route we assert the navigation held auth (no /login bounce), the HTTP
 * status was < 400, the (platform) error boundary did NOT render, and an <h1>
 * mounted (ModuleHeader canon). Create pages additionally must mount a <form>.
 *
 * Canonical paths are `/studio/*` (the operator console moved off `/console`
 * in ADR-0011; `/console/*` only survives as a permanent redirect).
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

type Surface = { href: string; form?: boolean };

const SURFACES: Surface[] = [
  // Procurement Receiving (goods receipts + 3-way match)
  { href: "/studio/procurement/receiving/new", form: true },
  // GL Ledger (journal entries)
  { href: "/studio/finance/ledger/new", form: true },
  // Asset Lifecycle + Warranties
  { href: "/studio/assets/new", form: true },
  // Contracts / CLM (repointed to /studio/legal/contracts)
  { href: "/studio/legal/contracts/new", form: true },
  // Approvals engine — policy + delegation sub-domains (not standalone nav entries)
  { href: "/studio/governance/approvals/policies" },
  { href: "/studio/governance/approvals/policies/new", form: true },
  { href: "/studio/governance/approvals/delegations" },
  { href: "/studio/governance/approvals/delegations/new", form: true },
];

async function probe(page: Page, s: Surface): Promise<string | null> {
  const errs: string[] = [];
  const onErr = (e: Error) => errs.push(e.message.split("\n")[0] ?? e.message);
  page.on("pageerror", onErr);
  try {
    const res = await page.goto(s.href, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    if (/\/login(\?|$)/.test(page.url())) return `${s.href} → bounced to /login`;
    if (status >= 400) return `${s.href} → HTTP ${status}`;
    const body = (await page.locator("body").innerText().catch(() => "")).slice(0, 1500);
    if (/application error|something went wrong|unhandled runtime|digest:/i.test(body))
      return `${s.href} → error boundary rendered`;
    await expect(page.locator("h1").first(), `${s.href} has no <h1>`).toBeVisible({ timeout: 15000 });
    if (s.form) {
      await expect(page.locator("main form").first(), `${s.href} has no <form>`).toBeVisible({ timeout: 15000 });
    }
    if (errs.length) return `${s.href} → uncaught: ${errs[0]}`;
    return null;
  } catch (e) {
    return `${s.href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onErr);
  }
}

test.describe("console — Tier 1+2 domain surfaces render", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("all Tier 1+2 create/sub-domain pages render without error", async ({ page }) => {
    const failures: string[] = [];
    for (const s of SURFACES) {
      const fail = await probe(page, s);
      if (fail) failures.push(fail);
    }
    expect(failures, `Broken Tier 1+2 surfaces:\n${failures.join("\n")}`).toEqual([]);
  });
});
