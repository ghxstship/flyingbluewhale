/**
 * Production-role landing pages. Each entry powers /teams/[role].
 *
 * Voice rule: operator vernacular per the brand canon. Each role gets
 * tuned hero copy, the modules they live in day-to-day, the pain points
 * the platform addresses, and role-specific FAQs. Same template, same
 * canonical data, different audience.
 */

export type TeamRole = {
  slug: string;
  role: string;
  /** One-line who-they-are. */
  blurb: string;
  hero: { eyebrow: string; title: string; body: string };
  /** Six day-to-day workflows that matter to this role. */
  workflows: Array<{ title: string; body: string }>;
  /** Modules from the canonical MODULES map this role spends time in. */
  modules: string[];
  /** Industries this role typically operates in. */
  industries: string[];
  /** Pain points the platform solves. */
  painPoints: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const TEAMS: TeamRole[] = [
  {
    slug: "tour-managers",
    role: "Tour Managers",
    blurb: "The single accountable owner of an entire touring run — advancing, finance, logistics, crew, settlement.",
    hero: {
      eyebrow: "For Tour Managers",
      title: "Tour Management, On Modern Rails.",
      body: "The TM stack hasn't changed in twenty years. A desktop app and a binder. ATLVS retunes the same primitives for cloud-native, real portals, offline mobile, AI assistance, per-org pricing.",
    },
    workflows: [
      {
        title: "Per-Stop Advancing",
        body: "Sixteen typed deliverables per stop. Riders, hospitality, stage plots, hotel blocks, ground transport. Portals for venues, vendors, drivers.",
      },
      {
        title: "Day Sheets To The Portal",
        body: "Crew + talent see their day sheet in the portal. No more PDF email chains. Updates publish; nobody asks 'is this the latest?'",
      },
      {
        title: "Per-Diem Math",
        body: "City × day × rate → finance. Pay-day reconciliation runs from the same record. Per-diems flow into payroll automatically.",
      },
      {
        title: "Settlement",
        body: "Box office, venue cost, guarantees, back-end. Settled at the venue with a signed sheet, off live data.",
      },
      {
        title: "Ground Transport",
        body: "Vehicle runs with driver, vehicle, manifest, POD. Drivers see their runs in a portal — no app to install.",
      },
      {
        title: "Crisis Comms",
        body: "Weather hold, security incident, evacuation — pre-approved templates publish in one tap from the road.",
      },
    ],
    modules: ["advancing", "logistics", "schedule", "finance", "portals", "safety"],
    industries: ["touring", "concerts", "festivals-tours"],
    painPoints: [
      "Day sheets emailed as PDFs and immediately out of date",
      "Per-diem math redone every Monday morning",
      "Settlement spreadsheet built from scratch every show",
      "Driver runs tracked in a chat thread until they're not",
    ],
    faqs: [
      {
        q: "Will this replace our desktop touring stack?",
        a: "Yes, for modern touring orgs. We carry advancing, day sheets, and per-stop variance, and add cloud-native multi-user, real portals, offline mobile, AI, and per-org pricing. The old tools win on muscle memory; we win on every spec.",
      },
      {
        q: "Can we run multiple tours simultaneously?",
        a: "Yes. The 21-day look-ahead crosses projects so you see what's load-in this week and which crew is available next.",
      },
      {
        q: "How does settlement work?",
        a: "Box-office data lands in finance throughout the show; settlement night you reconcile against guarantees, deductions, and back-end. A signed PDF exports for the venue/promoter.",
      },
    ],
  },
  {
    slug: "production-managers",
    role: "Production Managers",
    blurb: "The build owner — RFIs, submittals, daily logs, punch, inspections, show-ready.",
    hero: {
      eyebrow: "For Production Managers",
      title: "Run The Build Like A Build. Just Faster.",
      body: "The PM stack borrows from construction — ball-in-court RFIs, submittals, daily logs, punch lists, change orders — at show-day velocity, built for the production calendar.",
    },
    workflows: [
      {
        title: "RFIs With A Clock",
        body: "Question, recipient, official answer, due date. Open RFIs surface on every project dashboard. Closes that take 14 days on construction close in 24 hours here.",
      },
      {
        title: "Daily Logs",
        body: "Weather pulled from forecast, manpower from time entries, photos from the gallery. One record per day. Recap writes itself.",
      },
      {
        title: "Punch List",
        body: "Item, location, trade, photo, due date. Show-ready gate enforces it. Doors don't open until punch closes.",
      },
      {
        title: "Inspections",
        body: "Ten built-in templates (rigging, electrical, fire/life-safety, structural, ADA, food service, FOH, BOH, dressing rooms, broadcast). PDF output the AHJ accepts.",
      },
      {
        title: "Change Orders",
        body: "Quantified, priced, approved before the work happens. Writes to budget on accept.",
      },
      {
        title: "Vendor Coordination",
        body: "Vendor portal with COIs, W-9s, POs, payouts via Stripe Connect. Compliance gates POs automatically.",
      },
    ],
    modules: ["procore-parity", "inspections", "production", "procurement", "photos", "safety"],
    industries: ["fabrication", "live-events", "immersive-experiences"],
    painPoints: [
      "RFIs lost in email threads",
      "Daily logs in a notebook no one reads after wrap",
      "Punch list scattered across phone notes apps",
      "AHJ asks for inspection evidence the morning of show",
    ],
    faqs: [
      {
        q: "How does this fit production timelines?",
        a: "Same primitives at production velocity. Construction tooling is built for 18-month projects with deep BIM. Event production runs in 4-12 week cycles; we drop the heavy procurement-bidding and tighten the loop on what matters.",
      },
      {
        q: "Can we run multiple builds in flight?",
        a: "Yes. Production tier is unlimited users and unlimited projects. The 21-day look-ahead crosses projects.",
      },
    ],
  },
  {
    slug: "stage-managers",
    role: "Stage Managers",
    blurb: "The show caller — ROS, comms, cue books, real-time direction.",
    hero: {
      eyebrow: "For Stage Managers",
      title: "Run-Of-Show, To The Minute.",
      body: "The SM lives on the ROS. ATLVS gives you cue numbers, departments, departmental notes — the cue book shape, with everything else on the production hanging off it.",
    },
    workflows: [
      {
        title: "ROS To The Minute",
        body: "Cue number, time, duration, department, notes. Publishes to portals so artist sees set time, crew sees call, vendor sees delivery window.",
      },
      {
        title: "Cue Book Shape",
        body: "Reads like a cue book. Filterable per department. Comms channels per cue when relevant.",
      },
      {
        title: "Crew Calls",
        body: "Call sheet flows from the schedule to the portal to the ICS. Per-crew call times based on ROS dependency.",
      },
      {
        title: "Conflict Detection",
        body: "Double-booked crew, gear, or venues surface before they cost you.",
      },
      {
        title: "Real-Time Direction",
        body: "Show-call notes captured live; post-show debrief writes itself from the timestamped log.",
      },
      {
        title: "Set Time Communication",
        body: "Artists see their set time in the portal. Changes notify automatically; nobody texts asking 'is doors still 8?'",
      },
    ],
    modules: ["schedule", "advancing", "guides", "portals"],
    industries: ["concerts", "festivals-tours", "theatrical-performances"],
    painPoints: [
      "ROS in a shared Google Doc that two people edit simultaneously",
      "Crew call texted out the morning of and never reconciled to the budget",
      "Show notes captured in a notebook that lives in someone's bag",
    ],
    faqs: [
      {
        q: "Does it replace our cue-call software?",
        a: "For the call book itself — usually yes. For comms intercom — no, we don't replace Clear-Com or Riedel. We're the canonical schedule and notes layer that lives above the comms hardware.",
      },
    ],
  },
  {
    slug: "festival-directors",
    role: "Festival Directors",
    blurb: "Multi-day, multi-stage, 15k+ guest operations from one console.",
    hero: {
      eyebrow: "For Festival Directors",
      title: "Run The Festival. Not The Spreadsheet.",
      body: "Festivals run on six concurrent operations: ticketing + gate, advancing + ROS, vendor + procurement, safety + medical, F&B + hospitality, marketing + sponsorship. ATLVS is one platform for all six.",
    },
    workflows: [
      {
        title: "15k+ Gate",
        body: "Sub-100ms scan offline-queued. Multiple gates concurrent. Zero duplicates under load.",
      },
      {
        title: "Multi-Stage ROS",
        body: "Per-stage cue book with changeover windows. Artist set times, hospitality runs, sound checks.",
      },
      {
        title: "Per-Persona KBYG",
        body: "Guest, crew, artist, vendor, sponsor — each sees their version. One source, scoped renders.",
      },
      {
        title: "Vendor Compliance",
        body: "COIs, W-9s, payouts via Stripe Connect. POs gate behind a current COI. Audit-ready.",
      },
      {
        title: "Sponsor Activations",
        body: "Sponsor portal with activation specs, asset library, entitlements, reporting on delivery.",
      },
      {
        title: "Wrap Recap",
        body: "Photos, P&L, recordable incidents, gate throughput. One PDF on settlement night.",
      },
    ],
    modules: ["ticketing", "schedule", "advancing", "procurement", "safety", "ai"],
    industries: ["festivals-tours", "live-events"],
    painPoints: [
      "Ticketing on one platform, gate on another, no reconciliation",
      "Vendor COIs in a folder that's six months out of date",
      "Sponsor reporting put together by hand the week after wrap",
    ],
    faqs: [
      {
        q: "How many guests can the platform handle?",
        a: "Tested at 15,000-guest single gates with concurrent scanning, sub-100ms, offline-queued. The bottleneck is your network, not us.",
      },
      {
        q: "Can sponsors get a branded portal?",
        a: "Yes. Per-project branded portal scoped by RLS. Each sponsor sees only their activation, assets, and reporting.",
      },
    ],
  },
  {
    slug: "site-managers",
    role: "Site Managers",
    blurb: "Build site ownership — load-in, inspections, daily logs, strike.",
    hero: {
      eyebrow: "For Site Managers",
      title: "The Build Site, Documented.",
      body: "Site managers own the build site from load-in through strike. ATLVS captures the day — weather, manpower, inspections, photos, punch, change orders — and turns it into the post-show wrap automatically.",
    },
    workflows: [
      {
        title: "Daily Site Log",
        body: "Weather, manpower, equipment on site, work performed, photos. Auto-populates from time entries.",
      },
      {
        title: "Inspections Walk",
        body: "Walk inspection on the phone. Pass/fail per item, photo evidence, sign-off. PDF output for the AHJ.",
      },
      {
        title: "Photo Gallery",
        body: "Per-project gallery, EXIF preserved, geo-tagged. Daily logs auto-bundle the day's photos.",
      },
      {
        title: "Punch + Show-Ready",
        body: "Item, location, photo, due date. Show-ready gate enforces resolution before doors.",
      },
      {
        title: "Strike Coordination",
        body: "Reverse-build order, hard exit deadline, OT triggers tracked.",
      },
      {
        title: "Incident Capture",
        body: "Field-first incident intake from the phone. EHS paged on severity threshold.",
      },
    ],
    modules: ["procore-parity", "inspections", "photos", "safety", "schedule"],
    industries: ["fabrication", "live-events", "immersive-experiences", "festivals-tours"],
    painPoints: [
      "Daily logs on a clipboard, transcribed at wrap",
      "Photos on three different phones, never collected",
      "Inspection sign-offs lost between the binder and the spreadsheet",
    ],
    faqs: [],
  },
  {
    slug: "technical-directors",
    role: "Technical Directors",
    blurb: "Tech ownership across audio, lighting, video, scenic — specs through show-day.",
    hero: {
      eyebrow: "For Technical Directors",
      title: "Tech Specs Live On The Record.",
      body: "TDs own the technical spine — system design, gear list, power, rigging, signal flow. ATLVS captures specs as typed records that survive into the season, the next show, and the post-mortem.",
    },
    workflows: [
      {
        title: "Equipment Registry",
        body: "Every asset tagged with status across its lifecycle. Cross-season availability view.",
      },
      {
        title: "Sub-Rentals",
        body: "Source, return date, associated PO. Late returns flag in procurement.",
      },
      {
        title: "Rigging Inspections",
        body: "Point loads, dynamic loads, motor calcs documented per show.",
      },
      {
        title: "Power Distribution",
        body: "Circuit-by-circuit allocation with margin. Surfaces during inspection.",
      },
      {
        title: "Fabrication Orders",
        body: "Shop work with cost, timeline, delivery photos. Variance to budget tracked.",
      },
      {
        title: "Damage + Sub-Bill",
        body: "Damage reports with photos and cost estimates. Bills automatically to sub or client.",
      },
    ],
    modules: ["production", "inspections", "procurement", "compliance"],
    industries: ["concerts", "festivals-tours", "broadcast-tv-film", "immersive-experiences"],
    painPoints: [
      "Gear list lives in three spreadsheets",
      "Sub-rental returns chased by text 3 weeks after wrap",
      "Damage write-offs never reconciled to the client",
    ],
    faqs: [],
  },
  {
    slug: "talent-buyers",
    role: "Talent Buyers",
    blurb: "Lead-to-booking pipeline — offers, contracts, advancing handoff.",
    hero: {
      eyebrow: "For Talent Buyers",
      title: "From Offer To Advancing. One Record.",
      body: "Talent buying sits between the sales pipeline and production. ATLVS keeps offers, contracts, and the handoff to advancing on one record so the artist team never asks 'who is on it?'.",
    },
    workflows: [
      {
        title: "Pipeline",
        body: "Lead → offer → contract → confirmed → advancing. Per-show win rate and time-to-close.",
      },
      {
        title: "Offer Letters",
        body: "23 block types signed in place. IP + timestamp captured. Stripe Connect deposit on accept.",
      },
      {
        title: "Contract Library",
        body: "Templated agreements with variable fees, riders, options.",
      },
      {
        title: "Artist Portal",
        body: "Artists see their offer, rider, hospitality, set time. One link.",
      },
      {
        title: "Handoff To Advancing",
        body: "Confirmed offer flips to a project with advancing deliverables auto-created.",
      },
      {
        title: "Settlement",
        body: "Final fees, back-end, deductions. Settled at the venue from live data.",
      },
    ],
    modules: ["proposals", "advancing", "finance", "portals"],
    industries: ["concerts", "festivals-tours", "live-events"],
    painPoints: [
      "Offers in DocuSign, advancing in email, contracts in a folder",
      "Re-entering the same artist + venue data three times",
      "Handoff to production is a Slack message",
    ],
    faqs: [],
  },
  {
    slug: "hse-leads",
    role: "EHS / Safety Leads",
    blurb: "Safety + medical + crisis ownership — incidents, OSHA, daily briefings.",
    hero: {
      eyebrow: "For EHS Leads",
      title: "Safety Isn't A Binder. It's A System.",
      body: "EHS leads own incidents, OSHA logs, medical triage, daily briefings, crisis comms, BC/DR, safeguarding, environmental. ATLVS makes each a first-class record on the same database the show runs on.",
    },
    workflows: [
      {
        title: "Field-First Incident Intake",
        body: "From the phone, anonymous-capable. Photos, location, witnesses. Routes to EHS instantly.",
      },
      {
        title: "OSHA 300 Log",
        body: "Recordables flow from incidents. 300A summary one click before audit.",
      },
      {
        title: "Daily Safety Brief",
        body: "Per-day briefing with hazards, weather, PPE, comms, emergency assembly. Roster sign-on captured.",
      },
      {
        title: "Inspections",
        body: "Ten built-in templates with show-ready gate.",
      },
      {
        title: "Crisis Comms",
        body: "Pre-approved templates publish in one tap.",
      },
      {
        title: "Medical + Safeguarding",
        body: "Separately-scoped records with stricter access and audit.",
      },
    ],
    modules: ["safety", "inspections", "compliance", "mobile"],
    industries: ["festivals-tours", "live-events", "concerts", "immersive-experiences"],
    painPoints: [
      "Incidents on a clipboard, transcribed Monday morning",
      "OSHA 300A assembled from emails three weeks before audit",
      "Crisis comms drafted in real-time at 2am",
    ],
    faqs: [],
  },
];

export const TEAMS_BY_SLUG = Object.fromEntries(TEAMS.map((t) => [t.slug, t]));
