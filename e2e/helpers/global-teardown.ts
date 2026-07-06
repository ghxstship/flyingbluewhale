import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * After EVERY suite, purge the E2E create-flow residue from the shared fixtures
 * so it can't accumulate across runs and eventually trip an app cap (the ≤100%
 * co-pro split, the listOrgScoped 100-row vendor cap, …) that breaks the next
 * run. Delegates to `scripts/e2e-clean-fixtures.mjs` (self-contained: loads
 * `.env.local`, deletes only E2E-tagged rows, RLS-scoped as the owner fixture).
 *
 * Hard rule: this NEVER throws. Cleanup is hygiene — if it can't run (no creds,
 * network hiccup) we swallow it so a green suite is never turned red by teardown.
 * Because it deletes ALL matching residue (not just this run's), one completed
 * run also clears anything a prior interrupted run left behind.
 */
export default async function globalTeardown() {
  try {
    // Playwright runs from the repo root (where playwright.config.ts lives).
    const script = join(process.cwd(), "scripts", "e2e-clean-fixtures.mjs");
    const out = execFileSync("node", [script], { encoding: "utf8", timeout: 60_000 });
    if (out.trim()) process.stdout.write(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`e2e teardown — fixture cleanup skipped (ignored): ${msg}`);
  }
}
