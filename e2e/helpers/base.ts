import { test as base } from "playwright/test";

/**
 * Shared Playwright `test` with a resilient `page.goto`.
 *
 * Against a REMOTE target (E2E_BASE_URL / prod) a navigation is occasionally
 * superseded by a middleware redirect / Supabase session-cookie refresh, which
 * aborts the in-flight navigation → `net::ERR_ABORTED`. It recovers immediately
 * on a re-issue, so we wrap `goto` to retry that ONE transient rather than let
 * it leak as a test failure. Every other error propagates unchanged. Local dev
 * never hits this, so the wrapper is a no-op there.
 *
 * All specs import { test, expect } from this module instead of directly from
 * "playwright/test" so the whole suite gets deterministic navigation.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const orig = page.goto.bind(page);
    const resilientGoto: typeof page.goto = async (url, opts) => {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await orig(url, opts);
        } catch (e) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : String(e);
          if (!msg.includes("ERR_ABORTED")) throw e;
          await page.waitForTimeout(400);
        }
      }
      throw lastErr;
    };
    page.goto = resilientGoto;
    // `use` is Playwright's fixture callback, not a React hook — the linter
    // heuristic mis-fires on the name.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from "playwright/test";
export type { Page, Locator, APIRequestContext } from "playwright/test";
