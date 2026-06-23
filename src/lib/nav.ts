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
  | "FileStack"
  | "CreditCard"
  | "PiggyBank"
  | "Wallet"
  | "Clock"
  | "ChartBar"
  // Reference
  | "BookOpen"
  | "Bookmark"
  | "User"
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
  | "GitBranch"
  // Collaborate (F5 — whiteboards)
  | "Presentation"
  // GVTEWAY consumer nav
  | "List"
  | "UserCircle";

export type NavItem = {
  label: string;
  href: string;
  /** Icon registry key. Resolved to a Lucide component in
   *  `src/components/nav-icons.ts`. Each item carries a unique key. */
  icon?: IconName;
  /**
   * Minimum platform role required to see this entry. Unset = visible to
   * every member. Hiding nav is UX, not security — every gated surface
   * still enforces its own session/RLS checks; this just stops members
   * discovering admin tools via failed mutations.
   */
  minRole?: "manager" | "admin";
};
/**
 * Optional sub-grouping inside a NavGroup. Use when a class group exceeds
 * Miller's 5-9 band — render section labels as quiet dividers above the
 * items they introduce (Linear / Notion pattern). When `sections` is set,
 * the group renderer ignores `items` and walks sections instead.
 */
export type NavSection = { label: string; items: NavItem[] };
/**
 * A top-level sidebar group. When `href` is set the group header doubles as a
 * navigable hub link (Linear/Notion pattern) — clicking the label routes to the
 * module hub while a dedicated chevron toggles collapse. This is what lets us
 * drop "echo" leaves (an item whose href equals the group hub) without
 * orphaning the hub route (ADR-0011 §"No echo items"). Groups without a hub
 * page (e.g. Commerce, Messages) omit `href` and keep a toggle-only header.
 */
export type NavGroup = { label: string; href?: string; items: NavItem[]; sections?: NavSection[] };

/** Rank order for NavItem.minRole filtering. Owner/admin share the top tier. */
const ROLE_RANK: Record<string, number> = { owner: 3, admin: 3, manager: 2 };

/**
 * Strip nav entries above the caller's role. Groups/sections that end up
 * empty disappear entirely. Items without `minRole` always pass.
 */
export function filterNavByRole(groups: NavGroup[], role: string | null | undefined): NavGroup[] {
  const rank = ROLE_RANK[role ?? ""] ?? 1;
  const passes = (item: NavItem) => rank >= (item.minRole === "admin" ? 3 : item.minRole === "manager" ? 2 : 1);
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(passes),
      sections: g.sections?.map((s) => ({ ...s, items: s.items.filter(passes) })).filter((s) => s.items.length > 0),
    }))
    .filter((g) => g.items.length > 0 || (g.sections?.length ?? 0) > 0);
}

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
 * URL preservation: grouping and labels are the only nav concern; every
 * console route keeps its existing URL. The "Guest Hospitality" entry
 * is renamed "Guest Experience" (same URL `/studio/commercial/hospitality`,
 * tabbed internally by hosted persona for Sales-side Hospitality and
 * by audience filter for Operations-side Guest Experience).
 *
 * Pipeline drops as a sidebar entry — it survives as the default kanban
 * view on `/studio/leads` (ADR-0006 §"Resolved decisions" #1).
 */
export const platformNavDomain: NavGroup[] = [
  {
    // Workspace chrome — not a domain group; the rail's top tile. The header
    // links the console home (was the "Overview" echo leaf — dropped per
    // ADR-0011 §"No echo items"; the navigable header is the hub).
    label: "Dashboard",
    href: "/studio",
    items: [
      { label: "Dashboards", href: "/studio/dashboards", icon: "BarChart3" },
      { label: "Reports", href: "/studio/reports", icon: "ChartBar" },
      { label: "Goals", href: "/studio/goals", icon: "Crosshair" },
      // §9 coordinate lens — portfolio class × phase. An analytical lens (a nav
      // ITEM, never a top-level group); the sidebar stays domain-noun.
      { label: "Position", href: "/studio/position", icon: "Compass" },
      { label: "Assistant", href: "/studio/assistant", icon: "Bot" },
      { label: "Notifications", href: "/me/notifications/inbox", icon: "Inbox" },
      { label: "Threads", href: "/studio/inbox", icon: "MessageSquare" },
    ],
  },
  {
    // PROJECTS — Portfolio, Authoring, Design, Estimating, Governance.
    // From XPMS classes 0 (Strategy) + 1 (Creative). The header links the
    // Projects hub (was the "Projects" echo leaf — dropped per ADR-0011).
    label: "Projects",
    href: "/studio/projects",
    items: [],
    sections: [
      {
        label: "Portfolio",
        items: [
          { label: "Programs", href: "/studio/programs", icon: "Layers" },
          { label: "Venues", href: "/studio/venues", icon: "Building2" },
        ],
      },
      {
        label: "Authoring",
        items: [
          { label: "Proposals", href: "/studio/proposals", icon: "FileText" },
          { label: "Documents", href: "/studio/documents", icon: "FileStack" },
          { label: "Proposal Templates", href: "/studio/proposals/templates", icon: "Files" },
          { label: "Project Templates", href: "/studio/templates", icon: "Files" },
        ],
      },
      {
        label: "Design",
        items: [
          { label: "Site Plans", href: "/studio/site-plans", icon: "Map" },
          { label: "Drawings", href: "/studio/drawings", icon: "Files" },
          { label: "Specifications", href: "/studio/specs", icon: "BookOpen" },
          { label: "BIM Models", href: "/studio/bim", icon: "Network" },
        ],
      },
      {
        label: "Estimating",
        items: [
          { label: "Takeoffs", href: "/studio/takeoffs", icon: "Crosshair" },
          { label: "Estimates", href: "/studio/estimates", icon: "Coins" },
        ],
      },
      {
        label: "Governance",
        items: [
          { label: "Risk Register", href: "/studio/programs/risk", icon: "AlertTriangle" },
          { label: "Risk Scores", href: "/studio/risk", icon: "ShieldAlert" },
          { label: "Readiness", href: "/studio/programs/readiness", icon: "ShieldCheck" },
          { label: "Reviews", href: "/studio/programs/reviews", icon: "ClipboardCheck" },
        ],
      },
    ],
  },
  {
    // PRODUCTION — Inventory, Build, Show. The technical envelope gets
    // its own front door (lifecycle-proposal regression fix).
    // From XPMS classes 4 (Build) + 5 (Production). Header links the hub.
    label: "Production",
    href: "/studio/production",
    items: [],
    sections: [
      {
        label: "Inventory",
        items: [
          { label: "Equipment", href: "/studio/production/equipment", icon: "Wrench" },
          { label: "Equipment Utilization", href: "/studio/production/equipment/utilization", icon: "BarChart3" },
          { label: "AV Inventory", href: "/studio/production/av", icon: "Speaker" },
          { label: "Rentals", href: "/studio/production/rentals", icon: "ArrowLeftRight" },
        ],
      },
      {
        label: "Build",
        items: [
          { label: "Fabrication", href: "/studio/production/fabrication", icon: "Hammer" },
          { label: "Compounds", href: "/studio/production/compounds", icon: "Tent" },
          { label: "Yard", href: "/studio/production/warehouse", icon: "Network" },
          { label: "Punch List", href: "/studio/punch", icon: "ClipboardList" },
          { label: "Reality Captures", href: "/studio/captures", icon: "Telescope" },
          { label: "Photo Log", href: "/studio/photos", icon: "Telescope" },
          { label: "Warranties", href: "/studio/warranties", icon: "ShieldCheck" },
        ],
      },
      {
        label: "Show",
        items: [
          { label: "Run of Show", href: "/studio/production/ros", icon: "Play" },
          { label: "Live Dispatch", href: "/studio/production/dispatch/live", icon: "Radio" },
          { label: "Production Logistics", href: "/studio/production/logistics", icon: "Crosshair" },
        ],
      },
    ],
  },
  {
    // PEOPLE — Directory, Engagement, Development, Time & Recognition.
    // Renamed from "Workforce" per ADR-0011 (the domain noun is People; the
    // Workforce directory + courses + accreditation live under it).
    label: "People",
    href: "/studio/people",
    items: [],
    sections: [
      {
        label: "Directory",
        items: [
          // "Directory" echo leaf (/studio/people) dropped — the navigable
          // People group header is the directory hub (ADR-0011 §"No echo items").
          { label: "Teams", href: "/studio/people/teams", icon: "UsersRound" },
          { label: "Workforce", href: "/studio/workforce", icon: "HardHat" },
        ],
      },
      {
        label: "Engagement",
        items: [
          { label: "Contracts", href: "/studio/people/msas", icon: "FileSignature" },
          { label: "Offer Letters", href: "/studio/people/offer-letters", icon: "FileText" },
          { label: "Delegations", href: "/studio/participants/delegations", icon: "UsersRound" },
          { label: "Visa", href: "/studio/participants/visa", icon: "Stamp" },
          // ADR-0011 one-home-per-concept: Accreditation lives ONLY in People
          // (was also under Operations ▸ Guest Experience + Knowledge ▸
          // Certifications). §03 groups it with participants/credentials.
          { label: "Accreditation", href: "/studio/accreditation", icon: "BadgeCheck" },
          { label: "Rosters", href: "/studio/workforce/rosters", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Development",
        items: [
          { label: "Training", href: "/studio/workforce/training", icon: "GraduationCap" },
          // Courses deep-links into the LEG3ND shell — LEG3ND is the canonical
          // learning/LMS owner; the console-embedded Connecteam courses admin
          // was retired when LEG3ND graduated to its own (legend) shell.
          { label: "Courses", href: "/legend/learn", icon: "BookOpen" },
          // The Standard (knowledge base) re-homed here when the platform
          // Knowledge group dissolved (LEG3ND is now its own (legend) shell).
          { label: "The Standard", href: "/studio/knowledge", icon: "BookOpenCheck" },
          { label: "Onboarding", href: "/studio/workforce/onboarding", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Time & Recognition",
        items: [
          { label: "Time Off", href: "/studio/workforce/time-off", icon: "Calendar" },
          { label: "Shift Swaps", href: "/studio/workforce/shift-swaps", icon: "ArrowLeftRight" },
          { label: "Recognition", href: "/studio/workforce/recognition", icon: "Award" },
          { label: "Badges", href: "/studio/workforce/badges", icon: "BadgeCheck" },
          { label: "Resource Forecast", href: "/studio/workforce/forecast", icon: "TrendingUp" },
        ],
      },
    ],
  },
  {
    // SALES — Pipeline & Partners, Hospitality, Marketplace, Revenue.
    // Pipeline demoted to a saved view on /studio/leads (ADR-0006 #1).
    // Hospitality internally tabs by hosted persona: Talent / Sponsors /
    // Athletes / Industry / Media & Press / VVIP (ADR-0006 #2).
    // Analytics = /studio/insights (per-domain analytics in their
    // domain — Stripe pattern, ADR-0006 #4).
    // From XPMS classes 2 (Talent — bookings) + 3 (Marketing).
    // COMMERCE — Sales · Hospitality · Marketplace · Revenue, merged into one
    // domain group per ADR-0011 (Sales + Marketplace + Hospitality → Commerce,
    // with Sales as the lead section).
    label: "Commerce",
    items: [],
    sections: [
      {
        label: "Sales",
        items: [
          { label: "Sales", href: "/studio/sales", icon: "TrendingUp" },
          { label: "Pipeline", href: "/studio/pipeline", icon: "GitBranch" },
          { label: "Leads", href: "/studio/leads", icon: "UserPlus" },
          { label: "Clients", href: "/studio/clients", icon: "Handshake" },
          { label: "Sponsors", href: "/studio/commercial/sponsors", icon: "Award" },
          { label: "Marketing", href: "/studio/marketing", icon: "Megaphone" },
          { label: "Campaigns", href: "/studio/campaigns", icon: "Star" },
          { label: "Function Diary", href: "/studio/sales/diary", icon: "CalendarDays" },
          { label: "BEOs", href: "/studio/sales/beos", icon: "ClipboardList" },
        ],
      },
      {
        label: "Hospitality",
        items: [
          { label: "Hospitality", href: "/studio/commercial/hospitality", icon: "ConciergeBell" },
          // Moved from the (now-split) Operations group per ADR-0011 §03 (guest
          // experience belongs to Commerce). Same page as Hospitality, filtered
          // to the guest audience via ?audience=guest — matchRoute treats
          // query-bearing hrefs as never-active, so the Hospitality entry owns
          // the highlight; both now co-locate in Commerce.
          { label: "Guest Experience", href: "/studio/commercial/hospitality?audience=guest", icon: "ConciergeBell" },
        ],
      },
      {
        label: "Marketplace",
        items: [
          { label: "Marketplace", href: "/studio/marketplace", icon: "Globe" },
          { label: "Bookings", href: "/studio/bookings", icon: "TrendingUp" },
          { label: "Tours", href: "/studio/agency/tours", icon: "Route" },
          { label: "Agency Roster", href: "/studio/agency/roster", icon: "Users" },
          { label: "Talent Roster", href: "/studio/marketplace/talent", icon: "Music" },
          { label: "Offers", href: "/studio/marketplace/offers", icon: "Gavel" },
          { label: "Inquiries", href: "/studio/marketplace/inquiries", icon: "Inbox" },
          { label: "Box Office", href: "/studio/marketplace/box-office", icon: "Ticket" },
          { label: "Discounts", href: "/studio/marketplace/discounts", icon: "Receipt" },
        ],
      },
      {
        label: "Revenue",
        items: [
          // Transactional Revenue (marketplace + box office + store), distinct
          // from Finance AR (IMPLEMENTATION §5).
          { label: "Orders", href: "/studio/revenue/orders", icon: "Receipt" },
          { label: "Transactions", href: "/studio/revenue/transactions", icon: "Coins" },
          { label: "Analytics", href: "/studio/insights", icon: "BarChart3" },
        ],
      },
    ],
  },
  {
    // FINANCE — Receivables, Payables, Planning, Time & Payroll.
    // Unchanged from ADR-0005's Finance sub-sectioning; just lifts to a
    // top-level group instead of nesting under EXECUTIVE. Header links the hub.
    label: "Finance",
    href: "/studio/finance",
    items: [],
    sections: [
      {
        label: "Receivables",
        items: [
          { label: "Invoices", href: "/studio/finance/invoices", icon: "Receipt" },
          { label: "Pay Apps", href: "/studio/finance/pay-apps", icon: "FileSpreadsheet" },
          { label: "Lien Waivers", href: "/studio/finance/lien-waivers", icon: "Stamp" },
          { label: "E-Sign Envelopes", href: "/studio/envelopes", icon: "ClipboardSignature" },
          { label: "AP Invoice OCR", href: "/studio/finance/ap-ocr", icon: "Sparkles" },
        ],
      },
      {
        label: "Payables",
        items: [
          { label: "Expenses", href: "/studio/finance/expenses", icon: "CreditCard" },
          { label: "Mileage", href: "/studio/finance/mileage", icon: "Truck" },
          { label: "Payouts", href: "/studio/finance/payouts", icon: "Wallet" },
        ],
      },
      {
        // Ledger setup — chart-of-accounts entities + cost-code reference.
        // Promoted from hub-only links (workflow audit F-C).
        label: "Ledger Setup",
        items: [
          { label: "Entities", href: "/studio/finance/entities", icon: "Building2" },
          { label: "Cost Codes", href: "/studio/finance/cost-codes", icon: "ListOrdered" },
        ],
      },
      {
        label: "Planning",
        items: [
          { label: "Budgets", href: "/studio/finance/budgets", icon: "PiggyBank" },
          { label: "WIP", href: "/studio/finance/wip", icon: "FileSpreadsheet" },
          { label: "EAC Forecasts", href: "/studio/finance/forecasts", icon: "TrendingUp" },
          { label: "Periods", href: "/studio/finance/periods", icon: "CalendarDays" },
          { label: "Reports", href: "/studio/finance/reports", icon: "ChartBar" },
        ],
      },
      {
        label: "Time & Payroll",
        items: [
          { label: "Time", href: "/studio/finance/time", icon: "Clock" },
          { label: "Timesheets", href: "/studio/finance/timesheets", icon: "ClipboardCheck" },
          { label: "Certified Payroll", href: "/studio/finance/payroll", icon: "FileSignature" },
          { label: "Subscriptions", href: "/studio/subscriptions", icon: "BadgeCheck" },
        ],
      },
    ],
  },
  {
    // PROCUREMENT — Sourcing, Buying, Reference. Header links the hub.
    // Master Catalog moves here from Settings (ADR-0006 §"What moves").
    label: "Procurement",
    href: "/studio/procurement",
    items: [],
    sections: [
      {
        label: "Sourcing",
        items: [
          { label: "Vendors", href: "/studio/procurement/vendors", icon: "Store" },
          { label: "Prequalification", href: "/studio/procurement/prequalification", icon: "BookOpenCheck" },
          { label: "Sourcing", href: "/studio/procurement/sourcing", icon: "Compass" },
          { label: "RFQs", href: "/studio/procurement/rfqs", icon: "PackageCheck" },
          { label: "ITB", href: "/studio/procurement/itb", icon: "Gavel" },
        ],
      },
      {
        label: "Buying",
        items: [
          { label: "Requisitions", href: "/studio/procurement/requisitions", icon: "ShoppingCart" },
          { label: "Purchase Orders", href: "/studio/procurement/purchase-orders", icon: "Package" },
          { label: "PO Change Orders", href: "/studio/procurement/po-change-orders", icon: "ArrowLeftRight" },
          { label: "WO Broadcasts", href: "/studio/procurement/wo-broadcasts", icon: "Send" },
          { label: "Contracts", href: "/studio/contracts", icon: "ClipboardSignature" },
        ],
      },
      {
        label: "Reference",
        items: [
          { label: "Rate Card", href: "/studio/logistics/ratecard", icon: "ListOrdered" },
          { label: "Submittals", href: "/studio/submittals", icon: "Inbox" },
          { label: "Master Catalog", href: "/studio/settings/catalog", icon: "Spline" },
        ],
      },
    ],
  },
  // OPERATIONS junk-drawer split into four domain-noun groups per ADR-0011
  // §"The Operations junk-drawer splits into Coordination · Logistics · Safety
  // · Messages." Guest Experience moved to Commerce ▸ Hospitality (§03 puts
  // hospitality/guest-exp under Commerce); Accreditation moved to People (one
  // home). Each group header carries its module hub href (navigable group).
  {
    // COORDINATION — the day-to-day production-control surface (schedule,
    // tasks, daily log, forms, guides) + the org-level Sustainability rollup.
    // Header links the Operations hub; the redundant "Operations Hub" leaf is
    // dropped in favour of the navigable header (ADR-0011 §"No echo items").
    label: "Coordination",
    href: "/studio/operations",
    items: [
      { label: "Schedule", href: "/studio/schedule", icon: "Calendar" },
      { label: "Calendar", href: "/studio/calendar", icon: "CalendarDays" },
      { label: "Schedule Baselines", href: "/studio/schedule/baselines", icon: "GitBranch" },
      { label: "Look-Ahead", href: "/studio/operations/look-ahead", icon: "Telescope" },
      { label: "Tasks", href: "/studio/tasks", icon: "ListTodo" },
      { label: "Daily Log", href: "/studio/operations/daily-log", icon: "ScrollText" },
      { label: "Action Items", href: "/studio/action-items", icon: "CheckSquare" },
      { label: "Annotations", href: "/studio/annotations", icon: "AlertTriangle" },
      { label: "Forms", href: "/studio/forms", icon: "ClipboardList" },
      { label: "Guides", href: "/studio/guides", icon: "Atlas" },
      { label: "Reservations", href: "/studio/operations/reservations", icon: "ConciergeBell" },
      // Cross-cutting org-level sustainability rollup (was Operations ▸ Reporting).
      { label: "Sustainability", href: "/studio/sustainability", icon: "Leaf" },
    ],
  },
  {
    // LOGISTICS — transport, freight, warehouse, disposition, catering, lodging.
    label: "Logistics",
    href: "/studio/logistics",
    items: [
      { label: "Transport", href: "/studio/transport", icon: "Truck" },
      { label: "Dispatch", href: "/studio/transport/dispatch", icon: "Send" },
      { label: "Freight", href: "/studio/logistics/freight", icon: "Container" },
      { label: "Warehouse", href: "/studio/logistics/warehouse", icon: "Warehouse" },
      { label: "Disposition", href: "/studio/logistics/disposition", icon: "PackageOpen" },
      { label: "Catering", href: "/studio/logistics/services", icon: "UtensilsCrossed" },
      { label: "Accommodation", href: "/studio/accommodation", icon: "BedDouble" },
    ],
  },
  {
    // SAFETY — operational response + compliance, two sub-sections. Header
    // links the safety hub (the cross-domain read feed); the single Incidents
    // CRUD home stays at /studio/operations/incidents (ADR-0011 one home).
    label: "Safety",
    href: "/studio/safety",
    items: [],
    sections: [
      {
        label: "Operational",
        items: [
          // F-E: point at the canonical CRUD home (kanban / new / detail), not
          // the cross-domain read feed at /studio/safety/incidents (which is
          // the Safety group hub + stays reachable via cross-links).
          { label: "Incidents", href: "/studio/operations/incidents", icon: "Siren" },
          { label: "Major Incident", href: "/studio/safety/major-incident", icon: "Flame" },
          { label: "Crisis", href: "/studio/safety/crisis", icon: "Flame" },
          { label: "Medical", href: "/studio/safety/medical", icon: "Stethoscope" },
          { label: "Safeguarding", href: "/studio/safety/safeguarding", icon: "HeartHandshake" },
          { label: "Guard Tours", href: "/studio/safety/guard-tours", icon: "ShieldCheck" },
          // Kit v7 CameraScanner archetype — fixed-station gate credential scan.
          { label: "Access Control", href: "/studio/access-control", icon: "BadgeCheck" },
          { label: "Environmental", href: "/studio/safety/environmental", icon: "Leaf" },
          { label: "Threats", href: "/studio/safety/threats", icon: "ShieldAlert" },
        ],
      },
      {
        label: "Compliance",
        items: [
          { label: "Inspections", href: "/studio/inspections", icon: "Search" },
          { label: "OSHA 300", href: "/studio/safety/osha", icon: "ShieldAlert" },
          { label: "Briefings", href: "/studio/safety/briefings", icon: "ClipboardPlus" },
          { label: "Playbooks", href: "/studio/safety/playbooks", icon: "BookOpenCheck" },
          { label: "Chain of Custody", href: "/studio/compliance/coc", icon: "FileSignature" },
        ],
      },
    ],
  },
  {
    // MESSAGES — communication surfaces (announcements, polls, surveys, RFIs,
    // transmittals, service desk) plus the meeting/event coordination items.
    // No /studio/comms hub page exists, so the header stays toggle-only.
    label: "Messages",
    items: [
      { label: "Events", href: "/studio/events", icon: "CalendarDays" },
      { label: "Meetings", href: "/studio/meetings", icon: "CalendarDays" },
      { label: "Meeting Notes", href: "/studio/meetings/notes", icon: "FileText" },
      { label: "Announcements", href: "/studio/comms/announcements", icon: "Megaphone" },
      { label: "Polls", href: "/studio/comms/polls", icon: "BarChart3" },
      { label: "Surveys", href: "/studio/comms/surveys", icon: "ClipboardCheck" },
      { label: "Whiteboards", href: "/studio/collaborate/whiteboards", icon: "Presentation" },
      { label: "Transmittals", href: "/studio/transmittals", icon: "Send" },
      { label: "Email Inbox", href: "/studio/email-inbox", icon: "Inbox" },
      { label: "RFIs", href: "/studio/rfis", icon: "MessageCircleQuestion" },
      { label: "Service Desk", href: "/studio/services/requests", icon: "ConciergeBell" },
      { label: "TOC — ITIL", href: "/studio/ops/toc", icon: "Network" },
    ],
  },
  // KNOWLEDGE group removed (ADR-0011): LEG3ND is now its own (legend) shell
  // (legend.atlvs.pro / `legendNav`), reached from the ecosystem app-switcher
  // — not a console sidebar group. Its /legend/* deep-links (Resources,
  // Signage, Compliance Engine) live in `legendNav`; its /studio/* leaves
  // resolved to one home each: The Standard + Courses + Certifications →
  // People, Catalog → Procurement ▸ Reference, Safety (incidents) → the one
  // Incidents CRUD home in Operations ▸ Safety.
  {
    // COLLABORATE — lightweight workspace surfaces (Airtable-style sheets,
    // etc.) that don't belong to a heavier domain group.
    label: "Collaborate",
    items: [
      // Block documents (deferred item F4). Single-user editing; multiplayer
      // is out of scope.
      { label: "Documents", href: "/studio/collaborate/docs", icon: "FileText" },
      { label: "Sheets", href: "/studio/collaborate/sheets", icon: "FileSpreadsheet" },
      // Kit v7 component archetypes — RichTextEditor notes + KanbanBoard.
      { label: "Notes", href: "/studio/notes", icon: "FileText" },
      { label: "Board", href: "/studio/board", icon: "Layers" },
    ],
  },
];

/**
 * Canonical platform nav — the single domain-noun shape. Consumers import
 * `platformNav` directly; there is no per-user nav-mode switch.
 */
export const platformNav: NavGroup[] = platformNavDomain;

/**
 * LEG3ND shell nav (ADR-0011) — the standalone Knowledge · LMS · resource hub
 * promoted out of the console into its own `(legend)` route group / `legend`
 * subdomain. Rendered by `src/app/(legend)/layout.tsx`. The three kit modes
 * (public funnel · learner · authoring/compliance) share this rail; page-level
 * `requireSession()` gates the authoring/compliance surfaces.
 */
export const legendNav: NavGroup[] = [
  {
    // LEARN — the LMS spine (reference app: Learning Path → My Learning →
    // Catalog → Live → Progress), plus the credential wallet.
    label: "Learn",
    items: [
      { label: "Learning Path", href: "/legend/path", icon: "Route" },
      { label: "My Learning", href: "/legend/my-learning", icon: "BookOpen" },
      { label: "Catalog", href: "/legend/learn", icon: "GraduationCap" },
      { label: "Live Sessions", href: "/legend/live", icon: "CalendarDays" },
      { label: "Progress", href: "/legend/progress", icon: "BarChart3" },
      { label: "Credentials", href: "/legend/certifications", icon: "BadgeCheck" },
    ],
  },
  {
    // COMMUNITY — Skool-class discussion, directory, and learning crews.
    label: "Community",
    items: [
      { label: "Community", href: "/legend/community", icon: "UsersRound" },
      { label: "Members", href: "/legend/community/members", icon: "Users" },
      { label: "Crew", href: "/legend/crew", icon: "UsersRound" },
    ],
  },
  {
    // COMPETE — the shared gamification surfaces (Arena = leaderboard).
    label: "Compete",
    items: [
      { label: "The Arena", href: "/legend/leaderboard", icon: "Award" },
      { label: "Badges", href: "/legend/badges", icon: "Star" },
      { label: "Rewards", href: "/legend/store", icon: "Store" },
    ],
  },
  {
    // MANAGE — training console (roster · assignment · compliance reporting).
    label: "Manage",
    items: [
      { label: "Console", href: "/legend/console", icon: "ClipboardList" },
      { label: "XMCE Engine", href: "/legend/engine", icon: "ShieldCheck" },
      { label: "Recert Matrix", href: "/legend/compliance", icon: "ClipboardCheck" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Overview", href: "/legend", icon: "BookOpen" },
      { label: "Resources", href: "/legend/resources", icon: "FolderOpen" },
      { label: "Signage", href: "/legend/signage", icon: "Map" },
      { label: "For Institutions", href: "/legend/for-institutions", icon: "Building2" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/legend/profile", icon: "UserCircle" },
      { label: "Architecture", href: "/legend/architecture", icon: "Network" },
    ],
  },
];

/**
 * GVTEWAY consumer rail (design_handoff §2) — the root-level consumer surfaces
 * that sit alongside the project+persona `/p/[slug]/*` portal: editorial
 * discovery, community, shareable lists, saved, and account. Distinct from
 * `portalNav(slug, persona)`, which is the project-scoped portal.
 */
export const portalConsumerNav: NavGroup[] = [
  {
    label: "GVTEWAY",
    items: [
      { label: "Discover", href: "/p/discover", icon: "Compass" },
      { label: "Community", href: "/p/community", icon: "Users" },
      { label: "Scenes", href: "/p/scenes", icon: "Radio" },
      { label: "Lists", href: "/p/lists", icon: "ListOrdered" },
      { label: "Saved", href: "/p/saved", icon: "Star" },
      { label: "Account", href: "/p/account", icon: "User" },
      // Taste/genre onboarding — composes the same auth primitives as the
      // operator `(auth)` flow (design_handoff §4). Reached from the signup CTA;
      // registered here so the sitemap reconciler counts it as nav-reached.
      { label: "Welcome", href: "/p/welcome", icon: "Sparkles" },
    ],
  },
];

/**
 * Settings sidebar — rendered inside `/studio/settings/layout.tsx` as a
 * dedicated 2-col admin area. Extracted from `platformNav` 2026-04 so the
 * primary sidebar doesn't carry 14 admin items.
 */
export const settingsNav: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Organization", href: "/studio/settings/organization", minRole: "admin" },
      { label: "Branding", href: "/studio/settings/branding", minRole: "admin" },
      { label: "Domains", href: "/studio/settings/domains", minRole: "admin" },
      { label: "Email Templates", href: "/studio/settings/email-templates", minRole: "manager" },
      { label: "Locations", href: "/studio/locations" },
      { label: "Marketplace", href: "/studio/marketplace/settings", minRole: "admin" },
    ],
  },
  {
    label: "Team & Access",
    items: [
      { label: "Roles", href: "/studio/people/roles", minRole: "admin" },
      { label: "Invites", href: "/studio/people/invites", minRole: "admin" },
      { label: "Account Managers", href: "/studio/settings/account-managers", minRole: "admin" },
      { label: "Governance", href: "/studio/settings/governance", minRole: "admin" },
    ],
  },
  {
    // ADR-0006: Master Catalog moved from here to Procurement → Reference
    // (operational sourcing concern, not admin). Time-Clock Zones stays
    // as it's purely org-level field configuration.
    label: "Field Config",
    items: [{ label: "Time-Clock Zones", href: "/studio/settings/time-clock-zones" }],
  },
  {
    // ADR-0011: the XPMS 2.0 taxonomy (atoms / classes / codebook / tiers /
    // provenance / variance) is admin config, not daily nav — moved out of the
    // primary Knowledge group into Settings. Routes stay under /studio/xpms/*
    // (the WBS admin is NOT re-skinned by the LEG3ND airport-signage layout).
    label: "Taxonomy",
    items: [
      { label: "Overview", href: "/studio/xpms", minRole: "admin" },
      { label: "Atoms", href: "/studio/xpms/atoms", minRole: "admin" },
      { label: "Classes", href: "/studio/xpms/classes", minRole: "admin" },
      { label: "Codebook", href: "/studio/xpms/codebook", minRole: "admin" },
      { label: "Phases", href: "/studio/xpms/phases", minRole: "admin" },
      { label: "Tiers", href: "/studio/xpms/tiers", minRole: "admin" },
      { label: "Provenance", href: "/studio/xpms/provenance", minRole: "admin" },
      { label: "Variance", href: "/studio/xpms/variance", minRole: "admin" },
    ],
  },
  {
    label: "Billing & Data",
    items: [
      { label: "Billing", href: "/studio/settings/billing", minRole: "admin" },
      { label: "Exports", href: "/studio/settings/exports", minRole: "manager" },
      { label: "Imports", href: "/studio/settings/imports", minRole: "manager" },
      // ADR-0005 hoist: the project-level Import Jobs queue surfaced
      // as an orphan top-level prefix; it shares its mental model
      // with Exports, so it lands in the same admin sub-section.
      { label: "Import Jobs", href: "/studio/import", minRole: "manager" },
      // P0.1 — recycle bin. Browse + restore soft-deleted rows across the
      // human-meaningful soft-deletable tables. Manager+ (same band that can
      // delete). Backed by listTrashed + restoreOrgScoped.
      { label: "Trash", href: "/studio/trash", minRole: "manager" },
      // P0.2 — per-tenant AI & API usage dashboard over usage_rollups.
      { label: "Usage", href: "/studio/settings/usage", minRole: "manager" },
    ],
  },
  {
    // ADR-0006: Automations moved here (was 9 TECHNOLOGY → Automations).
    // Rationale: automations are config, not knowledge. Settings is the
    // home for config that drives behavior across the app.
    label: "Integrations",
    items: [
      { label: "Apps", href: "/studio/settings/integrations", minRole: "admin" },
      { label: "Marketplace", href: "/studio/settings/integrations/marketplace", minRole: "admin" },
      { label: "Ticketing", href: "/studio/settings/integrations/ticketing", minRole: "admin" },
      { label: "Automations", href: "/studio/ai/automations", minRole: "manager" },
      { label: "Field Agents", href: "/studio/ai/agents", minRole: "manager" },
      // F2 — RAG corpus indexer. Status of document_chunks by source + manual reindex.
      { label: "RAG Corpus", href: "/studio/ai/corpus", minRole: "manager" },
      { label: "API", href: "/studio/settings/api", minRole: "admin" },
      { label: "Webhooks", href: "/studio/settings/webhooks", minRole: "admin" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Audit Log", href: "/studio/settings/audit", minRole: "admin" },
      { label: "Compliance", href: "/studio/settings/compliance", minRole: "manager" },
      { label: "Marketplace Reviews", href: "/studio/marketplace/reviews" },
      { label: "Privacy", href: "/studio/legal/privacy" },
      { label: "DSAR", href: "/studio/legal/privacy/dsar" },
      { label: "Consent", href: "/studio/legal/privacy/consent" },
      { label: "Data Map", href: "/studio/legal/privacy/datamap" },
      { label: "IP / Trademarks", href: "/studio/legal/ip" },
      { label: "Insurance", href: "/studio/legal/insurance" },
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

/** Runtime list of all 15 portal sub-personas, in declaration order. */
export const PORTAL_PERSONAS: readonly PortalPersona[] = [
  "promoter",
  "producer",
  "stakeholder",
  "artist",
  "athlete",
  "delegation",
  "client",
  "sponsor",
  "media",
  "vendor",
  "crew",
  "volunteer",
  "hospitality",
  "guest",
  "vip",
];

/**
 * Map a coarse session persona (memberships.persona) to the portal
 * sub-persona whose rail/routes the viewer actually uses. Returns null
 * for operator personas (owner/admin/manager/collaborator) — operators
 * preview every persona's portal, so callers should fall back to the
 * full persona set.
 */
export function portalPersonaForSession(persona: string | null | undefined): PortalPersona | null {
  switch (persona) {
    case "client":
      return "client";
    case "contractor":
      return "vendor";
    case "crew":
      return "crew";
    case "guest":
    case "member":
    case "viewer":
    case "community":
    case "visitor":
      return "guest";
    default:
      return null;
  }
}

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
  // Shared project-events calendar (read-only <CalendarView>), distinct from
  // the persona-scoped workforce-shift schedules (<ScheduleSurface>). Lives at
  // the slug root so every persona sees the show calendar.
  const calendar: NavItem = { label: "Calendar", href: `/p/${slug}/schedule` };
  // Accreditation self-service (badge/credential applications). Portal-wide
  // surface above the persona slug; RLS gates what each viewer can request.
  const accreditation: NavItem = { label: "Accreditation", href: `/p/${slug}/apply` };
  // ADR-0005: workspace items (the shared 6) lift into their own section
  // so the persona-specific section stays inside Miller's band. Every
  // persona rail used to start with these 6, eating the operator's
  // recognition budget before any persona-specific work appeared.
  const overview: NavItem = { label: "Overview", href: base };
  const workspaceSection: NavSection = {
    label: "Workspace",
    items: [overview, guide, calendar, updates, inbox, tasks, messages, accreditation],
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
      { label: "Timesheets", href: `${base}/timesheets` },
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
// COMPVSS kit tab model (design kit rebuild 2026-06-21): the field app's primary
// bar is Home · Calendar · Tasks · Assets · Inbox, then More. Replaced the prior
// Home·Inbox·Shift·Alerts·Me deskless default. Icons resolve via the
// MobileTabBar ICONS map (keyed by href).
export const mobileTabs: NavItem[] = [
  { label: "Home", href: "/m" },
  { label: "Calendar", href: "/m/schedule" },
  { label: "Tasks", href: "/m/tasks" },
  // GVTEWAY consumer Onsite — the live-event center tab (design_handoff §2):
  // now/next set times, find-my-friends, read-only passes, gamification.
  { label: "Onsite", href: "/m/onsite" },
  { label: "Assets", href: "/m/inventory" },
  { label: "Inbox", href: "/m/inbox" },
  { label: "More", href: "/m/more" },
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
// COMPVSS kit More-hub surfaces (rebuild 2026-06-21). Every secondary
// destination reachable from the More tab (/m/more), the org/project switcher,
// and the cmd-K palette — grouped Tools · People · Network · Account. Title Case
// labels; middot `·` only inside headers, never here.
export const mobileSurfaces: NavItem[] = [
  // Tools.
  { label: "Catalog", href: "/m/catalog" },
  { label: "Inventory", href: "/m/inventory" },
  { label: "Inventory Scan", href: "/m/inventory/scan" },
  { label: "Scan", href: "/m/check-in" },
  { label: "Quick Scan", href: "/m/scan" },
  { label: "Advancing", href: "/m/advances" },
  { label: "Time", href: "/m/clock" },
  { label: "Requests", href: "/m/requests" },
  { label: "Documents", href: "/m/docs" },
  { label: "Handover", href: "/m/handover" },
  { label: "Daily Log", href: "/m/daily-log" },
  { label: "Punch", href: "/m/punch" },
  { label: "Chain of Custody", href: "/m/coc" },
  { label: "Incidents", href: "/m/incidents" },
  { label: "My Incidents", href: "/m/incident" },
  { label: "Guide", href: "/m/guide" },
  // People.
  { label: "Team Roster", href: "/m/directory" },
  { label: "Vendors", href: "/m/directory/companies" },
  { label: "Connections", href: "/m/connections" },
  // Network.
  { label: "Community", href: "/m/feed" },
  { label: "Jobs", href: "/m/gigs" },
  { label: "Marketplace", href: "/m/market" },
  // Account / credential.
  { label: "Wallet", href: "/m/wallet" },
  { label: "Time Off", href: "/m/time-off" },
  { label: "Profile", href: "/m/profile" },
  { label: "Activity History", href: "/m/activity" },
  { label: "Referrals & Rewards", href: "/m/referrals" },
  { label: "Emergency", href: "/m/emergency" },
  { label: "Alerts", href: "/m/alerts" },
  { label: "Notifications", href: "/m/notifications" },
  { label: "Onboarding", href: "/m/onboarding" },
  { label: "Settings", href: "/m/settings" },
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
// COMPVSS kit rebuild (2026-06-21): retuned to reference only surviving kit
// surfaces (the role-era surfaces — gate/driver/medic/ros/wms/learning/kudos/
// surveys — were deleted). All hrefs here must exist in `mobileSurfaces`.
const PHASE_PRIORITY_HREFS: Record<string, string[]> = {
  discovery: ["/m/directory", "/m/feed"],
  concept: ["/m/feed", "/m/directory"],
  development: ["/m/feed", "/m/docs"],
  advance: ["/m/onboarding", "/m/advances", "/m/docs", "/m/directory"],
  build: ["/m/punch", "/m/daily-log", "/m/handover", "/m/coc"],
  show: ["/m/check-in", "/m/incidents", "/m/clock", "/m/alerts"],
  strike: ["/m/punch", "/m/daily-log", "/m/handover", "/m/coc"],
  wrap: ["/m/time-off", "/m/onboarding", "/m/feed"],
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

// COMPVSS kit rebuild (2026-06-21) retired the persona-routed /m/[role] tab
// model entirely. The single crew-kit tab model (`mobileTabs`) + phase-aware
// ordering (`mobileSurfacesForPhase`) are the canon; the legacy MobileRole /
// MOBILE_ROLES / ROLE_TABS / roleTabs / mobileSurfacesForRole exports were
// removed (no live consumers).

// ───────────────────────────────────────────────────────────────────────
// Self-navigating shells — marketing + personal (/me).
//
// These shells navigate via their own chrome (MarketingHeader, the marketing
// layout footer, the personal layout tabs) rather than the platform rails.
// The link DATA lives HERE so it is a single source of truth the sitemap
// generator can reconcile; the components import and render it. Labels stay
// as i18n catalog keys (`labelKey`), resolved with `t()` at render — moving
// the data does not change a single rendered string.
// ───────────────────────────────────────────────────────────────────────

/** i18n-keyed nav item (marketing). `descriptionKey` drives dropdown blurbs. */
export type MarketingNavItem = { labelKey: string; href: string; descriptionKey?: string };
export type MarketingNavGroup = { labelKey: string; items: MarketingNavItem[] };

/** Marketing header — the three dropdown groups (Product / Industries / Resources). */
export const marketingHeaderGroups: [MarketingNavGroup, MarketingNavGroup, MarketingNavGroup] = [
  {
    labelKey: "marketing.header.product.label",
    items: [
      {
        labelKey: "marketing.header.product.features.label",
        href: "/features",
        descriptionKey: "marketing.header.product.features.description",
      },
      {
        labelKey: "marketing.header.product.solutions.label",
        href: "/solutions",
        descriptionKey: "marketing.header.product.solutions.description",
      },
      {
        labelKey: "marketing.header.product.atlvs.label",
        href: "/solutions/atlvs",
        descriptionKey: "marketing.header.product.atlvs.description",
      },
      {
        labelKey: "marketing.header.product.compvss.label",
        href: "/solutions/compvss",
        descriptionKey: "marketing.header.product.compvss.description",
      },
      {
        labelKey: "marketing.header.product.gvteway.label",
        href: "/solutions/gvteway",
        descriptionKey: "marketing.header.product.gvteway.description",
      },
      {
        labelKey: "marketing.header.product.legend.label",
        href: "/solutions/legend",
        descriptionKey: "marketing.header.product.legend.description",
      },
    ],
  },
  {
    labelKey: "marketing.header.industries.label",
    items: [
      { labelKey: "marketing.industries.live-events", href: "/solutions/live-events" },
      { labelKey: "marketing.industries.concerts", href: "/solutions/concerts" },
      { labelKey: "marketing.industries.festivals-tours", href: "/solutions/festivals-tours" },
      { labelKey: "marketing.industries.immersive-experiences", href: "/solutions/immersive-experiences" },
      { labelKey: "marketing.industries.brand-activations", href: "/solutions/brand-activations" },
      { labelKey: "marketing.industries.corporate-events", href: "/solutions/corporate-events" },
      { labelKey: "marketing.industries.theatrical-performances", href: "/solutions/theatrical-performances" },
      { labelKey: "marketing.industries.broadcast-tv-film", href: "/solutions/broadcast-tv-film" },
    ],
  },
  {
    labelKey: "marketing.header.resources.label",
    items: [
      {
        labelKey: "marketing.header.resources.blog.label",
        href: "/blog",
        descriptionKey: "marketing.header.resources.blog.description",
      },
      {
        labelKey: "marketing.header.resources.guides.label",
        href: "/guides",
        descriptionKey: "marketing.header.resources.guides.description",
      },
      {
        labelKey: "marketing.header.resources.docs.label",
        href: "/docs",
        descriptionKey: "marketing.header.resources.docs.description",
      },
      {
        labelKey: "marketing.header.resources.changelog.label",
        href: "/changelog",
        descriptionKey: "marketing.header.resources.changelog.description",
      },
    ],
  },
];

/** Marketing header — direct (non-dropdown) primary links. */
export const marketingHeaderPrimaryLinks: MarketingNavItem[] = [
  { labelKey: "marketing.header.marketplace", href: "/marketplace" },
  { labelKey: "nav.events", href: "/events" },
  { labelKey: "nav.pricing", href: "/pricing" },
  { labelKey: "nav.community", href: "/community" },
];

/** Marketing header — auth links (rendered with CTA styling in the component). */
export const marketingAuthLinks = {
  login: { labelKey: "marketing.header.login", href: "/login" },
  signup: { labelKey: "common.startFree", href: "/signup" },
} as const;

/** Marketing footer — seven grouped columns. */
export const marketingFooterGroups: MarketingNavGroup[] = [
  {
    labelKey: "marketing.layout.footer.product.heading",
    items: [
      { labelKey: "marketing.layout.footer.product.solutions", href: "/solutions" },
      { labelKey: "marketing.layout.footer.product.atlvs", href: "/solutions/atlvs" },
      { labelKey: "marketing.layout.footer.product.gvteway", href: "/solutions/gvteway" },
      { labelKey: "marketing.layout.footer.product.compvss", href: "/solutions/compvss" },
      { labelKey: "marketing.layout.footer.product.legend", href: "/solutions/legend" },
      { labelKey: "marketing.layout.footer.product.features", href: "/features" },
      { labelKey: "marketing.layout.footer.product.ai", href: "/ai" },
      { labelKey: "marketing.layout.footer.product.integrations", href: "/integrations" },
      { labelKey: "marketing.layout.footer.product.pricing", href: "/pricing" },
      { labelKey: "marketing.layout.footer.product.changelog", href: "/changelog" },
      { labelKey: "marketing.layout.footer.product.roadmap", href: "/roadmap" },
    ],
  },
  {
    labelKey: "marketing.layout.footer.builtFor.heading",
    items: [
      { labelKey: "marketing.layout.footer.builtFor.tourManagers", href: "/teams/tour-managers" },
      { labelKey: "marketing.layout.footer.builtFor.productionManagers", href: "/teams/production-managers" },
      { labelKey: "marketing.layout.footer.builtFor.stageManagers", href: "/teams/stage-managers" },
      { labelKey: "marketing.layout.footer.builtFor.festivalDirectors", href: "/teams/festival-directors" },
      { labelKey: "marketing.layout.footer.builtFor.siteManagers", href: "/teams/site-managers" },
      { labelKey: "marketing.layout.footer.builtFor.techDirectors", href: "/teams/technical-directors" },
      { labelKey: "marketing.layout.footer.builtFor.talentBuyers", href: "/teams/talent-buyers" },
      { labelKey: "marketing.layout.footer.builtFor.ehsLeads", href: "/teams/hse-leads" },
    ],
  },
  {
    labelKey: "marketing.layout.footer.industries.heading",
    items: [
      { labelKey: "marketing.layout.footer.industries.liveEvents", href: "/solutions/live-events" },
      { labelKey: "marketing.layout.footer.industries.concerts", href: "/solutions/concerts" },
      { labelKey: "marketing.layout.footer.industries.festivalsTours", href: "/solutions/festivals-tours" },
      { labelKey: "marketing.layout.footer.industries.immersive", href: "/solutions/immersive-experiences" },
      { labelKey: "marketing.layout.footer.industries.brandActivations", href: "/solutions/brand-activations" },
      { labelKey: "marketing.layout.footer.industries.corporate", href: "/solutions/corporate-events" },
      { labelKey: "marketing.layout.footer.industries.theatrical", href: "/solutions/theatrical-performances" },
      { labelKey: "marketing.layout.footer.industries.broadcast", href: "/solutions/broadcast-tv-film" },
    ],
  },
  {
    labelKey: "marketing.layout.footer.resources.heading",
    items: [
      { labelKey: "marketing.layout.footer.resources.docs", href: "/docs" },
      { labelKey: "marketing.layout.footer.resources.guides", href: "/guides" },
      { labelKey: "marketing.layout.footer.resources.glossary", href: "/glossary" },
      { labelKey: "marketing.layout.footer.resources.templates", href: "/templates" },
      { labelKey: "marketing.layout.footer.resources.tools", href: "/tools" },
      { labelKey: "marketing.layout.footer.resources.blog", href: "/blog" },
      { labelKey: "marketing.layout.footer.resources.community", href: "/community" },
      { labelKey: "marketing.layout.footer.resources.help", href: "/help" },
    ],
  },
  {
    labelKey: "marketing.layout.footer.compare.heading",
    items: [
      { labelKey: "marketing.layout.footer.compare.cvent", href: "/compare/cvent" },
      { labelKey: "marketing.layout.footer.compare.procore", href: "/compare/procore" },
      { labelKey: "marketing.layout.footer.compare.eventbrite", href: "/compare/eventbrite" },
      { labelKey: "marketing.layout.footer.compare.masterTour", href: "/compare/master-tour" },
      { labelKey: "marketing.layout.footer.compare.monday", href: "/compare/monday" },
      { labelKey: "marketing.layout.footer.compare.notion", href: "/compare/notion" },
      { labelKey: "marketing.layout.footer.compare.airtable", href: "/compare/airtable" },
      { labelKey: "marketing.layout.footer.compare.asana", href: "/compare/asana" },
      { labelKey: "marketing.layout.footer.compare.docusign", href: "/compare/docusign" },
      { labelKey: "marketing.layout.footer.compare.salesforce", href: "/compare/salesforce" },
      { labelKey: "marketing.layout.footer.compare.allAlternatives", href: "/alternatives" },
    ],
  },
  {
    labelKey: "marketing.layout.footer.studio.heading",
    items: [
      { labelKey: "marketing.layout.footer.studio.about", href: "/about" },
      { labelKey: "marketing.layout.footer.studio.contact", href: "/contact" },
      { labelKey: "marketing.layout.footer.studio.careers", href: "/careers" },
      { labelKey: "marketing.layout.footer.studio.customers", href: "/customers" },
      { labelKey: "marketing.layout.footer.studio.press", href: "/press" },
      { labelKey: "marketing.layout.footer.studio.partners", href: "/partners" },
      { labelKey: "marketing.layout.footer.studio.status", href: "/status" },
    ],
  },
  {
    labelKey: "marketing.layout.footer.legal.heading",
    items: [
      { labelKey: "marketing.layout.footer.legal.terms", href: "/legal/terms" },
      { labelKey: "marketing.layout.footer.legal.privacy", href: "/legal/privacy" },
      { labelKey: "marketing.layout.footer.legal.dpa", href: "/legal/dpa" },
      { labelKey: "marketing.layout.footer.legal.sla", href: "/legal/sla" },
    ],
  },
];

/** Personal (/me) nav — carries an English `fallback` for the `t(key, _, fallback)` pattern. */
export type PersonalNavItem = { labelKey: string; href: string; fallback: string };
export type PersonalNavGroup = { labelKey: string; fallback: string; items: PersonalNavItem[] };

/** Personal layout tabs — three grouped sections (Account / Activity / Marketplace). */
export const personalNavGroups: PersonalNavGroup[] = [
  {
    labelKey: "me.layout.groups.account",
    fallback: "Account",
    items: [
      { labelKey: "me.layout.tabs.profile", href: "/me/profile", fallback: "Profile" },
      { labelKey: "me.layout.tabs.preferences", href: "/me/preferences", fallback: "Preferences" },
      { labelKey: "me.layout.tabs.settings", href: "/me/settings", fallback: "Settings" },
      { labelKey: "me.layout.tabs.privacy", href: "/me/privacy", fallback: "Privacy" },
      { labelKey: "me.layout.tabs.security", href: "/me/security", fallback: "Security" },
      { labelKey: "me.layout.tabs.organizations", href: "/me/organizations", fallback: "Organizations" },
    ],
  },
  {
    labelKey: "me.layout.groups.activity",
    fallback: "Activity",
    items: [
      { labelKey: "me.layout.tabs.dashboard", href: "/me", fallback: "Dashboard" },
      { labelKey: "me.layout.tabs.notifications", href: "/me/notifications", fallback: "Notifications" },
      { labelKey: "me.layout.tabs.tickets", href: "/me/tickets", fallback: "Tickets" },
      { labelKey: "me.layout.tabs.reviews", href: "/me/reviews", fallback: "Reviews" },
    ],
  },
  {
    labelKey: "me.layout.groups.marketplace",
    fallback: "Marketplace",
    items: [
      { labelKey: "me.layout.tabs.talent", href: "/me/talent", fallback: "Talent" },
      { labelKey: "me.layout.tabs.applications", href: "/me/applications", fallback: "Applications" },
      { labelKey: "me.layout.tabs.submissions", href: "/me/submissions", fallback: "Submissions" },
      { labelKey: "me.layout.tabs.inquiries", href: "/me/inquiries", fallback: "Inquiries" },
      { labelKey: "me.layout.tabs.offers", href: "/me/offers", fallback: "Offers" },
      { labelKey: "me.layout.tabs.availability", href: "/me/availability", fallback: "Availability" },
      { labelKey: "me.layout.tabs.savedSearches", href: "/me/saved-searches", fallback: "Saved Searches" },
      { labelKey: "me.layout.tabs.crew", href: "/me/crew", fallback: "Crew" },
    ],
  },
];
