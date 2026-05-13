// EDCLV26 Salvage City — pre-arrival packet generator.
//
// Generates a focused, single-purpose pre-arrival PDF per recipient,
// distinct from the engagement letter. Sent ~7 days before first call.
// Traveler vs Local Hire variants. Includes:
//   * Day-of-arrival logistics (traveler: flight + hotel; local: parking + transit)
//   * Working schedule (per-person from playbook)
//   * What to bring (role-aware)
//   * Day-1 venue check-in QR code
//   * Las Vegas weather + heat advisory for May
//   * Key contacts + the production guide URL
//
// Reads /tmp/sc_onboarding_bundle.json + /tmp/sc_schedules.json. Output:
//   ~/Desktop/EDCLV26_Salvage_City_PreArrival_Packets/<Name>.pdf
import { chromium } from "playwright";
import QRCode from "qrcode";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const PREVIEW = process.env.PREVIEW === "1";
const BUNDLE = "/tmp/sc_onboarding_bundle.json";
const SCHEDULES_BUNDLE = "/tmp/sc_schedules.json";
const OUT = PREVIEW
  ? "/tmp/sc_prearrival_preview"
  : path.join(os.homedir(), "Desktop", "EDCLV26_Salvage_City_PreArrival_Packets");

const TRAVELERS = new Set(["Sarah Fry", "Vida Sotakoun"]);
const APP_BASE = "https://atlvs.pro";
const PRODUCTION_GUIDE_URL = "https://gvteway.atlvs.pro/edclv26-salvage-city/guide";

const safe = (s) => s.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => {
  if (!iso) return "TBD";
  const d = new Date(iso + (iso.length <= 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};
const parseSchedDate = (s) => {
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return new Date(s);
};
const fmtSchedDate = (s) => {
  const d = parseSchedDate(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};
const fmtTimeShort = (s) => (!s ? "—" : s.replace(/:00 (AM|PM)$/i, " $1").replace(/^0/, ""));

// Role-aware "what to bring" derived from role qualifications + venue context.
function whatToBring(letter, role, isTraveler) {
  const items = [
    { critical: true, text: "Photo ID (driver's license or passport) for credential pickup" },
    { critical: true, text: "Closed-toe shoes for load-in days (no exceptions)" },
    { critical: false, text: "Reusable water bottle — venue is hot in May (highs 92–99 °F)" },
    { critical: false, text: "Phone with the production text thread saved (number sent with credentials)" },
    { critical: false, text: "Layers — overnight lows in Las Vegas mid-May average 60–66 °F" },
  ];
  if ((role?.slug || "").startsWith("production-crew") || role?.slug === "production-crew-heavy") {
    items.push({ critical: false, text: "Personal toolbelt + multi-tool" });
    items.push({ critical: false, text: "Knee pads for ground-level install" });
    items.push({ critical: false, text: "Work gloves" });
  }
  if (role?.slug === "production-crew-heavy") {
    items.push({ critical: true, text: "Forklift / lift-truck card + OSHA 10 wallet card on your person" });
  }
  if (role?.slug === "production-assistant-runner" || role?.slug === "production-assistant-driver") {
    items.push({ critical: true, text: "Driver's license for vehicle assignment" });
    items.push({ critical: false, text: "Sunglasses (Las Vegas glare on the highway)" });
  }
  if (role?.slug?.startsWith("production-assistant")) {
    items.push({ critical: false, text: "Black tee + dark pants for show nights (show-caller will confirm dress code)" });
  }
  if (isTraveler) {
    items.push({ critical: false, text: "Personal medications + sunscreen (SPF 30+)" });
  }
  return items;
}

async function qrDataURL(url) {
  return await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, scale: 5, color: { dark: "#0a0a0a", light: "#ffffff" } });
}

function renderHTML(ctx) {
  const { letter: l, schedule, role, qrDataURI } = ctx;
  const isTraveler = TRAVELERS.has(l.recipient_name);
  const sched = (schedule || []).slice().sort((a, b) => parseSchedDate(a.date) - parseSchedDate(b.date));
  const firstCallDate = sched[0] ? fmtSchedDate(sched[0].date) : (l.effective_start ? fmtDate(l.effective_start) : "TBD");
  const firstCallTime = sched[0]?.start ? fmtTimeShort(sched[0].start) : "TBD";
  const items = whatToBring(l, role, isTraveler);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Pre-Arrival Packet — ${esc(l.recipient_name)}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #0a0a0a; background: #fff; }
  .doc { max-width: 7.4in; margin: 0 auto; padding: 0 0 0.4in 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #d8d4cc; padding-bottom: 16pt; margin-bottom: 18pt; }
  .eyebrow { font-family: "SFMono-Regular", Menlo, monospace; font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6b6b; }
  h1 { font-size: 22pt; font-weight: 600; margin: 6pt 0 2pt; line-height: 1.1; }
  .project { color: #6b6b6b; font-size: 10pt; }
  .meta { text-align: right; font-size: 8pt; color: #6b6b6b; line-height: 1.6; }
  section { margin: 14pt 0; page-break-inside: avoid; }
  section h2 { font-size: 9.5pt; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin: 0 0 8pt; }
  section h3 { font-size: 9pt; font-weight: 600; margin: 8pt 0 4pt; color: #2a2a2a; }
  section p { margin: 4pt 0; }
  .accent { background: #d4ff00; height: 4pt; margin: 0 -0.6in 16pt; }
  .badge { display: inline-block; padding: 1pt 6pt; border-radius: 2pt; font-size: 8pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.local { background: #d4ff00; color: #1a1a00; }
  .badge.traveler { background: #1a1a1a; color: #d4ff00; }
  .first-call { padding: 14pt 16pt; background: #fffcec; border-left: 4pt solid #d4ff00; }
  .first-call .label { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b; }
  .first-call .when { font-size: 18pt; font-weight: 600; margin-top: 4pt; }
  .first-call .where { font-size: 11pt; color: #444; margin-top: 4pt; }
  ul.dot { margin: 0; padding: 0; list-style: none; }
  ul.dot li { padding-left: 14pt; position: relative; margin: 3pt 0; font-size: 10pt; }
  ul.dot li::before { content: "·"; color: #888; position: absolute; left: 4pt; }
  ul.dot li.critical { font-weight: 600; }
  ul.dot li.critical::before { content: "★"; color: #c00; }
  .col-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18pt; }
  .resources { padding: 10pt 14pt; background: #fafaf7; border: 1px solid #d8d4cc; font-size: 9.5pt; }
  .resources .url { font-family: "SFMono-Regular", Menlo, monospace; font-size: 9pt; word-break: break-all; }
  .checkin { padding: 14pt 16pt; border: 1px solid #d8d4cc; background: #fafaf7; display: grid; grid-template-columns: 1fr 130px; gap: 18pt; align-items: center; }
  .checkin .qr { width: 130px; height: 130px; }
  .checkin .qr-caption { font-size: 8pt; color: #6b6b6b; text-align: center; margin-top: 4pt; }
  table.sched { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.sched th { text-align: left; font-weight: 600; padding: 4pt 6pt; border-bottom: 1px solid #d8d4cc; color: #6b6b6b; font-size: 8pt; letter-spacing: 0.1em; text-transform: uppercase; }
  table.sched td { padding: 3pt 6pt; border-bottom: 1px solid #f0ede5; }
  .weather-card { padding: 10pt 14pt; background: #f4f7ff; border: 1px solid #c7d4f0; font-size: 9.5pt; }
</style></head>
<body>
<div class="accent"></div>
<div class="doc">

  <header>
    <div>
      <div class="eyebrow">Pre-Arrival Packet</div>
      <h1>Seven days out.</h1>
      <div class="project">${esc(l.project_name)} · ${esc(l.recipient_name)} <span class="badge ${isTraveler ? "traveler" : "local"}">${isTraveler ? "Traveler" : "Local Hire"}</span></div>
    </div>
    <div class="meta">
      <div>Issued ${esc(fmtDate(new Date().toISOString().slice(0, 10)))}</div>
    </div>
  </header>

  <section>
    <p style="font-size:10.5pt;">${esc((l.recipient_name ?? "").split(" ")[0])} —</p>
    <p style="font-size:10.5pt;">Your engagement letter is signed and your onboarding is in motion. This packet is the last thing you'll need before you walk through the gate at the Speedway. Read it on the plane, on the couch, or on the drive in — whenever feels right. The goal is simple: when we meet at first call, you've already arrived ready, and we can move straight to the work.</p>
  </section>

  <section>
    <div class="first-call">
      <div class="label">Your first call</div>
      <div class="when">${esc(firstCallDate)} · ${esc(firstCallTime)}</div>
      <div class="where">Nomads Land — Salvage City · Las Vegas Motor Speedway · 7000 N Las Vegas Blvd, Las Vegas NV 89115</div>
      ${role?.day_one_brief ? `<p style="margin-top:10pt; font-size:10pt;"><strong>Day-one brief.</strong> ${esc(role.day_one_brief)}</p>` : ""}
    </div>
  </section>

  ${isTraveler ? `
  <section>
    <h2>1. Travel + Lodging</h2>
    <p>Travel and lodging are arranged on your behalf by Five Senses logistics. Your itinerary will land in your inbox at least seven days before your first call. When it arrives, confirm receipt the same day and flag any conflicts before you leave for the airport — once you're inside the gate at the Speedway, the schedule is unforgiving and last-minute changes cost everyone time.</p>
    <ul class="dot">
      <li class="critical">Watch for the email with subject "Salvage City — travel + lodging" and respond to confirm.</li>
      <li>Outbound flight: confirm your seat assignment and carry-on allowance 24 hours before departure.</li>
      <li>Hotel: check-in opens at 3 PM local; rooms are held under your last name.</li>
      <li>Ground transport (LAS → hotel): rideshare is reimbursable up to $40 each way — submit your receipt with the first weekly invoice.</li>
      <li>Per diem (M&IE only): $79 per day at the federal GSA Las Vegas rate, paid alongside the first invoice.</li>
    </ul>
  </section>
  ` : `
  <section>
    <h2>1. Getting to the Venue</h2>
    <p>You're hiring on locally, so travel and lodging are on you. The venue is the Las Vegas Motor Speedway, which is remote enough that your transport plan matters — please don't leave it to the morning of first call.</p>
    <ul class="dot">
      <li class="critical">Your parking pass arrives with the credentials packet 48 hours before load-in. Without it you'll be turned away at the perimeter — keep an eye on your inbox.</li>
      <li>If you're driving: I-15 north to exit 54 (Speedway Blvd). Allow 30 minutes from the Strip in light traffic, up to 90 on race weekends.</li>
      <li>If you're rideshare-ing: drop-off coordinates for the Production Trailer ship with your credentials packet.</li>
      <li>Carpool list will be posted in the production text thread once issued — save gas, save parking, coordinate.</li>
    </ul>
  </section>
  `}

  ${sched.length > 0 ? `
  <section>
    <h2>2. Your Schedule</h2>
    <p style="font-size:9.5pt; color:#444;">Drawn directly from the EDCLV26 Salvage City Production Playbook (Labor tab). The .ics calendar that came with your engagement letter populates these same dates into your calendar with a four-hour pre-call alarm — drag it in if you haven't yet.</p>
    <table class="sched">
      <thead><tr><th>Date</th><th>Activity</th><th>Start</th><th>End</th></tr></thead>
      <tbody>
        ${sched.map((d) => `<tr><td>${esc(fmtSchedDate(d.date))}</td><td>${esc(d.role || "—")}</td><td>${esc(fmtTimeShort(d.start))}</td><td>${esc(fmtTimeShort(d.end))}</td></tr>`).join("")}
      </tbody>
    </table>
  </section>` : ""}

  <section>
    <h2>${sched.length > 0 ? "3" : "2"}. What to Bring</h2>
    <p style="font-size:9.5pt; color:#444;">Pack with intention. Items marked <span style="color:#c00;font-weight:700;">★</span> are critical-path — without them you can't get past the credentials trailer. The venue sits well outside the Strip; once you're at the Speedway gate, doubling back for anything you forgot will cost you the better part of an hour.</p>
    <ul class="dot">${items.map((i) => `<li class="${i.critical ? "critical" : ""}">${esc(i.text)}</li>`).join("")}</ul>
  </section>

  <section>
    <h2>${sched.length > 0 ? "4" : "3"}. Las Vegas Weather (mid-May)</h2>
    <p style="font-size:9.5pt; color:#444;">Mid-May at the Speedway is hot, dry, and at times genuinely windy. Below is what to expect so you can pack and pace yourself accordingly.</p>
    <div class="weather-card">
      <p><strong>Daytime:</strong> 92–99 °F (33–37 °C), low humidity, intense sun. Heat-stress risk during the noon-to-3pm load-in windows — pace yourself and drink consistently.</p>
      <p><strong>Overnight:</strong> 60–66 °F (16–19 °C), often windy after sunset. Strike days finish in jacket weather.</p>
      <p><strong>Wind:</strong> May is the windy season at the Speedway. Sustained 15–25 mph with gusts is normal; Insomniac's 25 mph aerial-shutdown rule may trigger. The production playbook covers the Wind-25 fallback choreography end-to-end.</p>
      <p><strong>Recommendations:</strong> SPF 30+, electrolyte tabs in your bottle, an extra layer for night strikes, and sunglasses for the drive in.</p>
    </div>
  </section>

  <section>
    <h2>${sched.length > 0 ? "5" : "4"}. Day-1 Check-In</h2>
    <p style="font-size:9.5pt; color:#444;">When you arrive at credentials, scan the QR code below to mark yourself "arrived." Production sees the ping in real time and the day-1 safety briefing handoff lines up automatically.</p>
    <div class="checkin">
      <div>
        <p style="margin-top:0; font-size:10pt;">One scan and you're on the books. Pick up your credentials, sign the safety briefing attestation, collect your radio if your role requires one, and head to your station.</p>
        <p style="font-size:9pt;"><strong>Where:</strong> Production Trailer (location pinned in the credentials packet)</p>
        <p style="font-size:9pt;"><strong>Hours:</strong> 8:00 AM – 6:00 PM on load-in days</p>
        <p style="font-size:9pt; word-break:break-all;"><strong>Direct link:</strong> <span style="font-family:'SFMono-Regular',Menlo,monospace;">${esc(APP_BASE)}/offer/${esc(l.public_token)}/checkin</span></p>
      </div>
      <div>
        <img class="qr" src="${qrDataURI}" alt="QR check-in code">
        <div class="qr-caption">Day-1 check-in</div>
      </div>
    </div>
  </section>

  <section>
    <h2>${sched.length > 0 ? "6" : "5"}. Resources + Key Contacts</h2>
    <p style="font-size:9.5pt; color:#444;">Save these. The first three are who you'll reach when something goes sideways; the production guide is where most answers already live.</p>
    <div class="resources">
      <p style="margin:0 0 4pt;"><strong>Salvage City Production Guide:</strong></p>
      <p style="margin:0 0 8pt;"><span class="url">${esc(PRODUCTION_GUIDE_URL)}</span></p>
      <p style="margin:0 0 4pt;"><strong>Live onboarding tracker:</strong></p>
      <p style="margin:0 0 8pt;"><span class="url">${esc(APP_BASE)}/offer/${esc(l.public_token)}/onboarding</span></p>
      <p style="margin:0 0 4pt;"><strong>Production Director (escalation):</strong> Sarah Fry · FrySarah8@gmail.com · (615) 708-3676</p>
      <p style="margin:0 0 4pt;"><strong>Production Manager (day-of):</strong> Skylar Contini-Enneper · (702) 689-6907</p>
      <p style="margin:0 0 4pt;"><strong>Project Producer:</strong> Julian Clarkson · (407) 885-6011</p>
      <p style="margin:0;"><strong>Insomniac Production:</strong> Paul Seigenthaler · paul.seigenthaler@insomniac.com</p>
    </div>
  </section>

  <p style="font-size:10pt; margin-top:24pt; text-align:center; color:#2a2a2a;">
    Travel safely. Arrive rested. We'll see you at the gate.
  </p>
  <p style="font-size:8pt; color:#6b6b6b; margin-top:8pt; text-align:center;">
    <span style="font-family:'SFMono-Regular',Menlo,monospace;">REF · OL-${esc(String(l.id).slice(0, 8).toUpperCase())}</span>
  </p>

</div>
</body></html>`;
}

async function main() {
  const bundle = JSON.parse(await fs.readFile(BUNDLE, "utf8"));
  const schedules = JSON.parse(await fs.readFile(SCHEDULES_BUNDLE, "utf8"));
  const { letters, roles } = bundle;
  const roleBySlug = Object.fromEntries(roles.map((r) => [r.slug, r]));

  await fs.rm(OUT, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const results = [];

  for (const letter of letters) {
    const role = roleBySlug[letter.role_slug] ?? null;
    const sched = schedules[letter.recipient_name] || [];
    const qrDataURI = await qrDataURL(`${APP_BASE}/offer/${letter.public_token}/checkin`);
    const page = await ctx.newPage();
    await page.setContent(renderHTML({ letter, schedule: sched, role, qrDataURI }), { waitUntil: "load" });
    const filename = `EDCLV26_Salvage_City_PreArrival_${safe(letter.recipient_name)}.pdf`;
    const outPath = path.join(OUT, filename);
    await page.pdf({ path: outPath, format: "Letter", printBackground: true, margin: { top: "0in", right: "0in", bottom: "0.4in", left: "0in" } });
    const stat = await fs.stat(outPath);
    results.push({ name: letter.recipient_name, file: filename, kb: (stat.size / 1024).toFixed(1) });
    await page.close();
  }
  await browser.close();

  console.info(`\n=== Pre-arrival packet export — ${PREVIEW ? "PREVIEW" : "FINAL"} ===`);
  for (const r of results) console.info(`  ✓ ${r.name.padEnd(28)}  ${r.file}  (${r.kb} KB)`);
  console.info(`\nWrote ${results.length} packets to: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
