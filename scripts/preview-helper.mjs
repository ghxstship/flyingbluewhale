// Render the engagement-letter HTML directly (not the PDF) and capture
// full-page screenshots split into ~1400-pixel slices for review.
//
// Usage: node scripts/preview-helper.mjs "Sarah Fry"
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

// Re-render via the export script's pieces — duplicate to keep this self-contained.
const { execSync } = await import("node:child_process");
const TARGET = process.argv[2] || "Sarah Fry";

// Read the bundles + reuse the export script's renderHTML by inline-evaluating it.
// Simpler: regenerate the HTML by spawning a small child that reads the bundles
// and the renderHTML, then writes the HTML to /tmp.
const helperJS = `
import fs from "node:fs/promises";
const code = await fs.readFile("/Users/julianclarkson/Documents/flyingbluewhale/scripts/export-offer-letters.mjs", "utf8");
const m = code.match(/^function renderHTML[\\s\\S]+?^}$/m);
if (!m) { console.error("renderHTML not found"); process.exit(1); }
// Pull supporting helpers too
const helperBlock = code.match(/const EMPLOYER_LABEL = [\\s\\S]+?function fmtCompensation[\\s\\S]+?^}$/m);
if (!helperBlock) { console.error("helpers not found"); process.exit(1); }
const TRAVELERS_block = code.match(/const TRAVELERS = new Set\\([^)]+\\);/);
const PRODUCTION_GUIDE_block = code.match(/const PRODUCTION_GUIDE_URL = "[^"]+";/);
const inline = [TRAVELERS_block[0], PRODUCTION_GUIDE_block[0], helperBlock[0], m[0]].join("\\n");
const letters = JSON.parse(await fs.readFile("/tmp/sc_letters.json","utf8"));
const schedules = JSON.parse(await fs.readFile("/tmp/sc_schedules.json","utf8"));
const fn = new Function("letter","schedule",\`\${inline}\\nreturn renderHTML(letter, schedule);\`);
const target = process.argv[2];
const letter = letters.find(l => l.recipient_name === target);
if (!letter) { console.error("not found:", target); process.exit(1); }
const sched = schedules[letter.recipient_name] || [];
const html = fn(letter, sched);
await fs.writeFile("/tmp/_preview.html", html);
console.log("wrote /tmp/_preview.html");
`;
await fs.writeFile("/tmp/_render_one.mjs", helperJS);
execSync(`node /tmp/_render_one.mjs ${JSON.stringify(TARGET)}`, { stdio: "inherit" });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.goto("file:///tmp/_preview.html");
await page.waitForLoadState("load");

// Compute total height
const totalH = await page.evaluate(() => document.body.scrollHeight);
const sliceH = 1400;
const slices = Math.ceil(totalH / sliceH);

const safe = TARGET.replace(/[^a-z0-9]+/gi, "_");
for (let i = 0; i < slices; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * sliceH);
  await page.waitForTimeout(200);
  const out = `/tmp/letter_${safe}_p${i + 1}.png`;
  await page.screenshot({ path: out });
  console.log(`captured slice ${i + 1}/${slices} (offset ${i * sliceH}) → ${out}`);
}
await browser.close();
console.log(`Total document height: ${totalH}px, ${slices} slices.`);
