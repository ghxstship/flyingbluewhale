// EDCLV26 Salvage City — engagement-letter PDF exporter (Onboarding v2).
//
// Reads /tmp/sc_onboarding_bundle.json (project + letters + onboarding_steps +
// roles + certifications + role_certifications + compliance_addenda — pulled
// from the live DB via Supabase MCP) and renders each retained offer letter
// to a Letter-format PDF, plus a sibling .ics calendar file.
//
// Letter spec (industry-leading onboarding, 2026-05-06):
//   * Job Description as first-class section: qualifications, decision-rights
//     matrix (owns vs escalates), success criteria, failure modes, day-one
//     brief — all sourced from org_roles columns.
//   * Required certifications block from role_certifications, mapped per-role.
//   * Compensation: daily rate as "$X per day for up to 10 hr max — overtime
//     exempt"; per-diem only for travelers; Net 15 for all 1099 letters.
//   * Working schedule pulled from playbook (still keyed by /tmp/sc_schedules.json).
//   * Live onboarding tracker referenced by URL (rendered against the live
//     onboarding_steps table); steps listed in the letter as a checklist with
//     direct deep-links into the recipient's portal dashboard.
//   * Compliance addenda selected by venue.region × classification from
//     compliance_addenda (FL + NV today; the venue lookup makes this scale).
//   * QR code linking to /offer/<token>/checkin (day-1 venue check-in).
//   * Welcome message from the project (leadership tone-setter).
//   * Sidecar .ics calendar attachment with all scheduled work days, venue
//     address, call times, and a recipient ALERT 4 hr pre-call.
//
// Output mode:
//   PREVIEW=1  →  /tmp/sc_offer_letters_preview/ + qlmanage thumbnails.
//   default    →  ~/Desktop/EDCLV26_Salvage_City_Offer_Letters/ (replaces).
import { chromium } from "playwright";
import QRCode from "qrcode";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const PREVIEW = process.env.PREVIEW === "1";
const BUNDLE = "/tmp/sc_onboarding_bundle.json";
const SCHEDULES_BUNDLE = "/tmp/sc_schedules.json";

const OUT_DESKTOP = path.join(os.homedir(), "Desktop", "EDCLV26_Salvage_City_Offer_Letters");
const OUT_PREVIEW = "/tmp/sc_offer_letters_preview";
const OUT = PREVIEW ? OUT_PREVIEW : OUT_DESKTOP;

const TRAVELERS = new Set(["Sarah Fry", "Vida Sotakoun"]);
const APP_BASE = "https://atlvs.pro";
const PRODUCTION_GUIDE_URL = "https://gvteway.atlvs.pro/edclv26-salvage-city/guide";

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
const fmtTimeShort = (s) => (!s ? "—" : s.replace(/:00 (AM|PM)$/i, " $1").replace(/^0/, ""));

function fmtCompensation(l, scheduledDays) {
  if (l.compensation_basis === "tbd" || (l.effective_compensation_cents ?? 0) === 0) {
    return { rate: "To be confirmed prior to signature", caveat: "" };
  }
  if (l.compensation_basis === "flat_fee" && l.override_amount_cents) {
    return { rate: `${fmtUSD(l.override_amount_cents)} flat fee for the project`, caveat: "" };
  }
  if ((l.compensation_basis === "per_day" || l.compensation_basis === "per_show_day") && l.rate_unit_price_cents) {
    const days = scheduledDays && scheduledDays > 0 ? scheduledDays : l.engagement_days;
    const estTotal = l.rate_unit_price_cents * days;
    return {
      rate: `${fmtUSD(l.rate_unit_price_cents)} per day for up to 10 hours per day maximum — overtime exempt`,
      caveat: `Estimated total over ${days} scheduled work day${days === 1 ? "" : "s"}: ${fmtUSD(estTotal)} (subject to actual days worked).`,
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

function parseSchedDate(s) {
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return new Date(s);
}
const fmtSchedDate = (s) => {
  const d = parseSchedDate(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

// .ics generation — RFC 5545 minimal valid calendar.
function buildICS(letter, schedule) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ATLVS//Salvage City//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const venueAddr = "Las Vegas Motor Speedway, 7000 N Las Vegas Blvd, Las Vegas, NV 89115";
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const fmtICSDateTime = (date, time) => {
    // date "5/12/2026", time "8:00:00 AM"
    const d = parseSchedDate(date);
    const m = (time || "8:00:00 AM").match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    let hr = Number(m?.[1] ?? 8);
    const min = Number(m?.[2] ?? 0);
    if (m && m[4].toUpperCase() === "PM" && hr < 12) hr += 12;
    if (m && m[4].toUpperCase() === "AM" && hr === 12) hr = 0;
    d.setHours(hr, min, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}${mm}${dd}T${hh}${mi}00`;
  };
  for (const day of schedule || []) {
    const startUTC = fmtICSDateTime(day.date, day.start);
    const endUTC = fmtICSDateTime(day.date, day.end || day.start);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:salvage-city-${letter.id}-${day.date.replace(/\//g, "")}@atlvs.pro`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;TZID=America/Los_Angeles:${startUTC}`);
    lines.push(`DTEND;TZID=America/Los_Angeles:${endUTC}`);
    lines.push(`SUMMARY:Salvage City — ${(day.role || "Call")} (${letter.recipient_name})`);
    lines.push(`LOCATION:${venueAddr}`);
    lines.push(`DESCRIPTION:Production guide: ${PRODUCTION_GUIDE_URL}\\nCheck-in: ${APP_BASE}/offer/${letter.public_token}/checkin`);
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-PT4H");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:Salvage City call in 4 hours");
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

async function qrDataURL(url) {
  return await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, scale: 5, color: { dark: "#0a0a0a", light: "#ffffff" } });
}

function renderHTML(ctx) {
  const { letter: l, schedule, role, certifications, addenda, project, onboardingSteps, qrDataURI } = ctx;
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

  const sched = (schedule || []).slice().sort((a, b) => parseSchedDate(a.date) - parseSchedDate(b.date));
  const totalHours = sched.reduce((sum, d) => sum + Number(d.hours || 0), 0);
  const scheduledDays = sched.length;
  let totalEngagementDays;
  if (scheduledDays > 0) totalEngagementDays = scheduledDays;
  else if (l.compensation_basis === "flat_fee") totalEngagementDays = "Per engagement (no fixed schedule)";
  else if (l.compensation_basis === "tbd") totalEngagementDays = "TBD";
  else totalEngagementDays = l.engagement_days || "—";
  const comp = fmtCompensation(l, scheduledDays);
  const paymentSchedule = l.classification === "1099"
    ? "Net 15 from receipt of properly submitted invoice"
    : l.effective_payment_schedule || "Net 15 from receipt of properly submitted invoice";
  const perDiemLine = isTraveler && (l.effective_per_diem_cents ?? 0) > 0
    ? `${fmtUSD(l.effective_per_diem_cents)} per day (M&IE only; federal GSA Las Vegas rate)`
    : isTraveler ? "Per diem provided for travel days (rate TBD)" : null;

  const inclusions = (l.effective_inclusions ?? []).slice();
  const allInclusions = [
    ...inclusions.map((s) => esc(s)),
    isTraveler && l.effective_travel_provided ? "Travel arranged by Five Senses" : null,
    isTraveler && l.effective_lodging_provided ? "Lodging provided in Las Vegas" : null,
    l.effective_meals_provided ? "Crew meals on call days at the venue" : null,
  ].filter(Boolean);

  const onboardingURL = `${APP_BASE}/offer/${l.public_token}/onboarding`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Engagement Letter — ${esc(l.recipient_name)}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #0a0a0a; background: #fff; }
  .doc { max-width: 7.4in; margin: 0 auto; padding: 0 0 0.4in 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #d8d4cc; padding-bottom: 16pt; margin-bottom: 18pt; }
  .eyebrow { font-family: "SFMono-Regular", Menlo, monospace; font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
  h1 { font-size: 19pt; font-weight: 600; margin: 6pt 0 2pt; line-height: 1.15; }
  .project { color: #6b6b6b; font-size: 10pt; }
  .meta { text-align: right; font-size: 8pt; color: #6b6b6b; line-height: 1.6; }
  .meta .ref { font-family: "SFMono-Regular", Menlo, monospace; }
  section { margin: 14pt 0; page-break-inside: avoid; }
  section h2 { font-size: 9.5pt; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin: 0 0 8pt; }
  section h3 { font-size: 9pt; font-weight: 600; margin: 8pt 0 4pt; color: #2a2a2a; }
  section p { margin: 4pt 0; }
  .recipient { font-weight: 600; font-size: 11pt; }
  .recipient-meta { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #6b6b6b; }
  dl.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 24pt; margin: 0; }
  dl.kv > div { display: flex; flex-direction: column; gap: 1pt; }
  dl.kv dt { font-size: 8pt; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6b6b; }
  dl.kv dd { margin: 0; font-size: 10pt; }
  .badge { display: inline-block; padding: 1pt 6pt; border-radius: 2pt; font-size: 8pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.local { background: #d4ff00; color: #1a1a00; }
  .badge.traveler { background: #1a1a1a; color: #d4ff00; }
  .caveat { font-size: 9pt; color: #6b6b6b; margin-top: 3pt; }
  ul.dot, ul.dot-tight { margin: 0; padding: 0; list-style: none; }
  ul.dot li, ul.dot-tight li { padding-left: 14pt; position: relative; font-size: 10pt; }
  ul.dot li { margin: 2pt 0; }
  ul.dot-tight li { margin: 2pt 0 2pt; }
  ul.dot li::before, ul.dot-tight li::before { content: "·"; color: #888; position: absolute; left: 4pt; }
  ul.checkbox { margin: 0; padding: 0; list-style: none; }
  ul.checkbox li { padding-left: 22pt; position: relative; margin: 4pt 0; font-size: 10pt; }
  ul.checkbox li::before { content: ""; position: absolute; left: 0; top: 3pt; width: 10pt; height: 10pt; border: 1px solid #555; border-radius: 1pt; }
  table.sched, table.certs { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.sched th, table.certs th { text-align: left; font-weight: 600; padding: 4pt 6pt; border-bottom: 1px solid #d8d4cc; color: #6b6b6b; font-size: 8pt; letter-spacing: 0.1em; text-transform: uppercase; }
  table.sched td, table.certs td { padding: 3pt 6pt; border-bottom: 1px solid #f0ede5; }
  table.sched tr:last-child td, table.certs tr:last-child td { border-bottom: none; }
  table.sched .hours { text-align: right; font-family: "SFMono-Regular", Menlo, monospace; }
  table.sched tfoot td { font-weight: 600; padding-top: 6pt; border-top: 1px solid #d8d4cc; }
  .compliance { font-size: 9pt; color: #2a2a2a; line-height: 1.55; }
  .compliance p { margin: 4pt 0; }
  .compliance strong { color: #0a0a0a; }
  .signoff { border-top: 1px solid #d8d4cc; padding-top: 16pt; margin-top: 22pt; display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; align-items: end; page-break-inside: avoid; }
  .signoff .left .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .signoff .left .name { font-size: 16pt; font-style: italic; margin: 6pt 0 2pt; border-bottom: 1px solid #999; padding-bottom: 6pt; min-height: 24pt; }
  .signoff .left .role { font-size: 9pt; color: #6b6b6b; }
  .signoff .right { text-align: right; font-size: 8pt; color: #6b6b6b; }
  .signoff .right .ref { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #0a0a0a; }
  .accent { background: #d4ff00; height: 4pt; margin: 0 -0.6in 16pt; }
  .signature-block { margin-top: 14pt; page-break-inside: avoid; }
  .signature-line { border-bottom: 1px solid #999; height: 22pt; margin-bottom: 4pt; }
  .signature-row { display: grid; grid-template-columns: 2fr 1fr; gap: 18pt; }
  .signature-row .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; margin-bottom: 14pt; }
  .access { margin-top: 18pt; padding: 12pt 14pt; border: 1px solid #d8d4cc; background: #fafaf7; font-size: 9pt; page-break-inside: avoid; display: grid; grid-template-columns: 1fr 110px; gap: 16pt; align-items: center; }
  .access .h { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .access .code { font-family: "SFMono-Regular", Menlo, monospace; font-size: 11pt; margin-top: 4pt; }
  .access .url { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; color: #2c2c2c; word-break: break-all; }
  .access .qr { width: 110px; height: 110px; }
  .access .qr-caption { font-size: 8pt; color: #6b6b6b; text-align: center; margin-top: 4pt; }
  .resources { padding: 10pt 14pt; background: #fafaf7; border: 1px solid #d8d4cc; font-size: 9.5pt; }
  .resources a, .resources .url { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; word-break: break-all; }
  .welcome { padding: 12pt 14pt; background: #fffcec; border-left: 4pt solid #d4ff00; font-size: 10pt; line-height: 1.55; font-style: italic; color: #2a2a2a; }
  .col-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18pt; }
  .col-2 h3 { margin-top: 0; }
  .pill { display: inline-block; padding: 1pt 5pt; border-radius: 2pt; font-size: 8pt; font-weight: 600; }
  .pill.required { background: #fce8e8; color: #8b1414; }
  .pill.preferred { background: #e8eefc; color: #14488b; }
  .star { color: #c00; font-weight: 700; }
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

  ${project?.welcome_message ? `
  <section>
    <div class="welcome">${esc(project.welcome_message)}<br><span style="font-style:normal;font-size:8pt;color:#6b6b6b;">— ${esc(employerLabel)}</span></div>
  </section>` : ""}

  <section>
    <p style="font-size:10.5pt;">${esc(firstName)} —</p>
    <p style="font-size:10.5pt;">It is our pleasure to formally invite you to join the ${esc(l.project_name)} crew as <strong>${esc(l.role_title)}</strong> on behalf of ${esc(employerLabel)}. This document is your full expedition brief — engagement letter, job description, working schedule, compliance frame, and pre-arrival checklist held in one place. Read it end-to-end at your own pace, complete your onboarding steps at the live tracker linked at the foot of the letter, and counter-sign to accept. The crew is small and the timeline is precise; we'll meet you on the other side of "yes" with everything else you need to arrive ready.</p>
  </section>

  <section>
    <h2>1. Engagement Summary</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:10pt;">Here's the shape of your engagement at a glance — the role, the dates, the venue, and how to find the people you'll answer to.</p>
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

  ${role && (role.qualifications?.length || role.decision_rights_owns?.length) ? `
  <section>
    <h2>2. Job Description — ${esc(l.role_title)}</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:10pt;">What we're hiring you to do, what you're expected to bring with you, what you own outright versus where you escalate, and how we'll know — together — that this engagement was a success.</p>
    ${role.description ? `<p style="font-size:10pt;">${esc(role.description)}</p>` : ""}

    ${role.qualifications?.length ? `
    <h3>Qualifications</h3>
    <ul class="dot-tight">${role.qualifications.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : ""}

    ${role.responsibilities && Array.isArray(role.responsibilities) && role.responsibilities.length ? `
    <h3>Day-to-day responsibilities</h3>
    <ul class="dot-tight">${role.responsibilities.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}

    <div class="col-2">
      ${role.decision_rights_owns?.length ? `
      <div>
        <h3>Decisions you own</h3>
        <ul class="dot-tight">${role.decision_rights_owns.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </div>` : ""}
      ${role.decision_rights_escalates?.length ? `
      <div>
        <h3>Decisions to escalate</h3>
        <ul class="dot-tight">${role.decision_rights_escalates.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </div>` : ""}
    </div>

    <div class="col-2" style="margin-top:8pt;">
      ${role.success_criteria?.length ? `
      <div>
        <h3>What great looks like</h3>
        <ul class="dot-tight">${role.success_criteria.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </div>` : ""}
      ${role.failure_modes?.length ? `
      <div>
        <h3>Failure modes to avoid</h3>
        <ul class="dot-tight">${role.failure_modes.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </div>` : ""}
    </div>

    ${role.day_one_brief ? `
    <h3 style="margin-top:10pt;">Day-one brief</h3>
    <p style="font-size:10pt; padding: 6pt 10pt; border-left: 2pt solid #d4ff00; background:#fffcec;">${esc(role.day_one_brief)}</p>` : ""}
  </section>` : ""}

  <section>
    <h2>3. Compensation</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:10pt;">Your terms in plain numbers. We pay weekly on Net 15 from invoice receipt — submit each week's invoice to Alvaro at Five Senses, and the clock starts when he confirms it.</p>
    <dl class="kv">
      <div><dt>Rate</dt><dd>${esc(comp.rate)}</dd></div>
      <div><dt>Per Diem</dt><dd>${perDiemLine ? esc(perDiemLine) : "Not provided (local hire)"}</dd></div>
      <div><dt>Payment Terms</dt><dd>${esc(paymentSchedule)}</dd></div>
      <div><dt>Invoicing</dt><dd>Weekly to Alvaro Hernandez · alvaro@five-senses.co</dd></div>
    </dl>
    ${comp.caveat ? `<p class="caveat">${esc(comp.caveat)}</p>` : ""}
    <p class="caveat">All compensation figures are gross. You are solely responsible for federal and state tax obligations on these payments. ${esc(employerLabel)} will issue an IRS Form 1099-NEC at year-end for amounts exceeding $600.</p>
  </section>

  ${sched.length > 0 ? `
  <section>
    <h2>4. Working Schedule</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:8pt;">Your scheduled work days, drawn directly from the EDCLV26 Salvage City Production Playbook (Labor tab). The daily rate covers up to ten hours per work day; additional hours may be assigned at the discretion of production leadership and do not change the rate. We've packaged these same dates into the <strong>.ics calendar file alongside this PDF</strong> — drag it into your calendar and the four-hour pre-call alarms set themselves.</p>
    <table class="sched">
      <thead><tr><th>Date</th><th>Activity</th><th>Start</th><th>End</th><th class="hours">Hours</th></tr></thead>
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

  ${certifications && certifications.length ? `
  <section>
    <h2>5. Required Certifications</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:8pt;">These certifications must be on file before credentials issue at the gate. Upload current copies through the onboarding portal and we'll handle verification on our side. If anything is expired, near expiration, or missing, flag it now — we have a window to make it right; we don't have a window to fix it on day one.</p>
    <table class="certs">
      <thead><tr><th>Certification</th><th>Issuing body</th><th>Validity</th><th>Status</th></tr></thead>
      <tbody>
        ${certifications.map((c) => `<tr>
          <td><strong>${esc(c.name)}</strong>${c.description ? `<br><span style="font-size:8.5pt;color:#6b6b6b;">${esc(c.description)}</span>` : ""}</td>
          <td>${esc(c.issuing_body || "—")}</td>
          <td>${c.validity_months ? `${c.validity_months} mo` : "Lifetime"}</td>
          <td><span class="pill ${c.required ? "required" : "preferred"}">${c.required ? "Required" : "Preferred"}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>
  </section>` : ""}

  <section>
    <h2>6. Inclusions</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:8pt;">Beyond your day rate, here's what we cover on your behalf for the duration of the engagement:</p>
    ${allInclusions.length === 0
      ? `<p style="color:#6b6b6b">No additional inclusions specified for this engagement.</p>`
      : `<ul class="dot">${allInclusions.map((x) => `<li>${x}</li>`).join("")}</ul>`}
  </section>

  ${l.effective_expectations ? `
  <section>
    <h2>7. Expectations</h2>
    <p style="font-size:10pt; white-space: pre-line;">${esc(l.effective_expectations)}</p>
  </section>` : ""}

  ${addenda && addenda.length ? `
  <section>
    <h2>8. Terms &amp; Compliance — Florida + Nevada</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:8pt;">The clauses below cover the legal frame for your engagement under both Florida (governing law) and Nevada (work location). Read them carefully — countersigning this letter constitutes your acknowledgment of each.</p>
    <div class="compliance">
      ${addenda.map((a) => `<p><strong>${esc(a.title)}.</strong> ${esc(a.body)}</p>`).join("")}
    </div>
  </section>` : ""}

  ${onboardingSteps && onboardingSteps.length ? `
  <section>
    <h2>9. Onboarding &amp; Know-Before-You-Go Checklist</h2>
    <p style="font-size:10pt; margin-bottom:6pt;">
      What follows is the work to do between today and your first call — paperwork, safety, credentials, calendar, transport. Each item lives in your <strong>live onboarding portal</strong>, so as you check items off there, we see your progress in real time and the credentials team can prep ahead. Items marked <span class="star">★</span> are critical-path: missing them will delay your credentials at the gate or your first invoice. The full list, with descriptions, due dates, and direct links, is at:
    </p>
    <p style="font-family:'SFMono-Regular',Menlo,monospace; font-size:9pt; padding:6pt 10pt; background:#fafaf7; border:1px solid #d8d4cc; word-break:break-all;">${esc(onboardingURL)}</p>
    <ul class="checkbox">
      ${onboardingSteps.sort((a, b) => a.sort_order - b.sort_order).map((s) => `<li>${s.critical_path ? `<span class="star">★</span> ` : ""}<strong>${esc(s.title)}</strong>${s.due_at ? ` <span style="color:#6b6b6b;font-size:8.5pt;">(due ${esc(fmtDate(s.due_at))})</span>` : ""}${s.description ? `<br><span style="font-size:9pt; color:#444;">${esc(s.description)}</span>` : ""}</li>`).join("")}
    </ul>
  </section>` : ""}

  <section>
    <h2>10. Resources &amp; References</h2>
    <p style="font-size:9.5pt; color:#444; margin-bottom:8pt;">Everything else you'll want close to hand — the production guide auto-scoped to your role, the live onboarding tracker, the day-1 venue check-in, and the people to call when you need a fast answer.</p>
    <div class="resources">
      <p style="margin:0 0 4pt;"><strong>Salvage City Production Guide</strong> (auto-scoped to your role):</p>
      <p style="margin:0 0 8pt;"><span class="url">${esc(PRODUCTION_GUIDE_URL)}</span></p>
      <p style="margin:0 0 4pt;"><strong>Live onboarding tracker:</strong></p>
      <p style="margin:0 0 8pt;"><span class="url">${esc(onboardingURL)}</span></p>
      <p style="margin:0 0 4pt;"><strong>Day-1 venue check-in:</strong> scan the QR code below or visit:</p>
      <p style="margin:0 0 8pt;"><span class="url">${esc(APP_BASE)}/offer/${esc(l.public_token)}/checkin</span></p>
      <p style="margin:0 0 4pt;"><strong>Venue:</strong> ${esc(venueLine)}</p>
      <p style="margin:0 0 4pt;"><strong>Producer of Record:</strong> Five Senses Group · Paul Seigenthaler · <em>paul.seigenthaler@insomniac.com</em></p>
      <p style="margin:0 0 4pt;"><strong>Production Director (escalation):</strong> Sarah Fry · <em>FrySarah8@gmail.com</em> · (615) 708-3676</p>
      <p style="margin:0;"><strong>Project Producer:</strong> Julian Clarkson · <em>julian.clarkson@ghxstship.pro</em> · (407) 885-6011</p>
    </div>
  </section>

  <section>
    <p style="font-size:10.5pt;">If everything above reads right, countersign below and we'll see you in Las Vegas. If anything reads wrong — a date, a rate, a role, anything — flag it now. We'd rather rebuild the brief once than carry a misalignment into load-in.</p>
    <p style="font-size:10.5pt; margin-top:8pt;">Welcome to the crew, ${esc(firstName)}.</p>
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
    <div>
      <div class="h">Online Acceptance + Day-1 Check-in</div>
      <div style="margin-top:6pt;">Sign + complete onboarding at:</div>
      <div class="url">${esc(APP_BASE)}/offer/${esc(l.public_token)}</div>
      <div style="margin-top:6pt;">Access code:</div>
      <div class="code">${esc(l.access_code)}</div>
      <div style="margin-top:6pt; font-size:8.5pt; color:#6b6b6b;">Scan the QR at credential pickup to mark yourself "arrived."</div>
    </div>
    <div>
      <img class="qr" src="${qrDataURI}" alt="QR check-in code">
      <div class="qr-caption">Day-1 check-in</div>
    </div>
  </div>

</div>
</body></html>`;
}

async function generateThumbnail(pdfPath, outDir) {
  try {
    execSync(`qlmanage -t -s 1100 -o ${JSON.stringify(outDir)} ${JSON.stringify(pdfPath)} 2>/dev/null`, { stdio: "ignore" });
    return path.join(outDir, path.basename(pdfPath) + ".png");
  } catch {
    return null;
  }
}

async function main() {
  const bundle = JSON.parse(await fs.readFile(BUNDLE, "utf8"));
  const schedules = JSON.parse(await fs.readFile(SCHEDULES_BUNDLE, "utf8"));
  const { letters, steps, roles, certs, role_certs, addenda, project } = bundle;

  await fs.rm(OUT, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const results = [];

  // Index helpers
  const roleBySlug = Object.fromEntries(roles.map((r) => [r.slug, r]));
  const certBySlug = Object.fromEntries(certs.map((c) => [c.slug, c]));
  const stepsByLetter = {};
  for (const s of steps) {
    (stepsByLetter[s.offer_letter_id] ||= []).push(s);
  }
  // Region selector — venue is in NV; jurisdictional addenda cover NV + FL.
  const addendaForLetter = addenda.filter(
    (a) => (a.region === "NV" || a.region === "FL") && a.classification === "1099",
  );

  for (const letter of letters) {
    const role = roleBySlug[letter.role_slug] ?? null;
    const reqCertSlugs = role_certs.filter((rc) => rc.role_slug === letter.role_slug).map((rc) => ({ ...certBySlug[rc.cert_slug], required: rc.required }));
    const sched = schedules[letter.recipient_name] || [];
    const onboardingSteps = stepsByLetter[letter.id] || [];
    const qrDataURI = await qrDataURL(`${APP_BASE}/offer/${letter.public_token}/checkin`);

    const page = await ctx.newPage();
    const html = renderHTML({
      letter,
      schedule: sched,
      role,
      certifications: reqCertSlugs,
      addenda: letter.classification === "1099" ? addendaForLetter : [],
      project,
      onboardingSteps,
      qrDataURI,
    });
    await page.setContent(html, { waitUntil: "load" });
    const filenameBase = `EDCLV26_Salvage_City_Offer_Letter_${safe(letter.recipient_name)}`;
    const pdfPath = path.join(OUT, `${filenameBase}.pdf`);
    const icsPath = path.join(OUT, `${filenameBase}.ics`);
    await page.pdf({ path: pdfPath, format: "Letter", printBackground: true, margin: { top: "0in", right: "0in", bottom: "0.4in", left: "0in" } });
    if (sched.length > 0) {
      await fs.writeFile(icsPath, buildICS(letter, sched), "utf8");
    }
    const stat = await fs.stat(pdfPath);
    let thumb = null;
    if (PREVIEW) thumb = await generateThumbnail(pdfPath, OUT);
    results.push({
      name: letter.recipient_name,
      pdf: `${filenameBase}.pdf`,
      ics: sched.length > 0 ? `${filenameBase}.ics` : null,
      kb: (stat.size / 1024).toFixed(1),
      thumb,
    });
    await page.close();
  }

  await browser.close();

  console.info(`\n=== Offer-letter export — ${PREVIEW ? "PREVIEW" : "FINAL"} ===`);
  for (const r of results) {
    console.info(`  ✓ ${r.name.padEnd(28)}  ${r.pdf}  (${r.kb} KB)${r.ics ? `  + ${r.ics}` : ""}${r.thumb ? "  + thumb" : ""}`);
  }
  console.info(`\nWrote ${results.length} PDFs to: ${OUT}`);
  if (PREVIEW) console.info("\nThumbnails generated. Re-run without PREVIEW=1 to publish to Desktop.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
