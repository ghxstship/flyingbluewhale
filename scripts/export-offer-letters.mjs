// EDCLV26 Salvage City — engagement-letter PDF exporter.
//
// Renders each retained offer letter from /tmp/sc_letters.json (resolved
// view rows pulled via Supabase MCP) into a Letter-format PDF using
// Playwright/Chromium. Output mode is selected by env:
//
//   PREVIEW=1  →  write to /tmp/sc_offer_letters_preview/, also generate
//                 PNG thumbnails via qlmanage. No Desktop write.
//   (default)  →  write directly to ~/Desktop/EDCLV26_Salvage_City_Offer_Letters/
//
// Letter spec (2026-05-05):
//   * Daily rate is "$X per day for up to 10 hours per day max — overtime exempt"
//   * Per diem only shown for travelers (Sarah Fry, Vida Sotakoun)
//   * "Local Hire" indicator on everyone except Sarah + Vida
//   * Net 15 from invoice receipt for ALL 1099 letters
//   * Per-person working schedule pulled from playbook Labor tab
//   * NV/LV + FL compliance language
//   * Production guide link + onboarding & Know-Before-You-Go checklist
import { chromium } from "playwright";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const PREVIEW = process.env.PREVIEW === "1";
const LETTERS_BUNDLE = "/tmp/sc_letters.json";
const SCHEDULES_BUNDLE = "/tmp/sc_schedules.json";

const OUT_DESKTOP = path.join(os.homedir(), "Desktop", "EDCLV26_Salvage_City_Offer_Letters");
const OUT_PREVIEW = "/tmp/sc_offer_letters_preview";
const OUT = PREVIEW ? OUT_PREVIEW : OUT_DESKTOP;

// Travelers (per Julian, 2026-05-05) — NOT local hires; receive per diem.
const TRAVELERS = new Set(["Sarah Fry", "Vida Sotakoun"]);

const PRODUCTION_GUIDE_URL = "https://gvteway.lytehaus.tech/edclv26-salvage-city/guide";

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
const fmtTimeShort = (s) => {
  // "8:00:00 AM" → "8:00 AM"
  if (!s) return "—";
  return s.replace(/:00 (AM|PM)$/i, " $1").replace(/^0/, "");
};

// "$X per day for up to 10 hours per day max — overtime exempt"
// scheduledDays: actual count from the playbook Labor tab when present;
// otherwise falls back to the offer-letter's engagement_days span.
function fmtCompensation(l, scheduledDays) {
  if (l.compensation_basis === "tbd" || (l.effective_compensation_cents ?? 0) === 0) {
    return { rate: "To be confirmed prior to signature", caveat: "" };
  }
  if (l.compensation_basis === "flat_fee" && l.override_amount_cents) {
    return {
      rate: `${fmtUSD(l.override_amount_cents)} flat fee for the project`,
      caveat: "",
    };
  }
  if ((l.compensation_basis === "per_day" || l.compensation_basis === "per_show_day") && l.rate_unit_price_cents) {
    const days = scheduledDays && scheduledDays > 0 ? scheduledDays : l.engagement_days;
    const estTotal = l.rate_unit_price_cents * days;
    return {
      rate: `${fmtUSD(l.rate_unit_price_cents)} per day for up to 10 hours per day maximum — overtime exempt`,
      caveat: `Estimated total over ${days} scheduled work day${days === 1 ? "" : "s"}: ${fmtUSD(
        estTotal,
      )} (subject to actual days worked).`,
    };
  }
  if (l.compensation_basis === "hourly" && l.rate_unit_price_cents) {
    return {
      rate: `${fmtUSD(l.rate_unit_price_cents)} per hour`,
      caveat: `Estimated total: ${fmtUSD(l.effective_compensation_cents)} (subject to actual hours worked).`,
    };
  }
  return { rate: fmtUSD(l.effective_compensation_cents), caveat: "" };
}

function renderHTML(l, schedule) {
  const employerLabel = EMPLOYER_LABEL[l.employer] ?? l.employer;
  const venueLine = [l.venue_name, l.venue_city, l.venue_region].filter(Boolean).join(" · ") || "Las Vegas Motor Speedway · Las Vegas · NV";
  const ref = `OL-${String(l.id).slice(0, 8).toUpperCase()}`;
  const issuedOn = fmtDate(l.created_at?.slice(0, 10));
  const isTraveler = TRAVELERS.has(l.recipient_name);
  const isLocalHire = !isTraveler;
  const firstName = (l.recipient_name ?? "").split(" ")[0];
  const reportsTo = l.reports_to_name
    ? `${esc(l.reports_to_name)}${l.reports_to_email ? ` · ${esc(l.reports_to_email)}` : ""}`
    : "—";
  const parseSchedDate = (s) => {
    // Playbook dates come as "M/D/YYYY". new Date() handles this in Chromium,
    // but our ISO append breaks it — parse explicitly.
    const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    return new Date(s);
  };
  const fmtSchedDate = (s) => {
    const d = parseSchedDate(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const sched = (schedule || []).slice().sort((a, b) => parseSchedDate(a.date) - parseSchedDate(b.date));
  const totalHours = sched.reduce((sum, d) => sum + Number(d.hours || 0), 0);
  const scheduledDays = sched.length;
  let totalEngagementDays;
  if (scheduledDays > 0) totalEngagementDays = scheduledDays;
  else if (l.compensation_basis === "flat_fee") totalEngagementDays = "Per engagement (no fixed schedule)";
  else if (l.compensation_basis === "tbd") totalEngagementDays = "TBD";
  else totalEngagementDays = l.engagement_days || "—";
  const comp = fmtCompensation(l, scheduledDays);

  // Net 15 from invoice receipt for ALL 1099 letters (per Julian, 2026-05-05).
  // Includes TBD-rate letters (Paul, Alvaro) — payment terms apply once a rate
  // is confirmed and an invoice is submitted, regardless of basis.
  const paymentSchedule =
    l.classification === "1099"
      ? "Net 15 from receipt of properly submitted invoice"
      : l.effective_payment_schedule || "Net 15 from receipt of properly submitted invoice";

  // Per diem only for travelers. Federal GSA rate for Las Vegas (high season
  // May): $172 lodging + $79 M&IE — we render the rate as "$X/day" plus a
  // brief explainer.
  const perDiemLine = isTraveler && (l.effective_per_diem_cents ?? 0) > 0
    ? `${fmtUSD(l.effective_per_diem_cents)} per day (M&IE only; federal GSA Las Vegas rate)`
    : isTraveler
      ? "Per diem provided for travel days (rate TBD)"
      : null;

  // Pull inclusions and add traveler-specific items
  const inclusions = (l.effective_inclusions ?? []).slice();
  const allInclusions = [
    ...inclusions.map((s) => esc(s)),
    isTraveler && l.effective_travel_provided ? "Travel arranged by Five Senses" : null,
    isTraveler && l.effective_lodging_provided ? "Lodging provided in Las Vegas" : null,
    l.effective_meals_provided ? "Crew meals on call days at the venue" : null,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Engagement Letter — ${esc(l.recipient_name)}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.5; color: #0a0a0a; background: #fff;
  }
  .doc { max-width: 7.4in; margin: 0 auto; padding: 0 0 0.4in 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 1px solid #d8d4cc; padding-bottom: 16pt; margin-bottom: 18pt; }
  .eyebrow { font-family: "SFMono-Regular", Menlo, monospace; font-size: 8pt;
    letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
  h1 { font-size: 19pt; font-weight: 600; margin: 6pt 0 2pt; line-height: 1.15; }
  .project { color: #6b6b6b; font-size: 10pt; }
  .meta { text-align: right; font-size: 8pt; color: #6b6b6b; line-height: 1.6; }
  .meta .ref { font-family: "SFMono-Regular", Menlo, monospace; }
  section { margin: 14pt 0; page-break-inside: avoid; }
  section h2 { font-size: 9.5pt; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #444; margin: 0 0 8pt; }
  section p { margin: 4pt 0; }
  .recipient { font-weight: 600; font-size: 11pt; }
  .recipient-meta { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #6b6b6b; }
  dl.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 24pt; margin: 0; }
  dl.kv > div { display: flex; flex-direction: column; gap: 1pt; }
  dl.kv dt { font-size: 8pt; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6b6b; }
  dl.kv dd { margin: 0; font-size: 10pt; }
  .badge { display: inline-block; padding: 1pt 6pt; border-radius: 2pt; font-size: 8pt;
    font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.local { background: #d4ff00; color: #1a1a00; }
  .badge.traveler { background: #1a1a1a; color: #d4ff00; }
  .caveat { font-size: 9pt; color: #6b6b6b; margin-top: 3pt; }
  ul.dot { margin: 0; padding: 0; list-style: none; }
  ul.dot li { padding-left: 14pt; position: relative; margin: 2pt 0; font-size: 10pt; }
  ul.dot li::before { content: "·"; color: #888; position: absolute; left: 4pt; }
  ul.checkbox { margin: 0; padding: 0; list-style: none; }
  ul.checkbox li { padding-left: 22pt; position: relative; margin: 4pt 0; font-size: 10pt; }
  ul.checkbox li::before {
    content: ""; position: absolute; left: 0; top: 3pt;
    width: 10pt; height: 10pt; border: 1px solid #555; border-radius: 1pt;
  }
  table.sched { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.sched th { text-align: left; font-weight: 600; padding: 4pt 6pt;
    border-bottom: 1px solid #d8d4cc; color: #6b6b6b; font-size: 8pt;
    letter-spacing: 0.1em; text-transform: uppercase; }
  table.sched td { padding: 3pt 6pt; border-bottom: 1px solid #f0ede5; }
  table.sched tr:last-child td { border-bottom: none; }
  table.sched .hours { text-align: right; font-family: "SFMono-Regular", Menlo, monospace; }
  table.sched tfoot td { font-weight: 600; padding-top: 6pt; border-top: 1px solid #d8d4cc; }
  .compliance { font-size: 9pt; color: #2a2a2a; line-height: 1.55; }
  .compliance p { margin: 4pt 0; }
  .compliance strong { color: #0a0a0a; }
  .signoff { border-top: 1px solid #d8d4cc; padding-top: 16pt; margin-top: 22pt;
    display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; align-items: end;
    page-break-inside: avoid; }
  .signoff .left .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .signoff .left .name { font-size: 16pt; font-style: italic; margin: 6pt 0 2pt;
    border-bottom: 1px solid #999; padding-bottom: 6pt; min-height: 24pt; }
  .signoff .left .role { font-size: 9pt; color: #6b6b6b; }
  .signoff .right { text-align: right; font-size: 8pt; color: #6b6b6b; }
  .signoff .right .ref { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #0a0a0a; }
  .accent { background: #d4ff00; height: 4pt; margin: 0 -0.6in 16pt; }
  .signature-block { margin-top: 14pt; page-break-inside: avoid; }
  .signature-line { border-bottom: 1px solid #999; height: 22pt; margin-bottom: 4pt; }
  .signature-row { display: grid; grid-template-columns: 2fr 1fr; gap: 18pt; }
  .signature-row .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; margin-bottom: 14pt; }
  .access { margin-top: 18pt; padding: 10pt 14pt; border: 1px solid #d8d4cc; background: #fafaf7;
    font-size: 9pt; page-break-inside: avoid; }
  .access .h { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .access .code { font-family: "SFMono-Regular", Menlo, monospace; font-size: 11pt; margin-top: 4pt; }
  .access .url { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #2c2c2c; word-break: break-all; }
  .resources { padding: 10pt 14pt; background: #fafaf7; border: 1px solid #d8d4cc; font-size: 9.5pt; }
  .resources a, .resources .url { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; word-break: break-all; }
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
    <div style="display:flex; align-items:center; gap:10pt; margin-top:4pt;">
      <div class="recipient">${esc(l.recipient_name)}</div>
      <span class="badge ${isLocalHire ? "local" : "traveler"}">${isLocalHire ? "Local Hire" : "Traveler"}</span>
    </div>
    <div class="recipient-meta">${esc(l.recipient_email ?? "—")}${l.recipient_phone ? ` · ${esc(l.recipient_phone)}` : ""}</div>
  </section>

  <section>
    <p>Dear <strong>${esc(firstName)}</strong>,</p>
    <p>On behalf of ${esc(employerLabel)}, we are pleased to offer you the role of
      <strong>${esc(l.role_title)}</strong> for <strong>${esc(l.project_name)}</strong>.
      This letter outlines the engagement, compensation, working schedule, and terms under which
      we propose to work together. Please review the full document, complete the onboarding
      checklist below, and counter-sign to accept.</p>
  </section>

  <section>
    <h2>1. Engagement Summary</h2>
    <dl class="kv">
      <div><dt>Role</dt><dd>${esc(l.role_title)}</dd></div>
      <div><dt>Department</dt><dd>${esc(l.role_department || "Production")}</dd></div>
      <div><dt>Classification</dt><dd>${esc(CLASSIFICATION_LABEL[l.classification] ?? l.classification)}</dd></div>
      <div><dt>Hire Type</dt><dd>${isLocalHire ? "Local Hire — Las Vegas, NV" : "Traveler — travel + lodging arranged"}</dd></div>
      <div><dt>Reports To</dt><dd>${reportsTo}</dd></div>
      <div><dt>Work Location</dt><dd>${esc(venueLine)}</dd></div>
      <div><dt>Engagement Window</dt><dd>${esc(fmtRange(l.effective_start, l.effective_end))}</dd></div>
      <div><dt>Scheduled Work Days</dt><dd>${totalEngagementDays}</dd></div>
    </dl>
  </section>

  <section>
    <h2>2. Compensation</h2>
    <dl class="kv">
      <div><dt>Rate</dt><dd>${esc(comp.rate)}</dd></div>
      <div><dt>Per Diem</dt><dd>${perDiemLine ? esc(perDiemLine) : "Not provided (local hire)"}</dd></div>
      <div><dt>Payment Terms</dt><dd>${esc(paymentSchedule)}</dd></div>
      <div><dt>Invoicing</dt><dd>Submit weekly invoices to Alvaro Hernandez, Five Senses Group</dd></div>
    </dl>
    ${comp.caveat ? `<p class="caveat">${esc(comp.caveat)}</p>` : ""}
    <p class="caveat">All compensation figures are gross. Recipient is solely responsible for
      federal and state tax obligations. ${employerLabel} will issue an IRS Form 1099-NEC
      for amounts exceeding $600 in a calendar year.</p>
  </section>

  ${sched.length > 0 ? `
  <section>
    <h2>3. Working Schedule</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:8pt;">
      Per the EDCLV26 Salvage City Production Playbook (Labor tab). Daily rate covers up to
      10 hours per work day; additional hours may be assigned at the discretion of production
      leadership and do not entitle Recipient to additional compensation.
    </p>
    <table class="sched">
      <thead>
        <tr><th>Date</th><th>Activity</th><th>Start</th><th>End</th><th class="hours">Hours</th></tr>
      </thead>
      <tbody>
        ${sched.map((d) => `<tr>
          <td>${esc(fmtSchedDate(d.date))}</td>
          <td>${esc(d.role || "—")}</td>
          <td>${esc(fmtTimeShort(d.start))}</td>
          <td>${esc(fmtTimeShort(d.end))}</td>
          <td class="hours">${esc(d.hours || "—")}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="4">Total scheduled hours</td><td class="hours">${totalHours}</td></tr></tfoot>
    </table>
  </section>` : ""}

  <section>
    <h2>4. Inclusions</h2>
    ${allInclusions.length === 0
      ? `<p style="color:#6b6b6b">No additional inclusions specified.</p>`
      : `<ul class="dot">${allInclusions.map((x) => `<li>${x}</li>`).join("")}</ul>`}
  </section>

  ${l.effective_expectations ? `
  <section>
    <h2>5. Expectations</h2>
    <p style="font-size:10pt; white-space: pre-line;">${esc(l.effective_expectations)}</p>
  </section>` : ""}

  <section>
    <h2>6. Terms &amp; Compliance — Florida + Nevada</h2>
    <div class="compliance">
      <p><strong>Independent Contractor Status.</strong> Recipient is engaged as a 1099 independent
        contractor, not an employee. Recipient retains control over the means and manner of
        performing the engaged services, may engage other clients during the engagement window,
        is not entitled to employee benefits (paid time off, health insurance, retirement
        contributions, unemployment insurance), and is solely responsible for federal income
        tax, self-employment tax (Social Security and Medicare), and any applicable Nevada
        State Business License (Nevada Revised Statutes Chapter 76) or other local registrations
        required to conduct business in Las Vegas, Nevada.</p>

      <p><strong>No Overtime — Compensation Cap.</strong> The agreed daily rate compensates Recipient
        for up to ten (10) hours per work day. As a 1099 independent contractor, Recipient is
        not subject to overtime regulations under the federal Fair Labor Standards Act
        (FLSA, 29 U.S.C. § 207) or Nevada Revised Statutes Chapter 608. Hours worked beyond ten
        in a single day, if any, do not entitle Recipient to additional compensation absent
        prior written approval from a Production Director.</p>

      <p><strong>Workers' Compensation.</strong> Recipient acknowledges that as a 1099 independent
        contractor performing services in Nevada, Recipient is not covered by ${esc(employerLabel)}'s
        workers' compensation policy under Nevada Revised Statutes Chapter 616A. Recipient is
        responsible for securing their own coverage and assumes all risk associated with
        performance of the engaged services.</p>

      <p><strong>Equal Opportunity &amp; Non-Discrimination.</strong> ${esc(employerLabel)} engages
        contractors without regard to race, color, religion, sex, national origin, age, disability,
        sexual orientation, gender identity, or veteran status, in compliance with Title VII of
        the Civil Rights Act of 1964 (42 U.S.C. § 2000e), the Florida Civil Rights Act of 1992
        (Florida Statutes Chapter 760), and the Nevada Equal Rights of Citizens Act
        (Nevada Revised Statutes Chapter 613).</p>

      <p><strong>Right to Work.</strong> Both Florida (Article I, § 6 of the Florida Constitution)
        and Nevada (Nevada Revised Statutes Chapter 613) are right-to-work jurisdictions.
        Recipient is not required to join any union or pay union dues as a condition of this
        engagement.</p>

      <p><strong>Confidentiality.</strong> The contents of this letter and any non-public information
        about ${esc(l.project_name)}, ${esc(employerLabel)}, Five Senses Group, Insomniac, or any
        named vendor encountered during the engagement are confidential. Recipient may not share
        outside their direct counsel without the prior written consent of ${esc(employerLabel)}.</p>

      <p><strong>Governing Law.</strong> This agreement is governed by and construed under the laws
        of the State of Florida, without regard to its conflict-of-laws principles. Any dispute
        arising out of or relating to this engagement shall be resolved in the state or federal
        courts located in Hillsborough County, Florida, except where Nevada law mandates local
        venue for venue-specific work-injury or licensing matters.</p>
    </div>
  </section>

  <section>
    <h2>7. Onboarding &amp; Know-Before-You-Go Checklist</h2>
    <p style="font-size:10pt; margin-bottom:6pt;">
      Complete each item before your first call (${esc(fmtDate(l.effective_start))}). Items marked
      with ★ are critical-path; missing them will delay credentialing or payment.
    </p>
    <ul class="checkbox">
      <li>★ Counter-sign this engagement letter (online at the link below, or sign + return PDF).</li>
      <li>★ Submit a completed IRS Form W-9 to <em>alvaro@five-senses.co</em> for 1099 reporting.</li>
      <li>★ Complete the <strong>INSOMNIAC 2026 Safety &amp; Social Media Policy</strong> form
        (link in the production playbook). Use "Salvage City — No Ceilings" as the Department
        / Vendor field.</li>
      <li>★ Submit a recent headshot (1024×1024 minimum) to <em>sos@ghxstship.pro</em> for
        credential printing.</li>
      ${isTraveler ? `
      <li>★ Confirm travel itinerary with Five Senses logistics — flights and lodging will be
        booked on your behalf and confirmation will arrive at least 7 days before your first
        call.</li>` : `
      <li>Confirm transport plan to the Las Vegas Motor Speedway — parking pass arrives with
        your credentials packet 48 hours before load-in.</li>`}
      <li>Read the EDCLV26 Salvage City Supper Club Production Playbook end-to-end (link below);
        bookmark the schedule, contacts, and radio plan.</li>
      <li>Save the show schedule (May 15–17, 2026, five seatings nightly) to your calendar with
        a reminder set for 4 hours pre-call.</li>
      <li>Bring: photo ID for credential pickup; closed-toe shoes for load-in days;
        weather-appropriate layers (Las Vegas overnight lows ~60 °F mid-May); reusable water
        bottle (venue heat).</li>
      <li>Join the Salvage City production text thread (number sent with credentials packet)
        for day-of dispatch.</li>
      <li>Submit your first weekly invoice on Friday ${esc(l.effective_end ? fmtDate(l.effective_end) : "of the engagement window")}
        to <em>alvaro@five-senses.co</em> for Net 15 processing.</li>
    </ul>
  </section>

  <section>
    <h2>8. Resources &amp; References</h2>
    <div class="resources">
      <p style="margin:0 0 4pt;"><strong>Salvage City Production Guide</strong> (auto-scoped to your role):</p>
      <p style="margin:0 0 8pt;"><span class="url">${esc(PRODUCTION_GUIDE_URL)}</span></p>
      <p style="margin:0 0 4pt;"><strong>Venue:</strong> ${esc(venueLine)}</p>
      <p style="margin:0 0 4pt;"><strong>Producer of Record:</strong> Five Senses Group · Paul Seigenthaler ·
        <em>paul.seigenthaler@insomniac.com</em></p>
      <p style="margin:0 0 4pt;"><strong>Production Director (escalation):</strong> Sarah Fry ·
        <em>FrySarah8@gmail.com</em> · (615) 708-3676</p>
      <p style="margin:0;"><strong>Project Producer:</strong> Julian Clarkson ·
        <em>julian.clarkson@ghxstship.pro</em> · (407) 885-6011</p>
    </div>
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

async function generateThumbnail(pdfPath, outDir) {
  // qlmanage produces <basename>.png next to itself when -o <dir> is passed
  try {
    execSync(`qlmanage -t -s 1100 -o ${JSON.stringify(outDir)} ${JSON.stringify(pdfPath)} 2>/dev/null`, {
      stdio: "ignore",
    });
    return path.join(outDir, path.basename(pdfPath) + ".png");
  } catch {
    return null;
  }
}

async function main() {
  const letters = JSON.parse(await fs.readFile(LETTERS_BUNDLE, "utf8"));
  const schedules = JSON.parse(await fs.readFile(SCHEDULES_BUNDLE, "utf8"));

  // Reset output dir
  await fs.rm(OUT, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const results = [];

  for (const letter of letters) {
    const page = await ctx.newPage();
    const sched = schedules[letter.recipient_name] || [];
    const html = renderHTML(letter, sched);
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
    let thumb = null;
    if (PREVIEW) thumb = await generateThumbnail(outPath, OUT);
    results.push({ name: letter.recipient_name, file: filename, kb: (stat.size / 1024).toFixed(1), thumb });
    await page.close();
  }
  await browser.close();

  console.log(`\n=== Offer-letter export — ${PREVIEW ? "PREVIEW" : "FINAL"} ===`);
  for (const r of results) {
    console.log(`  ✓ ${r.name.padEnd(28)}  ${r.file}  (${r.kb} KB)${r.thumb ? "  + thumb" : ""}`);
  }
  console.log(`\nWrote ${results.length} PDFs to: ${OUT}`);
  if (PREVIEW) {
    console.log("\nThumbnails generated. Re-run without PREVIEW=1 to publish to Desktop.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
