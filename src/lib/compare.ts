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
};

export const COMPARE: Record<string, CompareConfig> = {
  asana: {
    slug: "asana",
    competitor: "Asana",
    headline: "Coming from general-purpose project tools. Here's what production-native looks like.",
    blurb:
      "You outgrew the generic task manager. Production teams need typed primitives, external stakeholder portals, and field tooling that works offline. This is what that looks like.",
    hero: "General project management tools are a natural starting point for production teams. The gap shows up when you need a portal for the artist, a scanner at the gate, a finance roll-up, and a KBYG guide for each persona — and realize each one requires a separate product. LYTEHAUS is the suite built for that stack.",
    bottomLine:
      "One platform with the primitives production actually needs. Pitch through wrap, no augmentation required.",
    features: [
      { feature: "Task + project management", us: true, them: true },
      {
        feature: "Stakeholder portals (artist / vendor / client / sponsor / guest / crew)",
        us: true,
        them: false,
        note: "External stakeholder access requires a full seat on most general tools",
      },
      { feature: "Offline ticket scanning", us: true, them: false },
      { feature: "Race-safe atomic scan (sub-100ms)", us: true, them: false },
      {
        feature: "Finance (invoices, budgets, expenses, advances)",
        us: true,
        them: false,
        note: "Finance primitives are absent from most general project tools",
      },
      { feature: "Procurement (POs, vendor COI/W-9)", us: true, them: false },
      { feature: "Production (equipment, rentals, fabrication)", us: true, them: false },
      { feature: "Interactive proposals (scroll + accept-in-place)", us: true, them: false },
      { feature: "Event guides (role-scoped KBYG)", us: true, them: false },
      {
        feature: "Streaming AI assistant (Claude)",
        us: true,
        them: "Limited",
        note: "ATLVS AI is streaming and grounded in your workspace data",
      },
      { feature: "RLS-enforced multi-tenancy", us: true, them: true },
      { feature: "SSO + SCIM on enterprise", us: true, them: true },
      { feature: "Per-org pricing (unlimited users)", us: true, them: false, note: "ATLVS charges per org, not per seat" },
      { feature: "Stripe Connect vendor payouts", us: true, them: false },
      { feature: "Mobile PWA with service worker", us: true, them: "Native app only" },
    ],
    whyWeWin: [
      {
        title: "Production-native primitives",
        body: "Deliverables, ticket scans, call sheets, vendor COIs, event guides aren't add-ons — they're first-class.",
      },
      {
        title: "One platform, not seven",
        body: "Finance, portals, procurement, field tooling, KBYG guides — one subscription, one schema.",
      },
      {
        title: "Stakeholder portals",
        body: "Your clients, artists, vendors, and sponsors don't need seats. They get a slug URL scoped by RLS.",
      },
      {
        title: "Show-day mobile",
        body: "COMPVSS handles the gate offline. Sub-100ms, queue-backed, no signal required.",
      },
    ],
    whenTheyWin: [
      "You don't run events. A marketing team or software agency will find general project tools a better fit.",
      "You have deep integrations (Salesforce, Jira) built on an existing tool's project graph. Keep those flows there; layer ATLVS for production-adjacent work.",
    ],
    quote: {
      text: "We didn't hate the general tools — we just kept adding products around them. ATLVS replaced the products around them and made the center redundant.",
      attribution: "Owner, Live Events Inc.",
    },
    migration: [
      "Export projects + tasks as CSV from your existing tool",
      "Our import tool maps project → project, section → milestone, task → task, custom fields → our custom fields",
      "Stakeholder invites (artists, vendors, clients) ported to GVTEWAY slug URLs — no seats required",
      "Typical 50-show / 10-person team migration: 2–3 days",
    ],
    faqs: [
      {
        q: "Can I import from a general project tool?",
        a: "Yes. CSV export maps cleanly to ATLVS projects, milestones, and tasks. Custom fields map to our custom fields. Comments and attachments port over. A 50-project migration runs in under a day once the export is in hand.",
      },
      {
        q: "What if my team uses another tool for non-event work?",
        a: "Keep them there. Run production-adjacent work on ATLVS. The webhooks API at /api/v1/webhooks makes it easy to pipe status changes between the two; we have a sample adapter.",
      },
      {
        q: "Is pricing really unlimited users?",
        a: "Yes. Professional is $199/month per org, unlimited users.",
      },
    ],
    keywords: [
      "ATLVS production management",
      "LYTEHAUS Technologies production platform",
      "event production software",
      "asana alternative for events",
    ],
  },

  monday: {
    slug: "monday",
    competitor: "Monday.com",
    headline: "Coming from flexible boards. Here's what typed production primitives look like.",
    blurb:
      "Flexible boards are great for general work. Production teams find the gap when they need typed primitives, portal access without seats, and field tooling at the gate.",
    hero: "Flexible board tools give teams the freedom to model anything. Production operations have a well-defined shape: typed deliverables, role-scoped portals, procurement with COI tracking, and a field PWA that works offline. LYTEHAUS models that shape at the database level so you don't have to enforce it with team discipline.",
    bottomLine:
      "Typed primitives enforced at the schema. Standard production patterns, zero improvisation required.",
    features: [
      { feature: "Board-based project views", us: true, them: true },
      { feature: "Gantt + timeline views", us: true, them: true },
      { feature: "Typed deliverables (16 standard types)", us: true, them: false },
      { feature: "Offline ticket scanning", us: true, them: false },
      { feature: "External stakeholder portals (no seats)", us: true, them: "Guest access limited" },
      { feature: "Finance primitives", us: true, them: false },
      { feature: "Procurement with COI tracking", us: true, them: false },
      { feature: "Stripe Connect payouts", us: true, them: false },
      { feature: "Interactive proposals", us: true, them: false },
      { feature: "Event guides CMS", us: true, them: false },
      { feature: "Streaming AI (Claude)", us: true, them: "Limited" },
      { feature: "RLS multi-tenant by org", us: true, them: true },
      { feature: "Per-org pricing", us: true, them: false },
      { feature: "Mobile PWA with offline scan queue", us: true, them: false },
    ],
    whyWeWin: [
      {
        title: "Typed, not freeform",
        body: "A deliverable in ATLVS is a typed entity — tech rider, hotel block, insurance cert. Typed primitives prevent schema drift at scale.",
      },
      {
        title: "Portals without seats",
        body: "Artists, vendors, clients don't count as users. They open a slug URL scoped by RLS. Your per-org bill doesn't grow as your stakeholder count does.",
      },
      {
        title: "Field tooling",
        body: "COMPVSS handles the gate. Sub-100ms atomic check-in, offline queue, no cell signal required.",
      },
    ],
    whenTheyWin: [
      "You need a fully custom workflow we haven't modeled. Our strength is standard production patterns — open-ended columns give teams more freedom for non-standard work.",
      "You already use a board tool for cross-department reporting and need consistent data across business units.",
    ],
    migration: [
      "CSV + board export is well-structured; our import adapter reads it directly",
      "Column types map: status → status, people → members, date → due_date, formula → custom field",
      "Automations → our webhooks; we provide a mapping doc",
    ],
    faqs: [
      {
        q: "Can the LYTEHAUS Technologies suite do everything a flexible board can?",
        a: "For production workflows, yes and more. For generic business tracking — warehouse inventory, hiring pipelines, software bugs — flexible boards offer more freedom. If you run events, we're optimized for that. If you're a 500-person conglomerate with many business units, a horizontal tool covers more ground.",
      },
      {
        q: "What about pricing?",
        a: "LYTEHAUS Professional is $199/month per org, unlimited users. Every stakeholder beyond the core team is free on our side.",
      },
    ],
    keywords: [
      "ATLVS production management",
      "LYTEHAUS Technologies typed primitives",
      "monday alternative events",
      "production software board tool alternative",
    ],
  },

  spreadsheets: {
    slug: "spreadsheets",
    competitor: "Spreadsheets",
    headline: "Coming from spreadsheets. Here's when the duct tape starts costing more than software.",
    blurb:
      "Every production team starts on spreadsheets. Most stay there too long. Here's the tipping point — and what you reclaim the day you stop.",
    hero: "Spreadsheets are free and infinitely flexible. That's why every production team starts there, and why every production team eventually realizes they're spending 40% of operations maintaining the sheet, not running the show. LYTEHAUS is what comes after the spreadsheet.",
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
      { feature: "Version history beyond 30 days", us: true, them: false },
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
        body: "Every row has typed columns. Status is a controlled enum. Due dates are actual dates. Finance rolls up because it was typed correctly the first time.",
      },
      {
        title: "Access control is real",
        body: "An intern cannot see exec compensation. A vendor cannot see another vendor's pricing. A client cannot edit the production schedule. RLS enforces all of this at the database.",
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
        a: "Three signals. One: someone's full-time role is 'keeps the spreadsheet alive.' Two: you've had a mistake that cost money or relationships and traced it to the sheet. Three: you've tried to give a client or vendor view-only access and ended up sharing the whole file.",
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
      "production management platform",
      "stop using spreadsheets events",
    ],
  },
};

export const COMPARE_LIST = Object.values(COMPARE);
