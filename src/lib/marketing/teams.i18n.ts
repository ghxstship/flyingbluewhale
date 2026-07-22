/**
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   node --experimental-strip-types scripts/gen-marketing-i18n.mjs
 *
 * Render-site i18n overlay for src/lib/marketing/teams.ts (I18N-WRAP, decision 7 rider).
 * The data file stays the SSOT for structure + English copy; this module
 * wraps every user-visible prose field in the 3-arg t(key, undefined,
 * fallback) form with PLAIN-STRING key and fallback literals so
 * scripts/extract-i18n-keys.mjs can land the keys in the locale catalogs.
 * Template-literal keys are invisible to the extractor, which is why every
 * slug is enumerated here instead of composed at the render site.
 *
 * Drift guard: i18n-content.test.ts asserts the identity-translator output
 * deep-equals the source entries, so data-file copy edits without a re-run
 * of the generator fail CI instead of silently shipping stale fallbacks.
 */

import { TEAMS_BY_SLUG, type TeamRole } from "./teams";

export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

const LOCALIZERS: Record<string, (e: TeamRole, t: Translator) => TeamRole> = {
  "tour-managers": (e, t) => ({
    ...e,
    role: t("marketing.teams.tour-managers.role", undefined, "Tour Managers"),
    blurb: t(
      "marketing.teams.tour-managers.blurb",
      undefined,
      "The single accountable owner of an entire touring run: advancing, finance, logistics, crew, settlement.",
    ),
    hero: {
      eyebrow: t("marketing.teams.tour-managers.hero.eyebrow", undefined, "For Tour Managers"),
      title: t("marketing.teams.tour-managers.hero.title", undefined, "Tour Management, On Modern Rails."),
      body: t(
        "marketing.teams.tour-managers.hero.body",
        undefined,
        "The TM stack hasn't changed in twenty years. A desktop app and a binder. ATLVS retunes the same primitives for cloud-native, real portals, offline mobile, Aurora AI assistance, per-org pricing.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.tour-managers.workflows.0.title", undefined, "Per-Stop Advancing"),
        body: t(
          "marketing.teams.tour-managers.workflows.0.body",
          undefined,
          "Sixteen typed deliverables per stop. Riders, hospitality, stage plots, hotel blocks, ground transport. Portals for venues, vendors, drivers.",
        ),
      },
      {
        title: t("marketing.teams.tour-managers.workflows.1.title", undefined, "Day Sheets To The Portal"),
        body: t(
          "marketing.teams.tour-managers.workflows.1.body",
          undefined,
          "Crew + talent see their day sheet in the portal. No more PDF email chains. Updates publish; nobody asks 'is this the latest?'",
        ),
      },
      {
        title: t("marketing.teams.tour-managers.workflows.2.title", undefined, "Per-Diem Math"),
        body: t(
          "marketing.teams.tour-managers.workflows.2.body",
          undefined,
          "City × day × rate → finance. Pay-day reconciliation runs from the same record. Per-diems flow into payroll automatically.",
        ),
      },
      {
        title: t("marketing.teams.tour-managers.workflows.3.title", undefined, "Settlement"),
        body: t(
          "marketing.teams.tour-managers.workflows.3.body",
          undefined,
          "Box office, venue cost, guarantees, back-end. Settled at the venue with a signed sheet, off live data.",
        ),
      },
      {
        title: t("marketing.teams.tour-managers.workflows.4.title", undefined, "Ground Transport"),
        body: t(
          "marketing.teams.tour-managers.workflows.4.body",
          undefined,
          "Vehicle runs with driver, vehicle, manifest, POD. Drivers see their runs in a portal with no app to install.",
        ),
      },
      {
        title: t("marketing.teams.tour-managers.workflows.5.title", undefined, "Crisis Comms"),
        body: t(
          "marketing.teams.tour-managers.workflows.5.body",
          undefined,
          "Weather hold, security incident, evacuation: pre-approved templates publish in one tap from the road.",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.tour-managers.pain-points.0",
        undefined,
        "Day sheets emailed as PDFs and immediately out of date",
      ),
      t("marketing.teams.tour-managers.pain-points.1", undefined, "Per-diem math redone every Monday morning"),
      t(
        "marketing.teams.tour-managers.pain-points.2",
        undefined,
        "Settlement spreadsheet built from scratch every show",
      ),
      t(
        "marketing.teams.tour-managers.pain-points.3",
        undefined,
        "Driver runs tracked in a chat thread until they're not",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.tour-managers.faqs.0.q", undefined, "Will this replace our desktop touring stack?"),
        a: t(
          "marketing.teams.tour-managers.faqs.0.a",
          undefined,
          "Yes, for modern touring orgs. We carry advancing, day sheets, and per-stop variance, and add cloud-native multi-user, real portals, offline mobile, Aurora AI, and per-org pricing. The old tools win on muscle memory; we win on every spec.",
        ),
      },
      {
        q: t("marketing.teams.tour-managers.faqs.1.q", undefined, "Can we run multiple tours simultaneously?"),
        a: t(
          "marketing.teams.tour-managers.faqs.1.a",
          undefined,
          "Yes. The 21-day look-ahead crosses projects so you see what's load-in this week and which crew is available next.",
        ),
      },
      {
        q: t("marketing.teams.tour-managers.faqs.2.q", undefined, "How does settlement work?"),
        a: t(
          "marketing.teams.tour-managers.faqs.2.a",
          undefined,
          "Box-office data lands in finance throughout the show; settlement night you reconcile against guarantees, deductions, and back-end. A signed PDF exports for the venue/promoter.",
        ),
      },
    ],
  }),
  "production-managers": (e, t) => ({
    ...e,
    role: t("marketing.teams.production-managers.role", undefined, "Production Managers"),
    blurb: t(
      "marketing.teams.production-managers.blurb",
      undefined,
      "The build owner: RFIs, submittals, daily logs, punch, inspections, show-ready.",
    ),
    hero: {
      eyebrow: t("marketing.teams.production-managers.hero.eyebrow", undefined, "For Production Managers"),
      title: t("marketing.teams.production-managers.hero.title", undefined, "Run The Build Like A Build. Just Faster."),
      body: t(
        "marketing.teams.production-managers.hero.body",
        undefined,
        "The PM stack borrows from construction (ball-in-court RFIs, submittals, daily logs, punch lists, change orders) at show-day velocity, built for the production calendar.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.production-managers.workflows.0.title", undefined, "RFIs With A Clock"),
        body: t(
          "marketing.teams.production-managers.workflows.0.body",
          undefined,
          "Question, recipient, official answer, due date. Open RFIs surface on every project dashboard. Closes that take 14 days on construction close in 24 hours here.",
        ),
      },
      {
        title: t("marketing.teams.production-managers.workflows.1.title", undefined, "Daily Logs"),
        body: t(
          "marketing.teams.production-managers.workflows.1.body",
          undefined,
          "Weather pulled from forecast, manpower from time entries, photos from the gallery. One record per day. Recap writes itself.",
        ),
      },
      {
        title: t("marketing.teams.production-managers.workflows.2.title", undefined, "Punch List"),
        body: t(
          "marketing.teams.production-managers.workflows.2.body",
          undefined,
          "Item, location, trade, photo, due date. Show-ready gate enforces it. Doors don't open until punch closes.",
        ),
      },
      {
        title: t("marketing.teams.production-managers.workflows.3.title", undefined, "Inspections"),
        body: t(
          "marketing.teams.production-managers.workflows.3.body",
          undefined,
          "Ten built-in templates (rigging, electrical, fire/life-safety, structural, ADA, food service, FOH, BOH, dressing rooms, broadcast). PDF output the AHJ accepts.",
        ),
      },
      {
        title: t("marketing.teams.production-managers.workflows.4.title", undefined, "Change Orders"),
        body: t(
          "marketing.teams.production-managers.workflows.4.body",
          undefined,
          "Quantified, priced, approved before the work happens. Writes to budget on accept.",
        ),
      },
      {
        title: t("marketing.teams.production-managers.workflows.5.title", undefined, "Vendor Coordination"),
        body: t(
          "marketing.teams.production-managers.workflows.5.body",
          undefined,
          "Vendor portal with COIs, W-9s, POs, payouts via Stripe Connect. Compliance gates POs automatically.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.production-managers.pain-points.0", undefined, "RFIs lost in email threads"),
      t(
        "marketing.teams.production-managers.pain-points.1",
        undefined,
        "Daily logs in a notebook no one reads after wrap",
      ),
      t("marketing.teams.production-managers.pain-points.2", undefined, "Punch list scattered across phone notes apps"),
      t(
        "marketing.teams.production-managers.pain-points.3",
        undefined,
        "AHJ asks for inspection evidence the morning of show",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.production-managers.faqs.0.q", undefined, "How does this fit production timelines?"),
        a: t(
          "marketing.teams.production-managers.faqs.0.a",
          undefined,
          "Same primitives at production velocity. Construction tooling is built for 18-month projects with deep BIM. Event production runs in 4-12 week cycles; we drop the heavy procurement-bidding and tighten the loop on what matters.",
        ),
      },
      {
        q: t("marketing.teams.production-managers.faqs.1.q", undefined, "Can we run multiple builds in flight?"),
        a: t(
          "marketing.teams.production-managers.faqs.1.a",
          undefined,
          "Yes. Production tier is unlimited users and unlimited projects. The 21-day look-ahead crosses projects.",
        ),
      },
    ],
  }),
  "stage-managers": (e, t) => ({
    ...e,
    role: t("marketing.teams.stage-managers.role", undefined, "Stage Managers"),
    blurb: t(
      "marketing.teams.stage-managers.blurb",
      undefined,
      "The show caller: ROS, comms, cue books, real-time direction.",
    ),
    hero: {
      eyebrow: t("marketing.teams.stage-managers.hero.eyebrow", undefined, "For Stage Managers"),
      title: t("marketing.teams.stage-managers.hero.title", undefined, "Run-Of-Show, To The Minute."),
      body: t(
        "marketing.teams.stage-managers.hero.body",
        undefined,
        "The SM lives on the ROS. ATLVS gives you cue numbers, departments, departmental notes: the cue book shape, with everything else on the production hanging off it.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.stage-managers.workflows.0.title", undefined, "ROS To The Minute"),
        body: t(
          "marketing.teams.stage-managers.workflows.0.body",
          undefined,
          "Cue number, time, duration, department, notes. Publishes to portals so artist sees set time, crew sees call, vendor sees delivery window.",
        ),
      },
      {
        title: t("marketing.teams.stage-managers.workflows.1.title", undefined, "Cue Book Shape"),
        body: t(
          "marketing.teams.stage-managers.workflows.1.body",
          undefined,
          "Reads like a cue book. Filterable per department. Comms channels per cue when relevant.",
        ),
      },
      {
        title: t("marketing.teams.stage-managers.workflows.2.title", undefined, "Crew Calls"),
        body: t(
          "marketing.teams.stage-managers.workflows.2.body",
          undefined,
          "Call sheet flows from the schedule to the portal to the ICS. Per-crew call times based on ROS dependency.",
        ),
      },
      {
        title: t("marketing.teams.stage-managers.workflows.3.title", undefined, "Conflict Detection"),
        body: t(
          "marketing.teams.stage-managers.workflows.3.body",
          undefined,
          "Double-booked crew, gear, or venues surface before they cost you.",
        ),
      },
      {
        title: t("marketing.teams.stage-managers.workflows.4.title", undefined, "Real-Time Direction"),
        body: t(
          "marketing.teams.stage-managers.workflows.4.body",
          undefined,
          "Show-call notes captured live; post-show debrief writes itself from the timestamped log.",
        ),
      },
      {
        title: t("marketing.teams.stage-managers.workflows.5.title", undefined, "Set Time Communication"),
        body: t(
          "marketing.teams.stage-managers.workflows.5.body",
          undefined,
          "Artists see their set time in the portal. Changes notify automatically; nobody texts asking 'is doors still 8?'",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.stage-managers.pain-points.0",
        undefined,
        "ROS in a shared Google Doc that two people edit simultaneously",
      ),
      t(
        "marketing.teams.stage-managers.pain-points.1",
        undefined,
        "Crew call texted out the morning of and never reconciled to the budget",
      ),
      t(
        "marketing.teams.stage-managers.pain-points.2",
        undefined,
        "Show notes captured in a notebook that lives in someone's bag",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.stage-managers.faqs.0.q", undefined, "Does it replace our cue-call software?"),
        a: t(
          "marketing.teams.stage-managers.faqs.0.a",
          undefined,
          "For the call book itself, usually yes. For comms intercom, no: we don't replace dedicated intercom hardware. We're the canonical schedule and notes layer that lives above the comms hardware.",
        ),
      },
    ],
  }),
  "festival-directors": (e, t) => ({
    ...e,
    role: t("marketing.teams.festival-directors.role", undefined, "Festival Directors"),
    blurb: t(
      "marketing.teams.festival-directors.blurb",
      undefined,
      "Multi-day, multi-stage, 15k+ guest operations from one console.",
    ),
    hero: {
      eyebrow: t("marketing.teams.festival-directors.hero.eyebrow", undefined, "For Festival Directors"),
      title: t("marketing.teams.festival-directors.hero.title", undefined, "Run The Festival. Not The Spreadsheet."),
      body: t(
        "marketing.teams.festival-directors.hero.body",
        undefined,
        "Festivals run on six concurrent operations: ticketing + gate, advancing + ROS, vendor + procurement, safety + medical, F&B + hospitality, marketing + sponsorship. ATLVS is one platform for all six.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.festival-directors.workflows.0.title", undefined, "15k+ Gate"),
        body: t(
          "marketing.teams.festival-directors.workflows.0.body",
          undefined,
          "Sub-100ms scan offline-queued. Multiple gates concurrent. Zero duplicates under load.",
        ),
      },
      {
        title: t("marketing.teams.festival-directors.workflows.1.title", undefined, "Multi-Stage ROS"),
        body: t(
          "marketing.teams.festival-directors.workflows.1.body",
          undefined,
          "Per-stage cue book with changeover windows. Artist set times, hospitality runs, sound checks.",
        ),
      },
      {
        title: t("marketing.teams.festival-directors.workflows.2.title", undefined, "Per-Persona KBYG"),
        body: t(
          "marketing.teams.festival-directors.workflows.2.body",
          undefined,
          "Guest, crew, artist, vendor, sponsor: each sees their version. One source, scoped renders.",
        ),
      },
      {
        title: t("marketing.teams.festival-directors.workflows.3.title", undefined, "Vendor Compliance"),
        body: t(
          "marketing.teams.festival-directors.workflows.3.body",
          undefined,
          "COIs, W-9s, payouts via Stripe Connect. POs gate behind a current COI. Audit-ready.",
        ),
      },
      {
        title: t("marketing.teams.festival-directors.workflows.4.title", undefined, "Sponsor Activations"),
        body: t(
          "marketing.teams.festival-directors.workflows.4.body",
          undefined,
          "Sponsor portal with activation specs, asset library, entitlements, reporting on delivery.",
        ),
      },
      {
        title: t("marketing.teams.festival-directors.workflows.5.title", undefined, "Wrap Recap"),
        body: t(
          "marketing.teams.festival-directors.workflows.5.body",
          undefined,
          "Photos, P&L, recordable incidents, gate throughput. One PDF on settlement night.",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.festival-directors.pain-points.0",
        undefined,
        "Ticketing on one platform, gate on another, no reconciliation",
      ),
      t(
        "marketing.teams.festival-directors.pain-points.1",
        undefined,
        "Vendor COIs in a folder that's six months out of date",
      ),
      t(
        "marketing.teams.festival-directors.pain-points.2",
        undefined,
        "Sponsor reporting put together by hand the week after wrap",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.festival-directors.faqs.0.q", undefined, "How many guests can the platform handle?"),
        a: t(
          "marketing.teams.festival-directors.faqs.0.a",
          undefined,
          "Tested at 15,000-guest single gates with concurrent scanning, sub-100ms, offline-queued. The bottleneck is your network, not us.",
        ),
      },
      {
        q: t("marketing.teams.festival-directors.faqs.1.q", undefined, "Can sponsors get a branded portal?"),
        a: t(
          "marketing.teams.festival-directors.faqs.1.a",
          undefined,
          "Yes. Per-project branded portal scoped by RLS. Each sponsor sees only their activation, assets, and reporting.",
        ),
      },
    ],
  }),
  "site-managers": (e, t) => ({
    ...e,
    role: t("marketing.teams.site-managers.role", undefined, "Site Managers"),
    blurb: t(
      "marketing.teams.site-managers.blurb",
      undefined,
      "Build site ownership: load-in, inspections, daily logs, strike.",
    ),
    hero: {
      eyebrow: t("marketing.teams.site-managers.hero.eyebrow", undefined, "For Site Managers"),
      title: t("marketing.teams.site-managers.hero.title", undefined, "The Build Site, Documented."),
      body: t(
        "marketing.teams.site-managers.hero.body",
        undefined,
        "Site managers own the build site from load-in through strike. ATLVS captures the day (weather, manpower, inspections, photos, punch, change orders) and turns it into the post-show wrap automatically.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.site-managers.workflows.0.title", undefined, "Daily Site Log"),
        body: t(
          "marketing.teams.site-managers.workflows.0.body",
          undefined,
          "Weather, manpower, equipment on site, work performed, photos. Auto-populates from time entries.",
        ),
      },
      {
        title: t("marketing.teams.site-managers.workflows.1.title", undefined, "Inspections Walk"),
        body: t(
          "marketing.teams.site-managers.workflows.1.body",
          undefined,
          "Walk inspection on the phone. Pass/fail per item, photo evidence, sign-off. PDF output for the AHJ.",
        ),
      },
      {
        title: t("marketing.teams.site-managers.workflows.2.title", undefined, "Photo Gallery"),
        body: t(
          "marketing.teams.site-managers.workflows.2.body",
          undefined,
          "Per-project gallery, EXIF preserved, geo-tagged. Daily logs auto-bundle the day's photos.",
        ),
      },
      {
        title: t("marketing.teams.site-managers.workflows.3.title", undefined, "Punch + Show-Ready"),
        body: t(
          "marketing.teams.site-managers.workflows.3.body",
          undefined,
          "Item, location, photo, due date. Show-ready gate enforces resolution before doors.",
        ),
      },
      {
        title: t("marketing.teams.site-managers.workflows.4.title", undefined, "Strike Coordination"),
        body: t(
          "marketing.teams.site-managers.workflows.4.body",
          undefined,
          "Reverse-build order, hard exit deadline, OT triggers tracked.",
        ),
      },
      {
        title: t("marketing.teams.site-managers.workflows.5.title", undefined, "Incident Capture"),
        body: t(
          "marketing.teams.site-managers.workflows.5.body",
          undefined,
          "Field-first incident intake from the phone. EHS paged on severity threshold.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.site-managers.pain-points.0", undefined, "Daily logs on a clipboard, transcribed at wrap"),
      t("marketing.teams.site-managers.pain-points.1", undefined, "Photos on three different phones, never collected"),
      t(
        "marketing.teams.site-managers.pain-points.2",
        undefined,
        "Inspection sign-offs lost between the binder and the spreadsheet",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.site-managers.faqs.0.q", undefined, "Does it work when the site has no signal?"),
        a: t(
          "marketing.teams.site-managers.faqs.0.a",
          undefined,
          "Yes. COMPVSS is offline-first. Punches, photos, and log entries queue on the phone and sync when coverage comes back. A generator field with zero bars still gets documented.",
        ),
      },
      {
        q: t("marketing.teams.site-managers.faqs.1.q", undefined, "Who can close out an incident report?"),
        a: t(
          "marketing.teams.site-managers.faqs.1.a",
          undefined,
          "Anyone on site can file one from the phone, anonymously if they want. Closing it is a manager sign-off. That split is enforced by role, so nothing quietly disappears between the field and the file.",
        ),
      },
      {
        q: t("marketing.teams.site-managers.faqs.2.q", undefined, "Will the AHJ accept the inspection output?"),
        a: t(
          "marketing.teams.site-managers.faqs.2.a",
          undefined,
          "The templates render to a signed PDF with pass/fail per item, photo evidence, and the inspector's sign-off timestamp. That's the format fire marshals and building officials ask for.",
        ),
      },
    ],
  }),
  "technical-directors": (e, t) => ({
    ...e,
    role: t("marketing.teams.technical-directors.role", undefined, "Technical Directors"),
    blurb: t(
      "marketing.teams.technical-directors.blurb",
      undefined,
      "Tech ownership across audio, lighting, video, scenic, from specs through show-day.",
    ),
    hero: {
      eyebrow: t("marketing.teams.technical-directors.hero.eyebrow", undefined, "For Technical Directors"),
      title: t("marketing.teams.technical-directors.hero.title", undefined, "Tech Specs Live On The Record."),
      body: t(
        "marketing.teams.technical-directors.hero.body",
        undefined,
        "TDs own the technical spine: system design, gear list, power, rigging, signal flow. ATLVS captures specs as typed records that survive into the season, the next show, and the post-mortem.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.technical-directors.workflows.0.title", undefined, "Equipment Registry"),
        body: t(
          "marketing.teams.technical-directors.workflows.0.body",
          undefined,
          "Every asset tagged with status across its lifecycle. Cross-season availability view.",
        ),
      },
      {
        title: t("marketing.teams.technical-directors.workflows.1.title", undefined, "Sub-Rentals"),
        body: t(
          "marketing.teams.technical-directors.workflows.1.body",
          undefined,
          "Source, return date, associated PO. Late returns flag in procurement.",
        ),
      },
      {
        title: t("marketing.teams.technical-directors.workflows.2.title", undefined, "Rigging Inspections"),
        body: t(
          "marketing.teams.technical-directors.workflows.2.body",
          undefined,
          "Point loads, dynamic loads, motor calcs documented per show.",
        ),
      },
      {
        title: t("marketing.teams.technical-directors.workflows.3.title", undefined, "Power Distribution"),
        body: t(
          "marketing.teams.technical-directors.workflows.3.body",
          undefined,
          "Circuit-by-circuit allocation with margin. Surfaces during inspection.",
        ),
      },
      {
        title: t("marketing.teams.technical-directors.workflows.4.title", undefined, "Fabrication Orders"),
        body: t(
          "marketing.teams.technical-directors.workflows.4.body",
          undefined,
          "Shop work with cost, timeline, delivery photos. Variance to budget tracked.",
        ),
      },
      {
        title: t("marketing.teams.technical-directors.workflows.5.title", undefined, "Damage + Sub-Bill"),
        body: t(
          "marketing.teams.technical-directors.workflows.5.body",
          undefined,
          "Damage reports with photos and cost estimates. Bills automatically to sub or client.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.technical-directors.pain-points.0", undefined, "Gear list lives in three spreadsheets"),
      t(
        "marketing.teams.technical-directors.pain-points.1",
        undefined,
        "Sub-rental returns chased by text 3 weeks after wrap",
      ),
      t(
        "marketing.teams.technical-directors.pain-points.2",
        undefined,
        "Damage write-offs never reconciled to the client",
      ),
    ],
    faqs: [
      {
        q: t(
          "marketing.teams.technical-directors.faqs.0.q",
          undefined,
          "Does the registry handle both serialized units and bulk stock?",
        ),
        a: t(
          "marketing.teams.technical-directors.faqs.0.a",
          undefined,
          "Yes. A moving-light with a serial number and a case of 200 shackles live in the same registry. Serialized assets track individually; lot assets carry a quantity and draw down as they're issued.",
        ),
      },
      {
        q: t("marketing.teams.technical-directors.faqs.1.q", undefined, "Can crew check gear out themselves?"),
        a: t(
          "marketing.teams.technical-directors.faqs.1.a",
          undefined,
          "Crew scan custody in and out from their own phones. Changing an asset's disposition, writing one off, or billing damage stays with the manager band. Scanning is open; the ledger is gated.",
        ),
      },
      {
        q: t(
          "marketing.teams.technical-directors.faqs.2.q",
          undefined,
          "What happens when a sub-rental comes back late?",
        ),
        a: t(
          "marketing.teams.technical-directors.faqs.2.a",
          undefined,
          "The return date lives on the rental record with its PO. Past-due returns flag in procurement instead of surfacing three weeks after wrap in a text thread.",
        ),
      },
    ],
  }),
  "talent-buyers": (e, t) => ({
    ...e,
    role: t("marketing.teams.talent-buyers.role", undefined, "Talent Buyers"),
    blurb: t(
      "marketing.teams.talent-buyers.blurb",
      undefined,
      "Lead-to-booking pipeline: offers, contracts, advancing handoff.",
    ),
    hero: {
      eyebrow: t("marketing.teams.talent-buyers.hero.eyebrow", undefined, "For Talent Buyers"),
      title: t("marketing.teams.talent-buyers.hero.title", undefined, "From Offer To Advancing. One Record."),
      body: t(
        "marketing.teams.talent-buyers.hero.body",
        undefined,
        "Talent buying sits between the sales pipeline and production. ATLVS keeps offers, contracts, and the handoff to advancing on one record so the artist team never asks 'who is on it?'.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.talent-buyers.workflows.0.title", undefined, "Pipeline"),
        body: t(
          "marketing.teams.talent-buyers.workflows.0.body",
          undefined,
          "Lead → offer → contract → confirmed → advancing. Per-show win rate and time-to-close.",
        ),
      },
      {
        title: t("marketing.teams.talent-buyers.workflows.1.title", undefined, "Offer Letters"),
        body: t(
          "marketing.teams.talent-buyers.workflows.1.body",
          undefined,
          "23 block types signed in place. IP + timestamp captured. Stripe Connect deposit on accept.",
        ),
      },
      {
        title: t("marketing.teams.talent-buyers.workflows.2.title", undefined, "Contract Library"),
        body: t(
          "marketing.teams.talent-buyers.workflows.2.body",
          undefined,
          "Templated agreements with variable fees, riders, options.",
        ),
      },
      {
        title: t("marketing.teams.talent-buyers.workflows.3.title", undefined, "Artist Portal"),
        body: t(
          "marketing.teams.talent-buyers.workflows.3.body",
          undefined,
          "Artists see their offer, rider, hospitality, set time. One link.",
        ),
      },
      {
        title: t("marketing.teams.talent-buyers.workflows.4.title", undefined, "Handoff To Advancing"),
        body: t(
          "marketing.teams.talent-buyers.workflows.4.body",
          undefined,
          "Confirmed offer flips to a project with advancing deliverables auto-created.",
        ),
      },
      {
        title: t("marketing.teams.talent-buyers.workflows.5.title", undefined, "Settlement"),
        body: t(
          "marketing.teams.talent-buyers.workflows.5.body",
          undefined,
          "Final fees, back-end, deductions. Settled at the venue from live data.",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.talent-buyers.pain-points.0",
        undefined,
        "Offers in DocuSign, advancing in email, contracts in a folder",
      ),
      t(
        "marketing.teams.talent-buyers.pain-points.1",
        undefined,
        "Re-entering the same artist + venue data three times",
      ),
      t("marketing.teams.talent-buyers.pain-points.2", undefined, "Handoff to production is a Slack message"),
    ],
    faqs: [
      {
        q: t("marketing.teams.talent-buyers.faqs.0.q", undefined, "What are the default deposit terms on a booking?"),
        a: t(
          "marketing.teams.talent-buyers.faqs.0.a",
          undefined,
          "Offers default to a 60% deposit with the balance due at load-in. You can change it per offer, but the default matches how most talent deals actually settle.",
        ),
      },
      {
        q: t("marketing.teams.talent-buyers.faqs.1.q", undefined, "Does the agent or manager need an account to sign?"),
        a: t(
          "marketing.teams.talent-buyers.faqs.1.a",
          undefined,
          "No. The offer letter opens from a link and signs in place. IP and timestamp are captured on signature, and the deposit can collect on accept through Stripe.",
        ),
      },
      {
        q: t("marketing.teams.talent-buyers.faqs.2.q", undefined, "What happens after an offer confirms?"),
        a: t(
          "marketing.teams.talent-buyers.faqs.2.a",
          undefined,
          "The confirmed offer flips into a project with its advancing deliverables auto-created. Production picks up the record you already built instead of a forwarded email.",
        ),
      },
    ],
  }),
  "hse-leads": (e, t) => ({
    ...e,
    role: t("marketing.teams.hse-leads.role", undefined, "EHS / Safety Leads"),
    blurb: t(
      "marketing.teams.hse-leads.blurb",
      undefined,
      "Safety + medical + crisis ownership: incidents, OSHA, daily briefings.",
    ),
    hero: {
      eyebrow: t("marketing.teams.hse-leads.hero.eyebrow", undefined, "For EHS Leads"),
      title: t("marketing.teams.hse-leads.hero.title", undefined, "Safety Isn't A Binder. It's A System."),
      body: t(
        "marketing.teams.hse-leads.hero.body",
        undefined,
        "EHS leads own incidents, OSHA logs, medical triage, daily briefings, crisis comms, BC/DR, safeguarding, environmental. ATLVS makes each a first-class record on the same database the show runs on.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.hse-leads.workflows.0.title", undefined, "Field-First Incident Intake"),
        body: t(
          "marketing.teams.hse-leads.workflows.0.body",
          undefined,
          "From the phone, anonymous-capable. Photos, location, witnesses. Routes to EHS instantly.",
        ),
      },
      {
        title: t("marketing.teams.hse-leads.workflows.1.title", undefined, "OSHA 300 Log"),
        body: t(
          "marketing.teams.hse-leads.workflows.1.body",
          undefined,
          "Recordables flow from incidents. 300A summary one click before audit.",
        ),
      },
      {
        title: t("marketing.teams.hse-leads.workflows.2.title", undefined, "Daily Safety Brief"),
        body: t(
          "marketing.teams.hse-leads.workflows.2.body",
          undefined,
          "Per-day briefing with hazards, weather, PPE, comms, emergency assembly. Roster sign-on captured.",
        ),
      },
      {
        title: t("marketing.teams.hse-leads.workflows.3.title", undefined, "Inspections"),
        body: t(
          "marketing.teams.hse-leads.workflows.3.body",
          undefined,
          "Ten built-in templates with show-ready gate.",
        ),
      },
      {
        title: t("marketing.teams.hse-leads.workflows.4.title", undefined, "Crisis Comms"),
        body: t("marketing.teams.hse-leads.workflows.4.body", undefined, "Pre-approved templates publish in one tap."),
      },
      {
        title: t("marketing.teams.hse-leads.workflows.5.title", undefined, "Medical + Safeguarding"),
        body: t(
          "marketing.teams.hse-leads.workflows.5.body",
          undefined,
          "Separately-scoped records with stricter access and audit.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.hse-leads.pain-points.0", undefined, "Incidents on a clipboard, transcribed Monday morning"),
      t(
        "marketing.teams.hse-leads.pain-points.1",
        undefined,
        "OSHA 300A assembled from emails three weeks before audit",
      ),
      t("marketing.teams.hse-leads.pain-points.2", undefined, "Crisis comms drafted in real-time at 2am"),
    ],
    faqs: [
      {
        q: t("marketing.teams.hse-leads.faqs.0.q", undefined, "Can crew report incidents anonymously?"),
        a: t(
          "marketing.teams.hse-leads.faqs.0.a",
          undefined,
          "Yes. The field intake works with or without a name attached. Anonymous filings route to EHS the same way, with photos and location intact. You get the report you'd otherwise never hear about.",
        ),
      },
      {
        q: t("marketing.teams.hse-leads.faqs.1.q", undefined, "Who is allowed to close an incident?"),
        a: t(
          "marketing.teams.hse-leads.faqs.1.a",
          undefined,
          "Filing is open to everyone on site. Closing is a manager-band sign-off, enforced by role. The person who reported a hazard can't be the one who quietly marks it resolved.",
        ),
      },
      {
        q: t("marketing.teams.hse-leads.faqs.2.q", undefined, "How does the OSHA log stay current?"),
        a: t(
          "marketing.teams.hse-leads.faqs.2.a",
          undefined,
          "Recordables flow from the incident record as they're classified, so the 300 log builds during the season. The 300A summary exports in one click when the audit letter arrives.",
        ),
      },
    ],
  }),
  "production-coordinator": (e, t) => ({
    ...e,
    role: t("marketing.teams.production-coordinator.role", undefined, "Production Coordinators"),
    blurb: t(
      "marketing.teams.production-coordinator.blurb",
      undefined,
      "The production office's connective tissue. Tasks, calls, travel, paperwork, and the answer to every 'who has that?'",
    ),
    hero: {
      eyebrow: t("marketing.teams.production-coordinator.hero.eyebrow", undefined, "For Production Coordinators"),
      title: t("marketing.teams.production-coordinator.hero.title", undefined, "Your Week, Minus The Chasing."),
      body: t(
        "marketing.teams.production-coordinator.hero.body",
        undefined,
        "Right now Monday is forty unread threads asking where things stand. On ATLVS the task list, the schedule, and the travel grid are the same record everyone else is reading, so the answer to 'where does that live?' becomes one link.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.production-coordinator.workflows.0.title", undefined, "My Work"),
        body: t(
          "marketing.teams.production-coordinator.workflows.0.body",
          undefined,
          "One personal spine: your open tasks, pending approvals, requests you filed. Everything with your name on it, in one list on your phone.",
        ),
      },
      {
        title: t("marketing.teams.production-coordinator.workflows.1.title", undefined, "Tasks That Close"),
        body: t(
          "marketing.teams.production-coordinator.workflows.1.body",
          undefined,
          "Assign, date, done. Tasks live on the project record, so 'did that happen?' has an answer without a status meeting.",
        ),
      },
      {
        title: t("marketing.teams.production-coordinator.workflows.2.title", undefined, "Schedule + Calls"),
        body: t(
          "marketing.teams.production-coordinator.workflows.2.body",
          undefined,
          "Calls flow from the schedule to each person's portal and calendar. When the call moves, the notification goes out; you don't re-text thirty people.",
        ),
      },
      {
        title: t("marketing.teams.production-coordinator.workflows.3.title", undefined, "Travel + Lodging"),
        body: t(
          "marketing.teams.production-coordinator.workflows.3.body",
          undefined,
          "Flights, ground, hotel blocks, roommate pairs. Each person sees their own itinerary in COMPVSS instead of asking you for the confirmation number again.",
        ),
      },
      {
        title: t("marketing.teams.production-coordinator.workflows.4.title", undefined, "Requests, Routed"),
        body: t(
          "marketing.teams.production-coordinator.workflows.4.body",
          undefined,
          "Gear, purchase reqs, time off, IT, report-it. Five structured intakes replace the 'hey, quick favor' texts. You file it; the approval routes itself.",
        ),
      },
      {
        title: t("marketing.teams.production-coordinator.workflows.5.title", undefined, "Docs + Templates"),
        body: t(
          "marketing.teams.production-coordinator.workflows.5.body",
          undefined,
          "The packet you built last show becomes the template for the next one. Field forms and documents live where the crew fills them in.",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.production-coordinator.pain-points.0",
        undefined,
        "The itinerary lives in your inbox and everyone knows it",
      ),
      t(
        "marketing.teams.production-coordinator.pain-points.1",
        undefined,
        "Approvals stall because nobody knows whose desk they're on",
      ),
      t(
        "marketing.teams.production-coordinator.pain-points.2",
        undefined,
        "The same call time gets texted, emailed, and posted, then changes",
      ),
      t(
        "marketing.teams.production-coordinator.pain-points.3",
        undefined,
        "Every show starts with rebuilding last show's paperwork",
      ),
    ],
    faqs: [
      {
        q: t(
          "marketing.teams.production-coordinator.faqs.0.q",
          undefined,
          "How is this different from a general task app?",
        ),
        a: t(
          "marketing.teams.production-coordinator.faqs.0.a",
          undefined,
          "The tasks sit on production records. A task attached to a load-in, a requisition, or an artist advance carries its context with it, so closing it updates the thing it was actually about.",
        ),
      },
      {
        q: t("marketing.teams.production-coordinator.faqs.1.q", undefined, "Can I approve things, or just file them?"),
        a: t(
          "marketing.teams.production-coordinator.faqs.1.a",
          undefined,
          "Depends on your role. Coordinators typically file requests and route them; approvals sit with the manager band. That split is enforced by permissions, which means an approval on the record is a real approval.",
        ),
      },
      {
        q: t("marketing.teams.production-coordinator.faqs.2.q", undefined, "Does travel really live here too?"),
        a: t(
          "marketing.teams.production-coordinator.faqs.2.a",
          undefined,
          "Yes. Travel and lodging are assignment records per person per project. Each traveler sees their own legs and room in the field app; you see the whole grid.",
        ),
      },
    ],
  }),
  "crew-freelancer": (e, t) => ({
    ...e,
    role: t("marketing.teams.crew-freelancer.role", undefined, "Crew & Freelancers"),
    blurb: t(
      "marketing.teams.crew-freelancer.blurb",
      undefined,
      "The people who build the show. Call times, credentials, hours, and getting paid without chasing anyone.",
    ),
    hero: {
      eyebrow: t("marketing.teams.crew-freelancer.hero.eyebrow", undefined, "For Crew & Freelancers"),
      title: t("marketing.teams.crew-freelancer.hero.title", undefined, "Show Up Knowing The Plan."),
      body: t(
        "marketing.teams.crew-freelancer.hero.body",
        undefined,
        "Before: call time in one text, parking in another, your W-9 in an email from March. After: COMPVSS on your phone has the shift, the gate, your credential, and your hours. It keeps working with zero bars.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.crew-freelancer.workflows.0.title", undefined, "Clock In, Verified"),
        body: t(
          "marketing.teams.crew-freelancer.workflows.0.body",
          undefined,
          "Punch in from the phone with geo verification against the site zone. Your hours are yours, on the record, from the first punch.",
        ),
      },
      {
        title: t("marketing.teams.crew-freelancer.workflows.1.title", undefined, "Your Schedule + Swaps"),
        body: t(
          "marketing.teams.crew-freelancer.workflows.1.body",
          undefined,
          "See your shifts, request a swap, get the answer in the app. No group-chat archaeology to figure out if you work Saturday.",
        ),
      },
      {
        title: t("marketing.teams.crew-freelancer.workflows.2.title", undefined, "Your Advances"),
        body: t(
          "marketing.teams.crew-freelancer.workflows.2.body",
          undefined,
          "Credential, radio, meal, ticket, uniform. Everything issued to you for the show, listed with its state, so the gate conversation is short.",
        ),
      },
      {
        title: t("marketing.teams.crew-freelancer.workflows.3.title", undefined, "Hours, Expenses, Mileage"),
        body: t(
          "marketing.teams.crew-freelancer.workflows.3.body",
          undefined,
          "Timesheets build from your punches. Receipts photograph straight into an expense. Mileage logs from the phone. Payday math stops being your problem.",
        ),
      },
      {
        title: t("marketing.teams.crew-freelancer.workflows.4.title", undefined, "Time Off That Answers"),
        body: t(
          "marketing.teams.crew-freelancer.workflows.4.body",
          undefined,
          "Request it in the app, watch it route, get a decision. The approval lives on the record instead of in someone's memory.",
        ),
      },
      {
        title: t("marketing.teams.crew-freelancer.workflows.5.title", undefined, "The Next Gig"),
        body: t(
          "marketing.teams.crew-freelancer.workflows.5.body",
          undefined,
          "Open gigs and calls post to the public marketplace. Your profile and availability calendar do the pitching while you're on a show.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.crew-freelancer.pain-points.0", undefined, "Call time changes and you find out at the gate"),
      t("marketing.teams.crew-freelancer.pain-points.1", undefined, "Hours disputed three weeks later with no record"),
      t(
        "marketing.teams.crew-freelancer.pain-points.2",
        undefined,
        "Receipts in a jacket pocket until they're unreadable",
      ),
      t(
        "marketing.teams.crew-freelancer.pain-points.3",
        undefined,
        "Every new gig means a new app, a new login, a new W-9",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.crew-freelancer.faqs.0.q", undefined, "How do I join?"),
        a: t(
          "marketing.teams.crew-freelancer.faqs.0.a",
          undefined,
          "Two ways. If a production hires you, they send an invite or an org code and you land in COMPVSS on your phone. If you're starting your own outfit, organizations are created in LEG3ND on the web, and then you invite your crew.",
        ),
      },
      {
        q: t("marketing.teams.crew-freelancer.faqs.1.q", undefined, "Do I need a laptop?"),
        a: t(
          "marketing.teams.crew-freelancer.faqs.1.a",
          undefined,
          "No. COMPVSS is built phone-first and works offline. Punches, photos, and filings queue on the device and sync when you're back in coverage.",
        ),
      },
      {
        q: t("marketing.teams.crew-freelancer.faqs.2.q", undefined, "Who can see my hours and documents?"),
        a: t(
          "marketing.teams.crew-freelancer.faqs.2.a",
          undefined,
          "You see your own records; your personal documents stay yours. Timesheets are visible to you and the managers who approve them. Access is enforced at the database layer per role, so a fellow crew member can't browse your file.",
        ),
      },
      {
        q: t("marketing.teams.crew-freelancer.faqs.3.q", undefined, "Can I work for more than one company?"),
        a: t(
          "marketing.teams.crew-freelancer.faqs.3.a",
          undefined,
          "Yes. One login, multiple workspaces. Each production's data stays inside its own org; switching shows takes two taps.",
        ),
      },
    ],
  }),
  "warehouse-asset-manager": (e, t) => ({
    ...e,
    role: t("marketing.teams.warehouse-asset-manager.role", undefined, "Warehouse & Asset Managers"),
    blurb: t(
      "marketing.teams.warehouse-asset-manager.blurb",
      undefined,
      "Owner of the shop and everything in it. The registry, the scans, the custody chain, the truck that leaves at 6am.",
    ),
    hero: {
      eyebrow: t("marketing.teams.warehouse-asset-manager.hero.eyebrow", undefined, "For Warehouse & Asset Managers"),
      title: t("marketing.teams.warehouse-asset-manager.hero.title", undefined, "Every Case, Accounted For."),
      body: t(
        "marketing.teams.warehouse-asset-manager.hero.body",
        undefined,
        "The truck leaves at 6 and you find out at 8 what didn't make it. On ATLVS a case that leaves the shop is a scan, and the scan is custody. What's out, who has it, and when it's due back stop being questions.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.warehouse-asset-manager.workflows.0.title", undefined, "One Asset Registry"),
        body: t(
          "marketing.teams.warehouse-asset-manager.workflows.0.body",
          undefined,
          "Gear, fleet, and lot stock in a single store with class, quantity, and disposition. The spreadsheet with the 'FINAL_v3' filename retires.",
        ),
      },
      {
        title: t("marketing.teams.warehouse-asset-manager.workflows.1.title", undefined, "Scan Custody"),
        body: t(
          "marketing.teams.warehouse-asset-manager.workflows.1.body",
          undefined,
          "QR and barcode scans from any phone move custody in and out. The chain of who touched what survives load-out, the show, and the 2am reload.",
        ),
      },
      {
        title: t("marketing.teams.warehouse-asset-manager.workflows.2.title", undefined, "Master Catalog"),
        body: t(
          "marketing.teams.warehouse-asset-manager.workflows.2.body",
          undefined,
          "Every SKU your org issues, from radios to wristbands, in one catalog. Assignments draw from it, so counts reconcile instead of drifting.",
        ),
      },
      {
        title: t("marketing.teams.warehouse-asset-manager.workflows.3.title", undefined, "Kit Fulfillment"),
        body: t(
          "marketing.teams.warehouse-asset-manager.workflows.3.body",
          undefined,
          "Radios, tools, and uniforms issue per person per show and come back through the same lifecycle. Issued, transferred, returned. No orphan gear.",
        ),
      },
      {
        title: t("marketing.teams.warehouse-asset-manager.workflows.4.title", undefined, "Runs + Logistics"),
        body: t(
          "marketing.teams.warehouse-asset-manager.workflows.4.body",
          undefined,
          "Vehicle runs with driver, manifest, and proof of delivery. The field app shows the driver their run; you see the board.",
        ),
      },
      {
        title: t("marketing.teams.warehouse-asset-manager.workflows.5.title", undefined, "Damage, Billed"),
        body: t(
          "marketing.teams.warehouse-asset-manager.workflows.5.body",
          undefined,
          "Damage reports carry photos and a cost estimate, and bill to the sub or the client instead of dying in a wrap-week email.",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.warehouse-asset-manager.pain-points.0",
        undefined,
        "The count is right until the first truck loads",
      ),
      t(
        "marketing.teams.warehouse-asset-manager.pain-points.1",
        undefined,
        "Custody is a memory, so losses are a mystery",
      ),
      t(
        "marketing.teams.warehouse-asset-manager.pain-points.2",
        undefined,
        "Sub-rental returns tracked in a text thread",
      ),
      t(
        "marketing.teams.warehouse-asset-manager.pain-points.3",
        undefined,
        "Write-offs discovered at year-end, not at wrap",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.warehouse-asset-manager.faqs.0.q", undefined, "What scanning hardware do I need?"),
        a: t(
          "marketing.teams.warehouse-asset-manager.faqs.0.a",
          undefined,
          "None to start. QR and barcodes scan with the phone camera in COMPVSS. If you run RFID, wedge scanners that emulate a keyboard work with the same intake.",
        ),
      },
      {
        q: t("marketing.teams.warehouse-asset-manager.faqs.1.q", undefined, "Can crew check gear out themselves?"),
        a: t(
          "marketing.teams.warehouse-asset-manager.faqs.1.a",
          undefined,
          "Yes, and that's the point: crew scan custody at the case. Changing a disposition, writing an asset off, or billing damage stays with the manager band, enforced by role. Open scanning, gated ledger.",
        ),
      },
      {
        q: t("marketing.teams.warehouse-asset-manager.faqs.2.q", undefined, "How do quantities work for bulk stock?"),
        a: t(
          "marketing.teams.warehouse-asset-manager.faqs.2.a",
          undefined,
          "Lot assets carry a quantity and draw down as they issue; serialized assets track one by one. Both roll up in the same inventory view, so the shackle count and the console serial live on one screen.",
        ),
      },
    ],
  }),
  "finance-controller": (e, t) => ({
    ...e,
    role: t("marketing.teams.finance-controller.role", undefined, "Finance Controllers"),
    blurb: t(
      "marketing.teams.finance-controller.blurb",
      undefined,
      "The one who closes the month. Capture at the source, approvals with teeth, terms that collect themselves.",
    ),
    hero: {
      eyebrow: t("marketing.teams.finance-controller.hero.eyebrow", undefined, "For Finance Controllers"),
      title: t("marketing.teams.finance-controller.hero.title", undefined, "Close The Month Without The Shoebox."),
      body: t(
        "marketing.teams.finance-controller.hero.body",
        undefined,
        "Today the month closes on receipts photographed in four different apps. On ATLVS the field captures its own paper: expenses, mileage, and hours land coded from the crew's phones, and you approve from yours. The full console ledger is coming; the capture layer works now.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.finance-controller.workflows.0.title", undefined, "Expenses At The Source"),
        body: t(
          "marketing.teams.finance-controller.workflows.0.body",
          undefined,
          "Crew photograph the receipt into a coded expense the day they spend it. You stop reconstructing a show from a pile at wrap.",
        ),
      },
      {
        title: t("marketing.teams.finance-controller.workflows.1.title", undefined, "Mileage That's Logged"),
        body: t(
          "marketing.teams.finance-controller.workflows.1.body",
          undefined,
          "Mileage files from the phone against the project. Rate math is done for you, and the log survives an audit.",
        ),
      },
      {
        title: t("marketing.teams.finance-controller.workflows.2.title", undefined, "Labor From Punches"),
        body: t(
          "marketing.teams.finance-controller.workflows.2.body",
          undefined,
          "Timesheets build from geo-verified clock punches, so the labor number you post is the labor that happened on site.",
        ),
      },
      {
        title: t("marketing.teams.finance-controller.workflows.3.title", undefined, "Approvals With Teeth"),
        body: t(
          "marketing.teams.finance-controller.workflows.3.body",
          undefined,
          "A requisition filed in the field spends nothing until the controller band signs. Approval chains are role-gated, and the decision lives on the record.",
        ),
      },
      {
        title: t("marketing.teams.finance-controller.workflows.4.title", undefined, "Terms That Collect"),
        body: t(
          "marketing.teams.finance-controller.workflows.4.body",
          undefined,
          "Proposals carry a 50/50 deposit split by default; talent bookings run 60/40 with the balance at load-in. Signed online, deposits collect through Stripe on acceptance.",
        ),
      },
      {
        title: t("marketing.teams.finance-controller.workflows.5.title", undefined, "The Console Ledger (On The Way)"),
        body: t(
          "marketing.teams.finance-controller.workflows.5.body",
          undefined,
          "Budgets, AP and AR, and settlement in the operator console are in build. We'd rather tell you that than sell you a screenshot.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.finance-controller.pain-points.0", undefined, "Wrap week is receipt archaeology"),
      t("marketing.teams.finance-controller.pain-points.1", undefined, "Labor actuals arrive two pay cycles late"),
      t("marketing.teams.finance-controller.pain-points.2", undefined, "POs approved verbally, disputed in writing"),
      t(
        "marketing.teams.finance-controller.pain-points.3",
        undefined,
        "Deposit terms renegotiated by accident in email",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.finance-controller.faqs.0.q", undefined, "What's live today and what's still coming?"),
        a: t(
          "marketing.teams.finance-controller.faqs.0.a",
          undefined,
          "Live now: field capture of expenses, mileage, and timesheets, role-gated approvals from the phone, proposals with deposit terms that sign and collect online, and vendor payouts through Stripe Connect. In build: the full console ledger with budgets, AP/AR, and settlement views.",
        ),
      },
      {
        q: t("marketing.teams.finance-controller.faqs.1.q", undefined, "How do vendor payouts work?"),
        a: t(
          "marketing.teams.finance-controller.faqs.1.a",
          undefined,
          "Vendors onboard a Stripe Connect account through their portal. Payouts route on approval as ACH, card, or wire, and every payout ties back to its PO.",
        ),
      },
      {
        q: t("marketing.teams.finance-controller.faqs.2.q", undefined, "Can crew see budget numbers?"),
        a: t(
          "marketing.teams.finance-controller.faqs.2.a",
          undefined,
          "No. Finance surfaces are role-gated at the database layer. Crew see their own expenses, hours, and reimbursements; budget and margin stay with the roles you grant.",
        ),
      },
    ],
  }),
  "marketing-content-lead": (e, t) => ({
    ...e,
    role: t("marketing.teams.marketing-content-lead.role", undefined, "Marketing & Content Leads"),
    blurb: t(
      "marketing.teams.marketing-content-lead.blurb",
      undefined,
      "The voice of the show. Guides, ticket pages, sponsor delivery, and one update that lands everywhere.",
    ),
    hero: {
      eyebrow: t("marketing.teams.marketing-content-lead.hero.eyebrow", undefined, "For Marketing & Content Leads"),
      title: t("marketing.teams.marketing-content-lead.hero.title", undefined, "Publish Once. Every Screen Follows."),
      body: t(
        "marketing.teams.marketing-content-lead.hero.body",
        undefined,
        "Show week you're pasting the same update into an email, a doc, and three chats. On ATLVS you publish once and each audience reads its own version: the guest guide, the crew feed, the sponsor portal, the ticket page. Same record underneath.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.marketing-content-lead.workflows.0.title", undefined, "Know Before You Go"),
        body: t(
          "marketing.teams.marketing-content-lead.workflows.0.body",
          undefined,
          "One guide, scoped per persona. Guests get parking and doors; crew get radio channels and PPE; artists get their set time. Sixteen section types, one source.",
        ),
      },
      {
        title: t("marketing.teams.marketing-content-lead.workflows.1.title", undefined, "The Ticket Page"),
        body: t(
          "marketing.teams.marketing-content-lead.workflows.1.body",
          undefined,
          "Tiers, transfers, and capacity read from the same records the gate scans against, so the storefront never advertises a tier that sold out yesterday.",
        ),
      },
      {
        title: t("marketing.teams.marketing-content-lead.workflows.2.title", undefined, "Sponsor Delivery"),
        body: t(
          "marketing.teams.marketing-content-lead.workflows.2.body",
          undefined,
          "Each sponsor's portal carries their activation specs, asset library, and entitlements, plus reporting on what actually got delivered. Renewal conversations start from evidence.",
        ),
      },
      {
        title: t("marketing.teams.marketing-content-lead.workflows.3.title", undefined, "Crew Announcements"),
        body: t(
          "marketing.teams.marketing-content-lead.workflows.3.body",
          undefined,
          "Post to the feed and it reaches every phone on the crew, with read counts. The 'nobody told me' era ends quietly.",
        ),
      },
      {
        title: t("marketing.teams.marketing-content-lead.workflows.4.title", undefined, "The Photo Record"),
        body: t(
          "marketing.teams.marketing-content-lead.workflows.4.body",
          undefined,
          "Site photos collect per project with dates and locations intact. The recap deck builds from the gallery instead of a plea in the group chat.",
        ),
      },
      {
        title: t(
          "marketing.teams.marketing-content-lead.workflows.5.title",
          undefined,
          "Campaign Console (On The Way)",
        ),
        body: t(
          "marketing.teams.marketing-content-lead.workflows.5.body",
          undefined,
          "Deeper campaign and content tooling in the operator console is in build. What's above ships today.",
        ),
      },
    ],
    painPoints: [
      t(
        "marketing.teams.marketing-content-lead.pain-points.0",
        undefined,
        "Five versions of the event info, four of them stale",
      ),
      t(
        "marketing.teams.marketing-content-lead.pain-points.1",
        undefined,
        "Sponsor recap assembled by hand the week after wrap",
      ),
      t("marketing.teams.marketing-content-lead.pain-points.2", undefined, "The good photos live on someone's phone"),
      t("marketing.teams.marketing-content-lead.pain-points.3", undefined, "Guest questions answered one DM at a time"),
    ],
    faqs: [
      {
        q: t("marketing.teams.marketing-content-lead.faqs.0.q", undefined, "Do guests need to install anything?"),
        a: t(
          "marketing.teams.marketing-content-lead.faqs.0.a",
          undefined,
          "No. The guest guide and ticket surfaces open from a link in any browser. COMPVSS, the installable app, is for your crew.",
        ),
      },
      {
        q: t("marketing.teams.marketing-content-lead.faqs.1.q", undefined, "Who can publish, and who can only draft?"),
        a: t(
          "marketing.teams.marketing-content-lead.faqs.1.a",
          undefined,
          "Publishing is a manager-band permission. Anyone you grant access can draft; the update goes live when a publisher pushes it. Drafts never leak to guests or sponsors.",
        ),
      },
      {
        q: t(
          "marketing.teams.marketing-content-lead.faqs.2.q",
          undefined,
          "Can the guest-facing surfaces carry our brand?",
        ),
        a: t(
          "marketing.teams.marketing-content-lead.faqs.2.a",
          undefined,
          "Yes, on Enterprise: custom branding and custom domains on the portal. Most promoters white-label the guest side and keep the operator side stock.",
        ),
      },
    ],
  }),
  "vendor-subcontractor": (e, t) => ({
    ...e,
    role: t("marketing.teams.vendor-subcontractor.role", undefined, "Vendors & Subcontractors"),
    blurb: t(
      "marketing.teams.vendor-subcontractor.blurb",
      undefined,
      "The outside shop the show depends on. POs in writing, compliance in one place, payouts without the phone calls.",
    ),
    hero: {
      eyebrow: t("marketing.teams.vendor-subcontractor.hero.eyebrow", undefined, "For Vendors & Subcontractors"),
      title: t("marketing.teams.vendor-subcontractor.hero.title", undefined, "Get The PO. Do The Work. Get Paid."),
      body: t(
        "marketing.teams.vendor-subcontractor.hero.body",
        undefined,
        "You've chased a net-60 check with three phone calls before. The vendor portal your client sends you shows the PO, the compliance docs it needs, and where your payout stands, in one login. No seat license, no software to buy.",
      ),
    },
    workflows: [
      {
        title: t("marketing.teams.vendor-subcontractor.workflows.0.title", undefined, "Onboard Once"),
        body: t(
          "marketing.teams.vendor-subcontractor.workflows.0.body",
          undefined,
          "COI and W-9 upload straight into the portal, with expiry tracked. A current certificate is the key that unlocks POs, so the paperwork conversation happens once.",
        ),
      },
      {
        title: t("marketing.teams.vendor-subcontractor.workflows.1.title", undefined, "POs In Writing"),
        body: t(
          "marketing.teams.vendor-subcontractor.workflows.1.body",
          undefined,
          "The order, its line items, and its terms live in your portal. Verbal scope changes stop being your problem to prove.",
        ),
      },
      {
        title: t("marketing.teams.vendor-subcontractor.workflows.2.title", undefined, "Bid Open RFQs"),
        body: t(
          "marketing.teams.vendor-subcontractor.workflows.2.body",
          undefined,
          "Producers publish RFQs to the public marketplace. You respond through the portal with your quals attached, against stated requirements instead of a guessing game.",
        ),
      },
      {
        title: t("marketing.teams.vendor-subcontractor.workflows.3.title", undefined, "Payouts, Direct"),
        body: t(
          "marketing.teams.vendor-subcontractor.workflows.3.body",
          undefined,
          "Onboard a Stripe Connect account and payouts land on PO fulfillment as ACH, card, or wire. Each payout ties to its PO, so reconciliation on your side is a lookup.",
        ),
      },
      {
        title: t("marketing.teams.vendor-subcontractor.workflows.4.title", undefined, "A Person, Not A Void"),
        body: t(
          "marketing.teams.vendor-subcontractor.workflows.4.body",
          undefined,
          "Your portal carries a message thread to your account manager on the production side. Questions land with the person who can answer them.",
        ),
      },
      {
        title: t("marketing.teams.vendor-subcontractor.workflows.5.title", undefined, "Every Client, One Login"),
        body: t(
          "marketing.teams.vendor-subcontractor.workflows.5.body",
          undefined,
          "Each producer you work with sends their own portal; your login carries across. Their worlds stay separate, your inbox stays sane.",
        ),
      },
    ],
    painPoints: [
      t("marketing.teams.vendor-subcontractor.pain-points.0", undefined, "Scope agreed on a call, disputed at invoice"),
      t("marketing.teams.vendor-subcontractor.pain-points.1", undefined, "COI expires mid-show and nobody caught it"),
      t("marketing.teams.vendor-subcontractor.pain-points.2", undefined, "Payment status is a weekly phone call"),
      t(
        "marketing.teams.vendor-subcontractor.pain-points.3",
        undefined,
        "Five clients, five spreadsheets of your own paperwork",
      ),
    ],
    faqs: [
      {
        q: t("marketing.teams.vendor-subcontractor.faqs.0.q", undefined, "What does the portal cost me?"),
        a: t(
          "marketing.teams.vendor-subcontractor.faqs.0.a",
          undefined,
          "Nothing. Your client's organization runs the platform; you're invited in. You get the PO record, compliance vault, messaging, and payout status without buying a seat.",
        ),
      },
      {
        q: t("marketing.teams.vendor-subcontractor.faqs.1.q", undefined, "How do I get paid?"),
        a: t(
          "marketing.teams.vendor-subcontractor.faqs.1.a",
          undefined,
          "Through Stripe Connect. You onboard a payout account once, and approved POs pay out directly as ACH, card, or wire. No invoice-into-the-void step.",
        ),
      },
      {
        q: t("marketing.teams.vendor-subcontractor.faqs.2.q", undefined, "Can my client see my other work?"),
        a: t(
          "marketing.teams.vendor-subcontractor.faqs.2.a",
          undefined,
          "No. Each portal is scoped to that organization's projects, enforced at the database layer. Client A cannot see that Client B exists, and neither sees anything of yours beyond what you submit to them.",
        ),
      },
      {
        q: t("marketing.teams.vendor-subcontractor.faqs.3.q", undefined, "What happens if my insurance lapses?"),
        a: t(
          "marketing.teams.vendor-subcontractor.faqs.3.a",
          undefined,
          "The portal flags the expiry ahead of time, and new POs gate until a current COI is on file. Annoying by design; it also means you never lose a job over paperwork you didn't know was stale.",
        ),
      },
    ],
  }),
};

/**
 * Localized view of TEAMS_BY_SLUG[slug]. Structure (slug, module + industry
 * slug lists) rides through from the data file; prose resolves through the
 * catalog and falls back to the verbatim English copy.
 */
export function localizeTeam(slug: string, t: Translator): TeamRole | undefined {
  const e = TEAMS_BY_SLUG[slug];
  if (!e) return undefined;
  const loc = LOCALIZERS[slug];
  return loc ? loc(e, t) : e;
}
