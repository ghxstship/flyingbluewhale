/**
 * Canonical industry catalogue for the marketing surface.
 *
 * Single source of truth for /solutions/[industry] and the programmatic
 * /features/[module]/[industry] farm. Update entries here, not in the
 * page files.
 */

export type IndustryConfig = {
  name: string;
  tagline: string;
  description: string;
  hero: { eyebrow: string; title: string; body: string };
  stats: { value: string; label: string }[];
  outcomes: string[];
  modules: { name: string; body: string }[];
  faqs: { q: string; a: string }[];
  related: string[];
};

export const INDUSTRIES: Record<string, IndustryConfig> = {
  "live-events": {
    name: "Live Events",
    tagline: "Venue residencies, club nights, one-offs",
    description:
      "ATLVS Technologies is the production platform for Live Events — club residencies, brand-hosted nights, album release parties, rooftop pop-ups. Ticketing with on-site scan, artist advancing, direct vendor payouts, and per-role Know Before You Go guides — all connected on day one.",
    hero: {
      eyebrow: "Live Events",
      title: "From Pitch to Wrap. One Platform.",
      body: "Replace the stack most venue teams run — Asana for tasks, DocuSign for contracts, QuickBooks for invoices, spreadsheets for advancing. ATLVS Technologies runs all of it in one place.",
    },
    stats: [
      { value: "15k+", label: "guests / night" },
      { value: "< 100ms", label: "scan latency" },
      { value: "6", label: "persona portals" },
      { value: "25%", label: "fewer invoice errors" },
    ],
    outcomes: [
      "Scan tickets on any phone — no rental scanner kits",
      "Ship artist advancing through the portal, not PDF chains",
      "Route vendor payouts directly on approval",
      "Publish one KBYG — guest, crew, artist each see their version",
      "Signed proposals turn into live projects on signature",
      "Crew clock in through COMPVSS with geo-verification",
    ],
    modules: [
      {
        name: "Ticketing",
        body: "Sub-100ms scan. Zero duplicates. Offline queue. Tiered tickets, transfers, VIP cabanas.",
      },
      {
        name: "Artist Advancing",
        body: "Riders, input lists, stage plots, catering, travel, schedule — all through the portal.",
      },
      {
        name: "Vendor Payouts",
        body: "Vendors onboard a payout account. Direct payout on PO fulfillment — ACH, card, or wire.",
      },
      {
        name: "KBYG Guides",
        body: "One source, role-scoped views. Sixteen section types rendered to portal and mobile.",
      },
      { name: "Finance", body: "Per-event P&L, deposit and balance splits, per-vendor invoicing." },
      { name: "Compliance", body: "Vendor COI tracking with expiry alerts, W-9 storage, immutable audit log." },
    ],
    faqs: [
      {
        q: "How many guests can the platform handle?",
        a: "We've scanned 15,000+ guests per event without a blip. Every ticket scans exactly once under concurrent load — the bottleneck is your network, not us.",
      },
      {
        q: "Can I use my existing ticketing vendor?",
        a: "Yes. Import ticket batches via CSV or webhook. Most teams switch to native ticketing once they see the offline scanner and analytics.",
      },
      {
        q: "Can I white-label for a venue's or promoter's brand?",
        a: "Yes, on Enterprise. Custom branding and custom domains. Most clubs and promoters white-label their guest-facing portal.",
      },
    ],
    related: ["concerts", "festivals-tours", "brand-activations", "weddings-private-events"],
  },

  concerts: {
    name: "Concerts",
    tagline: "Single-night shows, amphitheatres, arenas",
    description:
      "Purpose-built for Concerts — single-night shows to stadium-scale runs. Canonical rider, per-venue overrides, shared crew pool, venue advancing, real-time box office metrics, and a field app the house staff actually wants to use.",
    hero: {
      eyebrow: "Concerts",
      title: "One Rider. Every Venue.",
      body: "Concert touring operations live in forty spreadsheets. We keep the canonical rider in one place and scope per-venue variants on top — no copy-paste, no lost revisions.",
    },
    stats: [
      { value: "1×", label: "rider edit" },
      { value: "40+", label: "venues / tour" },
      { value: "< 2m", label: "per-diem approval → payout" },
      { value: "99.9%", label: "scan uptime" },
    ],
    outcomes: [
      "Canonical rider with per-venue overrides — edits cascade correctly",
      "Shared crew pool with per-show scheduling and day rates",
      "Per-diem and emergency advances payout on approval",
      "Box-office metrics and seat-map deltas in real time",
      "Credentials (DOT, insurance, certs) tracked with expiry alerts",
      "Daily settlement in under 48 hours post-show",
    ],
    modules: [
      { name: "Advancing", body: "Canonical plus per-show overrides. Deliverables tracked across the run." },
      { name: "Crew Pool", body: "Shared roster, per-show scheduling, day rates, credential expiry alerts." },
      { name: "Advances", body: "Per-diem and emergency requests with clean status flow and direct payout." },
      { name: "Box Office", body: "Real-time capacity dashboards, seat-map deltas, VIP flags." },
    ],
    faqs: [
      {
        q: "Can the canonical rider handle multi-artist bills?",
        a: "Yes. Each artist has its own project under the parent tour. Advancing, schedule, travel, and rider stay scoped per artist; shared venue info lives on the parent.",
      },
      {
        q: "Do advances pay out directly?",
        a: "Yes. Cash advances route directly to the crew member's linked account. Approval to payout is usually under two minutes.",
      },
      {
        q: "Can I pull manifest data from my ticketing vendor?",
        a: "Yes. CSV bulk imports, webhook from the major ticketing systems, or manual upload. The mobile scanner works offline and syncs when it reconnects.",
      },
    ],
    related: ["festivals-tours", "live-events", "theatrical-performances", "venues-arenas"],
  },

  "festivals-tours": {
    name: "Festivals & Tours",
    tagline: "Multi-day, multi-stage, multi-city",
    description:
      "Festivals and Tours are the hardest shape in live production — dozens of artists, multiple stages, multi-day windows, traveling crew, and a calendar that looks like a subway map. Built for that scale from day one.",
    hero: {
      eyebrow: "Festivals & Tours",
      title: "Run the Festival. Not the Spreadsheet.",
      body: "Multi-day festivals and city-to-city tours fall over when any one of fifty moving pieces breaks. Put artist advancing, vendor payouts, crew scheduling, credentials, and KBYG on one platform that doesn't.",
    },
    stats: [
      { value: "200+", label: "artists / festival" },
      { value: "6", label: "stages managed" },
      { value: "40+", label: "cities / tour" },
      { value: "15k+", label: "scans / day" },
    ],
    outcomes: [
      "Per-artist advancing with a set-time grid and stage assignments",
      "Per-city project cloning — edit only what's different",
      "Credential manifest with RFID and NFC wristband integration",
      "Direct vendor payouts on approval",
      "Real-time stage-side decision board visible to promoter and site ops",
      "Per-artist settlement in days, not weeks",
    ],
    modules: [
      { name: "Advancing Grid", body: "Per-artist rider and per-stage set-time grid with conflict detection." },
      { name: "Credentials", body: "Wristband and badge manifest with access tiers, counts, and RFID linkage." },
      { name: "Procurement", body: "Requisition to PO to receiving. Vendor COI and W-9 tracked with expiry." },
      { name: "COMPVSS Field App", body: "Offline ticket scan, crew clock-in, incident reports from any stage." },
      { name: "Per-City Clone", body: "One click clones the project. Override only what differs." },
    ],
    faqs: [
      {
        q: "Does the platform handle RFID wristbands?",
        a: "Yes. We integrate with the major RFID vendors (Intellitix, ID&C, Plus ID). Wristbands can be pre-assigned or bound at pickup; access tiers enforce at scan.",
      },
      {
        q: "Can I run a multi-day festival and a city tour on the same account?",
        a: "Yes. Each production is its own project, and the platform is multi-project from day one. The same team works across them without logging out.",
      },
      {
        q: "What happens when venue Wi-Fi dies?",
        a: "The field app is offline-first. Scans queue on the device and reconcile cleanly when the phone reconnects. No dropped entries.",
      },
    ],
    related: ["concerts", "live-events", "theatrical-performances", "sports-events", "government-municipal"],
  },

  "immersive-experiences": {
    name: "Immersive Experiences",
    tagline: "Installations, walk-throughs, pop-ups",
    description:
      "Immersive Experiences demand operations software that respects narrative pacing — timed-entry scheduling, per-zone staffing, capacity ceilings, role-specific guides, and an advancing system that treats every act as its own discipline.",
    hero: {
      eyebrow: "Immersive Experiences",
      title: "The Show Runs You. We Run the Show.",
      body: "Immersive runs live or die by seconds. We handle the operations — timed entries, per-zone capacity, cast and crew scheduling — so your team stays in the experience, not the spreadsheet.",
    },
    stats: [
      { value: "< 15s", label: "entry gap drift" },
      { value: "18", label: "zones staffed" },
      { value: "6", label: "capacity tiers" },
      { value: "0", label: "missed cues from ops" },
    ],
    outcomes: [
      "Timed-entry scheduling with enforced capacity ceilings",
      "Per-zone staffing grid with role, shift, and break tracking",
      "Cast and crew scheduling separated from front-of-house",
      "Per-ticket scan with immediate capacity decrement",
      "Incident reports with chain-of-custody for compliance",
      "Per-actor KBYG with safety protocols and character bible",
    ],
    modules: [
      { name: "Timed Entry", body: "Fifteen-minute windows with hard capacity. Waitlist with automated promotion." },
      { name: "Zones & Roles", body: "Zone map, role coverage, break scheduling, escalation routing." },
      {
        name: "Incidents",
        body: "One-tap incident log from the field, routed to the safety lead with chain-of-custody.",
      },
      { name: "Cast Portal", body: "Character bible, blocking notes, safety protocols, per-show call sheet." },
    ],
    faqs: [
      {
        q: "Can we enforce hard capacity per zone?",
        a: "Yes. Each zone has a maximum headcount. The scanner refuses entries that would exceed it, routes the guest to waitlist, and promotes when someone exits.",
      },
      {
        q: "Can we publish a separate guide for cast and for front-of-house?",
        a: "Yes. KBYG guides are per-persona. Cast sees blocking, cue notes, and safety drills. Front-of-house sees guest flow, FAQ, and emergency procedures.",
      },
      {
        q: "How are incidents handled?",
        a: "One-tap from the field. GPS, photo, and reporter captured automatically. The report routes to the safety lead, and the audit log preserves chain-of-custody for insurance.",
      },
    ],
    related: ["theatrical-performances", "brand-activations", "live-events"],
  },

  "brand-activations": {
    name: "Brand Activations",
    tagline: "Pop-ups, product launches, experiential marketing",
    description:
      "Brand Activations turn marketing dollars into memorable moments. We handle the operations — agency-to-client proposals, vendor COIs, RSVP flow, on-site capture, post-event analytics — so the creative team stays creative.",
    hero: {
      eyebrow: "Brand Activations",
      title: "From RFP to Recap. Same Platform.",
      body: "Activations live or die by the speed of the hand-off — agency to client, creative to production, production to vendors. ATLVS Technologies shortens every hand-off to zero.",
    },
    stats: [
      { value: "< 1 day", label: "proposal → signed project" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "40%", label: "faster reconciliation" },
      { value: "24/7", label: "client portal access" },
    ],
    outcomes: [
      "Signed proposals convert to live projects on signature",
      "Client portal open 24/7 for proposals, deliverables, invoices, files, and messages",
      "Vendor COI and W-9 tracking with expiry alerts",
      "RSVP and check-in flow with lead capture at ingress",
      "Card or ACH invoice payments with deposit and balance splits",
      "Post-event recap deck auto-drafted from the activation data",
    ],
    modules: [
      {
        name: "Proposals",
        body: "Twenty-three block types, scroll-spy nav, e-sign in place, share links, version history.",
      },
      { name: "Client Portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "RSVP + Capture", body: "Email RSVP with ticketing. On-site scan captures lead data to the CRM." },
      { name: "Finance", body: "Card or ACH invoicing, deposit and balance splits, live P&L per activation." },
    ],
    faqs: [
      {
        q: "Can agencies share one workspace with multiple clients?",
        a: "Yes. Each client is its own organization with its own data walled off. The agency team spans them; clients only ever see their own workspace.",
      },
      {
        q: "Does the platform handle lead capture at the activation?",
        a: "Yes. Every scan at the door can capture opt-in lead data (email, phone, consented fields). Data routes to the brand's CRM.",
      },
      {
        q: "Is there a branded proposal template?",
        a: "Yes. Proposals adopt the client's brand kit — logo, fonts, colors — automatically once the agency team sets it in settings.",
      },
    ],
    related: ["corporate-events", "immersive-experiences", "live-events", "trade-shows-exhibitions", "weddings-private-events"],
  },

  "corporate-events": {
    name: "Corporate Events",
    tagline: "Conferences, AGMs, summits, internal events",
    description:
      "ATLVS Technologies for Corporate Events — conferences, shareholder meetings, executive summits, internal kickoffs. Client-facing proposals, vendor COI tracking, stakeholder portals, and executive-grade guest experiences.",
    hero: {
      eyebrow: "Corporate Events",
      title: "Executive Grade. Field Ready.",
      body: "Corporate teams want proposals they can review and sign. Executives want KBYG. Vendors need COIs managed. Compliance wants an audit log. We do all four, tuned for corporate cadence.",
    },
    stats: [
      { value: "14 → 2", label: "days to invoice" },
      { value: "100%", label: "vendor COIs tracked" },
      { value: "< 1 day", label: "proposal → project" },
      { value: "SOC 2", label: "controls in production" },
    ],
    outcomes: [
      "Signed proposals convert to a live project on signature",
      "Client portal open 24/7 for proposals, deliverables, invoices, files, and messages",
      "Vendor COI and W-9 tracking with expiry alerts",
      "Per-persona KBYG — executives, VIPs, staff, crew",
      "Card or ACH invoicing with deposit and balance splits",
      "Immutable audit log on every change, for compliance and legal",
    ],
    modules: [
      {
        name: "Proposals",
        body: "Twenty-three block types, scroll-spy nav, e-sign in place, share links, version history.",
      },
      { name: "Client Portal", body: "Proposals, deliverables, invoices, shared files, direct messages." },
      { name: "Compliance", body: "Vendor COI tracking, W-9 storage, immutable audit log, SOC 2 controls." },
      { name: "Finance", body: "Card or ACH invoicing, deposit and balance splits, live P&L." },
    ],
    faqs: [
      {
        q: "Does the platform support SOC 2 or ISO compliance?",
        a: "The controls SOC 2 attests to — access control, change management, audit logging, encryption, monitoring — are already in production. SOC 2 Type II is in progress for Enterprise customers. Contact sales for current status.",
      },
      {
        q: "Can we route proposals through legal?",
        a: "Yes. Create a separate internal review link from the client link. Annotate and revise. Send the final version when you're ready. Version history tracks every edit.",
      },
    ],
    related: ["brand-activations", "theatrical-performances", "broadcast-tv-film", "conferences", "trade-shows-exhibitions", "weddings-private-events"],
  },

  "theatrical-performances": {
    name: "Theatrical Performances",
    tagline: "Residencies, touring productions, galas",
    description:
      "Theatrical Performances — Broadway runs, off-Broadway limited engagements, regional residencies, gala productions. Cast and crew scheduling, cue notes, understudy tracking, per-house advancing, and compliance-ready audit trails.",
    hero: {
      eyebrow: "Theatrical Performances",
      title: "Eight Shows a Week. Zero Drift.",
      body: "Long-running productions live or die by consistency. Cast changes, understudies, rider tweaks, venue quirks — we keep the canonical production in one place and log every deviation.",
    },
    stats: [
      { value: "8", label: "shows / week" },
      { value: "0", label: "missed cue logs" },
      { value: "1×", label: "rider edit" },
      { value: "100%", label: "understudy coverage" },
    ],
    outcomes: [
      "Per-show rundown with cue notes, blocking revisions, and understudy tracking",
      "Cast pool with availability and conflict detection across shows",
      "Canonical rider with per-venue overrides for touring productions",
      "Equity and union-compliant scheduling with break enforcement",
      "Front-of-house and back-of-house guides per persona",
      "Full audit trail — who changed what, when — for legal and compliance",
    ],
    modules: [
      { name: "Rundown", body: "Per-show cue list, blocking revisions, understudy assignments, version history." },
      { name: "Cast Pool", body: "Availability grid, conflict detection, union-compliant scheduling, day rates." },
      { name: "Advancing", body: "Canonical production scope. Per-venue overrides for touring." },
      { name: "Compliance", body: "Audit log on every change. Union break enforcement. Safety incident reporting." },
    ],
    faqs: [
      {
        q: "Does the platform support Equity-compliant scheduling?",
        a: "Yes. Break rules, 10-out-of-12 limitations, and overtime thresholds are configurable per production. The scheduler refuses assignments that would violate the rules.",
      },
      {
        q: "Can I track understudy coverage?",
        a: "Yes. Each role has a primary and understudy chain. Availability conflicts surface as the schedule is built. Historical coverage is preserved for payroll.",
      },
      {
        q: "How is cue-note revision history handled?",
        a: "Every rundown edit is versioned — who, when, before, after. The stage manager can roll back a bad revision in one click, and the audit log satisfies legal review.",
      },
    ],
    related: ["immersive-experiences", "concerts", "broadcast-tv-film", "venues-arenas", "education-campus"],
  },

  "broadcast-tv-film": {
    name: "Broadcast, TV & Film",
    tagline: "Studio, remote, location-based production",
    description:
      "Broadcast, TV & Film — multi-camera studio broadcasts, remote productions, location shoots, episodic series. Call sheets, day-of logistics, vendor management, union-compliant time tracking, and per-production financial reporting.",
    hero: {
      eyebrow: "Broadcast, TV & Film",
      title: "Prep to Wrap. One Platform.",
      body: "Film and television production carry more moving pieces than any other live format. We run call sheets, day-of logistics, vendor COIs, union payroll, and per-production P&L on one record, so the line producer stays on set, not behind a desk.",
    },
    stats: [
      { value: "120+", label: "crew per shoot day" },
      { value: "6 a.m.", label: "call-sheet delivery" },
      { value: "100%", label: "COI tracking" },
      { value: "0", label: "missed meal penalties" },
    ],
    outcomes: [
      "Call sheets auto-drafted and delivered to cast and crew by 6 a.m.",
      "Union-compliant time tracking with meal penalty enforcement",
      "Vendor COI and W-9 tracking with expiry alerts before they lapse",
      "Per-production P&L, petty cash envelopes, and per-department budgets",
      "Location agreements and clearances tracked with rights windows",
      "Offline time cards work when location has zero bars",
    ],
    modules: [
      {
        name: "Call Sheets",
        body: "Daily call sheets auto-drafted from schedule and crew pool. Delivered via email and portal.",
      },
      {
        name: "Time Tracking",
        body: "Union-compliant clock with meal penalty logic. DGA, IATSE, SAG rules configurable.",
      },
      { name: "Locations", body: "Location library with agreements, rights windows, and contact rolodex." },
      {
        name: "Procurement",
        body: "Purchase orders with receiving. Vendor COI and W-9 on every vendor. Petty cash per department.",
      },
    ],
    faqs: [
      {
        q: "Can the platform handle union-specific rules (DGA, IATSE, SAG, AEA)?",
        a: "Yes. Each production configures its union rule set per department. Time cards validate against the rules at submission. Meal penalties and overtime enforce automatically.",
      },
      {
        q: "How does location clearance work?",
        a: "Each location has a clearance record with rights-holder contact, granted window, and linked agreement. The system warns when a shoot date falls outside a cleared window.",
      },
      {
        q: "Can we integrate with our payroll provider (Cast & Crew, Entertainment Partners)?",
        a: "Yes. Time card exports in the standard formats those providers consume. Two-way sync is Enterprise. Export-only is available on every tier.",
      },
    ],
    related: ["theatrical-performances", "corporate-events", "concerts", "sports-events"],
  },

  "sports-events": {
    name: "Sports Events",
    tagline: "Game days, tournaments, championship weekends",
    description:
      "Game day runs on COMPVSS, the field app your event staff carries today. Crew scheduling by gate and section, credential scans at every checkpoint, one-tap incident reports that reach command in seconds, and a daily log that holds up in the post-game debrief.",
    hero: {
      eyebrow: "Sports Events",
      title: "Game Day Lives on the Field App.",
      body: "A stadium event day is hundreds of staff across dozens of positions with a kickoff that will not wait. COMPVSS puts the schedule, the gate scans, and the incident channel on every worker's phone, and it keeps working when the concourse kills the signal.",
    },
    stats: [
      { value: "< 100ms", label: "credential scan" },
      { value: "1 tap", label: "incident filed" },
      { value: "GPS", label: "verified clock-in" },
      { value: "0", label: "paper sign-in sheets" },
    ],
    outcomes: [
      "Post the game-day schedule by position and gate; crews confirm from their phones",
      "Scan staff credentials at every checkpoint, offline included",
      "File incidents from the stands with photo and GPS attached automatically",
      "Clock in with geo-verification at the employee gate",
      "Check radios and scanners out to workers and back in at wrap",
      "Box-office and settlement reporting arrive with the ATLVS console (coming soon)",
    ],
    modules: [
      {
        name: "Crew Scheduling",
        body: "Shifts by position, gate, and section. Coverage view shows the holes before doors.",
      },
      {
        name: "Gate & Credential Scan",
        body: "Staff credentials scan on any phone. Offline queue reconciles when the device reconnects.",
      },
      {
        name: "Incidents",
        body: "One-tap filing from anywhere in the bowl. Reports route to command with location and photo.",
      },
      {
        name: "Asset Custody",
        body: "Radios, scanners, and keys checked out per worker. The wrap report shows what is still out.",
      },
    ],
    faqs: [
      {
        q: "Does the app work inside a concrete stadium bowl?",
        a: "Yes. COMPVSS is offline-first. Scans, incident reports, and clock punches queue on the device and sync when the phone finds signal again. Nothing is lost in a dead zone.",
      },
      {
        q: "Can staffing agencies and third-party vendors work off the same schedule?",
        a: "Yes. External crews join the project with their own scoped access. They see their shifts and check-in points, and their scans and time punches land in the same record as your house staff.",
      },
      {
        q: "Can we reuse a setup across a whole home season?",
        a: "Yes. Build the event-day template once, then clone it per game and change only what differs. Schedules, checkpoints, and incident routing carry over.",
      },
    ],
    related: ["venues-arenas", "festivals-tours", "broadcast-tv-film"],
  },

  "venues-arenas": {
    name: "Venues & Arenas",
    tagline: "House teams running hundreds of shows a year",
    description:
      "Built for the house team that turns the building over night after night. COMPVSS runs the crew schedule across a heavy calendar, changeover punch lists, recurring inspections, and an incident log scoped per event, all from the phones your staff already carry.",
    hero: {
      eyebrow: "Venues & Arenas",
      title: "Two Hundred Event Days. One House System.",
      body: "A busy building hosts a concert, a game, and a corporate buyout in the same week. COMPVSS keeps the house crew scheduled across all of it and logs every changeover, inspection, and incident against the right event.",
    },
    stats: [
      { value: "24/7", label: "building coverage" },
      { value: "1 tap", label: "punch item logged" },
      { value: "Offline", label: "back-of-house ready" },
      { value: "0", label: "paper checklists" },
    ],
    outcomes: [
      "Schedule the house crew across the full event calendar with coverage gaps visible",
      "Run changeover punch lists with photos; items close before doors",
      "Recurring inspections per room and per system, with a record of every pass",
      "Incident and lost-and-found logs scoped to the event they happened at",
      "Shift handover notes so the night crew knows what the day crew left open",
      "House inventory custody: who has the lift key, and since when",
    ],
    modules: [
      {
        name: "Scheduling & Coverage",
        body: "Calendar-wide crew scheduling with a coverage view per event day. Swaps and confirmations from the phone.",
      },
      {
        name: "Punch Lists",
        body: "Changeover and maintenance punches with photo evidence, assignment, and closure tracking.",
      },
      {
        name: "Inspections",
        body: "Recurring checklists per space. Every completed inspection is timestamped and attributable.",
      },
      {
        name: "Incidents & Lost and Found",
        body: "One log for the building, filtered per event. Lost items tracked from intake to return.",
      },
    ],
    faqs: [
      {
        q: "Can we run multiple events in the building on the same day?",
        a: "Yes. Each event is its own project with its own schedule, checklists, and incident log. The house crew works across all of them from one app, and reports stay separated per event.",
      },
      {
        q: "Can a touring production see our house schedule?",
        a: "Only what you share. Touring and promoter reps can be invited into a single event with scoped access. They never see the rest of your calendar or another promoter's event.",
      },
      {
        q: "How does shift handover work?",
        a: "The outgoing lead logs a handover note against the shift, with open punch items attached. The incoming crew opens the app and sees exactly what is unresolved. No whiteboard required.",
      },
    ],
    related: ["sports-events", "concerts", "theatrical-performances"],
  },

  "trade-shows-exhibitions": {
    name: "Trade Shows & Exhibitions",
    tagline: "Exhibit halls, booth builds, show-floor operations",
    description:
      "Move-in to move-out on one field app. COMPVSS schedules labor calls per hall, runs booth punch lists to zero before show open, scans crew at the dock, and tracks every cart and lift checked out on the floor.",
    hero: {
      eyebrow: "Trade Shows & Exhibitions",
      title: "Move-In to Move-Out, On the Floor.",
      body: "An exhibit hall build is dozens of crews from different companies working the same floor against the same deadline. COMPVSS gives every crew its call time, its punch list, and its dock access from a phone, and gives you the whole floor in one view.",
    },
    stats: [
      { value: "1 tap", label: "booth punch filed" },
      { value: "< 100ms", label: "dock credential scan" },
      { value: "Offline", label: "in the hall, by design" },
      { value: "0", label: "clipboard walk-throughs" },
    ],
    outcomes: [
      "Schedule labor calls per hall and per booth block; crews confirm from their phones",
      "Booth punch lists with photos, assigned and closed before show open",
      "Scan crew credentials at the dock and the floor entrance",
      "Track carts, lifts, and tools checked out to each crew",
      "Daily log per hall for the general contractor record",
      "Exhibitor billing lands with the ATLVS console (coming soon)",
    ],
    modules: [
      {
        name: "Labor Scheduling",
        body: "Calls per hall, per day, per crew. Confirmations and no-shows visible before the shift starts.",
      },
      {
        name: "Punch Lists",
        body: "Per-booth punches with photo evidence. Filter by hall, aisle, or contractor and drive to zero.",
      },
      {
        name: "Dock & Floor Access",
        body: "Credential scan at the dock and the hall doors. Offline queue for the loading bays.",
      },
      {
        name: "Asset Custody",
        body: "Every lift, cart, and tool checked out per crew. Move-out shows what has not come back.",
      },
    ],
    faqs: [
      {
        q: "We are a general contractor with subs from six companies. Can they all work in one system?",
        a: "Yes. Each subcontractor joins the project with scoped access. They see their own calls, punches, and dock windows. You see the whole floor rolled up by hall and by company.",
      },
      {
        q: "Does the app work in the middle of a convention hall?",
        a: "Yes. COMPVSS is offline-first. Punches, scans, and time punches queue on the device and sync when signal returns, which matters when ten thousand exhibitors are sharing one access point.",
      },
      {
        q: "Can we run union labor calls through the platform?",
        a: "Yes. Calls are scheduled per crew with call times, positions, and confirmations. Time punches are geo-verified and export for payroll, and the daily log preserves who worked which hall.",
      },
    ],
    related: ["conferences", "corporate-events", "brand-activations"],
  },

  conferences: {
    name: "Conferences",
    tagline: "Summits, multi-track programs, general sessions",
    description:
      "For the production teams behind multi-track conferences: room turnovers on punch lists, AV crews scheduled per session block, check-in scanning at registration and session doors, and briefings that reach every crew phone before the first keynote.",
    hero: {
      eyebrow: "Conferences",
      title: "Forty Sessions a Day. Every Room Turn Logged.",
      body: "A conference is a production that resets itself every ninety minutes. COMPVSS runs the turn schedule, the room-set punch lists, and the door scans from the phones your crew already carries, so the 2 p.m. breakout looks as sharp as the opening keynote.",
    },
    stats: [
      { value: "1 tap", label: "room punch closed" },
      { value: "< 100ms", label: "badge scan at doors" },
      { value: "GPS", label: "verified crew clock-in" },
      { value: "0", label: "printed run sheets" },
    ],
    outcomes: [
      "Schedule AV and room crews per session block across every track",
      "Room-set punch lists per turnover, with photos, closed before doors open",
      "Scan attendee check-ins at registration and at session doors",
      "Session briefings and day-of guides delivered to every crew phone",
      "Mid-day schedule changes push to affected crews instantly",
      "Incidents filed from any room route straight to the floor manager",
    ],
    modules: [
      {
        name: "Room Turnovers",
        body: "Punch list per turn: set, AV check, signage, reset. Photo evidence and closure tracking per room.",
      },
      {
        name: "Crew Scheduling",
        body: "AV, rigging, and floor crews scheduled per session block. Changes reach the right phones immediately.",
      },
      {
        name: "Check-In Scan",
        body: "Registration and session-door scanning on any phone, with offline queue for crowded ballroom corridors.",
      },
      {
        name: "Briefings & Guides",
        body: "Per-persona day-of guides: crew sees run notes and escalations, staff sees the attendee-facing script.",
      },
    ],
    faqs: [
      {
        q: "How is this different from your Corporate Events coverage?",
        a: "Corporate Events covers the broader client-side program: proposals, stakeholder portals, compliance. Conferences is the production floor itself: session turns, AV crews, door scans, briefings. Many teams use both angles on the same project.",
      },
      {
        q: "Can we handle a campus spread across three hotels?",
        a: "Yes. Locations and rooms are modeled per venue, crews are scheduled per building, and the schedule view shows travel gaps between properties so a crew is never booked in two hotels at once.",
      },
      {
        q: "What happens when the program changes at 11 a.m.?",
        a: "Update the session block once and the change pushes to every affected crew phone. The old time disappears from their schedule, the new one appears, and the turn punch list moves with it.",
      },
    ],
    related: ["corporate-events", "trade-shows-exhibitions", "education-campus"],
  },

  "weddings-private-events": {
    name: "Weddings & Private Events",
    tagline: "High-end private productions, estates, destination builds",
    description:
      "For private-event production companies building tented estates and destination weekends. COMPVSS schedules the build crew day by day, checks vendors in at the gate, walks the punch list before the client walk-through, and keeps a daily log of every build day.",
    hero: {
      eyebrow: "Weddings & Private Events",
      title: "The Client Sees the Room. You See the Punch List.",
      body: "A high-end private build is a week of load-ins on a site with no loading dock and a client walk-through that cannot slip. COMPVSS runs the build schedule, the vendor arrivals, and the final punch from your crew's phones, even where the estate has no signal.",
    },
    stats: [
      { value: "1 tap", label: "punch item filed" },
      { value: "GPS", label: "verified crew clock-in" },
      { value: "Offline", label: "works at remote estates" },
      { value: "0", label: "binder run sheets" },
    ],
    outcomes: [
      "Build-week crew schedules per day and per zone, confirmed from the phone",
      "Vendor arrival check-in at the gate, timestamped against the delivery window",
      "Punch list walk with photos before every client walk-through",
      "Rental custody: what arrived, who has it, what goes back on which truck",
      "Daily log per build day, from first truck to last light focus",
      "Client proposals and invoicing arrive with the ATLVS console (coming soon)",
    ],
    modules: [
      {
        name: "Build Schedule",
        body: "Crew calls per build day and zone. The week view shows every trade's window on the site.",
      },
      {
        name: "Vendor Check-In",
        body: "Every arrival scanned at the gate. Late deliveries are visible the moment the window passes.",
      },
      {
        name: "Punch Lists",
        body: "Photo punches per zone, assigned to a crew, closed before the client walks the room.",
      },
      {
        name: "Daily Logs",
        body: "One log per build day: weather, arrivals, progress, issues. The record your team wishes it had kept.",
      },
    ],
    faqs: [
      {
        q: "Our clients expect discretion. Who can see event data?",
        a: "Only the people you invite, at the access level you give them. Each event is walled off, external vendors see only their own scope, and the audit log records every view and change.",
      },
      {
        q: "Does this work at a remote estate with no cell coverage?",
        a: "Yes. COMPVSS is offline-first. Check-ins, punches, and time punches queue on the device and sync when crews get back into coverage. The build does not pause for the signal.",
      },
      {
        q: "We are a twelve-person company. Is this built for teams our size?",
        a: "Yes. Most private-event production companies run lean and hire in per build. The core team lives in the app, and per-event crew and vendors join with scoped access for just that project.",
      },
    ],
    related: ["corporate-events", "live-events", "brand-activations"],
  },

  "government-municipal": {
    name: "Government & Municipal",
    tagline: "Civic events, public festivals, emergency coordination",
    description:
      "For city event offices, parks departments, and the agencies behind public festivals. COMPVSS schedules staff and volunteers per zone, tracks permits against the event record, files incidents with time and location for the after-action report, and puts emergency procedures on every worker's phone.",
    hero: {
      eyebrow: "Government & Municipal",
      title: "A Public Event Is a Public Record.",
      body: "A street festival answers to more agencies than any private show: permits, public safety, after-action review. COMPVSS documents the operation as it happens, from volunteer check-in to the last incident report, so the record writes itself.",
    },
    stats: [
      { value: "1 tap", label: "incident documented" },
      { value: "GPS", label: "on every field report" },
      { value: "Offline", label: "works on the parade route" },
      { value: "100%", label: "of changes in the audit log" },
    ],
    outcomes: [
      "Schedule staff and volunteers per zone with check-in at the perimeter",
      "Permit records tracked against the event, visible to every lead",
      "Incident reports carry timestamp, GPS, photo, and reporter for the after-action file",
      "Emergency procedures published to every worker's phone before gates",
      "Daily logs that stand up as the operational record",
      "Every change lands in an immutable audit log, exportable for records requests",
    ],
    modules: [
      {
        name: "Staff & Volunteer Scheduling",
        body: "Zone-based shifts for employees and volunteers alike, with confirmations and coverage view.",
      },
      {
        name: "Permits",
        body: "Permit register tied to the event: issuer, window, conditions, and expiry visible to every lead.",
      },
      {
        name: "Incidents",
        body: "Field reports with automatic time, location, and photo capture. Routing per severity and zone.",
      },
      {
        name: "Emergency Guides",
        body: "Evacuation routes, contact trees, and procedures delivered per role. Updated once, current everywhere.",
      },
    ],
    faqs: [
      {
        q: "Can volunteers who are not city employees use the app?",
        a: "Yes. Volunteers join the event with scoped access: their shift, their zone, their check-in, and the emergency guide. They never touch staff scheduling or internal records.",
      },
      {
        q: "Will the records satisfy an after-action review or a records request?",
        a: "The operational record is built for exactly that. Incident reports carry timestamp, GPS, photo, and reporter. Every change is in an immutable audit log, and logs export cleanly.",
      },
      {
        q: "Can we pilot this on a single event before a wider procurement?",
        a: "Yes. Most agencies start with one festival or one season. A single-event pilot exercises the full system, and the data carries forward if you expand. Contact us about procurement paperwork; we have done it before.",
      },
    ],
    related: ["festivals-tours", "sports-events", "education-campus"],
  },

  "education-campus": {
    name: "Education & Campus",
    tagline: "University events, campus productions, student crews",
    description:
      "For campus events offices and student production crews: commencement, orientation week, athletics support, performing arts. COMPVSS schedules student workers around class blocks, verifies clock-ins at venues across campus, and turns the day-of guide into training a first-timer can follow.",
    hero: {
      eyebrow: "Education & Campus",
      title: "Your Crew Graduates Every Four Years.",
      body: "A campus events office rebuilds its workforce every semester. COMPVSS gives student crews a schedule on their phone, a guide that teaches the job, and a clock-in that proves they showed up, so institutional knowledge stops walking out at commencement.",
    },
    stats: [
      { value: "GPS", label: "verified clock-in, campus-wide" },
      { value: "1 tap", label: "incident to campus safety" },
      { value: "Offline", label: "works in the field house" },
      { value: "0", label: "paper timesheets" },
    ],
    outcomes: [
      "Schedule student crews around class blocks, with swaps handled in the app",
      "Geo-verified clock-in at venues across campus",
      "Day-of guides double as training for first-time crew members",
      "Incident reports route to campus safety with location attached",
      "Equipment checkout from the campus inventory, tracked per student",
      "Room-turn punch lists for the spaces that host four events a day",
    ],
    modules: [
      {
        name: "Student Crew Scheduling",
        body: "Shifts that respect class schedules. Swap requests and confirmations happen in the app.",
      },
      {
        name: "Time & Attendance",
        body: "Geo-verified punches at every campus venue. Timesheets export for student payroll.",
      },
      {
        name: "Asset Checkout",
        body: "Cameras, radios, and AV gear checked out per student. End of semester shows what is still out.",
      },
      {
        name: "Guides",
        body: "Per-role day-of guides written once, reused every semester. The training is in the pocket.",
      },
    ],
    faqs: [
      {
        q: "Half our crew is new every semester. How fast can they start?",
        a: "A student joins from an invite, sees their shifts, and reads the role guide on their phone. Most crews are working their first event the same week. The guide carries the training load a veteran used to.",
      },
      {
        q: "Can we run many small events at once across campus?",
        a: "Yes. Each event is its own project with its own schedule and log. One office view rolls up coverage across every venue, from the black box theater to the field house.",
      },
      {
        q: "How do student hours get to payroll?",
        a: "Punches are geo-verified per venue, supervisors approve timesheets in the app, and approved hours export in formats campus payroll systems accept. No paper cards to chase down at month end.",
      },
    ],
    related: ["conferences", "government-municipal", "theatrical-performances"],
  },
};
