/**
 * Always-on render guard for the console surfaces added after the first full
 * sitemap inventory — the segments that closed the two flagged link gaps
 * (contracts detail/new/edit, email-inbox detail) plus the newer create/list
 * pages that are NOT in the sidebar nav (so `ia-coverage` can't reach them) and
 * carry no dynamic id (so they're verifiable without seeded fixtures):
 *
 *   - /studio/contracts            (list)  + /new
 *   - /studio/envelopes            (list)  + /new
 *   - /studio/email-inbox          (list)
 *   - /studio/finance/ap-ocr       (list)
 *   - /studio/finance/wip/new      (create)
 *   - /studio/settings/integrations/accounting + /new
 *
 * Per route we assert the navigation held auth (no /login bounce), the HTTP
 * status was < 400, and the (platform) error boundary did NOT render. Create
 * pages additionally must mount a <form>. Full detail-page (`[id]`) coverage is
 * provided by the opt-in sitemap crawl (CRAWL=1).
 */
import { expect, test, type Page } from "./helpers/base";
import { authedSetup } from "./helpers/auth";

type Surface = { href: string; form?: boolean; link?: string };

const SURFACES: Surface[] = [
  // Contracts/CLM moved to /studio/legal/contracts (commit 73f9844).
  { href: "/studio/legal/contracts" },
  { href: "/studio/legal/contracts/new", form: true },
  { href: "/studio/envelopes" },
  { href: "/studio/envelopes/new", form: true },
  { href: "/studio/email-inbox" },
  { href: "/studio/finance/ap-ocr" },
  { href: "/studio/finance/wip/new", form: true },
  { href: "/studio/settings/integrations/accounting" },
  // Connect screen, by design form-less: a "Connect" anchor 302s to the
  // provider's OAuth flow (no secret-capturing form in the UI). Assert the
  // connect affordance rather than a <form>.
  { href: "/studio/settings/integrations/accounting/new", link: "Connect" },
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
    // Every console surface mounts an <h1> (ModuleHeader canon).
    await expect(page.locator("h1").first(), `${s.href} has no <h1>`).toBeVisible({ timeout: 15000 });
    if (s.form) {
      await expect(page.locator("main form").first(), `${s.href} has no <form>`).toBeVisible({ timeout: 15000 });
    }
    if (s.link) {
      await expect(
        page.getByRole("link", { name: s.link }).first(),
        `${s.href} has no "${s.link}" link`,
      ).toBeVisible({ timeout: 15000 });
    }
    if (errs.length) return `${s.href} → uncaught: ${errs[0]}`;
    return null;
  } catch (e) {
    return `${s.href} → ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
  } finally {
    page.off("pageerror", onErr);
  }
}

test.describe("console — recently-added surfaces render", () => {
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => authedSetup(page, "owner"));

  test("all post-inventory create/list pages render without error", async ({ page }) => {
    const failures: string[] = [];
    for (const s of SURFACES) {
      const fail = await probe(page, s);
      if (fail) failures.push(fail);
    }
    expect(failures, `Broken recently-added surfaces:\n${failures.join("\n")}`).toEqual([]);
  });
});
