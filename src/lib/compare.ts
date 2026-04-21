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
    headline: "Second Star Technologies vs. Asana: production-native vs. generic work management.",
    blurb: "Asana is great project management software. It isn't event production software. Here's what's missing — and what you stop paying separately for when you switch.",
    hero: "Asana is the default 'we need to organize this' SaaS. For production teams it's a starting point that quickly needs augmentation: a separate portal tool for clients, a separate ticketing platform for events, a separate finance add-on, a separate KBYG wiki, a separate check-in app for the gate. The bill adds up and the seams leak.",
    bottomLine: "If you run shows, you'll outgrow Asana by your fifth event. The Second Star Technologies suite is the production-native spine that doesn't need augmentation.",
    features: [
      { feature: "Task + project management", us: true, them: true },
      { feature: "Stakeholder portals (artist / vendor / client / sponsor / guest / crew)", us: true, them: false, note: "Asana guest access is read-limited and unsuitable for external stakeholders" },
      { feature: "Offline ticket scanning", us: true, them: false },
      { feature: "Race-safe atomic scan (sub-100ms)", us: true, them: false },
      { feature: "Finance (invoices, budgets, expenses, advances)", us: true, them: false, note: "Asana has no finance primitives" },
      { feature: "Procurement (POs, vendor COI/W-9)", us: true, them: false },
      { feature: "Production (equipment, rentals, fabrication)", us: true, them: false },
      { feature: "Interactive proposals (scroll + accept-in-place)", us: true, them: false },
      { feature: "Event guides (role-scoped KBYG)", us: true, them: false },
      { feature: "Streaming AI assistant (Claude)", us: true, them: "Limited", note: "Asana AI is summary-only; no streaming, no drafting workflows" },
      { feature: "RLS-enforced multi-tenancy", us: true, them: true },
      { feature: "SSO + SCIM on enterprise", us: true, them: true },
      { feature: "Per-org pricing (unlimited users)", us: true, them: false, note: "Asana charges per seat" },
      { feature: "Stripe Connect vendor payouts", us: true, them: false },
      { feature: "Mobile PWA with service worker", us: true, them: "Native app only" },
    ],
    whyWeWin: [
      { title: "Production-native primitives", body: "Deliverables, ticket scans, call sheets, vendor COIs, event guides aren't add-ons — they're first-class." },
      { title: "One platform, not seven", body: "You stop paying for Asana + Eventbrite + DocuSign + a portal tool + a KBYG wiki. It's all one subscription." },
      { title: "Stakeholder portals", body: "Your clients, artists, vendors, and sponsors don't need Asana seats. They get a slug URL and see only what they should see." },
      { title: "Show-day mobile", body: "Your scanner works without cell signal. Asana doesn't help at the gate — and it doesn't try to." },
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
    keywords: ["ATLVS vs asana", "Second Star Technologies vs asana", "event production vs asana", "asana alternative for events"],
  },

  monday: {
    slug: "monday",
    competitor: "Monday.com",
    headline: "Second Star Technologies vs. Monday.com: typed primitives vs. a pretty spreadsheet.",
    blurb: "Monday is a lovely general-purpose board. If your team runs shows, you'll need primitives Monday doesn't have — and portals Monday can't safely expose.",
    hero: "Monday.com is flexible. That's its strength and the reason production teams outgrow it. Event operations need typed primitives (deliverables, scans, call sheets, COIs) not just columns you name 'deliverable status.' And they need a way to bring external stakeholders in without giving them seats.",
    bottomLine: "If you can build it in Monday with enough discipline, you can run shows on it. That discipline costs more than the software.",
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
      { title: "Typed, not freeform", body: "A deliverable in ATLVS is a typed entity — tech rider, hotel block, insurance cert. Monday columns are freeform. Typed primitives prevent the 'which column is status this quarter?' drift." },
      { title: "Portals without seats", body: "Artists, vendors, clients don't count as users. They open a slug URL scoped by RLS. Your per-org bill doesn't go up as your stakeholder count grows." },
      { title: "Field tooling", body: "COMPVSS handles the gate. Monday has no scanner, no offline queue, no atomic check-in. You'd pair it with another product." },
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
        q: "Can the Second Star Technologies suite do everything Monday can?",
        a: "For production workflows, yes and more. For generic business tracking — warehouse inventory, hiring pipelines, software bugs — Monday is more flexible. If you run events, we're the better fit. If you're a 500-person conglomerate, Monday covers more ground.",
      },
      {
        q: "What about pricing?",
        a: "Monday Standard is $12/user/month. A 15-person production team is $2,160/year. Our Professional tier is $2,388/year unlimited users — roughly the same headline price but every stakeholder beyond the 15 is free on our side, paid on theirs.",
      },
    ],
    keywords: ["ATLVS vs monday", "Second Star Technologies vs monday", "monday alternative events", "production software vs monday.com"],
  },

  spreadsheets: {
    slug: "spreadsheets",
    competitor: "Spreadsheets",
    headline: "Second Star Technologies vs. spreadsheets: when the duct tape starts costing more than software.",
    blurb: "Every production team starts on spreadsheets. Most stay there too long. Here's the tipping point — and what you gain the day you stop.",
    hero: "Spreadsheets are free. They're also infinitely flexible. That's why every production team starts there, and why every production team eventually realizes they're spending 40% of operations on maintaining the spreadsheet, not running the show.",
    bottomLine: "If you run more than six shows a year, or have more than five people on ops, you are paying for spreadsheets — in hours, not dollars. Here's what you reclaim.",
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
      { title: "Your schema enforces itself", body: "Every row has typed columns. Status is a controlled enum. Due dates are actual dates. Finance rolls up because it was typed correctly the first time — not because someone cleaned it up on Monday morning." },
      { title: "Access control is real", body: "An intern cannot see exec compensation. A vendor cannot see another vendor's pricing. A client cannot edit the production schedule. RLS enforces all of this in the database." },
      { title: "It stops being a person's job", body: "'Owning the spreadsheet' is a full-time role at most 10+ person production shops. That role goes away. Your spreadsheet person becomes a producer again." },
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
    keywords: ["spreadsheet alternative events", "production management vs spreadsheets", "stop using spreadsheets events"],
  },
};

export const COMPARE_LIST = Object.values(COMPARE);
