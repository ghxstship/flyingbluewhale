import { test as base } from "playwright/test";

/**
 * Shared Playwright `test` with a resilient `page.goto`.
 *
 * Against a REMOTE target (E2E_BASE_URL / prod) a navigation occasionally hits a
 * TRANSIENT network failure — the in-flight nav is superseded by a middleware
 * redirect / Supabase session-cookie refresh (`net::ERR_ABORTED`), or the
 * connection to the edge times out / resets (`ERR_TIMED_OUT`,
 * `ERR_CONNECTION_*`, `ERR_HTTP2_*`, …). These recover on a re-issue, so we wrap
 * `goto` to retry exactly this class and let every other error propagate. Local
 * dev never hits them, so the wrapper is a no-op there.
 *
 * All specs import { test, expect } from this module instead of directly from
 * "playwright/test" so the whole suite gets deterministic navigation.
 */
// Transient, retry-worthy navigation failures (connection-level, not app-level).
const TRANSIENT_NET = /ERR_(ABORTED|TIMED_OUT|CONNECTION_|NETWORK_CHANGED|HTTP2_|EMPTY_RESPONSE|SOCKET_)/;

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
          if (!TRANSIENT_NET.test(msg)) throw e;
          await page.waitForTimeout(500 * (attempt + 1));
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
