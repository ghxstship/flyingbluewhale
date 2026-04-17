export type MarketingGuide = {
  slug: string;
  title: string;
  blurb: string;
  hero: string;
  tldr: string;
  keywords: string[];
  readingTime: string;
  sections: Array<{
    heading: string;
    body: string[];
    list?: string[];
  }>;
  faqs: Array<{ q: string; a: string }>;
};

export const MARKETING_GUIDES: Record<string, MarketingGuide> = {
  "event-advancing": {
    slug: "event-advancing",
    title: "Event advancing: what it is, how it works, and how not to do it in email",
    blurb:
      "A complete primer on event advancing — the 16 standard deliverables, who owns each, and the workflow that keeps shows from falling apart the week before load-in.",
    hero:
      "Advancing is the process of confirming, in writing, every detail about a show before it happens. It is the most consequential two weeks of any production, and the single biggest driver of show-day quality. Here's how to do it without losing your mind in email threads.",
    tldr:
      "Advancing = the set of typed deliverables (tech rider, hospitality, ground, hotel, stage plot, input list, COI, credentials, etc.) confirmed between promoter, venue, artist team, and production before load-in. Doing it in typed rows beats email threads on every dimension that matters.",
    keywords: [
      "event advancing",
      "show advancing",
      "tour advancing",
      "advancing workflow",
      "advancing deliverables",
      "production advancing",
      "artist advancing",
    ],
    readingTime: "12 min read",
    sections: [
      {
        heading: "What advancing actually is",
        body: [
          "Advancing is the production-side process of confirming every material detail about an upcoming show in writing, with a paper trail. It runs typically 2–6 weeks before the show date. It involves the promoter (or tour manager), the venue, the artist's technical team, and the house production crew.",
          "The output of advancing is a set of typed deliverables — documents and data points — that together define what the show will be. The show then executes against that spec.",
        ],
      },
      {
        heading: "The 16 standard deliverables",
        body: [
          "Most shows reduce to some subset of these. A touring artist will hit all 16. A local corporate activation might hit six. But the taxonomy is stable — if you model your advancing around these types, you'll rarely be surprised.",
        ],
        list: [
          "Tech rider — the artist's production requirements (audio, lighting, backline, stage dimensions)",
          "Hospitality rider — dressing rooms, food, beverages, per-person needs",
          "Ground transport — airport pickups, show-day runs, driver schedule",
          "Hotel block — room count, check-in dates, payment responsibility",
          "Stage plot — physical layout of instruments, mics, monitors",
          "Input list — the audio engineer's input-to-channel mapping",
          "Insurance certificate — COI naming the venue as additional insured",
          "Credentials list — who gets what level pass (AAA, VIP, crew, vendor, guest)",
          "Parking pass allocation — trucks, buses, crew vehicles",
          "Load-in / load-out schedule — minute-by-minute",
          "Runner schedule — any off-site errands crew will handle",
          "Merch settlement — vendor assignment, payment terms, table location",
          "Security plan — venue-specific, with artist-specific additions",
          "Emergency plan — weather call, medical, evacuation",
          "Payment advance — any deposits, wire instructions, settlement method",
          "Post-show deliverables — filed insurance, returned gear, settlement docs",
        ],
      },
      {
        heading: "Why email threads are the wrong medium",
        body: [
          "Email has no status. You can't look at a thread and know 'is this confirmed or still pending?' without reading every reply.",
          "Email has no typing. The tech rider lives in a PDF attachment somewhere in the middle of the thread; the hospitality is further up; the ground transport is in a Google Doc link.",
          "Email has no history you can trust. Replies get forwarded, edited, lost. Proving what was agreed by what date requires archaeology.",
          "Email has no role scoping. The tour manager, production manager, venue rep, catering, and artist are all on a single thread — or scattered across five threads — and nobody has the full picture.",
        ],
      },
      {
        heading: "A better workflow",
        body: [
          "Treat advancing as a set of rows in a database, not a set of messages in inboxes. Each deliverable has an owner, a due date, a status, a file (if applicable), and a history of every change.",
          "Assign each deliverable to a specific person. Track status: draft → sent → received → approved → complete. Every transition writes a history row with actor, timestamp, and note.",
          "External parties (artist techs, venue reps, vendors) see their deliverables in a scoped portal — not the whole advancing stack. Hotel doesn't need to see the input list. The input engineer doesn't need to see the per diems.",
        ],
      },
      {
        heading: "The overdue dashboard",
        body: [
          "Your advancing system's most valuable single view is 'what's slipping.' A simple sort: deliverables with status ≠ complete, grouped by show, sorted by show date.",
          "This is the morning standup artifact. Every day, two weeks before every show, the production manager looks at this and triages. Nothing else is needed.",
        ],
      },
      {
        heading: "How flyingbluewhale handles advancing",
        body: [
          "Every project in flyingbluewhale has a deliverables module with the 16 standard types available out of the box. You can add custom types per org.",
          "Each deliverable has a status workflow, comments (threaded), file attachments stored in Supabase Storage, and a full deliverable_history row per state change.",
          "Artists and vendors see only the deliverables assigned to them, via GVTEWAY portals. They can upload responses, mark their end complete, and comment — all writing back into the shared history.",
          "Read more at /solutions/atlvs or /features/advancing.",
        ],
      },
    ],
    faqs: [
      {
        q: "Who owns advancing — tour manager or production manager?",
        a: "Depends on the show. For a touring artist, the tour manager drives advancing and the production manager (house side) responds. For a promoter-produced event, the production manager drives and the artist's team responds. Either way, typed deliverables with clear owners beat ambiguous threads.",
      },
      {
        q: "How far in advance should advancing start?",
        a: "Start 6 weeks out for major festivals and tours. 4 weeks for mid-size shows. 2 weeks for small club dates or corporate activations. Earlier is always better; advancing quality doesn't improve in the final week, it just gets more chaotic.",
      },
      {
        q: "What if the artist team won't respond to advancing?",
        a: "Escalate to the booking agent. If advancing isn't back 72 hours out, flag it to legal on the contract. Non-response to advancing is a contract violation more often than people realize — and having the typed deliverable record means you have the receipts.",
      },
    ],
  },

  "what-is-kbyg": {
    slug: "what-is-kbyg",
    title: "KBYG (Know Before You Go): what it is, why it matters, and why PDFs aren't enough",
    blurb:
      "Know Before You Go is the pre-show information packet that every stakeholder needs. Here's what goes in it — and why a role-scoped KBYG beats a PDF on every show of meaningful size.",
    hero:
      "KBYG stands for Know Before You Go. It's the packet of information every stakeholder needs before they arrive at a show — where to park, when to load in, what to bring, who to contact, what the weather call is. Done right, it prevents 80% of the show-day questions that otherwise hit the production radio.",
    tldr:
      "KBYG = pre-show info packet per role. A guest's KBYG is different from a crew member's KBYG is different from a vendor's KBYG. PDFs can't handle that; role-scoped digital guides can.",
    keywords: [
      "KBYG",
      "know before you go",
      "event guide",
      "boarding pass event",
      "event information packet",
      "pre-show information",
    ],
    readingTime: "8 min read",
    sections: [
      {
        heading: "The origin of KBYG",
        body: [
          "KBYG is borrowed from aviation — 'know before you fly' — and adapted to live events. Early festival KBYGs were single-page PDFs with the schedule, map, and a few FAQs.",
          "Modern KBYG expects more. Six or more distinct personas need tailored information: guests, VIPs, artists, crew, vendors, sponsors, press. A single PDF either bloats (information overload) or under-serves (missing key details for a specific persona).",
        ],
      },
      {
        heading: "What belongs in a KBYG",
        body: [
          "The canonical KBYG sections are well-established — every big festival has them. A good digital KBYG supports the full taxonomy and scopes which ones appear per persona.",
        ],
        list: [
          "Overview — the show summary, dates, venue, key contacts",
          "Schedule — doors, set times, load-in/out windows",
          "Set times — detailed, per stage, by day",
          "Timeline — minute-by-minute for the day of",
          "Credentials — who gets what type of pass, where to pick up",
          "Contacts — production, security, medical, transportation leads",
          "FAQ — persona-specific common questions",
          "SOPs — standard operating procedures for crew",
          "PPE — required personal protective equipment",
          "Radio — channel allocations for comms",
          "Resources — links, documents, maps",
          "Evacuation — emergency exits, muster points",
          "Fire safety — extinguisher locations, no-flame zones",
          "Accessibility — ADA parking, viewing areas, services",
          "Sustainability — waste, water stations, environmental initiatives",
          "Code of conduct — behavior expectations, reporting",
        ],
      },
      {
        heading: "Why role-scoping matters",
        body: [
          "A guest doesn't need radio channels. A crew member doesn't need ADA parking information. A sponsor needs to know where the activation tent is, not where the artist dressing rooms are.",
          "If you send one KBYG to everyone, you overwhelm most and under-serve some. If you send three KBYGs, you spend the morning of show day explaining which one is current.",
          "Role-scoped digital KBYG solves this: one canonical source, one CMS entry per project × persona, rendered appropriately for each viewer.",
        ],
      },
      {
        heading: "The Boarding Pass pattern",
        body: [
          "The Boarding Pass pattern — popularized by Black Coffee's 2025 tour KBYG (github.com/ghxstship/boardingpass) — treats the KBYG as an interactive, role-scoped, mobile-first website rather than a PDF.",
          "Key innovations: tier 1–5 classification banners for venue zones, role-specific timelines, embedded radio channel allocations, offline-accessible on the crew phone.",
          "flyingbluewhale adopts this pattern as the event guides module. One authoring flow in ATLVS CMS; six persona renders on portal + mobile, shared by <GuideView>. See /solutions/atlvs#guides.",
        ],
      },
      {
        heading: "Publish once, update anywhere",
        body: [
          "A PDF KBYG is frozen at the moment you export it. If the weather changes the load-in, you generate a new PDF, re-upload it, hope everyone refreshes — they won't.",
          "A database-backed KBYG updates in place. The version published at /p/[slug]/guide is always current. Service-worker caching ensures the crew phone has the latest version next time it reconnects.",
        ],
      },
    ],
    faqs: [
      {
        q: "How is a KBYG different from a run-of-show document?",
        a: "KBYG is stakeholder-facing, sent before the event. Run-of-show is production-facing, used during the event. They share data (schedule, contacts, timeline) but are rendered differently. In flyingbluewhale, both derive from the same underlying project data.",
      },
      {
        q: "Do we need a designer to make a KBYG look good?",
        a: "Not with a CMS-backed system. The sections render consistently across projects; branding tokens (logo, accent color, OG image) are per-project. The design work is one-time, not per-show.",
      },
      {
        q: "Can external partners see the KBYG without signing up?",
        a: "Yes. Published guides in flyingbluewhale are readable by anonymous viewers via a targeted RLS policy. Share the URL; your guest is reading it seconds later. No login required.",
      },
    ],
  },

  "production-ops-101": {
    slug: "production-ops-101",
    title: "Production Ops 101: the operating system every show needs",
    blurb:
      "A complete breakdown of what production operations actually covers, the standard roles, the standard tools, and the modern consolidation thesis.",
    hero:
      "Production ops is the invisible infrastructure of every event. Done well, nobody notices. Done poorly, everybody does. This is a complete primer on what it covers and how teams are consolidating the tool stack in 2026.",
    tldr:
      "Production ops = projects + advancing + finance + procurement + production + people + stakeholder comms + show-day execution. In 2026, most teams stop duct-taping 8 tools and consolidate onto a single production platform.",
    keywords: [
      "production operations",
      "event production ops",
      "production management",
      "event operations 101",
      "production ops platform",
    ],
    readingTime: "15 min read",
    sections: [
      {
        heading: "What production ops actually covers",
        body: [
          "Production ops is the set of disciplines that make a show happen on time, on budget, and safely. It is operationally distinct from creative direction (what the show is) and from artist/talent relations (who is on it) — though it touches both.",
          "It spans 7–8 functional areas. Any production team of meaningful size has someone owning each. The question is whether they're all coordinated on one platform or scattered across eight.",
        ],
      },
      {
        heading: "The functional map",
        body: [
          "In no particular order, these are the areas every production org needs to cover. Your titles will vary; the functions are stable.",
        ],
        list: [
          "Projects — the shows themselves, with dates, venues, milestones",
          "Advancing — the 16 typed deliverables per show (see /guides/event-advancing)",
          "Finance — budgets, invoices, expenses, advances, settlements",
          "Procurement — vendor management, POs, COI / W-9, payouts",
          "Production — equipment, rentals, fabrication, dispatch",
          "People — crew, credentials, scheduling, payroll",
          "Stakeholder comms — portals, KBYG, updates (see /guides/what-is-kbyg)",
          "Show-day execution — ticketing, clock-in, inventory, incident response",
        ],
      },
      {
        heading: "The tool sprawl problem",
        body: [
          "Most production orgs run 8–12 separate tools. A typical stack:",
          "",
          "Asana or Monday for projects. Notion for the wiki. Google Sheets for budgets. QuickBooks for accounting. DocuSign for contracts. Eventbrite or Ticketmaster for tickets. Some custom portal for clients. A separate check-in app for the gate. Slack for internal. Email for external. Each tool solves one problem and introduces three seams.",
          "",
          "The seams leak money. Data gets re-entered. Status drifts. People drop through the cracks between tools. A 10-person team can spend 2 FTE just on integration glue.",
        ],
      },
      {
        heading: "The consolidation thesis",
        body: [
          "The shift in 2026 is away from best-of-breed point tools and toward integrated production platforms.",
          "The argument: production data is deeply interconnected. A vendor PO depends on a project budget depends on a client-accepted proposal depends on advancing deliverables depends on a show schedule. If these live in one database, reporting is trivial. If they live in eight, reporting is a full-time job.",
          "flyingbluewhale is the explicit consolidation play. One Postgres schema, one auth, one set of RLS rules, three shells (ATLVS internal, GVTEWAY external, COMPVSS mobile). See /about for the thesis in detail.",
        ],
      },
      {
        heading: "The ops cadence",
        body: [
          "Regardless of tools, every mature production org runs on a cadence. Here's the default weekly rhythm for an active season:",
        ],
        list: [
          "Monday standup — what shipped last week, what's this week, what's slipping",
          "Wednesday finance review — AR/AP, budgets vs actuals, outstanding invoices",
          "Friday advancing review — all shows 2–6 weeks out, status of every deliverable",
          "Daily during show week — morning brief 9am, end-of-day debrief 11pm",
          "Post-show — debrief within 72 hours, lessons back into templates",
        ],
      },
      {
        heading: "What a mature production ops setup looks like",
        body: [
          "You can tell a mature ops org from the outside because nothing is chaotic in the week of a show. Load-in runs on schedule. Advancing is closed 72 hours out. Crew know where to be. Vendors have been paid. Client signatures are filed.",
          "Inside, the mature org has typed primitives for every recurring activity. Deliverables aren't documents in an email thread; they're rows with owners and statuses. Budgets aren't spreadsheets; they're live queries against expenses. KBYG isn't a PDF; it's a role-scoped rendered page.",
        ],
      },
      {
        heading: "How to get there",
        body: [
          "If you're starting from spreadsheets, read /compare/spreadsheets.",
          "If you're starting from Asana or Monday, read /compare/asana or /compare/monday.",
          "If you're already on a production platform and it isn't working, there may be a fit here. Start free at /signup or book a demo at /contact.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is production ops the same as project management?",
        a: "Overlapping but distinct. Project management is a component of production ops (the 'projects' function). Production ops additionally covers finance, procurement, people, show-day execution, and stakeholder comms. A project manager who doesn't touch finance is not doing production ops — they're doing project management within a production org.",
      },
      {
        q: "How many people do you need to run production ops?",
        a: "Depends on show count. Rule of thumb: 1 FTE per 15–20 shows/year, plus a production manager anchor. A 40-show/year agency is a 3-person ops team plus contract freelancers. This scales sublinearly with good tooling.",
      },
      {
        q: "What's the single biggest ops mistake production teams make?",
        a: "Treating advancing as an email workflow. It's the single most consequential two weeks of any show, and it gets done in inboxes. Move it to typed rows and you'll see show quality go up within one season.",
      },
    ],
  },
};

export const MARKETING_GUIDE_LIST = Object.values(MARKETING_GUIDES);
