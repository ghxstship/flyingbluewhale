#!/usr/bin/env node
// SEA TRIAL — real-browser deployment-readiness click-through of atlvs.pro.
// Headed Chromium (channel: chrome) via Playwright + axe a11y smoke. Captures a
// per-route evidence bundle: screenshot · console errors/warnings · network
// 4xx/5xx · axe violations · load time. NON-DESTRUCTIVE on live data: opens
// menus/tabs/dialogs but never submits outward-facing forms, pays, invites,
// deletes, or signs out.
//
//   SEA_BASE=https://atlvs.pro  (apex; subdomains derived)
//   SEA_BATCH=public|login|<file>   SEA_LIMIT=N   SEA_HEADLESS=1
//
// Evidence → docs/audits/evidence/sea-trial/. Results → results-<batch>.json.

import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BASE = process.env.SEA_BASE || "https://atlvs.pro";
const BATCH = process.env.SEA_BATCH || "public";
const LIMIT = process.env.SEA_LIMIT ? parseInt(process.env.SEA_LIMIT, 10) : Infinity;
const HEADLESS = process.env.SEA_HEADLESS === "1";
const EVID = join(ROOT, "docs/audits/evidence/sea-trial");
mkdirSync(EVID, { recursive: true });

const slug = (u) => u.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "_").slice(0, 120);
const DESTRUCTIVE =
  /sign\s?out|log\s?out|delete|remove|revoke|cancel|pay|checkout|purchase|subscribe|invite|send|submit|publish|deactivate|archive|trash|disconnect/i;

// ── Public URL set: apex static routes + concrete dynamic samples ──────────
function publicUrls() {
  const sm = readFileSync(join(ROOT, "docs/ia/SITEMAP.md"), "utf8");
  // Lines like:  ● `/pricing`   — only within the marketing shell section.
  const marketingSection = sm.split("## GVTEWAY — Public / Marketing")[1]?.split("\n## ")[0] ?? "";
  const routes = [...marketingSection.matchAll(/[●○⚠·]\s+`([^`]+)`/g)].map((m) => m[1]);
  const authSection = sm.split("## Auth")[1]?.split("\n## ")[0] ?? "";
  const authRoutes = [...authSection.matchAll(/[●○⚠·]\s+`([^`]+)`/g)].map((m) => m[1]);
  const all = [...new Set([...routes, ...authRoutes])];
  // Static (no dynamic segment) → use as-is.
  const statics = all.filter((r) => !r.includes("["));
  // Concrete samples for the dynamic SEO/marketing routes (real published values).
  const samples = [
    "/solutions/live-events", "/solutions/concerts", "/solutions/festivals-tours",
    "/compare/cvent", "/compare/procore", "/alternatives",
    "/teams/tour-managers", "/teams/production-managers",
    "/features", "/integrations", "/tools/capacity-calculator", "/tools/per-diem-calculator",
    "/marketplace/talent", "/marketplace/crew", "/marketplace/vendors",
    "/marketplace/gigs", "/marketplace/calls", "/marketplace/rfqs", "/marketplace/store",
  ];
  return [...new Set([...statics, ...samples])].map((r) => BASE + r);
}

function urlsForBatch() {
  if (BATCH === "public") return publicUrls();
  if (existsSync(BATCH)) return readFileSync(BATCH, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
  return publicUrls();
}

async function visit(page, url) {
  const consoleErrors = [], consoleWarns = [], pageErrors = [], net = [];
  const onConsole = (m) => {
    const t = m.type();
    if (t === "error") consoleErrors.push(m.text().slice(0, 300));
    else if (t === "warning") consoleWarns.push(m.text().slice(0, 200));
  };
  const onPageError = (e) => pageErrors.push(String(e).slice(0, 300));
  const onResponse = (r) => {
    const s = r.status();
    if (s >= 400) net.push({ url: r.url().slice(0, 200), status: s });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  let mainStatus = 0, loadMs = 0, navOk = true, navErr = "";
  const t0 = Date.now();
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    mainStatus = resp ? resp.status() : 0;
    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
    loadMs = Date.now() - t0;
  } catch (e) {
    navOk = false;
    navErr = String(e).split("\n")[0].slice(0, 200);
    loadMs = Date.now() - t0;
  }

  const file = join(EVID, slug(url) + ".png");
  let interactions = 0, opened = 0;
  if (navOk) {
    try { await page.screenshot({ path: file, fullPage: true, timeout: 20000 }); } catch {}
    // Safe interaction: open menus/tabs/accordions/dialog triggers; skip destructive + submits.
    try {
      const handles = await page.$$(
        'button:not([type=submit]), [role=tab], [role=button], summary, [aria-haspopup], [data-state]',
      );
      for (const h of handles.slice(0, 25)) {
        if (interactions >= 15) break;
        try {
          if (!(await h.isVisible())) continue;
          const txt = ((await h.innerText().catch(() => "")) || (await h.getAttribute("aria-label")) || "").trim();
          if (DESTRUCTIVE.test(txt)) continue;
          await h.click({ timeout: 1500, trial: false });
          interactions++;
          // If something opened, snapshot it then close.
          const dlg = await page.$('[role=dialog], [role=menu], [data-state="open"]');
          if (dlg) { opened++; await page.screenshot({ path: join(EVID, slug(url) + `_open${opened}.png`), timeout: 8000 }).catch(() => {}); await page.keyboard.press("Escape").catch(() => {}); }
        } catch {}
      }
    } catch {}
  }

  // axe a11y smoke.
  let axe = { violations: [], error: null };
  if (navOk) {
    try {
      const r = await new AxeBuilder({ page }).analyze();
      axe.violations = r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length }));
    } catch (e) { axe.error = String(e).slice(0, 120); }
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("response", onResponse);

  const status =
    !navOk || mainStatus >= 500 || pageErrors.length || consoleErrors.length ? "FAIL"
    : mainStatus >= 400 || axe.violations.length || net.length || loadMs > 6000 || consoleWarns.length ? "WARN"
    : "PASS";

  return {
    url, status, mainStatus, loadMs, navOk, navErr,
    consoleErrors: consoleErrors.slice(0, 8), consoleWarns: consoleWarns.slice(0, 5),
    pageErrors, net: net.slice(0, 10), axe, interactions, opened,
    screenshot: navOk ? file.replace(ROOT + "/", "") : null,
  };
}

async function login(page) {
  const email = process.env.SEA_EMAIL, pass = process.env.SEA_PASS;
  if (!email || !pass) throw new Error("SEA_EMAIL/SEA_PASS required for login");
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 35000 });
  await page.fill('input[type=email], input[name=email]', email);
  await page.fill('input[type=password], input[name=password]', pass);
  await page.screenshot({ path: join(EVID, "login_filled.png") }).catch(() => {});
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}),
    page.click('button[type=submit], button:has-text("Log in"), button:has-text("Sign in")'),
  ]);
  await page.waitForTimeout(2500);
  const landed = page.url();
  await page.screenshot({ path: join(EVID, "login_landed.png"), fullPage: true }).catch(() => {});
  return landed;
}

(async () => {
  let browser;
  for (const opts of [{ channel: "chrome", headless: HEADLESS }, { headless: true }]) {
    try { browser = await chromium.launch(opts); break; } catch (e) { console.error("launch failed", opts, String(e).slice(0, 100)); }
  }
  if (!browser) { console.error("no browser"); process.exit(1); }
  const stateFile = process.env.SEA_STATE;
  const ctxOpts = { viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true };
  if (BATCH !== "login" && stateFile && existsSync(stateFile)) ctxOpts.storageState = stateFile;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();

  if (BATCH === "login") {
    const landed = await login(page);
    if (stateFile) await ctx.storageState({ path: stateFile });
    const authed = !/\/login/.test(landed);
    console.log(`LOGIN ${authed ? "OK" : "FAILED"} landed=${landed} state=${stateFile || "(none)"}`);
    writeFileSync(join(EVID, "login-result.json"), JSON.stringify({ landed, authed, at: new Date().toISOString() }, null, 2));
    await browser.close();
    return;
  }

  const urls = urlsForBatch().slice(0, LIMIT);
  console.log(`SEA TRIAL batch=${BATCH} base=${BASE} urls=${urls.length} headless=${HEADLESS || "chrome-headed"}`);
  const results = [];
  let i = 0;
  for (const url of urls) {
    i++;
    const r = await visit(page, url);
    results.push(r);
    console.log(`[${i}/${urls.length}] ${r.status} ${r.mainStatus} ${r.loadMs}ms ax=${r.axe.violations.length} ce=${r.consoleErrors.length} cw=${r.consoleWarns.length} net=${r.net.length} ${url.replace(BASE, "")}`);
  }
  const out = join(EVID, `results-${BATCH.replace(/[^a-z0-9]+/gi, "_")}.json`);
  writeFileSync(out, JSON.stringify({ base: BASE, batch: BATCH, at: new Date().toISOString(), results }, null, 2));
  const tally = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  console.log(`DONE ${JSON.stringify(tally)} → ${out.replace(ROOT + "/", "")}`);
  await browser.close();
})();
