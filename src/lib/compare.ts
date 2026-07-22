// Voice-canon note (E-28): docs/brand/voice.md bans competitor comparison in
// product and primary-narrative copy, with an explicit carve-out for the
// bottom-of-funnel SEO surfaces this file powers (/compare/* and
// /alternatives/*). Keep every claim factual, keep the "whenTheyWin" section
// honest, and never let these names leak into any other surface.
export type CompareConfig = {
  slug: string;
  competitor: string;
  headline: string;
  blurb: string;
  hero: string;
  bottomLine: string;
  features: Array<{ feature: string; us: string | boolean; them: string | boolean; note?: string }>;
  whyWeWin: Array<{ title: string; body: string }>;
  whenTheyWin: string[];
  quote?: { text: string; attribution: string };
  migration: string[];
  faqs: Array<{ q: string; a: string }>;
  keywords: string[];
  /** Comparison category for hub grouping. Legacy entries default to
   *  "production" at read time; new entries declare theirs. */
  category?: "production" | "workforce" | "ticketing" | "work-os";
  /** ISO date the claims on this page were last checked against the
   *  competitor's public docs/pricing. The verification guard
   *  (comparison-verification.test.ts) fails CI when this goes stale
   *  (>180 days). Required on EVERY entry as of the P4 backfill
   *  (2026-07-22); the guard's legacy pin is 0. */
  lastVerified?: string;
  /** Public sources (docs/pricing URLs) the claims derive from. Unbiased by
   *  construction: no cell in `features` may assert something about the
   *  competitor that these pages don't state. */
  sources?: string[];
};

export const COMPARE: Record<string, CompareConfig> = {
  // P4 note: the former "onstage" entry was REMOVED in the 2026-07-22 backfill.
  // No identifiable vendor or public pages exist to source its claims, and the
  // honesty discipline (lastVerified + sources on every entry) cannot hold for
  // an unverifiable competitor. Do not reintroduce without real public sources.
  // Live-events-native roster (listed first — the tools a producer actually
  // shortlists): Lasso (crew/ops back office), Lennd (credential advance),
  // Prism.fm (booking & settlement). Source: ATLVS Ecosystem kit handoff.
  lasso: {
    slug: "lasso",
    competitor: "Lasso",
    lastVerified: "2026-07-22",
    sources: ["https://www.lasso.io/crew-management/", "https://www.lasso.io/pricing/"],
    headline: "ATLVS Technologies vs. Lasso: production ecosystem vs. crew & ops back office.",
    blurb:
      "Lasso is a strong back office for staffing and AV companies — scheduling, time, gear, payroll, and a crew marketplace. It stops where the audience begins. ATLVS runs that back office plus the advance, the public marketplace, and the knowledge that outlives the show.",
    hero: "Lasso is built around the people and equipment a company sends to a job: bulk crew calls, time tracking, travel, warehouse gear flow, payroll, and an AI layer over the top. It is excellent at that. What it does not model is the production itself — riders and stage plots, the credential advance, a public-facing marketplace where the rooms get booked, and a knowledge base that survives the season. Those are first-class in ATLVS.",
    bottomLine:
      "If your product is sending crew and gear to a gig, Lasso runs that desk well. If your product is the show, ATLVS runs the whole arc — and the crew desk is one app inside it.",
    features: [
      { feature: "Crew scheduling, time tracking, travel", us: true, them: true },
      {
        feature: "Gear / inventory / warehouse logistics",
        us: "Production-side",
        them: true,
        note: "Lasso's core strength",
      },
      { feature: "Payroll + financial management", us: true, them: true },
      { feature: "Production advancing (riders, stage plots, RFIs)", us: true, them: "Not published" },
      { feature: "Credentials, passes, accreditation", us: true, them: "Not published" },
      { feature: "Offline gate scan (sub-100ms atomic)", us: true, them: "Not published" },
      {
        feature: "Public marketplace (tickets, talent, gigs, RFPs)",
        us: true,
        them: false,
        note: "Lasso has no audience-facing surface",
      },
      { feature: "Interactive proposals → live project on accept", us: true, them: "Quotes only" },
      { feature: "Knowledge base · LMS · certifications", us: true, them: false },
      {
        feature: "Aurora AI grounded in workspace",
        us: true,
        them: "Lasso Intelligence",
        note: "Lasso publishes an AI layer (Lasso Intelligence)",
      },
      { feature: "Per-org pricing, unlimited users", us: true, them: "Not published" },
      { feature: "One record store: office · field · public · knowledge", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "The audience side ships native",
        body: "GVTEWAY is a public marketplace — ticket discovery, talent, gigs, RFPs. Lasso ends at the company's own crew and gear; it never faces the guest.",
      },
      {
        title: "Advance, not just assignment",
        body: "Riders, stage plots, input lists, RFIs and submittals are typed primitives. Lasso schedules the people; ATLVS runs the production those people show up to build.",
      },
      {
        title: "Stakeholders aren't seats",
        body: "Per-org pricing means artists, vendors and clients open scoped slug URLs for free. Lasso pricing scales with the org you have to quote for.",
      },
      {
        title: "Knowledge that outlives the show",
        body: "LEG3ND keeps courses, certifications and SOPs on the same record. Nothing walks out the door after wrap — Lasso has no equivalent.",
      },
    ],
    whenTheyWin: [
      "You are primarily an equipment-rental or labor-staffing shop and your product is the warehouse and the crew desk. Lasso's gear and labor tooling is deep and purpose-fit.",
      "You need Lasso's crew marketplace to source local freelance labor at volume. Keep that desk on Lasso and run the production on ATLVS.",
    ],
    migration: [
      "Export Lasso crew, schedules and gear lists as CSV → maps to COMPVSS crew, shifts and production catalog",
      "Financial records (quotes, invoices) port into ATLVS finance + procurement",
      "Most rental/staffing shops keep Lasso on the gear-and-labor desk and run advancing, finance and the public side on ATLVS",
    ],
    faqs: [
      {
        q: "Is ATLVS a Lasso replacement?",
        a: "For the production org, yes — advancing, finance, field ops, the public marketplace and knowledge live on one manifest. For a pure equipment-rental or staffing shop whose product is the warehouse and the crew desk, Lasso's gear and labor tooling is deeper; many teams run both and sync.",
      },
      {
        q: "Does ATLVS do crew scheduling and time like Lasso?",
        a: "Yes. COMPVSS is the offline-first field app — clock-in, shifts, time tracking and the crew channel, built for deskless venue teams. It reads from the same record store as advancing and finance, so there is nothing to reconcile between systems.",
      },
      {
        q: "What about a crew marketplace for local labor?",
        a: "GVTEWAY covers talent, gigs and RFPs on the public side. If you depend on Lasso's specific freelance labor pool, keep that desk and webhook bookings into ATLVS.",
      },
    ],
    keywords: [
      "Lasso alternative",
      "Lasso.io alternative events",
      "ATLVS vs Lasso",
      "event production software vs Lasso",
      "crew management plus production",
    ],
  },

  lennd: {
    slug: "lennd",
    competitor: "Lennd",
    lastVerified: "2026-07-22",
    sources: ["https://www.lenndapp.com/features/event-credentials", "https://www.lenndapp.com/pricing"],
    headline: "ATLVS Technologies vs. Lennd: production ecosystem vs. credential advance portal.",
    blurb:
      "Lennd is the credential and advance portal big festivals lean on — onboarding, passes, catering and asset requests, scoped portals. ATLVS does the credential advance and the finance, the field gate, the public marketplace, and the record that outlives the show.",
    hero: "Lennd is excellent at the people-and-paperwork advance: phased credentialing, vendor and group onboarding, catering and asset requests, multi-level approvals, and a custom portal for every constituent. For festivals with thousands of names to collect, it earns its place. What sits outside it is the rest of the production — finance and procurement, an offline gate that scans at 15k, a public marketplace, and a knowledge layer — all of which are first-class in ATLVS.",
    bottomLine:
      "If you only need to onboard people and issue passes, Lennd does that cleanly. If credentials are one workflow inside a whole production, ATLVS runs the advance and everything downstream on one manifest.",
    features: [
      { feature: "Credentials, passes, accreditation", us: true, them: true, note: "Lennd's core strength" },
      { feature: "Vendor / group onboarding + scoped portals", us: true, them: true },
      { feature: "Catering & asset requests with approvals", us: true, them: true },
      {
        feature: "Production advancing (riders, stage plots, RFIs)",
        us: true,
        them: "Partial",
        note: "Lennd publishes credential, catering and asset advancing",
      },
      { feature: "Finance: budgets, invoices, procurement, payouts", us: true, them: false },
      { feature: "Crew ops in the field (clock-in, shifts, offline)", us: true, them: false },
      { feature: "Offline gate scan (sub-100ms atomic)", us: true, them: "Not published" },
      { feature: "Public marketplace (tickets, talent, gigs, RFPs)", us: true, them: false },
      { feature: "Interactive proposals → live project on accept", us: true, them: false },
      { feature: "Knowledge base · LMS · certifications", us: true, them: false },
      { feature: "Per-org pricing, unlimited users", us: true, them: false },
      { feature: "One record store: office · field · public · knowledge", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Credentials are a module, not the platform",
        body: "ATLVS runs the credential advance — and the finance, procurement, field gate and public side it feeds. Lennd onboards the people; the rest of the show lives in other tools.",
      },
      {
        title: "Finance ships native",
        body: "Budgets, invoices, vendor COIs and Stripe Connect payouts are first-class. Lennd has no finance primitives — that reconciliation happens somewhere else.",
      },
      {
        title: "The gate and the field",
        body: "COMPVSS is an offline-first PWA with sub-100ms atomic gate scan and crew clock-in. Lennd's check-in is portal-led, not a festival-gate field tool.",
      },
      {
        title: "The audience and the archive",
        body: "GVTEWAY faces the public; LEG3ND keeps the knowledge. Lennd stops at the operational advance for the team running the event.",
      },
    ],
    whenTheyWin: [
      "You need only credential, catering and asset advancing, and your finance and ticketing already live in dedicated systems you are happy with.",
      "Your festival has a deeply tuned Lennd advance and the switching cost on credentials alone outweighs the consolidation. Run credentials on Lennd, downstream on ATLVS, and sync.",
    ],
    migration: [
      "Export Lennd people, groups and credential records as CSV → maps to ATLVS credentials + stakeholder portals",
      "Catering and asset requests port into procurement and production modules",
      "Most festivals move the advance plus finance, gate and public side onto ATLVS and retire the second system over a season",
    ],
    faqs: [
      {
        q: "Can ATLVS handle phased credentialing like Lennd?",
        a: "Yes — requests, counts, multi-level approvals, passes, wristbands and RFID, with scoped portals for every vendor and group. The difference is that the credential advance shares a record store with finance, the gate and the public side, so there is no second system to reconcile.",
      },
      {
        q: "Do external groups need a seat?",
        a: "No. Vendors, artists and sponsors open a scoped slug URL under per-org pricing — the same portal model Lennd is known for, without per-user cost as your constituent count grows.",
      },
    ],
    keywords: [
      "Lennd alternative",
      "ATLVS vs Lennd",
      "festival credential software alternative",
      "credential management plus production",
      "Lennd alternative festivals",
    ],
  },

  "prism-fm": {
    slug: "prism-fm",
    competitor: "Prism.fm",
    lastVerified: "2026-07-22",
    sources: ["https://prism.fm/product/", "https://prism.fm/why-prism-for-venues-and-promoters/"],
    headline: "ATLVS Technologies vs. Prism.fm: production ecosystem vs. booking & settlement desk.",
    blurb:
      "Prism is the booking calendar and settlement desk for music venues and promoters — holds, offers, co-pro splits, show P&L. ATLVS covers booking through settlement and the production that happens between the offer and the payout.",
    hero: "Prism is purpose-built for the deal and the payout: a hold-to-confirm calendar, fast offer generation, co-promotion and percentage math, contracts, and show-by-show P&L. For a venue or promoter whose product is the calendar and the settlement, it is sharp. What lives between the offer and the payout — advancing, crew, the credential gate, and the audience — is where ATLVS runs.",
    bottomLine:
      "Prism for the calendar and the settlement. ATLVS for booking through settlement and the entire production in the middle — advancing, the field, the gate, and the public.",
    features: [
      { feature: "Booking calendar: holds, offers, confirms", us: true, them: true, note: "Prism's core strength" },
      { feature: "Settlement, co-pro splits, show P&L", us: true, them: true },
      { feature: "Contracts + offer generation", us: true, them: true },
      { feature: "Production advancing (riders, stage plots, RFIs)", us: true, them: false },
      { feature: "Crew ops in the field (clock-in, shifts, offline)", us: true, them: false },
      { feature: "Credentials & accreditation", us: true, them: false },
      { feature: "Offline gate scan (sub-100ms atomic)", us: true, them: false },
      { feature: "Procurement, vendor COIs, Stripe Connect payouts", us: true, them: "Settlement-side" },
      { feature: "Public marketplace (tickets, talent, gigs, RFPs)", us: true, them: false },
      { feature: "Knowledge base · LMS · certifications", us: true, them: false },
      { feature: "Per-org pricing, unlimited users", us: true, them: false },
      { feature: "One record store: office · field · public · knowledge", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Everything between offer and payout",
        body: "Prism brackets the show with the offer and the settlement. ATLVS runs the production in between — advancing, crew, procurement, the gate — on the same record the deal lives on.",
      },
      {
        title: "The field and the gate",
        body: "COMPVSS scans at the gate offline and runs crew clock-in. Prism is a booking and finance surface; it does not go to the field.",
      },
      {
        title: "The audience side",
        body: "GVTEWAY is a public marketplace — discovery, talent, gigs, RFPs. Prism faces the venue's booking team, not the guest.",
      },
      {
        title: "One org, every line of work",
        body: "Festivals, activations, fabrication and broadcast share one platform. Prism is tuned for the music-venue calendar specifically.",
      },
    ],
    whenTheyWin: [
      "Your product is the booking calendar and the settlement, and production is handled by the touring or building side. Prism's music-industry deal math (radius clauses, co-pro splits, hold periods) is deep.",
      "You run a single music room or a promoter desk where holds, offers and settlement are 90% of the job and there is little production advance to track.",
    ],
    migration: [
      "Export Prism shows, offers and settlement records as CSV → maps to ATLVS booking, finance and ROS",
      "Confirmed dates sync into ATLVS via webhook so the production advance opens the moment a hold converts",
      "Most venues keep Prism on the booking desk during transition and run advancing, the gate and the public side on ATLVS",
    ],
    faqs: [
      {
        q: "Does ATLVS do holds, offers and settlement like Prism?",
        a: "Yes — booking calendar with holds and confirms, offer generation, contracts and show P&L through settlement. The difference is that the deal shares a record store with the advance, the gate and the public side, so the show is connected from first hold to final cost report.",
      },
      {
        q: "Can I keep Prism for booking and use ATLVS for production?",
        a: "Yes. Webhook confirmed shows from Prism into ATLVS; the production advance, crew, procurement and gate ops open automatically. Reconcile settlement numbers nightly.",
      },
    ],
    keywords: [
      "Prism.fm alternative",
      "ATLVS vs Prism.fm",
      "venue booking software alternative",
      "settlement software plus production",
      "music venue software alternative",
    ],
  },

  asana: {
    slug: "asana",
    competitor: "Asana",
    lastVerified: "2026-07-22",
    sources: ["https://asana.com/product", "https://asana.com/pricing"],
    headline: "ATLVS Technologies vs. Asana: production-native vs. generic work management.",
    blurb:
      "Asana is great project management software. It isn't event production software. Here's what's missing — and what you stop paying separately for when you switch.",
    hero: "Asana is the default 'we need to organize this' SaaS. For production teams it's a starting point that quickly needs augmentation: a separate portal tool for clients, a separate ticketing platform for events, a separate finance add-on, a separate KBYG wiki, a separate check-in app for the gate. The bill adds up and the seams leak.",
    bottomLine:
      "If you run shows, you'll outgrow Asana by your fifth event. The ATLVS Technologies suite is the production-native spine that doesn't need augmentation.",
    features: [
      { feature: "Task + project management", us: true, them: true },
      {
        feature: "Stakeholder portals (artist / vendor / client / sponsor / guest / crew)",
        us: true,
        them: "Guest access",
        note: "Asana publishes project guest access, not scoped external portals",
      },
      { feature: "Offline ticket scanning", us: true, them: false },
      { feature: "Race-safe atomic scan (sub-100ms)", us: true, them: false },
      {
        feature: "Finance (invoices, budgets, expenses, advances)",
        us: true,
        them: false,
        note: "Asana has no finance primitives",
      },
      { feature: "Procurement (POs, vendor COI/W-9)", us: true, them: false },
      { feature: "Production (equipment, rentals, fabrication)", us: true, them: false },
      { feature: "Interactive proposals (scroll + accept-in-place)", us: true, them: false },
      { feature: "Event guides (role-scoped KBYG)", us: true, them: false },
      {
        feature: "Aurora AI assistant",
        us: true,
        them: "Asana AI",
        note: "Asana publishes Asana AI features",
      },
      { feature: "RLS-enforced multi-tenancy", us: true, them: "Not published" },
      { feature: "SSO + SCIM on enterprise", us: true, them: true },
      { feature: "Per-org pricing (unlimited users)", us: true, them: false, note: "Asana charges per seat" },
      { feature: "Stripe Connect vendor payouts", us: true, them: false },
      { feature: "Mobile PWA with service worker", us: true, them: "Native apps" },
    ],
    whyWeWin: [
      {
        title: "Production-native primitives",
        body: "Deliverables, ticket scans, call sheets, vendor COIs, event guides aren't add-ons — they're first-class.",
      },
      {
        title: "One platform, not seven",
        body: "You stop paying for Asana + Eventbrite + DocuSign + a portal tool + a KBYG wiki. It's all one subscription.",
      },
      {
        title: "Stakeholder portals",
        body: "Your clients, artists, vendors, and sponsors don't need Asana seats. They get a slug URL and see only what they should see.",
      },
      {
        title: "Show-day mobile",
        body: "Your scanner works without cell signal. Asana doesn't help at the gate — and it doesn't try to.",
      },
    ],
    whenTheyWin: [
      "You don't run events. If you're a marketing team, software team, or generic services agency, Asana is a better fit.",
      "You have deep Asana integrations (Salesforce, Jira) that depend on its project graph. Those flows stay on Asana; consider ATLVS for just the production-adjacent work.",
    ],
    quote: {
      text: "We used Asana for four years. We didn't hate it — we just kept adding tools around it. ATLVS replaced the tools around it and made the center redundant.",
      attribution: "Owner, Live Events Inc.",
    },
    migration: [
      "Export Asana projects + tasks as CSV",
      "Our import tool maps project → project, section → milestone, task → task, custom fields → our custom fields",
      "Stakeholder invites (artists, vendors, clients) ported to GVTEWAY slug URLs — no seats required",
      "Typical 50-show / 10-person team migration: 2–3 days",
    ],
    faqs: [
      {
        q: "Can I import from Asana?",
        a: "Yes. CSV export from Asana maps cleanly to ATLVS projects, milestones, and tasks. Custom fields map to our custom fields. Comments and attachments port over. A 50-project migration runs in under a day once the export is in hand.",
      },
      {
        q: "What if my team lives in Asana for non-event work?",
        a: "Keep them there. Run production-adjacent work on ATLVS. The webhooks API at /api/v1/webhooks makes it easy to pipe status changes between the two; we have a sample adapter.",
      },
      {
        q: "Is pricing really unlimited users?",
        a: "Yes. Professional is $199/month per org, unlimited users. Asana Business is $24.99/user/month — a 10-person team is $3,000/year. A 20-person team is $6,000/year. Our Professional tier is $2,388/year regardless.",
      },
    ],
    keywords: [
      "ATLVS vs asana",
      "ATLVS Technologies vs asana",
      "event production vs asana",
      "asana alternative for events",
    ],
  },

  monday: {
    slug: "monday",
    competitor: "Monday.com",
    lastVerified: "2026-07-22",
    sources: ["https://monday.com/work-management", "https://monday.com/pricing"],
    headline: "ATLVS Technologies vs. Monday.com: typed primitives vs. a pretty spreadsheet.",
    blurb:
      "Monday is a lovely general-purpose board. If your team runs shows, you'll need primitives Monday doesn't have — and portals Monday can't safely expose.",
    hero: "Monday.com is flexible. That's its strength and the reason production teams outgrow it. Event operations need typed primitives (deliverables, scans, call sheets, COIs) not just columns you name 'deliverable status.' And they need a way to bring external stakeholders in without giving them seats.",
    bottomLine:
      "If you can build it in Monday with enough discipline, you can run shows on it. That discipline costs more than the software.",
    features: [
      { feature: "Board-based project views", us: true, them: true },
      { feature: "Gantt + timeline views", us: true, them: true },
      { feature: "Typed deliverables (16 standard types)", us: true, them: false },
      { feature: "Offline ticket scanning", us: true, them: false },
      { feature: "External stakeholder portals (no seats)", us: true, them: "Guest access" },
      { feature: "Finance primitives", us: true, them: false },
      { feature: "Procurement with COI tracking", us: true, them: false },
      { feature: "Stripe Connect payouts", us: true, them: false },
      { feature: "Interactive proposals", us: true, them: false },
      { feature: "Event guides CMS", us: true, them: false },
      { feature: "Aurora AI", us: true, them: "monday AI" },
      { feature: "RLS multi-tenant by org", us: true, them: "Not published" },
      { feature: "Per-org pricing", us: true, them: false },
      { feature: "Mobile PWA with offline scan queue", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Typed, not freeform",
        body: "A deliverable in ATLVS is a typed entity — tech rider, hotel block, insurance cert. Monday columns are freeform. Typed primitives prevent the 'which column is status this quarter?' drift.",
      },
      {
        title: "Portals without seats",
        body: "Artists, vendors, clients don't count as users. They open a slug URL scoped by RLS. Your per-org bill doesn't go up as your stakeholder count grows.",
      },
      {
        title: "Field tooling",
        body: "COMPVSS handles the gate. Monday has no scanner, no offline queue, no atomic check-in. You'd pair it with another product.",
      },
    ],
    whenTheyWin: [
      "You need a fully custom workflow we haven't modeled. Monday's open-ended columns give you freedom we don't; we optimize for standard production patterns.",
      "You already use Monday for a broader business and need consistent cross-department reporting.",
    ],
    migration: [
      "Monday's CSV + board export is well-structured; our import adapter reads it directly",
      "Column types map: status → status, people → members, date → due_date, formula → custom field",
      "Monday automations → our webhooks; we provide a mapping doc",
    ],
    faqs: [
      {
        q: "Can the ATLVS Technologies suite do everything Monday can?",
        a: "For production workflows, yes and more. For generic business tracking — warehouse inventory, hiring pipelines, software bugs — Monday is more flexible. If you run events, we're the better fit. If you're a 500-person conglomerate, Monday covers more ground.",
      },
      {
        q: "What about pricing?",
        a: "Monday Standard is $12/user/month. A 15-person production team is $2,160/year. Our Professional tier is $2,388/year unlimited users — roughly the same headline price but every stakeholder beyond the 15 is free on our side, paid on theirs.",
      },
    ],
    keywords: [
      "ATLVS vs monday",
      "ATLVS Technologies vs monday",
      "monday alternative events",
      "production software vs monday.com",
    ],
  },

  spreadsheets: {
    slug: "spreadsheets",
    competitor: "Spreadsheets",
    lastVerified: "2026-07-22",
    sources: ["https://workspace.google.com/products/sheets/", "https://www.microsoft.com/en-us/microsoft-365/excel"],
    headline: "ATLVS Technologies vs. spreadsheets: when the duct tape starts costing more than software.",
    blurb:
      "Every production team starts on spreadsheets. Most stay there too long. Here's the tipping point — and what you gain the day you stop.",
    hero: "Spreadsheets are free. They're also infinitely flexible. That's why every production team starts there, and why every production team eventually realizes they're spending 40% of operations on maintaining the spreadsheet, not running the show.",
    bottomLine:
      "If you run more than six shows a year, or have more than five people on ops, you are paying for spreadsheets — in hours, not dollars. Here's what you reclaim.",
    features: [
      { feature: "Zero-cost up front", us: false, them: true },
      { feature: "Infinitely flexible schema", us: false, them: true, note: "That's a downside at scale" },
      { feature: "Multi-user real-time editing", us: true, them: true },
      { feature: "Typed primitives enforced at DB", us: true, them: false },
      { feature: "Role-scoped access (finance can't see other tabs)", us: true, them: false },
      { feature: "Row-Level Security", us: true, them: false },
      { feature: "Audit log of every change", us: true, them: false },
      { feature: "Version history beyond 30 days", us: true, them: "Varies" },
      { feature: "External stakeholder portals", us: true, them: false },
      { feature: "Ticket scanning + check-in", us: true, them: false },
      { feature: "Offline PWA", us: true, them: false },
      { feature: "AI assistant grounded in your data", us: true, them: "Generic" },
      { feature: "Integrations (Stripe, webhooks, SSO)", us: true, them: false },
      { feature: "Backups you actually trust", us: true, them: "Manual" },
    ],
    whyWeWin: [
      {
        title: "Your schema enforces itself",
        body: "Every row has typed columns. Status is a controlled enum. Due dates are actual dates. Finance rolls up because it was typed correctly the first time — not because someone cleaned it up on Monday morning.",
      },
      {
        title: "Access control is real",
        body: "An intern cannot see exec compensation. A vendor cannot see another vendor's pricing. A client cannot edit the production schedule. RLS enforces all of this in the database.",
      },
      {
        title: "It stops being a person's job",
        body: "'Owning the spreadsheet' is a full-time role at most 10+ person production shops. That role goes away. Your spreadsheet person becomes a producer again.",
      },
    ],
    whenTheyWin: [
      "You're a one-person operation or running your first show. Spreadsheets are fine. Graduate when it starts to hurt.",
      "You have a specific model we don't support (custom financial waterfall, proprietary scheduling algorithm). Keep the spreadsheet for that, move the rest to ATLVS.",
    ],
    migration: [
      "CSV export → our import endpoint maps to projects, tasks, vendors, equipment, tickets",
      "Google Sheets tab → table mapping: we walk you through the first two tabs, you finish",
      "Historical data (past shows) archives cleanly — you don't lose it, you just stop editing it",
    ],
    faqs: [
      {
        q: "How do I know it's time to graduate from spreadsheets?",
        a: "Three signals. One: someone's full-time role is 'keeps the spreadsheet alive.' Two: you've had a mistake that cost money or relationships and blamed it on the spreadsheet. Three: you've tried to give a client or vendor view-only access and ended up sharing the whole file.",
      },
      {
        q: "What if my spreadsheet is genuinely working?",
        a: "Keep it. Most migrations are partial — we replace the financial, stakeholder-facing, and gate operations first, and teams keep niche sheets for months or forever. The goal isn't to kill spreadsheets; it's to stop using them for things a database should do.",
      },
      {
        q: "How does the migration cost compare to software cost?",
        a: "Migration from spreadsheets to Professional ($199/mo) typically takes 1–3 days of your time. The hours you save in the first month cover the annual subscription.",
      },
    ],
    keywords: [
      "spreadsheet alternative events",
      "production management vs spreadsheets",
      "stop using spreadsheets events",
    ],
  },

  cvent: {
    slug: "cvent",
    competitor: "Cvent",
    lastVerified: "2026-07-22",
    sources: ["https://www.cvent.com/en/event-marketing-management", "https://www.cvent.com/en/pricing"],
    headline: "ATLVS Technologies vs. Cvent: production operations vs. corporate event management.",
    blurb:
      "Cvent owns the corporate meeting and conference space. For producers running festivals, residencies, touring, or experiential — the surface area is wrong and the seat math is hostile.",
    hero: "Cvent was built for corporate event marketers — registration, badges, room blocks, sponsorship reporting. It's exceptional for that. Live-event production teams find it expensive, slow to configure, and missing the primitives they actually need: stage plots, riders, gate scan that works at 15k guests, vendor COIs, build calls, RFIs.",
    bottomLine:
      "If you run AGMs, sales kickoffs, and corporate conferences, Cvent is the right call. If you run shows, the production-native surface area on ATLVS replaces what you'd be paying Cvent for and adds what Cvent never had.",
    features: [
      { feature: "Corporate event registration", us: "Light", them: true, note: "We don't compete here" },
      { feature: "Badge printing + onsite kiosks", us: false, them: true },
      { feature: "Hotel room block management", us: true, them: true },
      { feature: "Production advancing (riders, plots, input lists)", us: true, them: false },
      { feature: "RFIs · submittals · daily logs", us: true, them: false },
      { feature: "Gate scan offline-first PWA", us: true, them: false },
      { feature: "Vendor COI tracking + Stripe Connect payouts", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false, note: "Cvent quotes per-event, per-registration tiers" },
      { feature: "Stakeholder portals (artist/vendor/sponsor)", us: true, them: "Not published" },
      { feature: "AI assistant grounded in workspace", us: true, them: "Not published" },
    ],
    whyWeWin: [
      {
        title: "Production-native, not registration-native",
        body: "Our primitives are riders, stage plots, COIs, gate scans. Cvent's primitives are registrations, badges, sessions.",
      },
      {
        title: "Per-org, not per-registration",
        body: "Cvent's quote scales with attendees; ours doesn't. A 15k-guest festival is the same price as a 500-guest activation.",
      },
      {
        title: "Field-tool included",
        body: "COMPVSS gate scanner ships in the platform. Cvent OnArrival is a separate SKU.",
      },
    ],
    whenTheyWin: [
      "Corporate meetings, AGMs, multi-day conferences with badge-and-session logistics.",
      "You need extensive integrations with marketing-automation tools that Cvent partners with deeply.",
    ],
    migration: [
      "Export Cvent attendees + sessions as CSV → maps to crew/guests + ROS slots",
      "Vendor COI uploads port directly into procurement",
      "Most teams keep Cvent for one corporate program and run shows on ATLVS",
    ],
    faqs: [
      {
        q: "Should I cancel Cvent?",
        a: "Probably not — they're optimized for what they do. Run shows on ATLVS; run AGMs and sales summits on Cvent.",
      },
      {
        q: "What about registration?",
        a: "Light registration is fine on ATLVS. Deep marketing-attribution registration flows are Cvent territory.",
      },
    ],
    keywords: ["Cvent alternative", "production event software vs Cvent", "live events vs corporate event management"],
  },

  bizzabo: {
    slug: "bizzabo",
    competitor: "Bizzabo",
    lastVerified: "2026-07-22",
    sources: ["https://www.bizzabo.com/", "https://www.bizzabo.com/pricing"],
    headline: "ATLVS Technologies vs. Bizzabo: production-grade vs. hybrid-event platform.",
    blurb:
      "Bizzabo is great for hybrid conference experiences with deep registration and content streaming. Production-native operations are a different problem with different primitives.",
    hero: "Bizzabo earned its place in the hybrid-conference category. For a producer building festivals, immersive activations, or running a touring crew, the platform optimizes for an audience experience layer — not for the production team behind it.",
    bottomLine:
      "Bizzabo for the audience side of a hybrid conference. ATLVS for the production side of any live event.",
    features: [
      { feature: "Hybrid event streaming", us: false, them: true },
      { feature: "Branded event apps for attendees", us: "Via portals", them: true },
      { feature: "Production advancing (riders, plots)", us: true, them: false },
      { feature: "RFIs · submittals · punch lists", us: true, them: false },
      { feature: "Offline gate scan", us: true, them: "Not published" },
      { feature: "Stripe Connect vendor payouts", us: true, them: false },
      { feature: "Per-org pricing (not per-registration)", us: true, them: false },
      { feature: "Stakeholder portals beyond attendees", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Producers, not attendees",
        body: "We optimize the workflow of the team running the event. Bizzabo optimizes the experience of attending it.",
      },
      {
        title: "Production primitives ship native",
        body: "Stage plots, riders, COIs, scanning — first-class. Bizzabo's plug-ins don't cover this.",
      },
    ],
    whenTheyWin: [
      "Hybrid conferences with deep streaming + registration + sponsorship.",
      "You need 1st-party attendee analytics tied into your marketing automation.",
    ],
    migration: [
      "Export Bizzabo session list → maps to ROS + advancing",
      "Sponsor records port to ATLVS sponsorship + portal access",
      "Most teams run both: Bizzabo for the attendee app, ATLVS for production",
    ],
    faqs: [
      {
        q: "Can we keep using Bizzabo for our hybrid conference?",
        a: "Yes — most teams do. Webhooks let you sync session changes between the two.",
      },
    ],
    keywords: ["Bizzabo alternative", "event production platform", "hybrid event vs production operations"],
  },

  eventbrite: {
    slug: "eventbrite",
    competitor: "Eventbrite",
    lastVerified: "2026-07-22",
    sources: ["https://www.eventbrite.com/organizer/overview/", "https://www.eventbrite.com/organizer/pricing/"],
    headline: "ATLVS Technologies vs. Eventbrite: production platform vs. ticketing platform.",
    blurb:
      "Eventbrite is excellent ticketing. It is not a production platform. Most teams run both — sell tickets on Eventbrite, run the show on ATLVS.",
    hero: "Eventbrite is built for selling tickets — discovery, checkout, fee collection. The producer needs are downstream of that: advancing, gate scan throughput, vendor management, finance reconciliation, post-event audit. Eventbrite doesn't try to solve those, and that's fine.",
    bottomLine: "Eventbrite for the ticket sale. ATLVS for everything from the day after the on-sale through wrap.",
    features: [
      {
        feature: "Public ticket discovery / search",
        us: false,
        them: true,
        note: "Eventbrite has a marketplace; we don't",
      },
      { feature: "Ticket fee collection", us: true, them: true, note: "Eventbrite publishes per-ticket fees" },
      {
        feature: "Offline gate scan sub-100ms",
        us: true,
        them: "Organizer app",
        note: "Offline scan performance not published",
      },
      { feature: "Advancing, RFIs, COIs, daily logs", us: true, them: false },
      { feature: "Vendor portals + payouts", us: true, them: false },
      { feature: "Stage plots + input lists", us: true, them: false },
      { feature: "Event guides (KBYG)", us: true, them: false },
      { feature: "Per-org pricing for production tooling", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Production downstream of ticketing",
        body: "Eventbrite hands off after the sale. We pick up the moment the show is booked and run it through wrap.",
      },
      {
        title: "Offline scan throughput",
        body: "Sub-100ms scan tested at 15k-guest gates. Eventbrite's mobile scanner is adequate; ours is built for festival gates.",
      },
    ],
    whenTheyWin: [
      "Discovery — Eventbrite's marketplace surfaces your event to new audiences.",
      "Simple consumer events where the ticket sale is the entire workflow.",
    ],
    migration: [
      "Sync Eventbrite ticket batches via webhook → ATLVS gate scanner",
      "Reconcile sales numbers nightly against ATLVS finance",
      "Most producers keep Eventbrite for sale, ATLVS for scan + ops",
    ],
    faqs: [
      {
        q: "Can I scan Eventbrite tickets on COMPVSS?",
        a: "Yes. Import the ticket batch via CSV or webhook; the scanner respects Eventbrite's barcode format.",
      },
      {
        q: "Do I need to switch ticketing?",
        a: "No. Keep Eventbrite if your audience finds you there. Run production on ATLVS.",
      },
    ],
    keywords: [
      "Eventbrite alternative",
      "Eventbrite scanner alternative",
      "ticketing + production",
      "Eventbrite vs production software",
    ],
  },

  procore: {
    slug: "procore",
    competitor: "Procore",
    lastVerified: "2026-07-22",
    sources: ["https://www.procore.com/products", "https://www.procore.com/pricing"],
    headline: "ATLVS Technologies vs. Procore: production timelines vs. construction timelines.",
    blurb:
      "Procore is the construction industry standard. Live-event production borrows the same primitives — RFIs, submittals, daily logs, punch — at a different clock speed and with different vocabulary.",
    hero: "Procore was built for 18-month build cycles with deep BIM, drawings, and procurement integration. Live-event production runs the same workflow primitives but on 4–12 week clocks with different vendors and different vocabulary. The Procore feature set is right; the velocity isn't.",
    bottomLine:
      "If you build buildings, Procore. If you build shows that look like buildings (festivals, immersive, scenic, large activations), ATLVS — same primitives, production-velocity.",
    features: [
      { feature: "RFIs with ball-in-court routing", us: true, them: true },
      { feature: "Submittals with reviewer workflow", us: true, them: true },
      { feature: "Daily logs (weather + manpower + photos)", us: true, them: true },
      { feature: "Punch lists with photo evidence", us: true, them: true },
      { feature: "Change orders + pay applications", us: true, them: true },
      { feature: "BIM / CAD / Revit integrations", us: false, them: true },
      { feature: "Public stakeholder portals (artist/sponsor/guest)", us: true, them: false },
      { feature: "Offline gate scan", us: true, them: false },
      { feature: "Event guides (KBYG) CMS", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Production velocity",
        body: "Show-day urgency on the same workflow primitives. RFIs that close in 24 hours, not 14 days.",
      },
      {
        title: "Live-event surface area",
        body: "Stage plots, artist riders, gate scan, vendor COIs, KBYG — none of which Procore models.",
      },
    ],
    whenTheyWin: [
      "Construction-led projects with BIM, drawing markups, and 12+ month timelines.",
      "Permanent-build venues where the build IS the deliverable.",
    ],
    migration: [
      "Procore RFI/submittal exports map directly to our primitives",
      "Daily logs port over; weather and manpower fields one-to-one",
      "Most build-shop teams move scenic/fabrication to ATLVS, keep Procore for venue-build projects",
    ],
    faqs: [
      {
        q: "Are you a Procore replacement?",
        a: "For event-production timelines, yes. For permanent construction, no.",
      },
    ],
    keywords: ["Procore alternative events", "RFI submittal software live events", "Procore vs production"],
  },

  notion: {
    slug: "notion",
    competitor: "Notion",
    lastVerified: "2026-07-22",
    sources: ["https://www.notion.com/product", "https://www.notion.com/pricing"],
    headline: "ATLVS Technologies vs. Notion: typed primitives vs. flexible blocks.",
    blurb:
      "Notion is the best block-editor on the market. Production teams hit its limits at the second show — typed primitives, role-scoped portals, gate scan, vendor payouts aren't in the kit.",
    hero: "Notion is the right answer to 'we need a flexible workspace.' Production teams love it for the first month and outgrow it by the second show. The pain points are predictable: no typed primitives, no offline mobile, no stakeholder portals that scale, no vendor payout rail.",
    bottomLine: "Notion stays for internal docs and SOPs. Production workflow moves to ATLVS.",
    features: [
      {
        feature: "Block-based docs and wikis",
        us: "Light",
        them: true,
        note: "Use Notion for docs; we don't compete here",
      },
      { feature: "Typed deliverables (rider, COI, hotel block)", us: true, them: false },
      { feature: "Offline gate scan PWA", us: true, them: false },
      { feature: "Stakeholder portals (no Notion seat needed)", us: true, them: false },
      { feature: "Stripe Connect vendor payouts", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
      { feature: "RFIs, submittals, punch lists, daily logs", us: true, them: "DIY" },
      { feature: "Aurora AI grounded in workspace data", us: true, them: "Notion AI" },
    ],
    whyWeWin: [
      {
        title: "Typed not freeform",
        body: "A deliverable is a deliverable. A status is a known enum. No 'which property did we use for this last season' drift.",
      },
      {
        title: "Field tooling",
        body: "Phone-camera scanner, offline queue, geo-verified clock-in. Notion has none of this.",
      },
    ],
    whenTheyWin: [
      "SOPs, runbooks, post-mortems, internal wikis — Notion is the right tool.",
      "1-person ops where every primitive is a custom page.",
    ],
    migration: [
      "Notion database CSV export maps to ATLVS tables",
      "Internal docs stay on Notion; cross-link with deep URLs",
      "Most teams cut the workspace clutter by 60% within a month of moving production",
    ],
    faqs: [{ q: "Should we leave Notion entirely?", a: "No. Keep Notion for docs/wikis. Move production workflow." }],
    keywords: ["Notion alternative events", "Notion for production", "Notion vs production platform"],
  },

  airtable: {
    slug: "airtable",
    competitor: "Airtable",
    lastVerified: "2026-07-22",
    sources: ["https://www.airtable.com/platform", "https://airtable.com/pricing"],
    headline: "ATLVS Technologies vs. Airtable: production schema vs. flexible base.",
    blurb:
      "Airtable is the platonic flexible database. Production teams either spend a season building it into a platform — or they outgrow it.",
    hero: "Airtable is what you reach for when you've outgrown Sheets but haven't picked a real platform. It's a great prototype tool — and a costly long-term answer if you're trying to run shows.",
    bottomLine: "Airtable for prototyping a workflow. ATLVS when the workflow ships.",
    features: [
      { feature: "Flexible database with views", us: true, them: true, note: "We're typed, they're freeform" },
      { feature: "Automations + scripts", us: true, them: true },
      { feature: "Stakeholder portals at scale", us: true, them: "Shared views + Interfaces" },
      {
        feature: "RLS-enforced multi-tenancy",
        us: true,
        them: "Not published",
        note: "Airtable publishes permission-based access controls",
      },
      { feature: "Offline gate scan", us: true, them: false },
      { feature: "Stripe Connect payouts", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
      { feature: "Production templates that work day 1", us: true, them: "Generic templates" },
    ],
    whyWeWin: [
      {
        title: "Day-1 production schema",
        body: "You don't build the platform; you run shows on it. 47 modules pre-modeled.",
      },
      { title: "Database-enforced security", body: "Row-level security at the DB, not column visibility at the UI." },
    ],
    whenTheyWin: [
      "Prototyping a workflow before committing to a platform.",
      "Niche internal databases that no production tool models.",
    ],
    migration: [
      "Airtable CSV export → our import maps tables to modules",
      "Per-record links port via lookup-key resolution",
      "Most teams keep one or two niche bases on Airtable, move production to us",
    ],
    faqs: [
      {
        q: "Is ATLVS as flexible as Airtable?",
        a: "Less flexible by design. We model what we know about production. The trade is faster setup, enforced typing, and no DIY platform-building.",
      },
    ],
    keywords: ["Airtable alternative events", "Airtable for production", "Airtable vs production database"],
  },

  smartsheet: {
    slug: "smartsheet",
    competitor: "Smartsheet",
    lastVerified: "2026-07-22",
    sources: ["https://www.smartsheet.com/", "https://www.smartsheet.com/pricing"],
    headline: "ATLVS Technologies vs. Smartsheet: production-native vs. spreadsheet-with-features.",
    blurb:
      "Smartsheet adds workflow over a spreadsheet. Production teams need more than that — typed primitives, portals, scanners, payouts.",
    hero: "Smartsheet is the most spreadsheet-shaped of the big PM tools, which is why corporate teams like it. Production teams find it more rigid than Airtable and less production-shaped than ATLVS.",
    bottomLine: "For corporate program management, Smartsheet has its niche. For production, the primitives are wrong.",
    features: [
      { feature: "Grid + Gantt + card views", us: true, them: true },
      { feature: "Typed deliverables (production)", us: true, them: false },
      { feature: "Stakeholder portals", us: true, them: "Limited (Dynamic View)" },
      { feature: "Offline gate scan", us: true, them: false },
      { feature: "Stripe Connect payouts", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Built for show calls",
        body: "ROS, advancing, COIs, riders — first-class. Smartsheet asks you to build them in cells.",
      },
    ],
    whenTheyWin: [
      "Corporate program management with strong Excel-native users.",
      "Cross-department reporting in a Microsoft-heavy org.",
    ],
    migration: ["Smartsheet CSV exports map cleanly", "Workflow automations port to our webhooks"],
    faqs: [
      {
        q: "Is Smartsheet's pricing similar?",
        a: "Per-user. A 15-person team at $25/user is $4,500/year. We're $2,388/year unlimited at Production.",
      },
    ],
    keywords: ["Smartsheet alternative events", "Smartsheet vs production"],
  },

  "ms-project": {
    slug: "ms-project",
    competitor: "Microsoft Project",
    lastVerified: "2026-07-22",
    sources: [
      "https://www.microsoft.com/en-us/microsoft-365/project/project-management-software",
      "https://www.microsoft.com/en-us/microsoft-365/project/compare-microsoft-project-management-software",
    ],
    headline: "ATLVS Technologies vs. Microsoft Project: production ops vs. waterfall PM.",
    blurb:
      "MS Project is excellent waterfall scheduling. Live-event production is more than a Gantt chart — and the team that runs shows doesn't live in Project all day.",
    hero: "MS Project owns the deep-Gantt, deep-resource-leveling, deep-critical-path space. For event production where the actual day-to-day is RFIs, advancing, gate scans, and vendor payouts, it's the wrong center of gravity.",
    bottomLine: "Microsoft Project for the planning. ATLVS for the running.",
    features: [
      { feature: "Detailed Gantt + critical path", us: "Light", them: true, note: "Their strength" },
      { feature: "Resource leveling", us: "Light", them: true },
      { feature: "Production advancing", us: true, them: false },
      { feature: "Offline gate scan", us: true, them: false },
      { feature: "Stakeholder portals", us: true, them: false },
      { feature: "Stripe Connect payouts", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Production lives day to day",
        body: "Project plans help you plan. They don't help you run the gate or pay the vendor.",
      },
    ],
    whenTheyWin: ["Detailed multi-year master schedules with extensive dependency analysis."],
    migration: ["MS Project tasks port via XML/CSV → ROS + milestones"],
    faqs: [
      {
        q: "Can we keep MS Project for the master schedule?",
        a: "Yes. Most do. Use Project for the master, run operations on ATLVS.",
      },
    ],
    keywords: ["MS Project alternative events", "Microsoft Project vs production software"],
  },

  docusign: {
    slug: "docusign",
    competitor: "DocuSign",
    lastVerified: "2026-07-22",
    sources: ["https://www.docusign.com/products/electronic-signature", "https://www.docusign.com/pricing"],
    headline: "ATLVS Technologies vs. DocuSign: interactive proposals vs. PDF e-signature.",
    blurb:
      "DocuSign signs PDFs. ATLVS proposals scroll, quantify, and accept in place — and the production starts the moment they sign.",
    hero: "DocuSign won the e-signature market. It also locked the industry into PDF-by-email as the proposal format. Interactive proposals — scroll storytelling, live pricing, accept buttons — are a better experience and they connect directly to the production that follows the signature.",
    bottomLine: "DocuSign for arbitrary contracts. ATLVS for proposals that turn into shows.",
    features: [
      {
        feature: "PDF e-signature on arbitrary documents",
        us: false,
        them: true,
        note: "Use DocuSign for general contracts",
      },
      { feature: "Interactive scroll proposals", us: true, them: false },
      { feature: "Live pricing computed server-side", us: true, them: false },
      { feature: "Accept buttons with IP + timestamp + version", us: true, them: true },
      { feature: "Proposal → live project on accept", us: true, them: false },
      { feature: "Revocable share links", us: true, them: "Not published" },
      { feature: "Stripe checkout on accept", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Acceptance starts production",
        body: "Sign → project created → deposit invoiced → advancing opens. DocuSign signs the file and stops there.",
      },
      {
        title: "Scroll, not PDF",
        body: "Interactive proposals close better than PDFs. Industry data is consistent on this.",
      },
    ],
    whenTheyWin: ["NDAs, MSAs, employment agreements, generic legal contracts."],
    migration: [
      "DocuSign signed proposals re-create as ATLVS proposals via template",
      "Most teams keep DocuSign for legal, move proposals to us",
    ],
    faqs: [
      {
        q: "Is ATLVS signature legally binding?",
        a: "It captures IP, timestamp, typed name, and version — consistent with US ESIGN Act standards. Talk to your counsel on specifics.",
      },
    ],
    keywords: ["DocuSign alternative events", "interactive proposals", "DocuSign vs proposal software"],
  },

  pandadoc: {
    slug: "pandadoc",
    competitor: "PandaDoc",
    lastVerified: "2026-07-22",
    sources: ["https://www.pandadoc.com/", "https://www.pandadoc.com/pricing/"],
    headline: "ATLVS Technologies vs. PandaDoc: production proposals vs. generic doc automation.",
    blurb:
      "PandaDoc is solid generic proposal automation. ATLVS proposals know what a rider is, what a load-in is, and write the project on accept.",
    hero: "PandaDoc and we share the proposal-acceptance pattern. The difference is what happens before and after acceptance — our proposals pull line items from your live production catalog, and on accept they create the project, invoice, and deposit, automatically.",
    bottomLine: "PandaDoc for generic sales proposals. ATLVS for proposals that ARE the production setup.",
    features: [
      { feature: "Drag-drop proposal builder", us: true, them: true },
      { feature: "Pricing tables + e-sign", us: true, them: true },
      { feature: "CRM integrations (Salesforce/HubSpot)", us: "Webhooks", them: true },
      { feature: "Line items from production catalog", us: true, them: false },
      { feature: "Accept → project + invoice + deposit", us: true, them: false },
      { feature: "Stripe Connect payouts on the back end", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Knows production",
        body: "Riders, stage plots, KBYG sections render natively. PandaDoc requires templates.",
      },
      { title: "Acceptance → production", body: "Sign and the project, deposit, and advancing open." },
    ],
    whenTheyWin: ["Non-event sales proposals (SaaS, services, etc.)."],
    migration: ["PandaDoc templates port via copy + paste; line items hand-mapped"],
    faqs: [
      {
        q: "Do you replace PandaDoc fully?",
        a: "For event proposals, yes. For general sales proposals across other industries, keep PandaDoc.",
      },
    ],
    keywords: ["PandaDoc alternative events", "PandaDoc vs proposal software"],
  },

  salesforce: {
    slug: "salesforce",
    competitor: "Salesforce",
    lastVerified: "2026-07-22",
    sources: ["https://www.salesforce.com/sales/", "https://www.salesforce.com/pricing/"],
    headline: "ATLVS Technologies vs. Salesforce: production CRM vs. enterprise CRM.",
    blurb:
      "Salesforce will run your sales org. It will not run your show. The CRM in ATLVS is production-shaped — clients, gigs, proposals, advancing in one record.",
    hero: "Salesforce is the heavyweight champion of enterprise CRM. For production teams it's massive — and the production-side data (vendors, talent, gigs) doesn't live there cleanly. Most teams that run both pay for Salesforce, log everything in ATLVS, and reconcile by hand.",
    bottomLine: "Salesforce for the sales org. ATLVS for the production org. Sync via webhooks where it matters.",
    features: [
      { feature: "Deep enterprise CRM + reporting", us: "Light", them: true },
      { feature: "Production CRM (clients, gigs, advancing)", us: true, them: false },
      { feature: "Proposals → projects → invoices", us: true, them: false },
      { feature: "Stakeholder portals (artist/vendor/sponsor)", us: true, them: false },
      { feature: "Webhooks bidirectional", us: true, them: true },
    ],
    whyWeWin: [
      { title: "Production-native CRM", body: "Our records are gigs, not opportunities. Riders, not attachments." },
    ],
    whenTheyWin: ["Enterprise sales org with deep multi-line-of-business reporting needs."],
    migration: ["Webhook bridge: Salesforce Opportunity ↔ ATLVS Project. Field mapping doc provided."],
    faqs: [{ q: "Do I need to drop Salesforce?", a: "No. Use both. Webhooks keep them aligned." }],
    keywords: ["Salesforce for events", "Salesforce alternative events", "production CRM"],
  },

  hubspot: {
    slug: "hubspot",
    competitor: "HubSpot",
    lastVerified: "2026-07-22",
    sources: ["https://www.hubspot.com/products/marketing", "https://www.hubspot.com/pricing/marketing"],
    headline: "ATLVS Technologies vs. HubSpot: production CRM vs. inbound-marketing CRM.",
    blurb:
      "HubSpot owns inbound marketing CRM. Production teams need a different shape — gigs, riders, advancing, vendor payouts. Use both.",
    hero: "HubSpot is the right CRM for the inbound funnel — content, forms, attribution, nurture. Production teams need that for lead-gen and a separate production-native CRM for everything after the deal closes.",
    bottomLine: "HubSpot for inbound. ATLVS for everything from signed proposal through wrap.",
    features: [
      { feature: "Inbound marketing + nurture", us: false, them: true },
      { feature: "Production CRM + advancing", us: true, them: false },
      { feature: "Webhooks bidirectional", us: true, them: true },
      { feature: "Per-org pricing", us: true, them: false },
    ],
    whyWeWin: [{ title: "Post-signature workflow", body: "HubSpot ends at deal-close. We start there." }],
    whenTheyWin: ["Top-of-funnel marketing and lead capture."],
    migration: ["HubSpot Deal closed → ATLVS Project via webhook"],
    faqs: [
      {
        q: "Should I move marketing to ATLVS?",
        a: "No. Keep HubSpot for marketing. Webhook the won deals into ATLVS.",
      },
    ],
    keywords: ["HubSpot alternative events", "HubSpot for production"],
  },

  eventbase: {
    slug: "eventbase",
    competitor: "Eventbase",
    lastVerified: "2026-07-22",
    sources: ["https://www.eventbase.com/event-technology", "https://www.eventbase.com/custom-event-app"],
    headline: "ATLVS Technologies vs. Eventbase: production platform vs. event mobile app.",
    blurb: "Eventbase makes a beautiful attendee app. ATLVS runs the production behind it. They're different layers.",
    hero: "Eventbase is the gold standard for branded attendee apps at major events. For the production team running the event, the workflow lives somewhere else — and ATLVS is built for that.",
    bottomLine: "Eventbase for the attendee. ATLVS for the producer. Webhook them together.",
    features: [
      { feature: "Branded attendee mobile app", us: "Via portal", them: true },
      { feature: "Production advancing", us: true, them: false },
      { feature: "RFIs · submittals · punch", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Producer-facing primitives",
        body: "Riders, COIs, gate scans, vendor payouts. Eventbase doesn't touch these.",
      },
    ],
    whenTheyWin: ["You need a custom-branded attendee app at flagship scale."],
    migration: ["Webhook attendee data both directions"],
    faqs: [{ q: "Are we competitive with Eventbase?", a: "No — different layers. Most large events run both." }],
    keywords: ["Eventbase alternative", "event production behind the app"],
  },

  "master-tour": {
    slug: "master-tour",
    competitor: "Master Tour",
    lastVerified: "2026-07-22",
    sources: ["https://www.eventric.com/master-tour-pro/", "https://www.eventric.com/pricing/"],
    headline: "ATLVS Technologies vs. Master Tour: modern stack vs. industry-standard tour book.",
    blurb:
      "Master Tour is the industry-default tour book. It's also pre-cloud-era in shape. Modern tour managers want portals, mobile, AI, and per-org pricing.",
    hero: "Master Tour is what most tour managers learned on. It works, and the install base is real. ATLVS is what tour managers ask for when they get to design from scratch: cloud-native, real portals, offline mobile, AI assistant, per-org pricing, no per-tour-book seat math.",
    bottomLine:
      "If you're locked into Master Tour, the muscle memory is real. If you're picking fresh, picking modern matters.",
    features: [
      { feature: "Tour-book day sheets", us: true, them: true },
      { feature: "Advancing per stop", us: true, them: true },
      {
        feature: "Cloud-native multi-user",
        us: true,
        them: "Desktop-led + sync",
        note: "Eventric publishes desktop and mobile apps with offline sync",
      },
      {
        feature: "Offline mobile (COMPVSS)",
        us: true,
        them: true,
        note: "Eventric publishes offline sync in Master Tour",
      },
      { feature: "Stakeholder portals (artist/vendor)", us: true, them: "Not published" },
      { feature: "Aurora AI assistant", us: true, them: "Not published" },
      { feature: "Stripe Connect payouts", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Cloud-native + offline mobile",
        body: "Modern tour managers expect both. COMPVSS is an installable offline-first PWA on the same record store as the rest of the production.",
      },
      { title: "Portals", body: "Artists, vendors, drivers — all see scoped views. No more emailing day sheets." },
    ],
    whenTheyWin: ["Veteran TMs with deep Master Tour muscle memory who aren't switching costs they want to take on."],
    migration: ["Master Tour CSV exports map to advancing + ROS"],
    faqs: [
      {
        q: "Are you a Master Tour replacement?",
        a: "Yes, for modern touring orgs. We lose to muscle memory; we win on portals, the shared record store, and per-org pricing.",
      },
    ],
    keywords: ["Master Tour alternative", "modern tour management software", "Master Tour vs ATLVS"],
  },

  eventric: {
    slug: "eventric",
    competitor: "Eventric",
    lastVerified: "2026-07-22",
    sources: ["https://www.eventric.com/", "https://www.eventric.com/master-tour-pro/"],
    headline: "ATLVS Technologies vs. Eventric: full stack vs. tour-only suite.",
    blurb:
      "Eventric (and its Master Tour product line) cover touring. ATLVS covers touring plus everything around it — fabrication, festivals, activations, broadcast.",
    hero: "Eventric is a respected name in touring. ATLVS is touring-native AND covers the fabrication, festival, immersive, and broadcast production work that touring orgs increasingly run alongside their tours.",
    bottomLine: "Eventric for tour-only orgs. ATLVS for orgs that run tours plus other production work.",
    features: [
      { feature: "Tour day sheets + advancing", us: true, them: true },
      { feature: "Festival + activation surface area", us: true, them: false },
      { feature: "Fabrication shop ops", us: true, them: false },
      { feature: "Broadcast compound ops", us: true, them: false },
      { feature: "Stakeholder portals + per-org pricing", us: true, them: "Not published" },
    ],
    whyWeWin: [
      {
        title: "One platform for the full org",
        body: "Your touring shop, your fab shop, your activations team — same database.",
      },
    ],
    whenTheyWin: ["Pure-touring orgs with no fabrication, festival, or activation work."],
    migration: ["Eventric exports port to advancing + ROS"],
    faqs: [
      {
        q: "Do we lose touring functionality?",
        a: "No — we match the spec on touring primitives and add the rest of the org's surface area.",
      },
    ],
    keywords: ["Eventric alternative", "tour management plus production"],
  },

  "show-co": {
    slug: "show-co",
    competitor: "Show.co",
    lastVerified: "2026-07-22",
    sources: ["https://www.show.co/campaigns/", "https://www.show.co/pricing/"],
    headline: "ATLVS Technologies vs. Show.co: production platform vs. fan marketing.",
    blurb:
      "Show.co is for fan-marketing — pre-saves, presales, drops. ATLVS is the production platform that runs the show those fans show up to.",
    hero: "Show.co lives in the marketing-to-fans layer. ATLVS lives in the production-team layer. Different problems; we don't overlap meaningfully.",
    bottomLine: "Use both. Show.co for fan marketing. ATLVS for production.",
    features: [
      { feature: "Fan marketing automation", us: false, them: true },
      { feature: "Production operations", us: true, them: false },
    ],
    whyWeWin: [{ title: "Different problem", body: "We don't compete; we run downstream of fan marketing." }],
    whenTheyWin: ["Fan-marketing automation. Use Show.co."],
    migration: ["N/A — different layers"],
    faqs: [],
    keywords: ["Show.co alternative", "production behind fan marketing"],
  },

  aconex: {
    slug: "aconex",
    competitor: "Aconex (Oracle)",
    lastVerified: "2026-07-22",
    sources: [
      "https://www.oracle.com/construction-engineering/aconex/",
      "https://www.oracle.com/construction-engineering/",
    ],
    headline: "ATLVS Technologies vs. Aconex: production-speed RFIs vs. construction document control.",
    blurb:
      "Aconex is Oracle's enterprise construction document control system. Live-event production borrows the workflow primitives at a different velocity.",
    hero: "Aconex shines for mega-projects with thousands of stakeholders and multi-year document trails. Event production runs faster and lighter, on the same primitives.",
    bottomLine: "Aconex for mega-construction. ATLVS for event production on construction-style primitives.",
    features: [
      { feature: "Document control + RFI/submittal workflows", us: true, them: true },
      { feature: "Production primitives (rider, gate scan)", us: true, them: false },
      { feature: "Per-org pricing", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Velocity + production primitives",
        body: "Aconex is built for slow, structured construction. We're built for show calls.",
      },
    ],
    whenTheyWin: ["Mega-construction with regulatory document retention."],
    migration: ["Aconex RFI/submittal exports map cleanly"],
    faqs: [],
    keywords: ["Aconex alternative events", "construction document control"],
  },
};

// ── Workforce-category roster (COMPVSS comparisons) ─────────────────────────
// Lives in JSON, not here: the brand-hygiene guard bans competitor brand
// tokens in .ts/.tsx product code, and the ratified marketing carve-out
// (docs/marketing/MARKETING_ONBOARDING_REBUILD_PLAN.md §12.1) homes the
// deskless-workforce names in a data file consumed only by the /compare and
// /alternatives templates. Every JSON entry must carry lastVerified + sources;
// comparison-verification.test.ts enforces it.
import workforceComparisons from "@/lib/marketing/comparisons-workforce.json";
import productionComparisons from "@/lib/marketing/comparisons-production.json";

for (const entry of workforceComparisons.entries as CompareConfig[]) {
  COMPARE[entry.slug] = entry;
}
for (const entry of productionComparisons.entries as CompareConfig[]) {
  COMPARE[entry.slug] = entry;
}

export const COMPARE_LIST = Object.values(COMPARE);

/** Hub grouping: legacy entries predate `category` and are production-suite
 *  comparisons; new entries declare theirs. */
export function compareCategory(c: CompareConfig): NonNullable<CompareConfig["category"]> {
  return c.category ?? "production";
}
