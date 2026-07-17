/**
 * Capture the kit-29 "Spec Only · Frame Pending" gallery frames off the LIVE
 * deployment — one phone-viewport PNG per ratified/new COMPVSS surface, for
 * hand-back into the DS project's `kits/compvss/apps/field/gallery/`.
 *
 *   node scripts/capture-kit29-gallery.mjs [baseUrl] [outDir]
 *
 * Defaults: https://atlvs.pro → docs/design/kit29-gallery/. Signs in as the
 * seeded crew fixture (crew@gvteway.test — the documented COMPVSS test
 * account) through the kit auth wizard, then walks the surface list. A
 * surface that fails to render still writes its frame (the failure IS the
 * finding) and is listed in the summary.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "https://atlvs.pro";
const OUT = process.argv[3] ?? "docs/design/kit29-gallery";
const EMAIL = process.env.COMPVSS_TEST_EMAIL ?? "crew@gvteway.test";
const PASSWORD = process.env.COMPVSS_TEST_PASSWORD ?? "CompvssTest2026!";

/** route → gallery file stem (the spec entry ids). */
const SURFACES = [
  ["/m/search", "search"],
  ["/m/support", "support"],
  ["/m/settings/about", "aboutlegal"],
  ["/m/settings/account", "account"],
  ["/m/alerts", "alerts-crisis"],
  ["/m/punch", "punch"],
  ["/m/snags", "snags"],
  ["/m/briefings", "briefings"],
  ["/m/lost-found", "lostfound"],
  ["/m/my-work", "mywork"],
  ["/m/timesheets", "timesheets"],
  ["/m/expenses", "expenses"],
  ["/m/mileage", "mileage"],
  ["/m/requisitions", "requisitions"],
  ["/m/handover", "handover"],
  ["/m/daily-log", "dailylog"],
  ["/m/coc", "coc"],
  ["/m/door", "door"],
  ["/m/guide", "guide"],
  ["/m/settings/team", "team"],
  ["/m/incidents", "incident"],
  ["/m/check-in", "scan"],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// Consent first (the scrim intercepts every tap until dismissed).
await page.goto(`${BASE}/m`, { waitUntil: "networkidle" });
// The consent banner intercepts every tap until dismissed, and it hydrates
// late — a fire-and-forget click on the pre-hydration DOM does nothing (the
// _debug-gate frame proved it). Block until the button exists, click it,
// and block until the banner is GONE before touching the wizard.
const reject = page.getByRole("button", { name: /reject all/i });
await reject.waitFor({ state: "visible", timeout: 20000 });
await reject.click();
await reject.waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);

// Kit auth wizard: I Already Have an Account → email + password → Dive In.
try {
  await page.getByText(/already have an account/i).click({ timeout: 20000 });
} catch (e) {
  await page.screenshot({ path: `${OUT}/_debug-gate.png` });
  console.error("gate state saved to _debug-gate.png; url=", page.url());
  throw e;
}
await page.getByPlaceholder(/rio@/i).fill(EMAIL);
await page.getByPlaceholder(/your password/i).fill(PASSWORD);
await page.getByRole("button", { name: /dive in/i }).click();
await page.waitForURL(/\/m(\/|\?|$)/, { timeout: 30000 });
await page.waitForTimeout(2500);

const failures = [];
for (const [route, stem] of SURFACES) {
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200); // settle images/skeletons
  } catch {
    failures.push(`${route} (navigation)`);
  }
  const body = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  if (/application error|unhandled|digest:/i.test(body)) failures.push(`${route} (error boundary)`);
  await page.screenshot({ path: `${OUT}/${stem}.png`, fullPage: false });
  console.log(`✓ ${stem}.png ← ${route}`);
}

await browser.close();
if (failures.length) {
  console.error(`\nSurfaces with problems:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`\nAll ${SURFACES.length} frames captured to ${OUT}/`);
