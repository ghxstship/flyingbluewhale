/**
 * Navigation data — pure strings, no React imports. Icons are referenced by
 * key (`IconName`) and resolved at render time via the registry in
 * `src/components/nav-icons.ts`. Keeping nav.ts free of component
 * references means platform-layout (a Server Component) can hand
 * `platformNav` to PlatformSidebar (a Client Component) through normal
 * props serialization — Lucide components are functions and would be
 * rejected by the RSC serializer if embedded directly.
 */

/** Icon keys recognised by the nav registry. Add new entries to
 *  `src/components/nav-icons.ts` and append the key here. */
export type IconName =
  // Dashboard
  | "LayoutDashboard"
  | "Briefcase"
  | "CheckSquare"
  | "Command"
  // Plan
  | "FolderOpen"
  | "Layers"
  | "Building2"
  | "Map"
  | "GraduationCap"
  | "AlertTriangle"
  | "ShieldCheck"
  | "ClipboardCheck"
  | "FileText"
  // Run
  | "Calendar"
  | "Telescope"
  | "ScrollText"
  | "ListTodo"
  | "CalendarDays"
  | "Play"
  | "MessageCircleQuestion"
  | "ClipboardList"
  // Safety
  | "Siren"
  | "Flame"
  | "Stethoscope"
  | "HeartHandshake"
  | "Search"
  | "ShieldAlert"
  | "ClipboardPlus"
  | "BookOpenCheck"
  // Logistics
  | "Truck"
  | "BedDouble"
  | "Send"
  | "Container"
  | "Warehouse"
  | "UtensilsCrossed"
  | "PackageOpen"
  // People
  | "Users"
  | "HardHat"
  | "BadgeCheck"
  | "UsersRound"
  | "Stamp"
  | "ClipboardSignature"
  | "FileSignature"
  // Production
  | "Wrench"
  | "Speaker"
  | "ArrowLeftRight"
  | "Hammer"
  | "Tent"
  | "Network"
  | "Crosshair"
  | "Radio"
  // Procurement
  | "Store"
  | "Compass"
  | "ShoppingCart"
  | "Package"
  | "PackageCheck"
  | "Inbox"
  | "ListOrdered"
  // Commerce
  | "UserPlus"
  | "Handshake"
  | "Files"
  | "Award"
  | "ConciergeBell"
  | "Ticket"
  | "Receipt"
  | "FileSpreadsheet"
  | "CreditCard"
  | "PiggyBank"
  | "Wallet"
  | "Clock"
  | "ChartBar"
  // Reference
  | "BookOpen"
  | "Atlas"
  | "Bot"
  | "Sparkles"
  | "Leaf"
  | "Spline"
  // Marketplace
  | "Globe"
  | "Megaphone"
  | "MessageSquare"
  | "Mic2"
  | "Music"
  | "Star"
  | "Gavel"
  // Bookings (0003)
  | "TrendingUp"
  | "BarChart3"
  | "Lock"
  | "Coins"
  | "Route"
  // Sales pipeline
  | "GitBranch";

export type NavItem = {
  label: string;
  href: string;
  /** Icon registry key. Resolved to a Lucide component in
   *  `src/components/nav-icons.ts`. Each item carries a unique key. */
  icon?: IconName;
};
/**
 * Optional sub-grouping inside a NavGroup. Use when a class group exceeds
 * Miller's 5-9 band — render section labels as quiet dividers above the
 * items they introduce (Linear / Notion pattern). When `sections` is set,
 * the group renderer ignores `items` and walks sections instead.
 */
export type NavSection = { label: string; items: NavItem[] };
export type NavGroup = { label: string; items: NavItem[]; sections?: NavSection[] };

/**
 * Console nav rendering mode. Per-user preference stored in
 * `user_preferences.ui_state.nav_mode`. Default is `"domain"` (ADR-0006).
 * The `"xpms"` mode renders the ADR-0004 XPMS-numeric sidebar verbatim
 * for power users who internalized the 10-class spine.
 */
export type NavMode = "domain" | "xpms";

/**
 * XPMS-native sidebar (ADR-0004, 2026-05-10) — preserved verbatim as the
 * `navMode: "xpms"` power-user view. ADR-0006 (2026-06-04) demoted this
 * from the operator-default to a toggle, replacing it with
 * `platformNavDomain` below.
 *
 * Sidebar groups are the **10 XPMS Classes** from `XPMS_CLASSES` in
 * src/lib/xpms/index.ts. The class number prefix on each label is
 * deliberate: it's the canonical class code (0–9) per the whitepaper
 * §5, and surfacing it builds operator literacy with the spine. Class
 * order is the published order; do not reshuffle.
 *
 * Time-axis filtering happens above the sidebar — `<PhaseStepper />`
 * binds to `projects.xpms_phase` and dims classes not live in the
 * current phase. The cell map (Class × Phase → route) is in
 * docs/decisions/ADR-0004-xpms-native-nav.md Appendix A.
 *
 * Some routes legitimately span two classes (Catering, Tickets,
 * Wayfinding, Hospitality). The route appears in BOTH class groups so
 * either path resolves; the canonical home for each route is the cell
 * declared in the ADR cell map.
 */
export const platformNavXpms: NavGroup[] = [
  {
    // Workspace chrome — not an XPMS class. Single "you are here" tile
    // at the top of the sidebar, separate from the 10 class groups.
    // ADR-0005: dedupe of the old Inbox/Messages twins — `Notifications`
    // is the personal alerts feed, `Threads` is the org-internal DM/chat
    // history. Two distinct surfaces, two distinct labels.
    label: "Dashboard",
    items: [
      { label: "Overview", href: "/console", icon: "LayoutDashboard" },
      { label: "Notifications", href: "/me/notifications/inbox", icon: "Inbox" },
      { label: "Threads", href: "/console/inbox", icon: "MessageSquare" },
    ],
  },
  {
    // 0 EXECUTIVE — Org-level command + control. Strategy / Finance /
    // Procurement / HR / Compliance, sectioned so a single class doesn't
    // blow Miller's 5-9 band (per docs/ia/03-ia-compression-proposal.md).
    label: "0 EXECUTIVE",
    items: [],
    sections: [
      {
        label: "Strategy",
        items: [
          { label: "Projects", href: "/console/projects", icon: "FolderOpen" },
          { label: "Programs", href: "/console/programs", icon: "Layers" },
          { label: "Venues", href: "/console/venues", icon: "Building2" },
          { label: "Risk Register", href: "/console/programs/risk", icon: "AlertTriangle" },
          // Predictive risk scoring rollup w/ severity trend (round 48).
          { label: "Risk Scores", href: "/console/risk", icon: "ShieldAlert" },
          { label: "Readiness", href: "/console/programs/readiness", icon: "ShieldCheck" },
          { label: "Reviews", href: "/console/programs/reviews", icon: "ClipboardCheck" },
        ],
      },
      // ADR-0005: Finance rebalanced into 4 ledger sub-sections — none
      // exceeds Miller's 5-9 band. Receivables / Payables / Planning /
      // Time & Payroll. The previous flat 14-leaf shape forced a
      // scan-then-click for every finance task; sub-sections restore
      // recognition. Section labels render as Linear-style dividers.
      // Since NavGroup carries one `sections` array, Finance is split
      // across multiple NavGroup-shaped sections inside the EXECUTIVE
      // group: each becomes its own NavSection with a Finance / prefix
      // so the section divider reads as a finance sub-ledger.
      {
        label: "Finance / Receivables",
        items: [
          { label: "Invoices", href: "/console/finance/invoices", icon: "Receipt" },
          { label: "Pay Apps", href: "/console/finance/pay-apps", icon: "FileSpreadsheet" },
          // Lien Waivers — statutory 4-quadrant matrix (round 40).
          { label: "Lien Waivers", href: "/console/finance/lien-waivers", icon: "Stamp" },
          // E-Sign envelopes (DocuSign / Adobe Sign / HelloSign / PandaDoc) — round 46.
          { label: "E-Sign Envelopes", href: "/console/envelopes", icon: "ClipboardSignature" },
          // AP invoice OCR via Anthropic Vision (round 58).
          { label: "AP Invoice OCR", href: "/console/finance/ap-ocr", icon: "Sparkles" },
        ],
      },
      {
        label: "Finance / Payables",
        items: [
          { label: "Expenses", href: "/console/finance/expenses", icon: "CreditCard" },
          { label: "Payouts", href: "/console/finance/payouts", icon: "Wallet" },
        ],
      },
      {
        label: "Finance / Planning",
        items: [
          { label: "Budgets", href: "/console/finance/budgets", icon: "PiggyBank" },
          // WIP + EAC forecasts (round 41).
          { label: "WIP", href: "/console/finance/wip", icon: "FileSpreadsheet" },
          { label: "EAC Forecasts", href: "/console/finance/forecasts", icon: "TrendingUp" },
          { label: "Periods", href: "/console/finance/periods", icon: "CalendarDays" },
          { label: "Reports", href: "/console/finance/reports", icon: "ChartBar" },
        ],
      },
      {
        label: "Finance / Time & Payroll",
        items: [
          { label: "Time", href: "/console/finance/time", icon: "Clock" },
          // Certified payroll — Davis-Bacon, CA DIR, NY PWA, WA L&I (round 45).
          { label: "Certified Payroll", href: "/console/finance/payroll", icon: "FileSignature" },
          { label: "Subscriptions", href: "/console/subscriptions", icon: "BadgeCheck" },
        ],
      },
      {
        label: "Procurement",
        items: [
          { label: "Vendors", href: "/console/procurement/vendors", icon: "Store" },
          { label: "Prequalification", href: "/console/procurement/prequalification", icon: "BookOpenCheck" },
          { label: "Sourcing", href: "/console/procurement/sourcing", icon: "Compass" },
          { label: "Requisitions", href: "/console/procurement/requisitions", icon: "ShoppingCart" },
          { label: "Purchase Orders", href: "/console/procurement/purchase-orders", icon: "Package" },
          { label: "RFQs", href: "/console/procurement/rfqs", icon: "PackageCheck" },
          // Formal Invitations to Bid (round 43) — trade-bundled, prequal-driven.
          { label: "ITB", href: "/console/procurement/itb", icon: "Gavel" },
          { label: "Submittals", href: "/console/submittals", icon: "Inbox" },
          // Unified contracts (prime/sub/consultant/service/rental/purchase) — round 49.
          { label: "Contracts", href: "/console/contracts", icon: "ClipboardSignature" },
          { label: "Rate Card", href: "/console/logistics/ratecard", icon: "ListOrdered" },
        ],
      },
      {
        label: "People & Compliance",
        items: [
          { label: "Directory", href: "/console/people", icon: "Users" },
          { label: "Sustainability", href: "/console/sustainability", icon: "Leaf" },
        ],
      },
    ],
  },
  {
    // 1 CREATIVE — Authoring class. The work itself: design, art
    // direction, brand, IP, source files. Programa lives mostly here.
    label: "1 CREATIVE",
    items: [
      { label: "Proposals", href: "/console/proposals", icon: "FileText" },
      { label: "Proposal Templates", href: "/console/proposals/templates", icon: "Files" },
      // ADR-0005 hoist: project-templates library was an orphan top-
      // level prefix; it's a creative authoring artifact, belongs here.
      { label: "Project Templates", href: "/console/templates", icon: "Files" },
      // Site Plans is a CAD-rooted creative artifact — primary class is
      // CREATIVE, secondary BUILD (where it materializes).
      { label: "Site Plans", href: "/console/site-plans", icon: "Map" },
      // Drawings = versioned sheet sets grouping site_plans for construction
      // delivery (50% DD, 100% CD, etc.). Slip-sheet diff between versions.
      { label: "Drawings", href: "/console/drawings", icon: "Files" },
      // Quantity takeoffs + estimates (round 42).
      { label: "Takeoffs", href: "/console/takeoffs", icon: "Crosshair" },
      { label: "Estimates", href: "/console/estimates", icon: "Coins" },
      // Specifications — CSI MasterFormat / Uniformat / NRM2 spec book.
      // RFIs and submittals link back via spec_section_id (round 36).
      { label: "Specifications", href: "/console/specs", icon: "BookOpen" },
      // BIM Models — IFC/RVT/NWD registry. Viewer pass forthcoming (round 39).
      { label: "BIM Models", href: "/console/bim", icon: "Network" },
    ],
  },
  {
    // 2 TALENT — Anyone in front of the audience: bookings, programming,
    // curation, talent ops, agency, riders. Show economy.
    //
    // ADR-0005: Bookings collapsed from 5 sibling leaves to one entry —
    // /console/bookings is a tabbed landing exposing Deals / Holds /
    // Calendar / Settlements. URLs preserved for deep links.
    label: "2 TALENT",
    items: [
      { label: "Bookings", href: "/console/bookings", icon: "TrendingUp" },
      { label: "Tours", href: "/console/agency/tours", icon: "Route" },
      { label: "Talent Roster", href: "/console/marketplace/talent", icon: "Music" },
      { label: "Offers", href: "/console/marketplace/offers", icon: "Gavel" },
      { label: "Rosters", href: "/console/workforce/rosters", icon: "ClipboardSignature" },
    ],
  },
  {
    // 3 MARKETING — Audience acquisition + revenue partnerships.
    // Sponsorship sales, CRM, public marketplace surfaces.
    //
    // ADR-0005: Marketplace collapsed from 3 siblings (Marketplace + Job
    // Postings + Open Calls) to one entry — /console/marketplace is the
    // hub that tabs into postings/calls/talent/offers/reviews.
    label: "3 MARKETING",
    items: [
      { label: "Leads", href: "/console/leads", icon: "UserPlus" },
      { label: "Pipeline", href: "/console/pipeline", icon: "GitBranch" },
      { label: "Clients", href: "/console/clients", icon: "Handshake" },
      { label: "Sponsors", href: "/console/commercial/sponsors", icon: "Award" },
      { label: "Marketing", href: "/console/marketing", icon: "Megaphone" },
      { label: "Insights", href: "/console/insights", icon: "BarChart3" },
      { label: "Marketplace", href: "/console/marketplace", icon: "Globe" },
    ],
  },
  {
    // 4 BUILD — Everything physically erected on site: site ops, scenic,
    // construction, install, wayfinding, tents, structures.
    label: "4 BUILD",
    items: [
      { label: "Fabrication", href: "/console/production/fabrication", icon: "Hammer" },
      { label: "Compounds", href: "/console/production/compounds", icon: "Tent" },
      { label: "Yard", href: "/console/production/warehouse", icon: "Network" },
      { label: "Punch List", href: "/console/punch", icon: "ClipboardList" },
      // Reality captures + warranty coverage (round 44).
      { label: "Reality Captures", href: "/console/captures", icon: "Telescope" },
      // ADR-0005 hoist: site photo log was an orphan; pairs with
      // captures (drone/360) as the visual progress record for BUILD.
      { label: "Photo Log", href: "/console/photos", icon: "Telescope" },
      { label: "Warranties", href: "/console/warranties", icon: "ShieldCheck" },
    ],
  },
  {
    // 5 PRODUCTION — Show systems: audio, lighting, video, staging,
    // rigging, power, SFX. The technical envelope.
    label: "5 PRODUCTION",
    items: [
      { label: "Equipment", href: "/console/production/equipment", icon: "Wrench" },
      // Per-asset 30/90-day utilization rollup w/ idle-revenue (round 52).
      { label: "Equipment Utilization", href: "/console/production/equipment/utilization", icon: "BarChart3" },
      { label: "AV Inventory", href: "/console/production/av", icon: "Speaker" },
      { label: "Rentals", href: "/console/production/rentals", icon: "ArrowLeftRight" },
      { label: "Production Logistics", href: "/console/production/logistics", icon: "Crosshair" },
      { label: "Run of Show", href: "/console/production/ros", icon: "Play" },
      { label: "Live Dispatch", href: "/console/production/dispatch/live", icon: "Radio" },
    ],
  },
  {
    // 6 OPERATIONS — People + flow. Largest class: event ops, labor,
    // logistics, transport, security, medical, permits. Sectioned so a
    // single class doesn't blow Miller's 5-9 band.
    label: "6 OPERATIONS",
    items: [],
    sections: [
      // ADR-0005: Coordination split into Schedule, Execution, and
      // Service Desk sub-sections; orphan prefixes that already had
      // real pages but no nav entry (/operations, /services/requests,
      // /meetings, /forms, /action-items, /ops/toc) are now surfaced
      // where operators expect to find them.
      {
        label: "Coordination / Schedule",
        items: [
          { label: "Schedule", href: "/console/schedule", icon: "Calendar" },
          // Baselines = CPM Gantt data spine w/ critical path + float (round 38).
          { label: "Schedule Baselines", href: "/console/schedule/baselines", icon: "GitBranch" },
          { label: "Look-Ahead", href: "/console/operations/look-ahead", icon: "Telescope" },
          { label: "Events", href: "/console/events", icon: "CalendarDays" },
          { label: "Meetings", href: "/console/meetings", icon: "CalendarDays" },
        ],
      },
      {
        label: "Coordination / Execution",
        items: [
          { label: "Operations Hub", href: "/console/operations", icon: "Command" },
          { label: "Daily Log", href: "/console/operations/daily-log", icon: "ScrollText" },
          { label: "Tasks", href: "/console/tasks", icon: "ListTodo" },
          { label: "Action Items", href: "/console/action-items", icon: "CheckSquare" },
          { label: "Annotations", href: "/console/annotations", icon: "AlertTriangle" },
          { label: "Forms", href: "/console/forms", icon: "ClipboardList" },
        ],
      },
      {
        label: "Coordination / Correspondence",
        items: [
          // Transmittals — audit-grade dispatch envelope w/ read receipts (round 37).
          { label: "Transmittals", href: "/console/transmittals", icon: "Send" },
          // Email-in inbox — per-project SES capture (round 50).
          { label: "Email Inbox", href: "/console/email-inbox", icon: "Inbox" },
          { label: "RFIs", href: "/console/rfis", icon: "MessageCircleQuestion" },
          { label: "Service Desk", href: "/console/services/requests", icon: "ConciergeBell" },
          { label: "TOC — ITIL", href: "/console/ops/toc", icon: "Network" },
        ],
      },
      {
        label: "Workforce",
        items: [
          { label: "Teams", href: "/console/people/teams", icon: "UsersRound" },
          { label: "Workforce", href: "/console/workforce", icon: "HardHat" },
          // Cross-project capacity vs demand forecast — Bridgit Bench parity (round 48).
          { label: "Resource Forecast", href: "/console/workforce/forecast", icon: "TrendingUp" },
          { label: "Training", href: "/console/workforce/training", icon: "GraduationCap" },
          { label: "Courses", href: "/console/workforce/courses", icon: "BookOpen" },
          { label: "Time Off", href: "/console/workforce/time-off", icon: "Calendar" },
          { label: "Shift Swaps", href: "/console/workforce/shift-swaps", icon: "ArrowLeftRight" },
          { label: "Recognition", href: "/console/workforce/recognition", icon: "Award" },
          { label: "Badges", href: "/console/workforce/badges", icon: "BadgeCheck" },
          { label: "Onboarding", href: "/console/workforce/onboarding", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Engagement",
        items: [
          { label: "Contracts", href: "/console/people/msas", icon: "FileSignature" },
          { label: "Offer Letters", href: "/console/people/offer-letters", icon: "FileText" },
          { label: "Delegations", href: "/console/participants/delegations", icon: "UsersRound" },
          { label: "Visa", href: "/console/participants/visa", icon: "Stamp" },
        ],
      },
      {
        label: "Communications",
        items: [
          { label: "Announcements", href: "/console/comms/announcements", icon: "Megaphone" },
          { label: "Polls", href: "/console/comms/polls", icon: "BarChart3" },
          { label: "Surveys", href: "/console/comms/surveys", icon: "ClipboardCheck" },
        ],
      },
      {
        label: "Logistics",
        items: [
          { label: "Transport", href: "/console/transport", icon: "Truck" },
          { label: "Dispatch", href: "/console/transport/dispatch", icon: "Send" },
          { label: "Freight", href: "/console/logistics/freight", icon: "Container" },
          { label: "Warehouse", href: "/console/logistics/warehouse", icon: "Warehouse" },
          { label: "Disposition", href: "/console/logistics/disposition", icon: "PackageOpen" },
        ],
      },
      // ADR-0005: Safety split into Operational (live-event response) and
      // Compliance (audit-grade record-keeping). Operators in a Show-phase
      // shift only see the four live-response leaves at a glance; the
      // OSHA/playbook compliance set stays available behind its own divider.
      {
        label: "Safety / Operational",
        items: [
          { label: "Incidents", href: "/console/safety/incidents", icon: "Siren" },
          { label: "Crisis", href: "/console/safety/crisis", icon: "Flame" },
          { label: "Medical", href: "/console/safety/medical", icon: "Stethoscope" },
          { label: "Safeguarding", href: "/console/safety/safeguarding", icon: "HeartHandshake" },
        ],
      },
      {
        label: "Safety / Compliance",
        items: [
          { label: "Inspections", href: "/console/inspections", icon: "Search" },
          { label: "OSHA 300", href: "/console/safety/osha", icon: "ShieldAlert" },
          { label: "Briefings", href: "/console/safety/briefings", icon: "ClipboardPlus" },
          { label: "Playbooks", href: "/console/safety/playbooks", icon: "BookOpenCheck" },
        ],
      },
    ],
  },
  {
    // 7 EXPERIENCE — Audience-facing surface. Guest experience,
    // activations, retail, accessibility, sponsor fulfillment.
    label: "7 EXPERIENCE",
    items: [
      { label: "Tickets", href: "/console/commercial/tickets", icon: "Ticket" },
      { label: "Guest Hospitality", href: "/console/commercial/hospitality", icon: "ConciergeBell" },
      { label: "Accreditation", href: "/console/accreditation", icon: "BadgeCheck" },
    ],
  },
  {
    // 8 HOSPITALITY — Care of body. F&B, bar, catering (artist/crew),
    // lodging, VIP, artist hospitality.
    label: "8 HOSPITALITY",
    items: [
      { label: "Catering", href: "/console/logistics/services", icon: "UtensilsCrossed" },
      { label: "Accommodation", href: "/console/accommodation", icon: "BedDouble" },
    ],
  },
  {
    // 9 TECHNOLOGY — Bits + signals. Networking, IT, RF, ticketing,
    // data, AR/VR/XR, AI. Includes the XPMS Catalog (the atom registry
    // is itself a TECHNOLOGY surface).
    label: "9 TECHNOLOGY",
    items: [
      { label: "Automations", href: "/console/ai/automations", icon: "Bot" },
      // Document-grounded AI assistant w/ RAG citations (round 47).
      { label: "Assistant", href: "/console/assistant", icon: "Sparkles" },
      { label: "Articles", href: "/console/knowledge", icon: "BookOpen" },
      { label: "Guides", href: "/console/guides", icon: "Atlas" },
      // ADR-0005 hoist: shareable dashboards are a TECHNOLOGY surface
      // (the saved-view registry), not an EXECUTIVE one.
      { label: "Dashboards", href: "/console/dashboards", icon: "ChartBar" },
      // The XPMS Catalog (atom registry) is the canonical TECHNOLOGY-
      // class surface — a typed, searchable atom browse.
      { label: "Catalog", href: "/console/xpms", icon: "Spline" },
    ],
  },
];

/**
 * Domain-noun sidebar (ADR-0006, 2026-06-04) — the operator-default.
 *
 * Seven plain-English groups: Projects · Production · Workforce · Sales ·
 * Finance · Procurement · Operations. No Knowledge / Insights group —
 * Articles route to the Help affordance, Guides land in Operations,
 * Dashboards live in workspace chrome, Assistant in ⌘K + right rail,
 * Automations in Settings → Integrations, Sustainability in Operations →
 * Reporting. Matches Linear / Stripe / Notion / Vercel.
 *
 * URL preservation: every URL in `platformNavXpms` resolves from this
 * shape. Only grouping and labels move. The "Guest Hospitality" entry
 * is renamed "Guest Experience" (same URL `/console/commercial/hospitality`,
 * tabbed internally by hosted persona for Sales-side Hospitality and
 * by audience filter for Operations-side Guest Experience).
 *
 * Pipeline drops as a sidebar entry — it survives as the default kanban
 * view on `/console/leads` (ADR-0006 §"Resolved decisions" #1).
 */
export const platformNavDomain: NavGroup[] = [
  {
    // Workspace chrome — not a domain group. Same shape as platformNavXpms
    // so the rail's top tile stays consistent across nav modes.
    label: "Dashboard",
    items: [
      { label: "Overview", href: "/console", icon: "LayoutDashboard" },
      { label: "Notifications", href: "/me/notifications/inbox", icon: "Inbox" },
      { label: "Threads", href: "/console/inbox", icon: "MessageSquare" },
    ],
  },
  {
    // PROJECTS — Portfolio, Authoring, Design, Estimating, Governance.
    // From XPMS classes 0 (Strategy) + 1 (Creative).
    label: "Projects",
    items: [],
    sections: [
      {
        label: "Portfolio",
        items: [
          { label: "Projects", href: "/console/projects", icon: "FolderOpen" },
          { label: "Programs", href: "/console/programs", icon: "Layers" },
          { label: "Venues", href: "/console/venues", icon: "Building2" },
        ],
      },
      {
        label: "Authoring",
        items: [
          { label: "Proposals", href: "/console/proposals", icon: "FileText" },
          { label: "Proposal Templates", href: "/console/proposals/templates", icon: "Files" },
          { label: "Project Templates", href: "/console/templates", icon: "Files" },
        ],
      },
      {
        label: "Design",
        items: [
          { label: "Site Plans", href: "/console/site-plans", icon: "Map" },
          { label: "Drawings", href: "/console/drawings", icon: "Files" },
          { label: "Specifications", href: "/console/specs", icon: "BookOpen" },
          { label: "BIM Models", href: "/console/bim", icon: "Network" },
        ],
      },
      {
        label: "Estimating",
        items: [
          { label: "Takeoffs", href: "/console/takeoffs", icon: "Crosshair" },
          { label: "Estimates", href: "/console/estimates", icon: "Coins" },
        ],
      },
      {
        label: "Governance",
        items: [
          { label: "Risk Register", href: "/console/programs/risk", icon: "AlertTriangle" },
          { label: "Risk Scores", href: "/console/risk", icon: "ShieldAlert" },
          { label: "Readiness", href: "/console/programs/readiness", icon: "ShieldCheck" },
          { label: "Reviews", href: "/console/programs/reviews", icon: "ClipboardCheck" },
        ],
      },
    ],
  },
  {
    // PRODUCTION — Inventory, Build, Show. The technical envelope gets
    // its own front door (lifecycle-proposal regression fix).
    // From XPMS classes 4 (Build) + 5 (Production).
    label: "Production",
    items: [],
    sections: [
      {
        label: "Inventory",
        items: [
          { label: "Equipment", href: "/console/production/equipment", icon: "Wrench" },
          { label: "Equipment Utilization", href: "/console/production/equipment/utilization", icon: "BarChart3" },
          { label: "AV Inventory", href: "/console/production/av", icon: "Speaker" },
          { label: "Rentals", href: "/console/production/rentals", icon: "ArrowLeftRight" },
        ],
      },
      {
        label: "Build",
        items: [
          { label: "Fabrication", href: "/console/production/fabrication", icon: "Hammer" },
          { label: "Compounds", href: "/console/production/compounds", icon: "Tent" },
          { label: "Yard", href: "/console/production/warehouse", icon: "Network" },
          { label: "Punch List", href: "/console/punch", icon: "ClipboardList" },
          { label: "Reality Captures", href: "/console/captures", icon: "Telescope" },
          { label: "Photo Log", href: "/console/photos", icon: "Telescope" },
          { label: "Warranties", href: "/console/warranties", icon: "ShieldCheck" },
        ],
      },
      {
        label: "Show",
        items: [
          { label: "Run of Show", href: "/console/production/ros", icon: "Play" },
          { label: "Live Dispatch", href: "/console/production/dispatch/live", icon: "Radio" },
          { label: "Production Logistics", href: "/console/production/logistics", icon: "Crosshair" },
        ],
      },
    ],
  },
  {
    // WORKFORCE — Directory, Engagement, Development, Time & Recognition.
    // From XPMS class 6 (Workforce + Engagement).
    label: "Workforce",
    items: [],
    sections: [
      {
        label: "Directory",
        items: [
          { label: "Directory", href: "/console/people", icon: "Users" },
          { label: "Teams", href: "/console/people/teams", icon: "UsersRound" },
          { label: "Workforce", href: "/console/workforce", icon: "HardHat" },
        ],
      },
      {
        label: "Engagement",
        items: [
          { label: "Contracts", href: "/console/people/msas", icon: "FileSignature" },
          { label: "Offer Letters", href: "/console/people/offer-letters", icon: "FileText" },
          { label: "Delegations", href: "/console/participants/delegations", icon: "UsersRound" },
          { label: "Visa", href: "/console/participants/visa", icon: "Stamp" },
          { label: "Rosters", href: "/console/workforce/rosters", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Development",
        items: [
          { label: "Training", href: "/console/workforce/training", icon: "GraduationCap" },
          { label: "Courses", href: "/console/workforce/courses", icon: "BookOpen" },
          { label: "Onboarding", href: "/console/workforce/onboarding", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Time & Recognition",
        items: [
          { label: "Time Off", href: "/console/workforce/time-off", icon: "Calendar" },
          { label: "Shift Swaps", href: "/console/workforce/shift-swaps", icon: "ArrowLeftRight" },
          { label: "Recognition", href: "/console/workforce/recognition", icon: "Award" },
          { label: "Badges", href: "/console/workforce/badges", icon: "BadgeCheck" },
          { label: "Resource Forecast", href: "/console/workforce/forecast", icon: "TrendingUp" },
          // Connecteam/Deputy parity — projected vs actual hours + labor cost per date/role.
          { label: "Labor Demand", href: "/console/workforce/labor", icon: "BarChart2" },
        ],
      },
    ],
  },
  {
    // SALES — Pipeline & Partners, Hospitality, Marketplace, Revenue.
    // Pipeline demoted to a saved view on /console/leads (ADR-0006 #1).
    // Hospitality internally tabs by hosted persona: Talent / Sponsors /
    // Athletes / Industry / Media & Press / VVIP (ADR-0006 #2).
    // Analytics = /console/insights (per-domain analytics in their
    // domain — Stripe pattern, ADR-0006 #4).
    // From XPMS classes 2 (Talent — bookings) + 3 (Marketing).
    label: "Sales",
    items: [],
    sections: [
      {
        label: "Pipeline & Partners",
        items: [
          { label: "Leads", href: "/console/leads", icon: "UserPlus" },
          { label: "Clients", href: "/console/clients", icon: "Handshake" },
          { label: "Sponsors", href: "/console/commercial/sponsors", icon: "Award" },
          { label: "Marketing", href: "/console/marketing", icon: "Megaphone" },
        ],
      },
      {
        label: "Hospitality",
        items: [{ label: "Hospitality", href: "/console/commercial/hospitality", icon: "ConciergeBell" }],
      },
      {
        label: "Marketplace",
        items: [
          { label: "Marketplace", href: "/console/marketplace", icon: "Globe" },
          { label: "Bookings", href: "/console/bookings", icon: "TrendingUp" },
          { label: "Tours", href: "/console/agency/tours", icon: "Route" },
          { label: "Talent Roster", href: "/console/marketplace/talent", icon: "Music" },
          { label: "Offers", href: "/console/marketplace/offers", icon: "Gavel" },
        ],
      },
      {
        label: "Revenue",
        items: [
          { label: "Tickets", href: "/console/commercial/tickets", icon: "Ticket" },
          { label: "Analytics", href: "/console/insights", icon: "BarChart3" },
        ],
      },
    ],
  },
  {
    // FINANCE — Receivables, Payables, Planning, Time & Payroll.
    // Unchanged from ADR-0005's Finance sub-sectioning; just lifts to a
    // top-level group instead of nesting under EXECUTIVE.
    label: "Finance",
    items: [],
    sections: [
      {
        label: "Receivables",
        items: [
          { label: "Invoices", href: "/console/finance/invoices", icon: "Receipt" },
          { label: "Pay Apps", href: "/console/finance/pay-apps", icon: "FileSpreadsheet" },
          { label: "Lien Waivers", href: "/console/finance/lien-waivers", icon: "Stamp" },
          { label: "E-Sign Envelopes", href: "/console/envelopes", icon: "ClipboardSignature" },
          { label: "AP Invoice OCR", href: "/console/finance/ap-ocr", icon: "Sparkles" },
        ],
      },
      {
        label: "Payables",
        items: [
          { label: "Expenses", href: "/console/finance/expenses", icon: "CreditCard" },
          { label: "Payouts", href: "/console/finance/payouts", icon: "Wallet" },
        ],
      },
      {
        label: "Planning",
        items: [
          { label: "Budgets", href: "/console/finance/budgets", icon: "PiggyBank" },
          { label: "WIP", href: "/console/finance/wip", icon: "FileSpreadsheet" },
          { label: "EAC Forecasts", href: "/console/finance/forecasts", icon: "TrendingUp" },
          { label: "Periods", href: "/console/finance/periods", icon: "CalendarDays" },
          { label: "Reports", href: "/console/finance/reports", icon: "ChartBar" },
        ],
      },
      {
        label: "Time & Payroll",
        items: [
          { label: "Time", href: "/console/finance/time", icon: "Clock" },
          { label: "Certified Payroll", href: "/console/finance/payroll", icon: "FileSignature" },
          { label: "Subscriptions", href: "/console/subscriptions", icon: "BadgeCheck" },
        ],
      },
    ],
  },
  {
    // PROCUREMENT — Sourcing, Buying, Reference.
    // Master Catalog moves here from Settings (ADR-0006 §"What moves").
    label: "Procurement",
    items: [],
    sections: [
      {
        label: "Sourcing",
        items: [
          { label: "Vendors", href: "/console/procurement/vendors", icon: "Store" },
          { label: "Prequalification", href: "/console/procurement/prequalification", icon: "BookOpenCheck" },
          { label: "Sourcing", href: "/console/procurement/sourcing", icon: "Compass" },
          { label: "RFQs", href: "/console/procurement/rfqs", icon: "PackageCheck" },
          { label: "ITB", href: "/console/procurement/itb", icon: "Gavel" },
        ],
      },
      {
        label: "Buying",
        items: [
          { label: "Requisitions", href: "/console/procurement/requisitions", icon: "ShoppingCart" },
          { label: "Purchase Orders", href: "/console/procurement/purchase-orders", icon: "Package" },
          { label: "Contracts", href: "/console/contracts", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Reference",
        items: [
          { label: "Rate Card", href: "/console/logistics/ratecard", icon: "ListOrdered" },
          { label: "Submittals", href: "/console/submittals", icon: "Inbox" },
          { label: "Master Catalog", href: "/console/settings/catalog", icon: "Spline" },
        ],
      },
    ],
  },
  {
    // OPERATIONS — Coordination, Communication, Logistics, Safety
    // (Operational + Compliance), Guest Experience, Reporting.
    // Largest group, heavily sub-sectioned. Sustainability moves here
    // as a cross-cutting org-level rollup (ADR-0006 §"What moves").
    // Guides moves into Coordination as operational reference.
    // From XPMS classes 6 (Coordination + Logistics + Safety +
    // Communications) + 7 (Experience) + 8 (Hospitality).
    label: "Operations",
    items: [],
    sections: [
      {
        label: "Coordination",
        items: [
          { label: "Operations Hub", href: "/console/operations", icon: "Command" },
          { label: "Schedule", href: "/console/schedule", icon: "Calendar" },
          { label: "Schedule Baselines", href: "/console/schedule/baselines", icon: "GitBranch" },
          { label: "Look-Ahead", href: "/console/operations/look-ahead", icon: "Telescope" },
          { label: "Tasks", href: "/console/tasks", icon: "ListTodo" },
          { label: "Daily Log", href: "/console/operations/daily-log", icon: "ScrollText" },
          { label: "Action Items", href: "/console/action-items", icon: "CheckSquare" },
          { label: "Annotations", href: "/console/annotations", icon: "AlertTriangle" },
          { label: "Forms", href: "/console/forms", icon: "ClipboardList" },
          { label: "Guides", href: "/console/guides", icon: "Atlas" },
        ],
      },
      {
        label: "Communication",
        items: [
          { label: "Events", href: "/console/events", icon: "CalendarDays" },
          { label: "Meetings", href: "/console/meetings", icon: "CalendarDays" },
          { label: "Announcements", href: "/console/comms/announcements", icon: "Megaphone" },
          { label: "Polls", href: "/console/comms/polls", icon: "BarChart3" },
          { label: "Surveys", href: "/console/comms/surveys", icon: "ClipboardCheck" },
          { label: "Transmittals", href: "/console/transmittals", icon: "Send" },
          { label: "Email Inbox", href: "/console/email-inbox", icon: "Inbox" },
          { label: "RFIs", href: "/console/rfis", icon: "MessageCircleQuestion" },
          { label: "Service Desk", href: "/console/services/requests", icon: "ConciergeBell" },
          { label: "TOC — ITIL", href: "/console/ops/toc", icon: "Network" },
        ],
      },
      {
        label: "Logistics",
        items: [
          { label: "Transport", href: "/console/transport", icon: "Truck" },
          { label: "Dispatch", href: "/console/transport/dispatch", icon: "Send" },
          { label: "Freight", href: "/console/logistics/freight", icon: "Container" },
          { label: "Warehouse", href: "/console/logistics/warehouse", icon: "Warehouse" },
          { label: "Disposition", href: "/console/logistics/disposition", icon: "PackageOpen" },
          { label: "Catering", href: "/console/logistics/services", icon: "UtensilsCrossed" },
          { label: "Accommodation", href: "/console/accommodation", icon: "BedDouble" },
        ],
      },
      {
        label: "Safety / Operational",
        items: [
          { label: "Incidents", href: "/console/safety/incidents", icon: "Siren" },
          { label: "Crisis", href: "/console/safety/crisis", icon: "Flame" },
          { label: "Medical", href: "/console/safety/medical", icon: "Stethoscope" },
          { label: "Safeguarding", href: "/console/safety/safeguarding", icon: "HeartHandshake" },
        ],
      },
      {
        label: "Safety / Compliance",
        items: [
          { label: "Inspections", href: "/console/inspections", icon: "Search" },
          { label: "OSHA 300", href: "/console/safety/osha", icon: "ShieldAlert" },
          { label: "Briefings", href: "/console/safety/briefings", icon: "ClipboardPlus" },
          { label: "Playbooks", href: "/console/safety/playbooks", icon: "BookOpenCheck" },
        ],
      },
      {
        label: "Guest Experience",
        items: [
          { label: "Accreditation", href: "/console/accreditation", icon: "BadgeCheck" },
          // Same URL as Sales → Hospitality; the surface will eventually
          // filter by ?audience=guest. Active-route highlight goes to
          // whichever entry appears first in nav order (Sales appears
          // earlier — known limitation, captured in ADR-0006 §2).
          { label: "Guest Experience", href: "/console/commercial/hospitality", icon: "ConciergeBell" },
        ],
      },
      {
        label: "Reporting",
        items: [{ label: "Sustainability", href: "/console/sustainability", icon: "Leaf" }],
      },
    ],
  },
];

/**
 * Default platform nav export — points to the ADR-0006 domain-noun shape.
 * Consumers that import `platformNav` automatically get the new default.
 * To pick by user preference at the layout level, use `getPlatformNav()`.
 */
export const platformNav: NavGroup[] = platformNavDomain;

/**
 * Resolver — pick the sidebar shape for a given nav mode.
 * Use from server-component layouts: read `nav_mode` from the user's
 * preferences (defaults to `"domain"`), call this, pass result to
 * `<PlatformSidebar groups={...} />`.
 */
export function getPlatformNav(mode: NavMode | undefined | null): NavGroup[] {
  return mode === "xpms" ? platformNavXpms : platformNavDomain;
}

/**
 * Settings sidebar — rendered inside `/console/settings/layout.tsx` as a
 * dedicated 2-col admin area. Extracted from `platformNav` 2026-04 so the
 * primary sidebar doesn't carry 14 admin items.
 */
export const settingsNav: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Organization", href: "/console/settings/organization" },
      { label: "Branding", href: "/console/settings/branding" },
      { label: "Domains", href: "/console/settings/domains" },
      { label: "Email Templates", href: "/console/settings/email-templates" },
      { label: "Locations", href: "/console/locations" },
      { label: "Marketplace", href: "/console/marketplace/settings" },
    ],
  },
  {
    label: "Team & Access",
    items: [
      { label: "Roles", href: "/console/people/roles" },
      { label: "Invites", href: "/console/people/invites" },
      { label: "Account Managers", href: "/console/settings/account-managers" },
      { label: "Governance", href: "/console/settings/governance" },
    ],
  },
  {
    // ADR-0006: Master Catalog moved from here to Procurement → Reference
    // (operational sourcing concern, not admin). Time-Clock Zones stays
    // as it's purely org-level field configuration.
    label: "Field Config",
    items: [{ label: "Time-Clock Zones", href: "/console/settings/time-clock-zones" }],
  },
  {
    label: "Billing & Data",
    items: [
      { label: "Billing", href: "/console/settings/billing" },
      { label: "Exports", href: "/console/settings/exports" },
      { label: "Imports", href: "/console/settings/imports" },
      // ADR-0005 hoist: the project-level Import Jobs queue surfaced
      // as an orphan top-level prefix; it shares its mental model
      // with Exports, so it lands in the same admin sub-section.
      { label: "Import Jobs", href: "/console/import" },
    ],
  },
  {
    // ADR-0006: Automations moved here (was 9 TECHNOLOGY → Automations).
    // Rationale: automations are config, not knowledge. Settings is the
    // home for config that drives behavior across the app.
    label: "Integrations",
    items: [
      { label: "Apps", href: "/console/settings/integrations" },
      { label: "Marketplace", href: "/console/settings/integrations/marketplace" },
      { label: "Ticketing", href: "/console/settings/integrations/ticketing" },
      { label: "Automations", href: "/console/ai/automations" },
      { label: "API", href: "/console/settings/api" },
      { label: "Webhooks", href: "/console/settings/webhooks" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Audit Log", href: "/console/settings/audit" },
      { label: "Compliance", href: "/console/settings/compliance" },
      { label: "Marketplace Reviews", href: "/console/marketplace/reviews" },
      { label: "Privacy", href: "/console/legal/privacy" },
      { label: "DSAR", href: "/console/legal/privacy/dsar" },
      { label: "Consent", href: "/console/legal/privacy/consent" },
      { label: "Data Map", href: "/console/legal/privacy/datamap" },
      { label: "IP / Trademarks", href: "/console/legal/ip" },
      { label: "Insurance", href: "/console/legal/insurance" },
    ],
  },
];

/**
 * Portal sub-personas — 15 functional roles, each mapped to one of the
 * 10 XPMS classes via `classOfPersona()` below. The XPMS class
 * determines which dashboard template skins the persona's landing
 * surface (ADR-0004 portal collapse — 10 dashboard templates, 1:1 with
 * the spine, instead of inventing a separate portal taxonomy).
 *
 * Three additions vs the original 12 (2026-05-10): promoter, producer,
 * stakeholder — the EXECUTIVE-class external counterparts (board, co-pro,
 * fiscal-strategic) that the prior 12 didn't cover.
 */
export type PortalPersona =
  // EXECUTIVE (0) — board / co-pro / fiscal counterparts
  | "promoter"
  | "producer"
  | "stakeholder"
  // TALENT (2) — in front of audience
  | "artist"
  | "athlete"
  | "delegation"
  // MARKETING (3) — revenue partners + press
  | "client"
  | "sponsor"
  | "media"
  // OPERATIONS (6) — labor + fulfillment
  | "vendor"
  | "crew"
  | "volunteer"
  | "hospitality"
  // EXPERIENCE (7) — audience-facing
  | "guest"
  | "vip";

/**
 * Map a portal sub-persona to its primary XPMS class (0..9).
 * Used by the portal layout to pick which dashboard template skins the
 * landing surface. The 4 unpopulated classes (CREATIVE 1, BUILD 4,
 * PRODUCTION 5, HOSPITALITY 8, TECHNOLOGY 9) are forward-looking slots
 * — when a future persona lands in one of those classes, only this
 * mapping changes; the dashboard template is already there.
 */
export function classOfPersona(p: PortalPersona): 0 | 2 | 3 | 6 | 7 {
  switch (p) {
    case "promoter":
    case "producer":
    case "stakeholder":
      return 0;
    case "artist":
    case "athlete":
    case "delegation":
      return 2;
    case "client":
    case "sponsor":
    case "media":
      return 3;
    case "vendor":
    case "crew":
    case "volunteer":
    case "hospitality":
      return 6;
    case "guest":
    case "vip":
      return 7;
  }
}

/**
 * Dashboard template slug for an XPMS class. The 10 slugs match the
 * folder names under src/components/xpms/dashboards/. Each slug is a
 * stable identifier that survives class-name changes.
 */
export const XPMS_DASHBOARD_TEMPLATES = {
  0: "executive",
  1: "creative",
  2: "talent",
  3: "marketing",
  4: "build",
  5: "production",
  6: "operations",
  7: "experience",
  8: "hospitality",
  9: "technology",
} as const;
export type XpmsDashboardTemplate = (typeof XPMS_DASHBOARD_TEMPLATES)[keyof typeof XPMS_DASHBOARD_TEMPLATES];

export function dashboardTemplateForPersona(p: PortalPersona): XpmsDashboardTemplate {
  return XPMS_DASHBOARD_TEMPLATES[classOfPersona(p)];
}

/**
 * ADR-0005 — super-persona collapse. 15 sub-personas roll up to 4
 * super-personas, each aligned to its primary XPMS class. The rail
 * shows the super-persona label as its title; the sub-persona name
 * becomes a section divider inside the rail (so the operator still
 * sees "Artist" vs "Athlete" semantics, but the cognitive primary
 * unit is one of 4 super-personas).
 *
 * Sub-persona URL paths (/p/[slug]/<sub-persona>/...) are preserved.
 */
export type SuperPersona = "buyer" | "talent" | "workforce" | "audience";

export function superPersonaOf(p: PortalPersona): SuperPersona {
  switch (p) {
    case "client":
    case "sponsor":
    case "promoter":
    case "stakeholder":
      return "buyer";
    case "artist":
    case "athlete":
    case "delegation":
    case "vip":
    case "hospitality":
    case "media":
    case "producer":
      return "talent";
    case "vendor":
    case "crew":
    case "volunteer":
      return "workforce";
    case "guest":
      return "audience";
  }
}

export const SUPER_PERSONA_LABEL: Record<SuperPersona, string> = {
  buyer: "Buyer",
  talent: "Talent",
  workforce: "Workforce",
  audience: "Audience",
};

const PERSONA_TITLE: Record<PortalPersona, string> = {
  promoter: "Promoter",
  producer: "Producer",
  stakeholder: "Stakeholder",
  artist: "Artist",
  athlete: "Athlete",
  delegation: "Delegation",
  client: "Client",
  sponsor: "Sponsor",
  media: "Media",
  vendor: "Vendor",
  crew: "Crew",
  volunteer: "Volunteer",
  hospitality: "Hospitality",
  guest: "Guest",
  vip: "VIP",
};

export function portalNav(slug: string, persona: PortalPersona): NavGroup {
  const base = `/p/${slug}/${persona}`;
  const guide: NavItem = { label: "Guide", href: `/p/${slug}/guide` };
  const privacy: NavItem = { label: "Privacy", href: `${base}/privacy` };
  // Shared portal-wide surfaces (announcements + inbox) live above the
  // persona slug so they're visible from every persona's rail. The
  // Updates feed reads org announcements filtered to portal audiences;
  // the Inbox reads `public.notifications` filtered to the caller.
  const updates: NavItem = { label: "Updates", href: `/p/${slug}/announcements` };
  const inbox: NavItem = { label: "Inbox", href: `/p/${slug}/inbox` };
  const tasks: NavItem = { label: "Tasks", href: `/p/${slug}/tasks` };
  const messages: NavItem = { label: "Messages", href: `/p/${slug}/messages` };
  // ADR-0005: workspace items (the shared 6) lift into their own section
  // so the persona-specific section stays inside Miller's band. Every
  // persona rail used to start with these 6, eating the operator's
  // recognition budget before any persona-specific work appeared.
  const overview: NavItem = { label: "Overview", href: base };
  const workspaceSection: NavSection = {
    label: "Workspace",
    items: [overview, guide, updates, inbox, tasks, messages],
  };
  // Only persona-specific items here — the shared 6 (Overview, Guide,
  // Updates, Inbox, Tasks, Messages) live in `workspaceSection` above
  // and render as a separate section in the rail. Privacy is included
  // where it's persona-relevant (most external personas).
  const personaSubItems: Record<PortalPersona, NavItem[]> = {
    // EXECUTIVE (0) — board / co-pro / fiscal counterparts.
    promoter: [
      { label: "Co-Pro Splits", href: `${base}/co-pro` },
      { label: "Settlements", href: `${base}/settlements` },
      { label: "Tour P&L", href: `${base}/tour-pnl` },
      { label: "Marketing Milestones", href: `${base}/marketing` },
      { label: "Approvals", href: `${base}/approvals` },
      privacy,
    ],
    producer: [
      { label: "Portfolio", href: `${base}/portfolio` },
      { label: "Tracker", href: `${base}/tracker` },
      { label: "P&L", href: `${base}/pnl` },
      { label: "Risk", href: `${base}/risk` },
      { label: "Readiness", href: `${base}/readiness` },
      { label: "Approvals", href: `${base}/approvals` },
      { label: "Reviews", href: `${base}/reviews` },
      privacy,
    ],
    stakeholder: [
      { label: "Portfolio", href: `${base}/portfolio` },
      { label: "P&L", href: `${base}/pnl` },
      { label: "Governance", href: `${base}/governance` },
      { label: "Sustainability", href: `${base}/sustainability` },
      { label: "Audit Trail", href: `${base}/audit` },
      privacy,
    ],
    // TALENT (2) — in front of the audience.
    artist: [
      { label: "Advancing", href: `${base}/advancing` },
      { label: "Catering", href: `${base}/catering` },
      { label: "Venue", href: `${base}/venue` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Travel", href: `${base}/travel` },
      privacy,
    ],
    athlete: [
      { label: "Requests", href: `${base}/requests` },
      { label: "Training", href: `${base}/training` },
      { label: "Safeguarding", href: `${base}/safeguarding` },
      { label: "Visa", href: `${base}/visa` },
      privacy,
    ],
    delegation: [
      { label: "Entries", href: `${base}/entries` },
      { label: "Rate Card", href: `${base}/ratecard` },
      { label: "Bookings", href: `${base}/bookings` },
      { label: "Meetings", href: `${base}/meetings` },
      { label: "Cases", href: `${base}/cases` },
      { label: "Transport", href: `${base}/transport` },
      { label: "Accommodation", href: `${base}/accommodation` },
      { label: "Visa", href: `${base}/visa` },
      privacy,
    ],
    // MARKETING (3) — revenue partners + press.
    client: [
      { label: "Proposals", href: `${base}/proposals` },
      { label: "Deliverables", href: `${base}/deliverables` },
      { label: "Invoices", href: `${base}/invoices` },
      { label: "Files", href: `${base}/files` },
      privacy,
    ],
    sponsor: [
      { label: "Entitlements", href: `${base}/entitlements` },
      { label: "Activations", href: `${base}/activations` },
      { label: "Assets", href: `${base}/assets` },
      { label: "Reporting", href: `${base}/reporting` },
      privacy,
    ],
    media: [
      { label: "Services", href: `${base}/services` },
      { label: "Accommodation", href: `${base}/accommodation` },
      { label: "Transport", href: `${base}/transport` },
      { label: "Press Conferences", href: `${base}/pressconf` },
      { label: "Info-On-Demand", href: `${base}/info` },
      privacy,
    ],
    // OPERATIONS (6) — labor + fulfillment.
    // ADR-0008 Move 3 — Connecteam-parity surfaces backfilled into vendor
    // alongside the existing engagement items. Same shared components
    // crew uses; the desktop vendor user gets the full workflow without
    // needing the PWA. 13 items pushes Miller's ceiling — ADR-0008
    // §Open questions #1 recommends a Vendor/Engagement +
    // Vendor/Operations split in the rail-renderer pass.
    vendor: [
      { label: "Submissions", href: `${base}/submissions` },
      { label: "Equipment Pull List", href: `${base}/equipment-pull-list` },
      { label: "Purchase Orders", href: `${base}/purchase-orders` },
      { label: "Invoices", href: `${base}/invoices` },
      { label: "Credentials", href: `${base}/credentials` },
      { label: "Training", href: `${base}/training` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Time Off", href: `${base}/time-off` },
      { label: "Feed", href: `${base}/feed` },
      { label: "Chat", href: `${base}/chat` },
      { label: "Kudos", href: `${base}/kudos` },
      { label: "Docs", href: `${base}/docs` },
      { label: "Directory", href: `${base}/directory` },
      privacy,
    ],
    // ADR-0008 Move 2 — Connecteam-parity surfaces backfilled into the
    // portal crew persona so desktop crew users don't have to install
    // the PWA. Same data as /m/* surfaces; shared component extraction
    // (ADR-0008 Move 1) lifts the rendering pattern in a follow-up. v1
    // at 11 items is over Miller's ceiling — future cut splits into
    // Crew/Engagement + Crew/Operations sub-sections.
    crew: [
      { label: "Call Sheet", href: `${base}/call-sheet` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Time", href: `${base}/time` },
      { label: "Time Off", href: `${base}/time-off` },
      { label: "Feed", href: `${base}/feed` },
      { label: "Chat", href: `${base}/chat` },
      { label: "Learning", href: `${base}/learning` },
      { label: "Kudos", href: `${base}/kudos` },
      { label: "Docs", href: `${base}/docs` },
      { label: "Directory", href: `${base}/directory` },
      privacy,
    ],
    volunteer: [
      { label: "Application", href: `${base}/application` },
      { label: "Training", href: `${base}/training` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Uniform", href: `${base}/uniform` },
      privacy,
    ],
    hospitality: [
      { label: "Guests", href: `${base}/guests` },
      { label: "Itinerary", href: `${base}/itinerary` },
      privacy,
    ],
    // EXPERIENCE (7) — audience-facing.
    guest: [
      { label: "Tickets", href: `${base}/tickets` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Logistics", href: `${base}/logistics` },
      privacy,
    ],
    vip: [
      { label: "Transport", href: `${base}/transport` },
      { label: "Accommodation", href: `${base}/accommodation` },
      { label: "Itinerary", href: `${base}/itinerary` },
      privacy,
    ],
  };
  // ADR-0008 Move 3 §Open questions #1 — vendor at 14 items breaks
  // Miller's 9-item ceiling. Split into Engagement (the procurement-side
  // workflow: PO/invoice/credentials/training/time-off/submissions) +
  // Operations (the Connecteam-parity day-to-day: feed/chat/kudos/docs/
  // directory/schedule/equipment-pull). Other personas keep the single
  // persona section since they're already under 10.
  if (persona === "vendor") {
    const items = personaSubItems.vendor;
    const byHref = new Map(items.map((i) => [i.href, i] as const));
    const pick = (slugs: string[]): NavItem[] =>
      slugs.map((s) => byHref.get(`${base}/${s}`)).filter((v): v is NavItem => !!v);
    const engagement: NavSection = {
      label: "Vendor / Engagement",
      items: [...pick(["submissions", "purchase-orders", "invoices", "credentials", "training", "time-off"])],
    };
    const operations: NavSection = {
      label: "Vendor / Operations",
      items: [...pick(["equipment-pull-list", "schedule", "feed", "chat", "kudos", "docs", "directory", "privacy"])],
    };
    return {
      label: SUPER_PERSONA_LABEL[superPersonaOf(persona)],
      items: [],
      sections: [workspaceSection, engagement, operations],
    };
  }
  const personaSection: NavSection = {
    label: PERSONA_TITLE[persona],
    items: personaSubItems[persona],
  };
  return {
    label: SUPER_PERSONA_LABEL[superPersonaOf(persona)],
    items: [],
    sections: [workspaceSection, personaSection],
  };
}

/**
 * Mobile tab bar — 5 generic deskless surfaces (ADR-0006).
 *
 * Was: Home · Gate · Shift · Alerts · Me — too specialized; Gate is a
 * security-team-only tool. SaaS deskless convention (Connecteam, When I
 * Work, Sling) puts Inbox in the primary tab bar so messaging is one
 * tap from anywhere. Gate stays a first-class surface, just reachable
 * via the Tools drawer / persona-routed home rather than the global bar.
 * Persona-routed tab bars (ADR-0009, deferred) will customize per role
 * for security / driver / medic / admin without changing this default.
 */
export const mobileTabs: NavItem[] = [
  { label: "Home", href: "/m" },
  { label: "Inbox", href: "/m/inbox" },
  { label: "Shift", href: "/m/shift" },
  { label: "Alerts", href: "/m/alerts" },
  { label: "Me", href: "/m/settings" },
];

/**
 * Secondary mobile surfaces. Reachable from the Tools tab on /m and
 * from the mobile cmd-K palette. Connecteam-parity additions live in
 * the second cluster.
 *
 * ADR-0005 cleanup: the three near-twins (/m/clock, /m/checkin,
 * /m/check-in) do different things — /m/clock is the punch surface,
 * /m/checkin is the meal-credit read view, /m/check-in is the ticket
 * scanner. Labels rewritten so operators can tell them apart at a
 * glance without having to remember which dash spelling does what.
 */
export const mobileSurfaces: NavItem[] = [
  // Field-ops surfaces (existing).
  { label: "Gate Scan", href: "/m/gate" },
  { label: "Wallet", href: "/m/wallet" },
  { label: "Shift", href: "/m/shift" },
  { label: "Clock In", href: "/m/clock" },
  { label: "Meal Credit", href: "/m/checkin" },
  { label: "Ticket Scan", href: "/m/check-in" },
  { label: "Incident", href: "/m/incidents" },
  { label: "Medic", href: "/m/medic" },
  { label: "Safeguarding", href: "/m/safeguarding" },
  { label: "Alerts", href: "/m/alerts" },
  { label: "Driver", href: "/m/driver" },
  { label: "A&D", href: "/m/ad" },
  { label: "Run of Show", href: "/m/ros" },
  { label: "Guard", href: "/m/guard" },
  { label: "Warehouse", href: "/m/wms" },
  { label: "Punch", href: "/m/punch" },
  { label: "Daily Log", href: "/m/daily-log" },
  { label: "Handover", href: "/m/handover" },
  { label: "Requests", href: "/m/requests" },
  { label: "Chain of Custody", href: "/m/coc" },
  { label: "Wayfind", href: "/m/wayfind" },
  { label: "Open Gigs", href: "/m/gigs" },
  // Connecteam-parity surfaces (0046).
  { label: "Updates", href: "/m/feed" },
  { label: "Inbox", href: "/m/inbox" },
  { label: "Learning", href: "/m/learning" },
  { label: "Time Off", href: "/m/time-off" },
  { label: "Kudos", href: "/m/kudos" },
  { label: "Polls", href: "/m/polls" },
  { label: "Surveys", href: "/m/surveys" },
  { label: "My Docs", href: "/m/docs" },
  { label: "Directory", href: "/m/directory" },
  { label: "Onboarding", href: "/m/onboarding" },
  { label: "Advancing", href: "/m/advances" },
  { label: "Tracker", href: "/m/tracker" },
];

/**
 * ADR-0005 — phase-aware ordering of `mobileSurfaces`. Field operators
 * in different production phases need different tools-first. The
 * canonical XPMS phase comes from `projects.xpms_phase`; pass it in
 * and the surfaces most likely to be used in that phase float to the
 * top, others keep their existing order beneath them.
 *
 * Pass `undefined` (no active project / unscoped) to get the default
 * static order from `mobileSurfaces`. The same export remains the
 * source of truth for the full surface list.
 */
const PHASE_PRIORITY_HREFS: Record<string, string[]> = {
  discovery: ["/m/directory", "/m/feed", "/m/inbox"],
  concept: ["/m/feed", "/m/inbox", "/m/directory"],
  development: ["/m/feed", "/m/inbox", "/m/learning", "/m/docs"],
  advance: ["/m/onboarding", "/m/advances", "/m/learning", "/m/docs", "/m/directory"],
  build: ["/m/punch", "/m/daily-log", "/m/driver", "/m/handover", "/m/coc", "/m/wms"],
  show: ["/m/gate", "/m/incidents", "/m/ros", "/m/medic", "/m/clock", "/m/alerts"],
  strike: ["/m/punch", "/m/daily-log", "/m/handover", "/m/coc", "/m/wms"],
  wrap: ["/m/time-off", "/m/kudos", "/m/onboarding", "/m/feed", "/m/surveys"],
};

export function mobileSurfacesForPhase(phase?: string): NavItem[] {
  if (!phase) return mobileSurfaces;
  const priority = PHASE_PRIORITY_HREFS[phase];
  if (!priority) return mobileSurfaces;
  const byHref = new Map(mobileSurfaces.map((i) => [i.href, i] as const));
  const head: NavItem[] = [];
  const seen = new Set<string>();
  for (const href of priority) {
    const item = byHref.get(href);
    if (item) {
      head.push(item);
      seen.add(href);
    }
  }
  const tail = mobileSurfaces.filter((i) => !seen.has(i.href));
  return [...head, ...tail];
}

/**
 * Persona-routed mobile (ADR-0009 scaffold).
 *
 * Mobile roles drive per-role tab bars + role-relevant Tools drawer
 * ordering. Each role has a home at `/m/[role]` that lands them on a
 * dashboard scoped to their work. Existing `/m/*` surfaces continue to
 * resolve during the three-month grace window (ADR-0009 §"Migration
 * rules" #1) — this is scaffold only; the URL move per surface is a
 * dedicated PR.
 */
export type MobileRole = "performer" | "crew" | "driver" | "medic" | "guard" | "admin";

export const MOBILE_ROLES: MobileRole[] = ["performer", "crew", "driver", "medic", "guard", "admin"];

/**
 * Resolve the best default mobile role for a session. Operators with
 * an admin/owner role land on the admin home (full surface drawer);
 * personas map by their guide-side mapping plus the deskless extension.
 * Stored override at `user_preferences.ui_state.mobile_role` wins over
 * the inferred default — read at the layout level.
 */
export function mapSessionToMobileRole(role: string | null, persona: string | null): MobileRole {
  if (role === "owner" || role === "admin" || role === "manager") return "admin";
  switch (persona) {
    case "artist":
    case "athlete":
      return "performer";
    case "crew":
    case "contractor":
    case "collaborator":
      return "crew";
    default:
      return "crew";
  }
}

/**
 * Per-role mobile tab bar. Five tabs each; role-relevant primary tools
 * surface first. Universal surfaces (Inbox, Alerts, Me) appear under
 * every role so the operator never gets stranded.
 */
// ADR-0009 URL flip — universal surfaces (inbox, shift, alerts, settings,
// feed, kudos, learning, time-off, docs, directory) use role-prefixed
// canonical URLs that map to thin re-exports under /m/[role]/<surface>.
// Role-specific surfaces (gate, driver, medic, guard) still use static
// paths because those pages are their role's home — not duplicated.
export const ROLE_TABS: Record<MobileRole, NavItem[]> = {
  performer: [
    { label: "Home", href: "/m/performer" },
    { label: "Schedule", href: "/m/performer/shift" },
    { label: "Inbox", href: "/m/performer/inbox" },
    { label: "Alerts", href: "/m/performer/alerts" },
    { label: "Me", href: "/m/performer/settings" },
  ],
  crew: [
    { label: "Home", href: "/m/crew" },
    { label: "Shift", href: "/m/crew/shift" },
    { label: "Inbox", href: "/m/crew/inbox" },
    { label: "Alerts", href: "/m/crew/alerts" },
    { label: "Me", href: "/m/crew/settings" },
  ],
  driver: [
    { label: "Home", href: "/m/driver" },
    { label: "Run", href: "/m/driver" },
    { label: "Wayfind", href: "/m/wayfind" },
    { label: "Alerts", href: "/m/driver/alerts" },
    { label: "Me", href: "/m/driver/settings" },
  ],
  medic: [
    { label: "Home", href: "/m/medic" },
    { label: "Log", href: "/m/medic" },
    { label: "Queue", href: "/m/medic/alerts" },
    { label: "Alerts", href: "/m/medic/alerts" },
    { label: "Me", href: "/m/medic/settings" },
  ],
  guard: [
    { label: "Home", href: "/m/guard" },
    { label: "Gate", href: "/m/gate" },
    { label: "Incident", href: "/m/incidents" },
    { label: "Alerts", href: "/m/guard/alerts" },
    { label: "Me", href: "/m/guard/settings" },
  ],
  admin: [
    { label: "Home", href: "/m/admin" },
    { label: "Inbox", href: "/m/admin/inbox" },
    { label: "Shift", href: "/m/admin/shift" },
    { label: "Alerts", href: "/m/admin/alerts" },
    { label: "Me", href: "/m/admin/settings" },
  ],
};

export function roleTabs(role: MobileRole): NavItem[] {
  return ROLE_TABS[role];
}

/**
 * Per-role tools-drawer priority — the surfaces a role uses most.
 * Composes with phase reordering: role-priority comes first, then
 * phase-priority surfaces that aren't already in the role head, then
 * the rest in default order.
 *
 * Admin gets no role-priority (they touch every surface, so the
 * existing phase ordering is correct for them).
 */
const ROLE_PRIORITY_HREFS: Record<MobileRole, string[]> = {
  performer: ["/m/shift", "/m/advances", "/m/feed", "/m/guide", "/m/inbox"],
  crew: ["/m/shift", "/m/clock", "/m/ros", "/m/daily-log", "/m/punch", "/m/time-off", "/m/feed"],
  driver: ["/m/driver", "/m/wayfind", "/m/ad", "/m/alerts", "/m/handover"],
  medic: ["/m/medic", "/m/alerts", "/m/safeguarding", "/m/incidents"],
  guard: ["/m/gate", "/m/incidents", "/m/incident", "/m/wallet", "/m/guard", "/m/alerts"],
  admin: [],
};

/**
 * Role × phase-aware tools-drawer ordering (ADR-0009).
 *
 * Composes phase reordering on top of role-relevant filtering. Order:
 *   1. Role-priority surfaces (per ROLE_PRIORITY_HREFS).
 *   2. Phase-priority surfaces (per PHASE_PRIORITY_HREFS) not already
 *      in the role head.
 *   3. Everything else in default `mobileSurfaces` order.
 *
 * Pass `role=undefined` to get just phase ordering (existing behavior).
 * Pass `phase=undefined` to get just role ordering.
 */
export function mobileSurfacesForRole(role: MobileRole | undefined, phase?: string): NavItem[] {
  if (!role) return mobileSurfacesForPhase(phase);
  const rolePriority = ROLE_PRIORITY_HREFS[role];
  const phasePriority = phase ? (PHASE_PRIORITY_HREFS[phase] ?? []) : [];
  const seen = new Set<string>();
  const head: NavItem[] = [];
  const byHref = new Map(mobileSurfaces.map((i) => [i.href, i] as const));
  for (const href of rolePriority) {
    const item = byHref.get(href);
    if (item && !seen.has(href)) {
      head.push(item);
      seen.add(href);
    }
  }
  for (const href of phasePriority) {
    const item = byHref.get(href);
    if (item && !seen.has(href)) {
      head.push(item);
      seen.add(href);
    }
  }
  const tail = mobileSurfaces.filter((i) => !seen.has(i.href));
  return [...head, ...tail];
}
