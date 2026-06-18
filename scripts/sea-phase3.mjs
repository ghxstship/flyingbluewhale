#!/usr/bin/env node
// SEA TRIAL — Phase 3 write-lifecycle against a NON-PROD preview deploy.
// Full create → read → update → delete round-trip on a CRM lead (UI → server
// action → Supabase → back), then verifies teardown. Path-prefix mode (preview
// has no subdomains), so console lives at <base>/console.
//
//   SEA_BASE=https://<preview>.vercel.app SEA_EMAIL=… SEA_PASS=… \
//     [SEA_BYPASS=<x-vercel-protection-bypass>] node scripts/sea-phase3.mjs
//
// Evidence → docs/audits/evidence/sea-trial/phase3/.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BASE = (process.env.SEA_BASE || "").replace(/\/$/, "");
const EMAIL = process.env.SEA_EMAIL, PASS = process.env.SEA_PASS;
const BYPASS = process.env.SEA_BYPASS; // Vercel deployment-protection bypass token
if (!BASE || !EMAIL || !PASS) { console.error("need SEA_BASE/SEA_EMAIL/SEA_PASS"); process.exit(1); }
const EVID = join(ROOT, "docs/audits/evidence/sea-trial/phase3");
mkdirSync(EVID, { recursive: true });

const LABEL = `SEA-TRIAL Lead ${process.env.SEA_TS || "run"}`;
const steps = [];
const shot = (page, n) => page.screenshot({ path: join(EVID, n + ".png"), fullPage: true }).catch(() => {});

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const record = (step, ok, detail) => { steps.push({ step, ok, detail }); console.log(`${ok ? "✓" : "✗"} ${step} — ${detail}`); };

  try {
    // Vercel deployment-protection bypass: visiting the _vercel_share link sets
    // an auth cookie on the context for all subsequent preview navigations.
    if (BYPASS) {
      await page.goto(BYPASS, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForTimeout(1200);
    }
    // 0 — LOGIN
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.fill("input[type=email], input[name=email]", EMAIL);
    await page.fill("input[type=password], input[name=password]", PASS);
    await Promise.all([
      page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}),
      page.click('button[type=submit], button:has-text("Log in"), button:has-text("Sign in")'),
    ]);
    await page.waitForTimeout(2500);
    await shot(page, "0-login");
    record("login", !/\/login/.test(page.url()), `landed ${page.url()}`);

    // 1 — CREATE
    await page.goto(`${BASE}/console/leads/new`, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.fill('input[name="name"]', LABEL);
    await page.fill('input[name="source"]', "sea-trial").catch(() => {});
    await shot(page, "1-create-form");
    await Promise.all([
      page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}),
      page.click('button[type=submit]'),
    ]);
    await page.waitForTimeout(2000);
    const afterCreate = page.url();
    const m = afterCreate.match(/\/console\/leads\/([0-9a-f-]{36})/);
    const leadId = m ? m[1] : null;
    await shot(page, "2-created-detail");
    record("create", !!leadId, `redirected to ${afterCreate}${leadId ? ` (id ${leadId})` : " (no id in URL)"}`);

    // 2 — READ (appears in list)
    await page.goto(`${BASE}/console/leads`, { waitUntil: "domcontentloaded", timeout: 35000 });
    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
    const inList = (await page.content()).includes(LABEL);
    await shot(page, "3-read-list");
    record("read", inList, inList ? `"${LABEL}" present in /console/leads` : "lead not found in list");

    // 3 — UPDATE (edit a field)
    let updated = false;
    if (leadId) {
      await page.goto(`${BASE}/console/leads/${leadId}/edit`, { waitUntil: "domcontentloaded", timeout: 35000 });
      const newSource = "sea-trial-updated";
      const srcInput = await page.$('input[name="source"]');
      if (srcInput) {
        await srcInput.fill(newSource);
        await Promise.all([
          page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}),
          page.click('button[type=submit]'),
        ]);
        await page.waitForTimeout(1500);
        await page.goto(`${BASE}/console/leads/${leadId}`, { waitUntil: "domcontentloaded", timeout: 35000 });
        updated = (await page.content()).includes(newSource);
      }
      await shot(page, "4-updated-detail");
    }
    record("update", updated, updated ? "edited source persisted on detail" : "update not confirmed");

    // 4 — DELETE
    let deleted = false;
    if (leadId) {
      await page.goto(`${BASE}/console/leads/${leadId}`, { waitUntil: "domcontentloaded", timeout: 35000 });
      const delBtn = await page.$('form button:has-text("Delete"), button:has-text("Delete")');
      if (delBtn) {
        page.on("dialog", (d) => d.accept().catch(() => {})); // accept any confirm()
        await Promise.all([
          page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}),
          delBtn.click(),
        ]);
        await page.waitForTimeout(2000);
      }
      // verify gone from list
      await page.goto(`${BASE}/console/leads`, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
      deleted = !(await page.content()).includes(LABEL);
      await shot(page, "5-deleted-list");
    }
    record("delete", deleted, deleted ? `"${LABEL}" gone from list (cleanup verified)` : "lead still present — MANUAL CLEANUP NEEDED");

    writeFileSync(join(EVID, "phase3-result.json"), JSON.stringify({ base: BASE, label: LABEL, leadId, steps }, null, 2));
    const pass = steps.filter((s) => s.ok).length;
    console.log(`\nPHASE 3: ${pass}/${steps.length} steps passed`);
  } catch (e) {
    console.error("phase3 error:", String(e).slice(0, 300));
  } finally {
    await browser.close();
  }
})();
