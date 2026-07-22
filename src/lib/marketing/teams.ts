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
    faqs: [
      {
        q: "Does it work when the site has no signal?",
        a: "Yes. COMPVSS is offline-first. Punches, photos, and log entries queue on the phone and sync when coverage comes back. A generator field with zero bars still gets documented.",
      },
      {
        q: "Who can close out an incident report?",
        a: "Anyone on site can file one from the phone, anonymously if they want. Closing it is a manager sign-off. That split is enforced by role, so nothing quietly disappears between the field and the file.",
      },
      {
        q: "Will the AHJ accept the inspection output?",
        a: "The templates render to a signed PDF with pass/fail per item, photo evidence, and the inspector's sign-off timestamp. That's the format fire marshals and building officials ask for.",
      },
    ],
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
    faqs: [
      {
        q: "Does the registry handle both serialized units and bulk stock?",
        a: "Yes. A moving-light with a serial number and a case of 200 shackles live in the same registry. Serialized assets track individually; lot assets carry a quantity and draw down as they're issued.",
      },
      {
        q: "Can crew check gear out themselves?",
        a: "Crew scan custody in and out from their own phones. Changing an asset's disposition, writing one off, or billing damage stays with the manager band. Scanning is open; the ledger is gated.",
      },
      {
        q: "What happens when a sub-rental comes back late?",
        a: "The return date lives on the rental record with its PO. Past-due returns flag in procurement instead of surfacing three weeks after wrap in a text thread.",
      },
    ],
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
    faqs: [
      {
        q: "What are the default deposit terms on a booking?",
        a: "Offers default to a 60% deposit with the balance due at load-in. You can change it per offer, but the default matches how most talent deals actually settle.",
      },
      {
        q: "Does the agent or manager need an account to sign?",
        a: "No. The offer letter opens from a link and signs in place. IP and timestamp are captured on signature, and the deposit can collect on accept through Stripe.",
      },
      {
        q: "What happens after an offer confirms?",
        a: "The confirmed offer flips into a project with its advancing deliverables auto-created. Production picks up the record you already built instead of a forwarded email.",
      },
    ],
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
    faqs: [
      {
        q: "Can crew report incidents anonymously?",
        a: "Yes. The field intake works with or without a name attached. Anonymous filings route to EHS the same way, with photos and location intact. You get the report you'd otherwise never hear about.",
      },
      {
        q: "Who is allowed to close an incident?",
        a: "Filing is open to everyone on site. Closing is a manager-band sign-off, enforced by role. The person who reported a hazard can't be the one who quietly marks it resolved.",
      },
      {
        q: "How does the OSHA log stay current?",
        a: "Recordables flow from the incident record as they're classified, so the 300 log builds during the season. The 300A summary exports in one click when the audit letter arrives.",
      },
    ],
  },
  {
    slug: "production-coordinator",
    role: "Production Coordinators",
    blurb: "The production office's connective tissue. Tasks, calls, travel, paperwork, and the answer to every 'who has that?'",
    hero: {
      eyebrow: "For Production Coordinators",
      title: "Your Week, Minus The Chasing.",
      body: "Right now Monday is forty unread threads asking where things stand. On ATLVS the task list, the schedule, and the travel grid are the same record everyone else is reading, so the answer to 'where does that live?' becomes one link.",
    },
    workflows: [
      {
        title: "My Work",
        body: "One personal spine: your open tasks, pending approvals, requests you filed. Everything with your name on it, in one list on your phone.",
      },
      {
        title: "Tasks That Close",
        body: "Assign, date, done. Tasks live on the project record, so 'did that happen?' has an answer without a status meeting.",
      },
      {
        title: "Schedule + Calls",
        body: "Calls flow from the schedule to each person's portal and calendar. When the call moves, the notification goes out; you don't re-text thirty people.",
      },
      {
        title: "Travel + Lodging",
        body: "Flights, ground, hotel blocks, roommate pairs. Each person sees their own itinerary in COMPVSS instead of asking you for the confirmation number again.",
      },
      {
        title: "Requests, Routed",
        body: "Gear, purchase reqs, time off, IT, report-it. Five structured intakes replace the 'hey, quick favor' texts. You file it; the approval routes itself.",
      },
      {
        title: "Docs + Templates",
        body: "The packet you built last show becomes the template for the next one. Field forms and documents live where the crew fills them in.",
      },
    ],
    modules: ["schedule", "advancing", "logistics", "mobile", "forms"],
    industries: ["live-events", "corporate-events", "conferences", "trade-shows-exhibitions"],
    painPoints: [
      "The itinerary lives in your inbox and everyone knows it",
      "Approvals stall because nobody knows whose desk they're on",
      "The same call time gets texted, emailed, and posted, then changes",
      "Every show starts with rebuilding last show's paperwork",
    ],
    faqs: [
      {
        q: "How is this different from a general task app?",
        a: "The tasks sit on production records. A task attached to a load-in, a requisition, or an artist advance carries its context with it, so closing it updates the thing it was actually about.",
      },
      {
        q: "Can I approve things, or just file them?",
        a: "Depends on your role. Coordinators typically file requests and route them; approvals sit with the manager band. That split is enforced by permissions, which means an approval on the record is a real approval.",
      },
      {
        q: "Does travel really live here too?",
        a: "Yes. Travel and lodging are assignment records per person per project. Each traveler sees their own legs and room in the field app; you see the whole grid.",
      },
    ],
  },
  {
    slug: "crew-freelancer",
    role: "Crew & Freelancers",
    blurb: "The people who build the show. Call times, credentials, hours, and getting paid without chasing anyone.",
    hero: {
      eyebrow: "For Crew & Freelancers",
      title: "Show Up Knowing The Plan.",
      body: "Before: call time in one text, parking in another, your W-9 in an email from March. After: COMPVSS on your phone has the shift, the gate, your credential, and your hours. It keeps working with zero bars.",
    },
    workflows: [
      {
        title: "Clock In, Verified",
        body: "Punch in from the phone with geo verification against the site zone. Your hours are yours, on the record, from the first punch.",
      },
      {
        title: "Your Schedule + Swaps",
        body: "See your shifts, request a swap, get the answer in the app. No group-chat archaeology to figure out if you work Saturday.",
      },
      {
        title: "Your Advances",
        body: "Credential, radio, meal, ticket, uniform. Everything issued to you for the show, listed with its state, so the gate conversation is short.",
      },
      {
        title: "Hours, Expenses, Mileage",
        body: "Timesheets build from your punches. Receipts photograph straight into an expense. Mileage logs from the phone. Payday math stops being your problem.",
      },
      {
        title: "Time Off That Answers",
        body: "Request it in the app, watch it route, get a decision. The approval lives on the record instead of in someone's memory.",
      },
      {
        title: "The Next Gig",
        body: "Open gigs and calls post to the public marketplace. Your profile and availability calendar do the pitching while you're on a show.",
      },
    ],
    modules: ["mobile", "schedule", "advancing", "finance"],
    industries: ["live-events", "concerts", "festivals-tours", "sports-events", "venues-arenas"],
    painPoints: [
      "Call time changes and you find out at the gate",
      "Hours disputed three weeks later with no record",
      "Receipts in a jacket pocket until they're unreadable",
      "Every new gig means a new app, a new login, a new W-9",
    ],
    faqs: [
      {
        q: "How do I join?",
        a: "Two ways. If a production hires you, they send an invite or an org code and you land in COMPVSS on your phone. If you're starting your own outfit, organizations are created in LEG3ND on the web, and then you invite your crew.",
      },
      {
        q: "Do I need a laptop?",
        a: "No. COMPVSS is built phone-first and works offline. Punches, photos, and filings queue on the device and sync when you're back in coverage.",
      },
      {
        q: "Who can see my hours and documents?",
        a: "You see your own records; your personal documents stay yours. Timesheets are visible to you and the managers who approve them. Access is enforced at the database layer per role, so a fellow crew member can't browse your file.",
      },
      {
        q: "Can I work for more than one company?",
        a: "Yes. One login, multiple workspaces. Each production's data stays inside its own org; switching shows takes two taps.",
      },
    ],
  },
  {
    slug: "warehouse-asset-manager",
    role: "Warehouse & Asset Managers",
    blurb: "Owner of the shop and everything in it. The registry, the scans, the custody chain, the truck that leaves at 6am.",
    hero: {
      eyebrow: "For Warehouse & Asset Managers",
      title: "Every Case, Accounted For.",
      body: "The truck leaves at 6 and you find out at 8 what didn't make it. On ATLVS a case that leaves the shop is a scan, and the scan is custody. What's out, who has it, and when it's due back stop being questions.",
    },
    workflows: [
      {
        title: "One Asset Registry",
        body: "Gear, fleet, and lot stock in a single store with class, quantity, and disposition. The spreadsheet with the 'FINAL_v3' filename retires.",
      },
      {
        title: "Scan Custody",
        body: "QR and barcode scans from any phone move custody in and out. The chain of who touched what survives load-out, the show, and the 2am reload.",
      },
      {
        title: "Master Catalog",
        body: "Every SKU your org issues, from radios to wristbands, in one catalog. Assignments draw from it, so counts reconcile instead of drifting.",
      },
      {
        title: "Kit Fulfillment",
        body: "Radios, tools, and uniforms issue per person per show and come back through the same lifecycle. Issued, transferred, returned. No orphan gear.",
      },
      {
        title: "Runs + Logistics",
        body: "Vehicle runs with driver, manifest, and proof of delivery. The field app shows the driver their run; you see the board.",
      },
      {
        title: "Damage, Billed",
        body: "Damage reports carry photos and a cost estimate, and bill to the sub or the client instead of dying in a wrap-week email.",
      },
    ],
    modules: ["logistics", "production", "mobile", "procurement"],
    industries: ["live-events", "festivals-tours", "broadcast-tv-film", "trade-shows-exhibitions"],
    painPoints: [
      "The count is right until the first truck loads",
      "Custody is a memory, so losses are a mystery",
      "Sub-rental returns tracked in a text thread",
      "Write-offs discovered at year-end, not at wrap",
    ],
    faqs: [
      {
        q: "What scanning hardware do I need?",
        a: "None to start. QR and barcodes scan with the phone camera in COMPVSS. If you run RFID, wedge scanners that emulate a keyboard work with the same intake.",
      },
      {
        q: "Can crew check gear out themselves?",
        a: "Yes, and that's the point: crew scan custody at the case. Changing a disposition, writing an asset off, or billing damage stays with the manager band, enforced by role. Open scanning, gated ledger.",
      },
      {
        q: "How do quantities work for bulk stock?",
        a: "Lot assets carry a quantity and draw down as they issue; serialized assets track one by one. Both roll up in the same inventory view, so the shackle count and the console serial live on one screen.",
      },
    ],
  },
  {
    slug: "finance-controller",
    role: "Finance Controllers",
    blurb: "The one who closes the month. Capture at the source, approvals with teeth, terms that collect themselves.",
    hero: {
      eyebrow: "For Finance Controllers",
      title: "Close The Month Without The Shoebox.",
      body: "Today the month closes on receipts photographed in four different apps. On ATLVS the field captures its own paper: expenses, mileage, and hours land coded from the crew's phones, and you approve from yours. The full console ledger is coming; the capture layer works now.",
    },
    workflows: [
      {
        title: "Expenses At The Source",
        body: "Crew photograph the receipt into a coded expense the day they spend it. You stop reconstructing a show from a pile at wrap.",
      },
      {
        title: "Mileage That's Logged",
        body: "Mileage files from the phone against the project. Rate math is done for you, and the log survives an audit.",
      },
      {
        title: "Labor From Punches",
        body: "Timesheets build from geo-verified clock punches, so the labor number you post is the labor that happened on site.",
      },
      {
        title: "Approvals With Teeth",
        body: "A requisition filed in the field spends nothing until the controller band signs. Approval chains are role-gated, and the decision lives on the record.",
      },
      {
        title: "Terms That Collect",
        body: "Proposals carry a 50/50 deposit split by default; talent bookings run 60/40 with the balance at load-in. Signed online, deposits collect through Stripe on acceptance.",
      },
      {
        title: "The Console Ledger (On The Way)",
        body: "Budgets, AP and AR, and settlement in the operator console are in build. We'd rather tell you that than sell you a screenshot.",
      },
    ],
    modules: ["finance", "mobile", "proposals", "portals"],
    industries: ["corporate-events", "festivals-tours", "government-municipal", "education-campus"],
    painPoints: [
      "Wrap week is receipt archaeology",
      "Labor actuals arrive two pay cycles late",
      "POs approved verbally, disputed in writing",
      "Deposit terms renegotiated by accident in email",
    ],
    faqs: [
      {
        q: "What's live today and what's still coming?",
        a: "Live now: field capture of expenses, mileage, and timesheets, role-gated approvals from the phone, proposals with deposit terms that sign and collect online, and vendor payouts through Stripe Connect. In build: the full console ledger with budgets, AP/AR, and settlement views.",
      },
      {
        q: "How do vendor payouts work?",
        a: "Vendors onboard a Stripe Connect account through their portal. Payouts route on approval as ACH, card, or wire, and every payout ties back to its PO.",
      },
      {
        q: "Can crew see budget numbers?",
        a: "No. Finance surfaces are role-gated at the database layer. Crew see their own expenses, hours, and reimbursements; budget and margin stay with the roles you grant.",
      },
    ],
  },
  {
    slug: "marketing-content-lead",
    role: "Marketing & Content Leads",
    blurb: "The voice of the show. Guides, ticket pages, sponsor delivery, and one update that lands everywhere.",
    hero: {
      eyebrow: "For Marketing & Content Leads",
      title: "Publish Once. Every Screen Follows.",
      body: "Show week you're pasting the same update into an email, a doc, and three chats. On ATLVS you publish once and each audience reads its own version: the guest guide, the crew feed, the sponsor portal, the ticket page. Same record underneath.",
    },
    workflows: [
      {
        title: "Know Before You Go",
        body: "One guide, scoped per persona. Guests get parking and doors; crew get radio channels and PPE; artists get their set time. Sixteen section types, one source.",
      },
      {
        title: "The Ticket Page",
        body: "Tiers, transfers, and capacity read from the same records the gate scans against, so the storefront never advertises a tier that sold out yesterday.",
      },
      {
        title: "Sponsor Delivery",
        body: "Each sponsor's portal carries their activation specs, asset library, and entitlements, plus reporting on what actually got delivered. Renewal conversations start from evidence.",
      },
      {
        title: "Crew Announcements",
        body: "Post to the feed and it reaches every phone on the crew, with read counts. The 'nobody told me' era ends quietly.",
      },
      {
        title: "The Photo Record",
        body: "Site photos collect per project with dates and locations intact. The recap deck builds from the gallery instead of a plea in the group chat.",
      },
      {
        title: "Campaign Console (On The Way)",
        body: "Deeper campaign and content tooling in the operator console is in build. What's above ships today.",
      },
    ],
    modules: ["guides", "ticketing", "portals", "photos"],
    industries: ["brand-activations", "conferences", "weddings-private-events", "sports-events"],
    painPoints: [
      "Five versions of the event info, four of them stale",
      "Sponsor recap assembled by hand the week after wrap",
      "The good photos live on someone's phone",
      "Guest questions answered one DM at a time",
    ],
    faqs: [
      {
        q: "Do guests need to install anything?",
        a: "No. The guest guide and ticket surfaces open from a link in any browser. COMPVSS, the installable app, is for your crew.",
      },
      {
        q: "Who can publish, and who can only draft?",
        a: "Publishing is a manager-band permission. Anyone you grant access can draft; the update goes live when a publisher pushes it. Drafts never leak to guests or sponsors.",
      },
      {
        q: "Can the guest-facing surfaces carry our brand?",
        a: "Yes, on Enterprise: custom branding and custom domains on the portal. Most promoters white-label the guest side and keep the operator side stock.",
      },
    ],
  },
  {
    slug: "vendor-subcontractor",
    role: "Vendors & Subcontractors",
    blurb: "The outside shop the show depends on. POs in writing, compliance in one place, payouts without the phone calls.",
    hero: {
      eyebrow: "For Vendors & Subcontractors",
      title: "Get The PO. Do The Work. Get Paid.",
      body: "You've chased a net-60 check with three phone calls before. The vendor portal your client sends you shows the PO, the compliance docs it needs, and where your payout stands, in one login. No seat license, no software to buy.",
    },
    workflows: [
      {
        title: "Onboard Once",
        body: "COI and W-9 upload straight into the portal, with expiry tracked. A current certificate is the key that unlocks POs, so the paperwork conversation happens once.",
      },
      {
        title: "POs In Writing",
        body: "The order, its line items, and its terms live in your portal. Verbal scope changes stop being your problem to prove.",
      },
      {
        title: "Bid Open RFQs",
        body: "Producers publish RFQs to the public marketplace. You respond through the portal with your quals attached, against stated requirements instead of a guessing game.",
      },
      {
        title: "Payouts, Direct",
        body: "Onboard a Stripe Connect account and payouts land on PO fulfillment as ACH, card, or wire. Each payout ties to its PO, so reconciliation on your side is a lookup.",
      },
      {
        title: "A Person, Not A Void",
        body: "Your portal carries a message thread to your account manager on the production side. Questions land with the person who can answer them.",
      },
      {
        title: "Every Client, One Login",
        body: "Each producer you work with sends their own portal; your login carries across. Their worlds stay separate, your inbox stays sane.",
      },
    ],
    modules: ["portals", "procurement", "compliance", "finance"],
    industries: ["live-events", "festivals-tours", "trade-shows-exhibitions", "venues-arenas", "government-municipal"],
    painPoints: [
      "Scope agreed on a call, disputed at invoice",
      "COI expires mid-show and nobody caught it",
      "Payment status is a weekly phone call",
      "Five clients, five spreadsheets of your own paperwork",
    ],
    faqs: [
      {
        q: "What does the portal cost me?",
        a: "Nothing. Your client's organization runs the platform; you're invited in. You get the PO record, compliance vault, messaging, and payout status without buying a seat.",
      },
      {
        q: "How do I get paid?",
        a: "Through Stripe Connect. You onboard a payout account once, and approved POs pay out directly as ACH, card, or wire. No invoice-into-the-void step.",
      },
      {
        q: "Can my client see my other work?",
        a: "No. Each portal is scoped to that organization's projects, enforced at the database layer. Client A cannot see that Client B exists, and neither sees anything of yours beyond what you submit to them.",
      },
      {
        q: "What happens if my insurance lapses?",
        a: "The portal flags the expiry ahead of time, and new POs gate until a current COI is on file. Annoying by design; it also means you never lose a job over paperwork you didn't know was stale.",
      },
    ],
  },
];

export const TEAMS_BY_SLUG = Object.fromEntries(TEAMS.map((t) => [t.slug, t]));
