/**
 * Canonical module catalogue for the marketing surface.
 *
 * Single source of truth for /features/[module] and the programmatic
 * /features/[module]/[industry] farm. Update entries here, not in the
 * page files.
 */

export type ModuleConfig = {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  blurb: string;
  heroTitle: string;
  heroBody: string;
  highlights: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
  related: Array<{ slug: string; label: string }>;
  keywords?: string[];
  /** Optional Without/With problem framing — 3 pain points vs. 3 outcomes. */
  withoutUs?: string[];
  withUs?: string[];
  /** Optional persona strip — who this module is built for. */
  personas?: string[];
  /** Optional pull-quote rendered as Review schema. */
  quote?: { text: string; attribution: string; rating?: number };
};

export const MODULES: Record<string, ModuleConfig> = {
  console: {
    slug: "console",
    name: "Office Console",
    eyebrow: "ATLVS · Office console",
    title: "The production console your team actually uses.",
    blurb:
      "Projects, finance, procurement, production, people, Aurora AI — every internal module in one sidebar, scoped by role.",
    heroTitle: "One console. Every module. Role-aware access.",
    heroBody:
      "ATLVS is where your office team works. Nine modules covering projects, finance, procurement, production, people, advancing, CMS, Aurora AI, and compliance — all reading from the same backbone, all scoped to your organization.",
    highlights: [
      {
        title: "Nine modules",
        body: "Overview, Projects, Advancing, Finance, Procurement, Production, People, CMS, Aurora, Compliance.",
      },
      {
        title: "Role-aware nav",
        body: "Owner, admin, manager, member, viewer — each tier sees exactly what they should, nothing they shouldn't.",
      },
      {
        title: "Data walled off",
        body: "Every row scoped to your organization at the database layer — not just in the app.",
      },
      { title: "Immutable audit log", body: "Who, when, what changed, what it was before. Every action. Exportable." },
      {
        title: "Aurora built in",
        body: "An assistant that reads your projects, crew, and budgets — and drafts from them.",
      },
      { title: "Signed DPA, 99.9% uptime", body: "Signed DPA and 99.9% uptime SLA on the Enterprise tier." },
    ],
    faqs: [
      {
        q: "Can different roles see different modules?",
        a: "Yes. The sidebar is filtered by role. Owners see everything. Members see what they need to execute. Viewers are read-only. Finance-only seats can be scoped to budgets, invoices, expenses, and time — without touching people or procurement.",
      },
      {
        q: "Is my org's data walled off from other orgs?",
        a: "Yes — at the database layer. A user in one org cannot read, update, or delete anything belonging to another org, no matter how they come in. It's enforced on the data itself, not in the app.",
      },
      {
        q: "How is access revoked when someone leaves?",
        a: "Remove the membership. Access dies immediately — in the console, in the portals, in the mobile app, in background jobs. Nothing to propagate, nothing to cache-bust.",
      },
    ],
    related: [
      { slug: "portals", label: "GVTEWAY stakeholder portals" },
      { slug: "mobile", label: "COMPVSS field app" },
      { slug: "ai", label: "Aurora AI assistant" },
    ],
    keywords: ["production management console", "ATLVS", "internal operations software", "event production software"],
  },
  portals: {
    slug: "portals",
    name: "Stakeholder Portals",
    eyebrow: "GVTEWAY · Stakeholder portals",
    title: "Share exactly the right view. Nothing more.",
    blurb:
      "Tailored portals for artists, vendors, clients, sponsors, guests, and crew. No passwords. Revocable in one click.",
    heroTitle: "Six personas. Zero leakage. Branded per project.",
    heroBody:
      "GVTEWAY gives every outside stakeholder a workspace built for them. Artists see their advancing. Vendors see their POs. Clients see their proposal. Guests see their guide. Each link is the access — rotate it and access revokes everywhere, instantly.",
    highlights: [
      {
        title: "Six persona rails",
        body: "Artist, Vendor, Client, Sponsor, Guest, Crew — each with a nav built for their job.",
      },
      {
        title: "Link is the access",
        body: "Share a URL. Revoke it and access ends. No passwords to reset, no accounts to deprovision.",
      },
      {
        title: "Interactive proposals",
        body: "Clients open their link to a scrolling proposal — read, accept or decline, signed in place.",
      },
      { title: "Role-scoped guides", body: "Each persona sees only the Know Before You Go sections written for them." },
      {
        title: "No signup required",
        body: "Your stakeholders never create an account. They click the link, they see their lane.",
      },
      {
        title: "White-label ready",
        body: "Per-project color, logo, and OG image. It feels like your brand, because it is.",
      },
    ],
    faqs: [
      {
        q: "Do external stakeholders need to create accounts?",
        a: "No. Each stakeholder gets a unique link. Open it and you're in — scoped to exactly what that persona is allowed to see. Revoke the link and access ends.",
      },
      {
        q: "Can a vendor see another vendor's pricing?",
        a: "No. Every vendor sees only their own POs, COIs, W-9s, and requisitions — even if they're on the same project. The walls are enforced at the data layer.",
      },
      {
        q: "Can I brand the portal for my client?",
        a: "Yes. Every project has its own color, logo, and OG image. Your client sees their brand; the plumbing underneath stays the same.",
      },
    ],
    related: [
      { slug: "console", label: "ATLVS console" },
      { slug: "proposals", label: "Interactive Proposals" },
      { slug: "guides", label: "Event Guides (KBYG)" },
    ],
    keywords: ["stakeholder portal", "client portal software", "vendor portal", "event guest portal", "crew portal"],
  },
  mobile: {
    slug: "mobile",
    name: "Field Mobile App",
    eyebrow: "COMPVSS · Field kit",
    title: "Install it once. Works when the venue doesn't.",
    blurb:
      "Ticket scan, geo-verified clock-in, inventory, incident reports — from any phone. Keeps working when venue signal drops.",
    heroTitle: "A field kit, not an app store submission.",
    heroBody:
      "COMPVSS installs from the browser — no app store, no build pipeline, no version fragmentation. Your crew opens a link, adds it to the home screen, and has a full-screen scanner that works on day one. And on the worst day, when venue signal drops, it keeps working.",
    highlights: [
      {
        title: "Install from the browser",
        body: "A mobile app you add from the web — no app store, no approval queue. Ready on day one.",
      },
      {
        title: "Offline-first",
        body: "Scanner, today's call sheet, and the guide cached locally. Load with zero bars.",
      },
      { title: "No duplicate scans", body: "Every ticket scans exactly once, even under concurrent load at the gate." },
      {
        title: "Scan queue replays",
        body: "Offline scans queue on the device, then sync in order when signal returns. No scan gets lost.",
      },
      {
        title: "Geo-verified clock-in",
        body: "GPS check with a graceful manual fallback when the venue's a dead zone.",
      },
      { title: "Incident reports", body: "Photos, location, witnesses — admin and EHS paged immediately on network." },
    ],
    faqs: [
      {
        q: "Is COMPVSS a native iOS or Android app?",
        a: "No — and that's the point. It's a mobile app you install straight from the browser. No app store review, no version fragmentation, no fleet updates. Your crew adds it to their home screen and gets a full-screen experience.",
      },
      {
        q: "What if the venue has zero cell signal?",
        a: "The scanner still works. Scans queue on the device and replay in order when connectivity returns. No scan is ever dropped.",
      },
      {
        q: "How do you prevent duplicate scans at the gate?",
        a: "Every ticket scans exactly once. A second scan hits a clean denial. Sub-100ms server-side — the crew sees the result before they've lowered the phone.",
      },
    ],
    related: [
      { slug: "ticketing", label: "Ticketing" },
      { slug: "guides", label: "Event Guides" },
      { slug: "production", label: "Production Operations" },
    ],
    keywords: ["event check-in app", "offline ticket scanner", "production mobile app"],
  },
  ai: {
    slug: "ai",
    name: "Aurora AI",
    eyebrow: "ATLVS · Aurora AI",
    title: "An assistant that actually knows your org.",
    blurb:
      "Aurora AI reads your projects, crew, and budgets — not the public internet. Drafts riders, RFPs, call sheets, and recaps on demand.",
    heroTitle: "Aurora AI, wired into your production.",
    heroBody:
      "Aurora AI, powered by Brio, drafts from your actual data — your projects, your crew, your budgets, your schedule. Ask for a hospitality rider in the venue's voice. Ask for an RFP for lighting. Ask for a recap. Every conversation is scoped to your workspace and logged.",
    highlights: [
      { title: "Streams responses", body: "Answers stream as they generate — no waiting for the wall of text." },
      {
        title: "Grounded in your data",
        body: "Riders, RFPs, call sheets, recaps, safety briefings — drafted from your projects, not the public internet.",
      },
      {
        title: "Per-org history",
        body: "Every conversation scoped to your workspace, searchable, never cross-organization.",
      },
      {
        title: "Fast or deep",
        body: "Pick the quick model for day-to-day, the deep one when you need reasoning — per conversation.",
      },
      { title: "Cost-controlled", body: "Rate limits and budgets keep runaway usage from ever being a surprise." },
      { title: "Auditable", body: "Every interaction logged — who, when, which model, which data it touched." },
    ],
    faqs: [
      {
        q: "Does Aurora see other orgs' data?",
        a: "No. Every tool the assistant can call is scoped to your organization. It can't reach into anyone else's data — by design.",
      },
      {
        q: "Which model does it use?",
        a: "A fast model by default for day-to-day work, with a deep-reasoning model available per conversation for heavier tasks like proposal drafting or contract review.",
      },
      {
        q: "Do you train on our data?",
        a: "No. We don't train models — we're a production platform. Your data stays your data.",
      },
    ],
    related: [
      { slug: "console", label: "ATLVS console" },
      { slug: "proposals", label: "Proposals" },
      { slug: "advancing", label: "Advancing" },
    ],
    keywords: ["Aurora AI", "AI assistant", "AI for event production", "production AI"],
  },
  finance: {
    slug: "finance",
    name: "Finance",
    eyebrow: "ATLVS · Finance",
    title: "Finance that speaks production.",
    blurb:
      "Invoices, expenses, budgets, time, mileage, advances, vendor payouts, live P&L — modeled for how shows actually get paid for.",
    heroTitle: "The numbers your accountant understands.",
    heroBody:
      "Budgets roll up by project and category. Expenses attach receipts. Time and mileage flow into payroll. Advances reconcile against deliverables on close-out. Clients pay by card or ACH. Vendors get paid out directly. We never touch your money.",
    highlights: [
      { title: "Budgets", body: "Per-project budget lines with committed, actual, and variance in real time." },
      { title: "Invoices", body: "Line-itemed, branded, PDF-ready. Pay by card or ACH." },
      { title: "Expenses", body: "Receipts attached, category rollups, approval flow, reimbursable flag." },
      { title: "Time", body: "Start-stop clock or bulk entry. Exports clean to payroll." },
      { title: "Mileage", body: "Trip logs with deductible and reimbursable rates." },
      { title: "Advances", body: "Cash advances tracked against the deliverables they paid for." },
    ],
    faqs: [
      {
        q: "Does it replace QuickBooks?",
        a: "No — it feeds it. We capture production-native data (show dates, crew shifts, per-day advances) cleanly, then export to your accounting system. Direct QuickBooks Online sync is on the roadmap.",
      },
      {
        q: "Can crew submit their own expenses?",
        a: "Yes. Crew submit through the portal. Managers approve. The expense writes to the budget and flows out to payroll.",
      },
    ],
    related: [
      { slug: "procurement", label: "Procurement" },
      { slug: "advancing", label: "Advancing" },
      { slug: "console", label: "ATLVS console" },
    ],
    keywords: ["production finance software", "event budget tracking", "show accounting"],
  },
  procurement: {
    slug: "procurement",
    name: "Procurement",
    eyebrow: "ATLVS · Procurement",
    title: "Requisitions, POs, vendor compliance, payouts.",
    blurb: "Requisition to PO to delivery to invoice — with COIs and W-9s on file and direct vendor payouts.",
    heroTitle: "From request to payout. End to end.",
    heroBody:
      "A crew member requests from the field. A manager turns it into a PO against a vendor who has COI and W-9 on file. Delivery gets scanned. The vendor invoices. Payout goes direct — ACH, card, or wire. Every step logged.",
    highlights: [
      { title: "Vendors", body: "Profiles, categories, COI expiry tracking, W-9 uploads." },
      { title: "Requisitions", body: "Crew-initiated requests with approval thresholds." },
      { title: "Purchase orders", body: "Line-itemed, versioned, signed by the vendor." },
      {
        title: "Direct payouts",
        body: "Vendors onboard a payout account and get paid directly — ACH, card, or international wire.",
      },
      {
        title: "Compliance gating",
        body: "POs blocked if COI is expired or W-9 is missing. No surprises on audit day.",
      },
      { title: "Portal integration", body: "Vendors see their POs and invoices in their own portal." },
    ],
    faqs: [
      {
        q: "What happens if a vendor's COI expires?",
        a: "New POs against that vendor block automatically, and the vendor flags in ATLVS until the document is refreshed. Existing POs stay valid.",
      },
      {
        q: "Do vendors need an account to receive payment?",
        a: "For direct payouts, yes — each vendor onboards a payout account from their portal. Traditional ACH or check workflows work too. Direct payout is optional.",
      },
    ],
    related: [
      { slug: "finance", label: "Finance" },
      { slug: "portals", label: "Vendor Portal" },
      { slug: "compliance", label: "Compliance" },
    ],
    keywords: ["procurement software", "purchase order system", "vendor management", "vendor payouts"],
  },
  production: {
    slug: "production",
    name: "Production",
    eyebrow: "ATLVS · Production",
    title: "Equipment, rentals, fabrication, logistics.",
    blurb: "Track inventory across the season, dispatch to shows, reconcile returns — tied to the field scanner.",
    heroTitle: "Where the gear lives between shows.",
    heroBody:
      "Every asset — truss, LED wall, comms, barricade — tracked across its lifecycle. Outbound dispatch, in-field scans, damage reports, sub-rentals, fabrication orders. One source of truth, tied to the field app.",
    highlights: [
      { title: "Equipment registry", body: "Every asset tagged with status across its lifecycle." },
      { title: "Rentals", body: "Sub-rentals in, with return date tracking and automatic follow-ups." },
      { title: "Fabrication orders", body: "Shop work with cost, timeline, and delivery photos." },
      { title: "Dispatch sheets", body: "Per-show load-out, checked in at venue via the field scanner." },
      { title: "Damage reports", body: "Photos and cost estimates. Billed automatically to sub or client." },
      { title: "Cross-season view", body: "Where is each asset right now? Is it available next weekend?" },
    ],
    faqs: [
      {
        q: "Do we need barcode hardware?",
        a: "No. The field app uses the phone camera. If you already have hardware scanners, they work too.",
      },
      {
        q: "Can we track sub-rentals?",
        a: "Yes. Sub source, return date, associated PO — all captured. Late returns flag in the procurement rail.",
      },
    ],
    related: [
      { slug: "mobile", label: "COMPVSS field app" },
      { slug: "procurement", label: "Procurement" },
      { slug: "console", label: "ATLVS console" },
    ],
    keywords: ["production inventory", "equipment tracking", "rental management", "fabrication tracking"],
  },
  compliance: {
    slug: "compliance",
    name: "Compliance",
    eyebrow: "ATLVS · Compliance",
    title: "Audit, retention, SOC 2 posture.",
    blurb: "Data walled off per organization. Immutable audit log. Retention policies. Signed DPA on Enterprise.",
    heroTitle: "Built to pass a security review.",
    heroBody:
      "The ATLVS Technologies platform's security posture is not a checklist — it's enforced on the data. Every organization's data walled off at the deepest layer. Every change written to an immutable audit trail. Files shared through auto-expiring links, not public buckets.",
    highlights: [
      { title: "Data walled off per org", body: "No exceptions. Enforced at the database, not in the app." },
      {
        title: "Immutable audit trail",
        body: "Every change captured — before, after, who, when, from where. Queryable and exportable.",
      },
      { title: "Retention", body: "Configurable per-category retention with soft-delete and purge." },
      {
        title: "Auto-expiring file links",
        body: "Sensitive files share through signed links with short expiry. No public buckets.",
      },
      { title: "Edge security", body: "Strict content and origin rules enforced at the edge." },
    ],
    faqs: [
      {
        q: "Are you SOC 2 certified?",
        a: "SOC 2 Type II is in progress. The controls SOC 2 attests to — access control, change management, audit logging, encryption, monitoring — are already in production. Full posture on /trust.",
      },
      {
        q: "How is tenant isolation enforced?",
        a: "On the data. Every row is scoped to an organization at the database layer, and no application path can return a row from another org — by design.",
      },
    ],
    related: [
      { slug: "console", label: "ATLVS console" },
      { slug: "ai", label: "Aurora AI assistant" },
    ],
    keywords: ["SOC 2 production software", "multi-tenant security", "audit log", "event production compliance"],
  },
  proposals: {
    slug: "proposals",
    name: "Interactive Proposals",
    eyebrow: "ATLVS · Proposals",
    title: "Proposals that scroll, quantify, and close.",
    blurb:
      "Generate full interactive proposals from templates. Scroll-activated sections, live pricing, accept in place.",
    heroTitle: "Stop attaching PDFs. Start sending URLs.",
    heroBody:
      "Clients open a link, scroll through a branded presentation, see live pricing, and accept or decline — every action captured. No DocuSign. No PDF-in-an-email-chain. Every proposal is its own URL, revocable anytime.",
    highlights: [
      { title: "Scroll storytelling", body: "Sections load as the client reads. It feels like a keynote, not a PDF." },
      { title: "Live pricing", body: "Line items, options, upsells, taxes — computed server-side. Not a snapshot." },
      { title: "Accept in place", body: "Accept or decline buttons persist with IP, timestamp, and signature." },
      { title: "Versioned", body: "Every edit creates a new version. Old versions stay addressable." },
      { title: "Revocable share links", body: "Share by link. Revoke instantly. Access dies immediately." },
      {
        title: "Template library",
        body: "Start from proven templates — festival, tour, corporate activation, private event.",
      },
    ],
    faqs: [
      {
        q: "Can clients redline a proposal?",
        a: "Not in v1 — the client flow is accept or decline. Comments are coming. Redlines are handled offline for now and reflected in a new version.",
      },
      {
        q: "Is the accept signature legally binding?",
        a: "It captures IP, timestamp, typed name, and the exact version. Whether that constitutes a binding e-signature in your jurisdiction is a question for your counsel — most US e-sign laws are permissive.",
      },
    ],
    related: [
      { slug: "portals", label: "Client Portal" },
      { slug: "ai", label: "Aurora AI drafting" },
      { slug: "finance", label: "Finance" },
    ],
    keywords: ["interactive proposal software", "event proposal generator", "production proposals"],
  },
  guides: {
    slug: "guides",
    name: "Event Guides (KBYG)",
    eyebrow: "ATLVS · Event guides",
    title: "One Know Before You Go. Every role sees their version.",
    blurb: "A role-scoped KBYG shared across portal and mobile. Written once, rendered differently for each audience.",
    heroTitle: "One source. Six personas. Zero duplication.",
    heroBody:
      "Write a single KBYG per project. A guest sees parking, schedule, FAQ. Crew sees call sheet, radio channels, PPE, SOPs. Artist sees rider, catering, dressing room. Same canonical data, different views — edited once.",
    highlights: [
      { title: "Write once", body: "One guide per project. Every persona auto-scoped to their sections." },
      {
        title: "Section library",
        body: "Overview, schedule, set times, timeline, credentials, contacts, FAQ, SOPs, PPE, radio channels, evacuation, fire safety, accessibility, sustainability, code of conduct — and custom.",
      },
      {
        title: "Auto-scoped render",
        body: "Each viewer lands on the persona view built for them. No manual link-juggling.",
      },
      {
        title: "Portal and mobile",
        body: "Same guide, rendered cleanly whether the viewer is on a laptop or at the gate.",
      },
      {
        title: "Publish flow",
        body: "Draft, preview, publish. Update the morning of the show and every viewer sees the latest.",
      },
      { title: "Revision history", body: "Every publish saves a version. Roll back from the CMS in a click." },
    ],
    faqs: [
      {
        q: "Do guests need an account to view the guide?",
        a: "No. Published guides are readable by the link. Guests see the sections scoped to them — nothing else.",
      },
      {
        q: "How is this different from a PDF KBYG?",
        a: "A PDF can't be scoped by role. It can't be updated the morning of the show. It can't be rolled back. Event guides are all of those — instantly.",
      },
    ],
    related: [
      { slug: "portals", label: "GVTEWAY portals" },
      { slug: "mobile", label: "COMPVSS field app" },
      { slug: "console", label: "CMS in ATLVS" },
    ],
    keywords: ["event guide CMS", "boarding pass KBYG", "know before you go", "event information software"],
  },
  ticketing: {
    slug: "ticketing",
    name: "Ticketing + check-in",
    eyebrow: "COMPVSS · Ticketing",
    title: "Scan tickets faster than anyone at the gate.",
    blurb: "Issue, track, and scan tickets — with an offline-first scan queue and sub-100ms response at the gate.",
    heroTitle: "Sub-100ms server-side. Zero duplicates.",
    heroBody:
      "Tickets issue in ATLVS, deliver as QR codes, and scan in COMPVSS. Every ticket scans exactly once, even under concurrent load. Offline scans queue on the device and replay in order when the signal comes back.",
    highlights: [
      { title: "Issue in ATLVS", body: "Generate tickets by allocation, by persona, with QR codes ready to go." },
      { title: "Scan in COMPVSS", body: "Phone camera. Sub-100ms scan response. Four clear result states." },
      {
        title: "Zero duplicates",
        body: "Every ticket scans exactly once, even with multiple gates scanning under pressure.",
      },
      { title: "Offline queue", body: "Scans queue on the device and replay in order when the network returns." },
      { title: "Scan history", body: "Every attempt captured with result and scanner identity." },
      { title: "Rate limited", body: "Abuse protection without getting in the way of legitimate traffic." },
    ],
    faqs: [
      {
        q: "What's the scan latency?",
        a: "Sub-100ms server-side. A typical US cell connection adds 200-400ms end to end. Offline scans are instant locally.",
      },
      {
        q: "How do we handle refunded tickets?",
        a: "Void them in ATLVS. A subsequent scan resolves as voided, not accepted — and the scanner sees a clear denial.",
      },
    ],
    related: [
      { slug: "mobile", label: "COMPVSS field app" },
      { slug: "portals", label: "Guest Portal" },
      { slug: "console", label: "ATLVS" },
    ],
    keywords: ["event ticketing", "QR ticket scanner", "offline check-in"],
  },
  advancing: {
    slug: "advancing",
    name: "Advancing",
    eyebrow: "ATLVS · Advancing",
    title: "Advancing, organized by deliverable.",
    blurb:
      "Track 16 standard deliverable types per show — tech rider, hospitality, stage plot, input list, COI, credentials — with comments, history, and attachments.",
    heroTitle: "Stop advancing in email threads.",
    heroBody:
      "Every show has a predictable set of deliverables: tech rider, hospitality, ground transport, hotel block, stage plot, input list, insurance certs, credentials. Advancing tracks each as its own typed item — with status, owner, due date, comments, attachments, and full history.",
    highlights: [
      {
        title: "16 deliverable types",
        body: "Tech rider, hospitality, ground transport, hotel, stage plot, input list, COI, passes, and more.",
      },
      {
        title: "Per-deliverable thread",
        body: "Comments, mentions, status changes — every change written to history.",
      },
      { title: "File attachments", body: "PDFs, diagrams, riders — delivered through auto-expiring signed links." },
      { title: "Status workflow", body: "Draft, sent, received, approved, complete — with automatic notifications." },
      { title: "Overdue tracking", body: "The dashboard surfaces what's slipping against show dates." },
      {
        title: "Portal exposure",
        body: "Artists and vendors see their deliverables in their own portal and upload responses directly.",
      },
    ],
    faqs: [
      {
        q: "Why not just use email and a shared drive?",
        a: "Because email doesn't have status, history, or role-scoped access. Advancing tracks what a thread can't — who's waiting on what, what slipped, and who approved.",
      },
      {
        q: "Can external parties upload directly?",
        a: "Yes. Artists and vendors see their deliverables in their portal and upload files there. Everything writes back to the advancing record for your team.",
      },
    ],
    related: [
      { slug: "console", label: "ATLVS console" },
      { slug: "portals", label: "Stakeholder Portals" },
      { slug: "finance", label: "Finance (advances)" },
    ],
    keywords: ["event advancing software", "show advancing", "artist advancing", "production advancing workflow"],
  },
  "procore-parity": {
    slug: "procore-parity",
    name: "RFIs · Submittals · Punch",
    eyebrow: "ATLVS · Construction-grade ops",
    title: "Construction-grade workflows, built for show calls.",
    blurb:
      "Ball-in-court RFIs, submittal logs, daily logs, punch lists, change orders, payment applications — the construction-ops feature set, retuned for production timelines.",
    heroTitle: "Run the build like a build. Just faster.",
    heroBody:
      "Production schedules don't have time for 14-day RFI cycles. ATLVS gives you the construction-industry workflow primitives — RFIs, submittals, daily logs, punch, change orders, pay apps — clocked to show-day urgency. Routing, official answers, show-ready gates.",
    highlights: [
      {
        title: "RFIs with ball-in-court",
        body: "Question, recipient, due date, official answer. Open RFIs surface on every project dashboard.",
      },
      {
        title: "Submittal log",
        body: "Per-spec submittals with revision history, reviewer routing, and approved-as-noted resolution.",
      },
      {
        title: "Daily logs",
        body: "Weather, manpower, equipment on site, work performed, photos. Auto-populates from time entries.",
      },
      { title: "Punch list", body: "Item, location, trade, photo, due date — closeout view with show-ready gate." },
      {
        title: "Change orders",
        body: "Quantified, priced, approved before the work happens. Writes to the budget on accept.",
      },
      {
        title: "Payment applications",
        body: "Schedule-of-values draws against contract value with retainage. PDF exports for AIA-style billing.",
      },
    ],
    withoutUs: [
      "RFIs lost in email threads — official answers undocumented",
      "Daily logs in a notebook nobody reads after wrap",
      "Punch lists scattered across 6 phone notes apps",
    ],
    withUs: [
      "Every RFI has an owner, a clock, and an official answer",
      "Daily logs roll up to a weather-keyed, photo-evidenced timeline",
      "Punch closes with one gate, with evidence per item",
    ],
    personas: ["Production managers", "Site supervisors", "General contractors", "Build leads"],
    faqs: [
      {
        q: "How does this fit production timelines?",
        a: "Same primitives, retuned for live-events velocity. Construction tooling is built for 18-month projects. Show calls run in 4-12 weeks — we drop the procurement-bidding and BIM-heavy modules and tighten the loop on what matters: ball-in-court routing, daily logs, punch.",
      },
      {
        q: "Does it integrate with our drawings?",
        a: "PDF markup is built in. CAD/Revit/BIM is on the roadmap but isn't where production teams live. Most of our customers reference drawings as PDFs.",
      },
      {
        q: "Can the GC and our team both use it?",
        a: "Yes. GC gets a vendor portal (GVTEWAY) with their RFIs, submittals, and pay apps. Your team works in the console. Same database, different surfaces.",
      },
    ],
    related: [
      { slug: "inspections", label: "Inspections" },
      { slug: "schedule", label: "Schedule + ROS" },
      { slug: "production", label: "Production" },
    ],
    quote: {
      text: "We were running RFIs in a shared Google Doc. The first show we ran on ATLVS, we closed punch a day earlier than scheduled. We're never going back.",
      attribution: "Build lead, immersive-experience studio",
      rating: 5,
    },
    keywords: [
      "construction RFI software",
      "submittal log",
      "punch list software",
      "daily log software",
      "change order tracking",
      "Procore alternative",
    ],
  },
  inspections: {
    slug: "inspections",
    name: "Inspections",
    eyebrow: "ATLVS · Inspections",
    title: "Template-driven inspections across 10 categories.",
    blurb:
      "Rigging, electrical, fire/life-safety, structural, ADA, food service, FOH, BOH, dressing rooms, broadcast — pass/fail per item, photo evidence, signed off.",
    heroTitle: "Inspection workflows the AHJ recognizes.",
    heroBody:
      "Ten built-in inspection templates covering rigging, electrical, fire/life-safety, structural, ADA, food service, FOH, BOH, dressing rooms, and broadcast compounds. Walk a checklist on the phone, capture pass/fail per item, attach photos, sign off. Output is a clean PDF for the AHJ.",
    highlights: [
      {
        title: "10 built-in templates",
        body: "Rigging, electrical, fire/life-safety, structural, ADA, food service, FOH, BOH, dressing rooms, broadcast.",
      },
      {
        title: "Pass/fail per item",
        body: "Every item resolves to pass, fail, or N/A — with notes and photo evidence.",
      },
      { title: "Auto-generated PDF", body: "Clean output with photos, sign-offs, and timestamps for the AHJ binder." },
      { title: "Show-ready gate", body: "Doors open requires every inspection signed off. Soft-block built in." },
      { title: "Custom templates", body: "Your own categories with the same workflow. Build once, reuse every show." },
      { title: "Mobile-first", body: "Walk the room on your phone with COMPVSS. Sync when you exit the gear cage." },
    ],
    withoutUs: [
      "Inspection checklists on clipboards, photos on someone's phone, sign-off page in someone's email",
      "AHJ asks for evidence at 9am show day and three people start searching",
      "Repeat findings season-over-season because last year's notes are lost",
    ],
    withUs: [
      "Every inspection lives in one record with photos, sign-offs, and timestamps",
      "AHJ binder is one PDF export, ready before doors",
      "Trend reports surface recurring findings so they get fixed structurally",
    ],
    personas: ["Production managers", "EHS leads", "Fire marshals", "Rigging supervisors", "ADA coordinators"],
    faqs: [
      {
        q: "Can we build our own inspection templates?",
        a: "Yes. The 10 built-in templates are a starting point — every org can add custom categories with the same item/evidence/sign-off pattern. Templates version, so an updated template doesn't rewrite history.",
      },
      {
        q: "Is the PDF output acceptable to the AHJ?",
        a: "Most are. Output includes inspector name, timestamp, signed photo evidence, and project metadata. Jurisdictions with paper-only requirements still need a clipboard, but the binder behind it lives here.",
      },
    ],
    related: [
      { slug: "procore-parity", label: "RFIs · Submittals · Punch" },
      { slug: "safety", label: "Safety stack" },
      { slug: "compliance", label: "Compliance" },
    ],
    keywords: [
      "event inspection software",
      "rigging inspection",
      "fire inspection checklist",
      "ADA compliance event",
      "AHJ inspection report",
    ],
  },
  schedule: {
    slug: "schedule",
    name: "Schedule + ROS",
    eyebrow: "ATLVS · Schedule",
    title: "Run-of-show, 21-day look-ahead, production calendar.",
    blurb:
      "ROS down to the minute, look-ahead 21 days out, crew availability, conflicts surfaced before they cost you.",
    heroTitle: "The schedule isn't a Gantt chart. It's a show.",
    heroBody:
      "Every show has three time horizons — the minute (run-of-show), the day (production calendar), the month (21-day look-ahead). All three live on the same record. Crew availability conflicts surface before they cost you. ROS publishes to portals so artists, crew, and vendors all see the same minute.",
    highlights: [
      {
        title: "Run-of-show",
        body: "Cued to the minute. Artist arrivals, sound checks, doors, set times, encores, strikes.",
      },
      {
        title: "21-day look-ahead",
        body: "Cross-project view of what's load-in this week and which crew is available next.",
      },
      {
        title: "Production calendar",
        body: "Per-project day-grid with milestones, deadlines, deliverables, and crew calls.",
      },
      { title: "Conflict detection", body: "Surfaces double-booked crew, gear, and venues automatically." },
      {
        title: "Portal publish",
        body: "Crew sees their call. Artists see their set time. Vendors see their delivery window.",
      },
      {
        title: "ICS feed",
        body: "Sync into Google / Outlook / Apple Calendar for the road. Per-persona scope respected.",
      },
    ],
    withoutUs: [
      "ROS in a Google Doc that two people have edited at once",
      "Crew calls texted out the morning of and never reconciled to the budget",
      "Look-ahead lives in a single PM's head until they take a day off",
    ],
    withUs: [
      "ROS is one record, with version history and minute-accurate publish",
      "Crew calls flow from the schedule to the call sheet to the portal to the ICS",
      "21-day look-ahead is a permanent surface every PM can read",
    ],
    personas: ["Production managers", "Stage managers", "Show callers", "Tour managers", "Crew bosses"],
    faqs: [
      {
        q: "Does it replace our show-caller's spreadsheet?",
        a: "It can. ROS is built to the minute with cue numbers, departments, and notes. Show callers tell us it reads like a cue book — same shape, with the rest of the production hanging off it.",
      },
      {
        q: "Can artists see their set time without seeing everything else?",
        a: "Yes. Portals are role-scoped. Artists see set time, sound check, and load-in. They don't see other artists' fees or the run sheet.",
      },
    ],
    related: [
      { slug: "advancing", label: "Advancing" },
      { slug: "guides", label: "Event Guides" },
      { slug: "portals", label: "Portals" },
    ],
    keywords: [
      "run of show software",
      "production calendar",
      "show schedule software",
      "21-day look-ahead",
      "event crew schedule",
    ],
  },
  photos: {
    slug: "photos",
    name: "Photos + Daily Logs",
    eyebrow: "ATLVS · Photos + Logs",
    title: "Project galleries that aren't a phone roll.",
    blurb:
      "Per-project galleries, EXIF-aware, geo-tagged, daily logs with weather and manpower, photo evidence on every record.",
    heroTitle: "Stop AirDropping photos at wrap.",
    heroBody:
      "Every photo on the platform — gallery uploads, daily log evidence, inspection items, incident reports, punch resolutions — lives in one project gallery. EXIF preserved. Geo-tagged when present. Daily logs auto-bundle the day's photos and weather. The wrap recap writes itself.",
    highlights: [
      { title: "Project gallery", body: "Drag-drop bulk upload, EXIF preserved, geo on the map when present." },
      {
        title: "Daily logs",
        body: "Weather pulled from forecast, manpower from time entries, photos from the gallery — one record.",
      },
      {
        title: "Photo evidence inline",
        body: "Inspections, incidents, punch items, RFIs — every record links its photos.",
      },
      { title: "Recap export", body: "End-of-show PDF or ZIP with the season's gallery, grouped by day." },
      { title: "Crew-side capture", body: "COMPVSS field app captures and uploads from the phone, queued offline." },
      { title: "Per-org retention", body: "Set retention by category. Self-expiring shares for client previews." },
    ],
    personas: ["Production coordinators", "Marketing leads", "Tour managers", "Site supervisors"],
    faqs: [
      {
        q: "Where do photos taken in the field go?",
        a: "COMPVSS captures from the phone camera, queues offline if needed, and uploads into the per-project gallery with EXIF and geo intact. They're immediately referenceable from logs and incident reports.",
      },
      {
        q: "Can clients see select photos?",
        a: "Yes. Share auto-expiring signed links to a gallery subset. The client never gets bucket-level access.",
      },
    ],
    related: [
      { slug: "mobile", label: "COMPVSS field app" },
      { slug: "procore-parity", label: "Daily logs" },
      { slug: "safety", label: "Incident evidence" },
    ],
    keywords: ["production photo gallery", "event daily log", "geo-tagged photo evidence", "construction photo log"],
  },
  logistics: {
    slug: "logistics",
    name: "Logistics + Transport",
    eyebrow: "ATLVS · Logistics",
    title: "Freight, dispatch, accommodation blocks, ground transport.",
    blurb:
      "The travel-and-trucking layer most production tools skip. Trucking, ratecard, accommodation, ground transport runs — all on one record.",
    heroTitle: "If it moves, it lives here.",
    heroBody:
      "Trucks, vans, ground transport runs, accommodation blocks, ratecards — the operations layer that runs alongside the show. Every leg has a driver, a vehicle, a manifest, a status. Hotel blocks reconcile against the crew roster. Per-diems flow into finance.",
    highlights: [
      { title: "Freight + trucking", body: "Lanes, drivers, equipment, BOLs, signed POD images." },
      { title: "Ground transport", body: "Crew + talent runs with vehicle, driver, pickup / drop, manifest." },
      { title: "Accommodation blocks", body: "Hotel blocks per show with crew roster reconciliation." },
      { title: "Ratecards", body: "Per-vehicle and per-driver rates with auto-cost rollup to budget." },
      { title: "Per-diems", body: "Auto-calculated by city × day; flow into finance for payroll." },
      { title: "Driver portal", body: "Drivers see their runs in GVTEWAY. POD upload from the phone." },
    ],
    withoutUs: [
      "Trucking on a different spreadsheet from the budget — variance found at wrap",
      "Hotel block reconciliation by hand against the crew roster",
      "Per-diem math redone every Monday",
    ],
    withUs: [
      "Trucking, ground, hotel, per-diem all on one record with budget rollup",
      "Hotel blocks reconcile against the live crew roster automatically",
      "Per-diem rolls into payroll the day it's earned",
    ],
    personas: ["Logistics coordinators", "Tour managers", "Travel coordinators", "Production managers"],
    faqs: [
      {
        q: "Do drivers need an account?",
        a: "No. Drivers get a portal link scoped to their runs — view manifest, upload POD, mark complete. The link is the access; revoke any time.",
      },
      {
        q: "Can we book hotels directly?",
        a: "Not in v1. We track the block, the rate, the roster reconciliation. The booking itself stays with your travel desk or GDS.",
      },
    ],
    related: [
      { slug: "schedule", label: "Schedule" },
      { slug: "finance", label: "Finance" },
      { slug: "portals", label: "Driver portal" },
    ],
    keywords: [
      "tour logistics software",
      "event ground transport",
      "trucking software events",
      "accommodation block management",
      "per diem tracking",
    ],
  },
  safety: {
    slug: "safety",
    name: "Safety Stack",
    eyebrow: "ATLVS · Safety",
    title: "Incidents, OSHA recordables, medical, crisis comms, safeguarding.",
    blurb:
      "The full HSE stack — incident intake, OSHA logs, medical triage, crisis comms, business continuity, cyber-IR, safeguarding, environmental — on the same record as the show.",
    heroTitle: "Safety isn't a binder. It's a system.",
    heroBody:
      "Incidents file from the field on COMPVSS. Recordable status routes to the OSHA log automatically. Medical triage records encrypt at rest. Crisis comms templates publish in one tap. Business continuity, cyber-incident response, safeguarding, environmental — all live as first-class records, not policies in a binder.",
    highlights: [
      {
        title: "Incident intake",
        body: "From the field, anonymous-capable. Photos, location, witnesses. Routes to EHS instantly.",
      },
      { title: "OSHA 300 log", body: "Recordables flow from incidents. 300A summary one click before audit." },
      {
        title: "Medical triage",
        body: "On-show medical records — encrypted at rest, scoped to medical role, retention configurable.",
      },
      {
        title: "Crisis comms",
        body: "Pre-approved templates for weather hold, security incident, evacuation. Publish in one tap.",
      },
      {
        title: "Safeguarding",
        body: "Vulnerable-persons intake separate from medical, with stricter scope and audit.",
      },
      { title: "Environmental", body: "Spill, noise, lighting — capture, log, remediate." },
    ],
    withoutUs: [
      "Incident reports on the back of a clipboard, transcribed Monday morning",
      "OSHA 300A assembled from emails three weeks before audit",
      "Crisis comms drafted in real-time at 2am",
    ],
    withUs: [
      "Field-first incident intake with mandatory evidence and instant EHS routing",
      "OSHA log auto-assembled from the year's incidents",
      "Crisis comms templates pre-approved and one-tap to publish",
    ],
    personas: ["EHS leads", "Safety officers", "Medical leads", "Site security directors", "Compliance officers"],
    faqs: [
      {
        q: "Is medical data encrypted?",
        a: "Yes. Medical records are encrypted at rest with the medical role scope. Retention is configurable per org. Standard HIPAA-safe handling for the data that touches this surface; we are not a covered entity.",
      },
      {
        q: "How does anonymous reporting work?",
        a: "Optional reporter-identity capture. The intake form can run anonymous with optional contact-back. EHS leads see the report; the reporter chooses what they share.",
      },
    ],
    related: [
      { slug: "compliance", label: "Compliance" },
      { slug: "mobile", label: "COMPVSS field app" },
      { slug: "inspections", label: "Inspections" },
    ],
    keywords: [
      "event safety software",
      "OSHA 300 log software",
      "event incident report",
      "crisis comms templates",
      "safeguarding software",
    ],
  },
  knowledge: {
    slug: "knowledge",
    name: "Knowledge Base",
    eyebrow: "ATLVS · Knowledge",
    title: "Tagged articles. Public-form intake. Vendor training.",
    blurb:
      "The org's institutional memory — SOPs, runbooks, vendor training, FAQ, post-mortems — searchable, taggable, exportable.",
    heroTitle: "Where the season's lessons live forever.",
    heroBody:
      "Every season writes new SOPs, new vendor instructions, new post-mortems. Knowledge is the place they live so they outlive the PM who wrote them. Tagged, searchable, exportable. Vendor training tracked back to compliance records.",
    highlights: [
      { title: "Tagged articles", body: "Per-team, per-topic, per-show. Search finds it, tags surface it." },
      {
        title: "Vendor training",
        body: "Articles tagged for vendor onboarding. Acknowledgement tracked to compliance.",
      },
      { title: "Public intake form", body: "External requests file as tagged articles. Triage, assign, resolve." },
      { title: "SOP runbooks", body: "Standard operating procedures with versioning and required-reading flags." },
      { title: "Post-mortems", body: "Show-incident post-mortems with named actions and owners." },
      { title: "Export", body: "Markdown or PDF, per article or per tag. Walk-away on cancel, always." },
    ],
    personas: ["Operations leads", "Vendor managers", "Training coordinators", "Production managers"],
    faqs: [
      {
        q: "How does this differ from a Notion or a Confluence?",
        a: "Knowledge is wired to the rest of the platform. Vendor training acknowledgements write to compliance records. Post-mortems link to the incidents they're about. SOPs surface as required reading on relevant modules. The integration is the value.",
      },
    ],
    related: [
      { slug: "compliance", label: "Compliance" },
      { slug: "forms", label: "Forms" },
      { slug: "console", label: "ATLVS console" },
    ],
    keywords: ["event SOP software", "vendor training records", "production runbook", "team knowledge base"],
  },
  forms: {
    slug: "forms",
    name: "Forms",
    eyebrow: "ATLVS · Forms",
    title: "Custom-field public submission with honeypot anti-spam.",
    blurb:
      "Build a form, share a URL, land submissions in your tenant — no third-party form vendor, no data-residency surprises.",
    heroTitle: "Forms that respect your data residency.",
    heroBody:
      "Every form is yours to shape — define fields, validation, anti-spam in code or in the CMS. Public URLs. Submissions land in your tenant, not in a third-party SaaS. Per-form rate limits and honeypot protection built in.",
    highlights: [
      {
        title: "Custom fields",
        body: "Define field types, validation, required fields, and file uploads in one place.",
      },
      { title: "Public submission", body: "Share a URL — no auth required for the submitter, no third-party scripts." },
      { title: "Honeypot anti-spam", body: "Multi-layer: honeypot, time-delay, rate limit, optional reCAPTCHA." },
      { title: "Conditional logic", body: "Fields show/hide based on prior answers, server-validated on submit." },
      {
        title: "File uploads",
        body: "Direct to your storage bucket via signed URL — no third party touches the file.",
      },
      {
        title: "Webhook on submit",
        body: "Pipe submissions into anywhere — Slack, email, your CRM — via signed webhook.",
      },
    ],
    personas: [
      "Operations leads",
      "Marketing",
      "Vendor coordinators",
      "Sponsorship managers",
      "Volunteer coordinators",
    ],
    faqs: [
      {
        q: "How does this compare to Typeform or Google Forms?",
        a: "Data residency. Submissions land in your tenant, not in a third-party SaaS — meaningful for vendor COIs, volunteer waivers, applicant info. Branding, validation, and webhook delivery are at parity; the difference is whose servers hold the payload.",
      },
      {
        q: "Can we accept file uploads?",
        a: "Yes — direct-to-storage via signed URL. No third party sees the file. Scoped retention per form.",
      },
    ],
    related: [
      { slug: "knowledge", label: "Knowledge Base" },
      { slug: "compliance", label: "Compliance" },
      { slug: "portals", label: "Vendor Portal" },
    ],
    keywords: [
      "event form software",
      "secure form builder",
      "self-hosted forms",
      "Typeform alternative",
      "Google Forms alternative",
    ],
  },
};
