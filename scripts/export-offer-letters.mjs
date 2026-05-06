// One-shot offer-letter PDF exporter for EDCLV26 Salvage City.
// Renders each letter from a self-contained HTML template, prints to PDF
// via Playwright/Chromium, saves to ~/Desktop/. No dev server required.
//
// Input bundle: /tmp/sc_letters.json (array of resolved offer-letter rows
// pulled from the offer_letters_resolved view via Supabase MCP).
import { chromium } from "playwright";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BUNDLE = "/tmp/sc_letters.json";
const OUT = path.join(os.homedir(), "Desktop", "EDCLV26_Salvage_City_Offer_Letters");

const EMPLOYER_LABEL = {
  ghxstship: "GHXSTSHIP Industries LLC",
  five_senses: "Five Senses Group",
  joint: "Five Senses Group + GHXSTSHIP Industries LLC",
};
const CLASSIFICATION_LABEL = {
  w2: "W-2 Employee",
  "1099": "1099 Independent Contractor",
  agency: "Agency / Loan-out",
  intern: "Intern",
};
const BASIS_LABEL = {
  per_day: "Per Day",
  per_show_day: "Per Show Day",
  flat_fee: "Flat Fee",
  hourly: "Hourly",
  tbd: "To Be Determined",
};

const safe = (s) => s.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => {
  if (!iso) return "TBD";
  const d = new Date(iso + (iso.length <= 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};
const fmtRange = (a, b) => {
  if (!a && !b) return "TBD";
  const f = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (a && b) return `${f(a)} – ${f(b)}`;
  return f(a ?? b);
};
const fmtUSD = (cents) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function fmtCompensation(l) {
  if (l.compensation_basis === "tbd" || (l.effective_compensation_cents ?? 0) === 0) {
    return "To be confirmed prior to signature";
  }
  const total = fmtUSD(l.effective_compensation_cents);
  switch (l.compensation_basis) {
    case "per_day":
    case "per_show_day":
      return l.rate_unit_price_cents
        ? `${fmtUSD(l.rate_unit_price_cents)} per day × ${l.engagement_days} days = ${total}`
        : total;
    case "hourly":
      return l.rate_unit_price_cents ? `${fmtUSD(l.rate_unit_price_cents)} per hour (${total} estimated)` : total;
    case "flat_fee":
    default:
      return total;
  }
}

function renderHTML(l) {
  const employerLabel = EMPLOYER_LABEL[l.employer] ?? l.employer;
  const venueLine = [l.venue_name, l.venue_city, l.venue_region].filter(Boolean).join(" · ");
  const ref = `OL-${String(l.id).slice(0, 8).toUpperCase()}`;
  const issuedOn = fmtDate(l.created_at?.slice(0, 10));
  const inclusions = l.effective_inclusions ?? [];
  const allInclusions = [
    ...inclusions.map((s) => esc(s)),
    l.effective_travel_provided ? "Travel provided / arranged" : null,
    l.effective_lodging_provided ? "Lodging provided" : null,
    l.effective_meals_provided ? "Crew meals on call days" : null,
  ].filter(Boolean);
  const firstName = (l.recipient_name ?? "").split(" ")[0];
  const reportsTo = l.reports_to_name
    ? `${esc(l.reports_to_name)}${l.reports_to_email ? ` · ${esc(l.reports_to_email)}` : ""}`
    : "—";
  const perDiemLine =
    (l.effective_per_diem_cents ?? 0) > 0 ? `${fmtUSD(l.effective_per_diem_cents)} per day` : "—";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Engagement Letter — ${esc(l.recipient_name)}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 11pt; line-height: 1.5; color: #0a0a0a; background: #fff;
    padding: 0.2in 0;
  }
  .doc { max-width: 7.4in; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 1px solid #d8d4cc; padding-bottom: 18pt; margin-bottom: 22pt; }
  .eyebrow { font-family: "SFMono-Regular", Menlo, monospace; font-size: 8pt;
    letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
  h1 { font-size: 20pt; font-weight: 600; margin: 6pt 0 2pt; line-height: 1.15; }
  .project { color: #6b6b6b; font-size: 10pt; }
  .meta { text-align: right; font-size: 8pt; color: #6b6b6b; line-height: 1.6; }
  .meta .ref { font-family: "SFMono-Regular", Menlo, monospace; }
  section { margin: 18pt 0; }
  section h2 { font-size: 9.5pt; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #444; margin: 0 0 10pt; }
  section p { margin: 6pt 0; }
  .recipient { font-weight: 600; font-size: 11pt; }
  .recipient-meta { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #6b6b6b; }
  dl.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt 24pt; margin: 0; }
  dl.kv > div { display: flex; flex-direction: column; gap: 1pt; }
  dl.kv dt { font-size: 8pt; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6b6b; }
  dl.kv dd { margin: 0; font-size: 10.5pt; }
  ul.dot { margin: 0; padding: 0; list-style: none; }
  ul.dot li { padding-left: 14pt; position: relative; margin: 3pt 0; font-size: 10.5pt; }
  ul.dot li::before { content: "·"; color: #888; position: absolute; left: 4pt; }
  .terms { white-space: pre-line; font-size: 10pt; }
  .signoff { border-top: 1px solid #d8d4cc; padding-top: 18pt; margin-top: 28pt;
    display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; align-items: end; }
  .signoff .left .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .signoff .left .name { font-size: 16pt; font-style: italic; margin: 6pt 0 2pt;
    border-bottom: 1px solid #999; padding-bottom: 6pt; min-height: 24pt; }
  .signoff .left .role { font-size: 9pt; color: #6b6b6b; }
  .signoff .right { text-align: right; font-size: 8pt; color: #6b6b6b; }
  .signoff .right .ref { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #0a0a0a; }
  .accent { background: #d4ff00; height: 4pt; margin: 0 -0.6in 18pt; }
  .signature-block { margin-top: 18pt; }
  .signature-line { border-bottom: 1px solid #999; height: 22pt; margin-bottom: 4pt; }
  .signature-row { display: grid; grid-template-columns: 2fr 1fr; gap: 18pt; }
  .signature-row .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; margin-bottom: 14pt; }
  .access { margin-top: 22pt; padding: 10pt 14pt; border: 1px solid #d8d4cc; background: #fafaf7;
    font-size: 9pt; }
  .access .h { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .access .code { font-family: "SFMono-Regular", Menlo, monospace; font-size: 11pt; margin-top: 4pt; }
  .access .url { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #2c2c2c; word-break: break-all; }
</style></head>
<body>
<div class="accent"></div>
<div class="doc">
  <header>
    <div>
      <div class="eyebrow">${esc(employerLabel)}</div>
      <h1>Engagement Letter</h1>
      <div class="project">${esc(l.project_name)}</div>
    </div>
    <div class="meta">
      <div>Issued ${esc(issuedOn)}</div>
      <div class="ref">REF · ${esc(ref)}</div>
    </div>
  </header>

  <section>
    <div class="eyebrow">Recipient</div>
    <div class="recipient">${esc(l.recipient_name)}</div>
    <div class="recipient-meta">${esc(l.recipient_email ?? "—")}${l.recipient_phone ? ` · ${esc(l.recipient_phone)}` : ""}</div>
  </section>

  <section>
    <p>Dear <strong>${esc(firstName)}</strong>,</p>
    <p>On behalf of ${esc(employerLabel)}, we are pleased to offer you the role of
      <strong>${esc(l.role_title)}</strong> for <strong>${esc(l.project_name)}</strong>.
      This letter outlines the engagement, compensation, and terms under which we propose to work together.</p>
  </section>

  <section>
    <h2>1. Engagement Summary</h2>
    <dl class="kv">
      <div><dt>Role</dt><dd>${esc(l.role_title)}</dd></div>
      <div><dt>Department</dt><dd>${esc(l.role_department || "—")}</dd></div>
      <div><dt>Classification</dt><dd>${esc(CLASSIFICATION_LABEL[l.classification] ?? l.classification)}</dd></div>
      <div><dt>Reports To</dt><dd>${reportsTo}</dd></div>
      <div><dt>Work Location</dt><dd>${esc(venueLine || "—")}</dd></div>
      <div><dt>Engagement Window</dt><dd>${esc(fmtRange(l.effective_start, l.effective_end))}</dd></div>
    </dl>
  </section>

  <section>
    <h2>2. Compensation</h2>
    <dl class="kv">
      <div><dt>Basis</dt><dd>${esc(BASIS_LABEL[l.compensation_basis] ?? l.compensation_basis)}</dd></div>
      <div><dt>Compensation</dt><dd>${esc(fmtCompensation(l))}</dd></div>
      <div><dt>Per Diem</dt><dd>${esc(perDiemLine)}</dd></div>
      <div><dt>Payment Schedule</dt><dd>${esc(l.effective_payment_schedule ?? "—")}</dd></div>
    </dl>
  </section>

  <section>
    <h2>3. Inclusions</h2>
    ${allInclusions.length === 0
      ? `<p style="color:#6b6b6b">No additional inclusions specified.</p>`
      : `<ul class="dot">${allInclusions.map((x) => `<li>${x}</li>`).join("")}</ul>`}
  </section>

  ${l.effective_expectations ? `
  <section>
    <h2>4. Expectations</h2>
    <p class="terms">${esc(l.effective_expectations)}</p>
  </section>` : ""}

  ${l.effective_terms ? `
  <section>
    <h2>5. Terms</h2>
    <p class="terms">${esc(l.effective_terms)}</p>
  </section>` : ""}

  <section>
    <h2>6. Governing Law &amp; Confidentiality</h2>
    <p>This engagement is governed by the laws of the ${esc(l.effective_governing_law ?? "State of Florida")}.
    ${l.effective_confidentiality ? "The contents of this letter are confidential and may not be shared outside the recipient and their direct counsel." : ""}</p>
  </section>

  <div class="signoff">
    <div class="left">
      <div class="label">For ${esc(employerLabel)}</div>
      <div class="name">${esc(l.signing_authority_name ?? "Julian Clarkson")}</div>
      <div class="role">${esc(l.signing_authority_email ?? "julian.clarkson@ghxstship.pro")}</div>
    </div>
    <div class="right">
      <div>Reference</div>
      <div class="ref">${esc(ref)}</div>
    </div>
  </div>

  <div class="signature-block">
    <div class="signature-row">
      <div>
        <div class="label">Recipient Signature</div>
        <div class="signature-line"></div>
        <div style="font-size:8pt;color:#6b6b6b;">${esc(l.recipient_name)}</div>
      </div>
      <div>
        <div class="label">Date</div>
        <div class="signature-line"></div>
      </div>
    </div>
  </div>

  <div class="access">
    <div class="h">Online Acceptance</div>
    <div style="margin-top:6pt;">To accept this offer online, visit:</div>
    <div class="url">https://lytehaus.tech/offer/${esc(l.public_token)}</div>
    <div style="margin-top:6pt;">Access code:</div>
    <div class="code">${esc(l.access_code)}</div>
  </div>
</div>
</body></html>`;
}

async function main() {
  const letters = JSON.parse(await fs.readFile(BUNDLE, "utf8"));
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const results = [];

  for (const letter of letters) {
    const page = await ctx.newPage();
    const html = renderHTML(letter);
    await page.setContent(html, { waitUntil: "load" });
    const filename = `EDCLV26_Salvage_City_Offer_Letter_${safe(letter.recipient_name)}.pdf`;
    const outPath = path.join(OUT, filename);
    await page.pdf({
      path: outPath,
      format: "Letter",
      printBackground: true,
      margin: { top: "0in", right: "0in", bottom: "0.4in", left: "0in" },
    });
    const stat = await fs.stat(outPath);
    results.push({ name: letter.recipient_name, file: filename, kb: (stat.size / 1024).toFixed(1) });
    await page.close();
  }
  await browser.close();

  console.log("\n=== Offer-letter export ===");
  for (const r of results) {
    console.log(`  ✓ ${r.name.padEnd(28)}  ${r.file}  (${r.kb} KB)`);
  }
  console.log(`\nWrote ${results.length} PDFs to: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
