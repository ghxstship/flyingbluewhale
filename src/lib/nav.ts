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
  | "Leaf"
  | "Spline"
  // Marketplace
  | "Globe"
  | "Megaphone"
  | "Mic2"
  | "Music"
  | "Star"
  | "Gavel"
  // Bookings (0003)
  | "TrendingUp"
  | "BarChart3"
  | "Lock"
  | "Coins"
  | "Route";

export type NavItem = {
  label: string;
  href: string;
  /** Icon registry key. Resolved to a Lucide component in
   *  `src/components/nav-icons.ts`. Each item carries a unique key. */
  icon?: IconName;
};
export type NavGroup = { label: string; items: NavItem[] };

/**
 * Primary console navigation — XPMS-native (ADR-0004, 2026-05-10).
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
export const platformNav: NavGroup[] = [
  {
    // Workspace chrome — not an XPMS class. Single "you are here" tile
    // at the top of the sidebar, separate from the 10 class groups.
    label: "Dashboard",
    items: [{ label: "Overview", href: "/console", icon: "LayoutDashboard" }],
  },
  {
    // 0 EXECUTIVE — Org-level command + control. Strategy / Finance /
    // Procurement / Legal / HR / Compliance fold under one canonical
    // class. Today's Plan + Procurement + half of Commerce + half of
    // People all live here.
    label: "0 EXECUTIVE",
    items: [
      // Strategy
      { label: "Projects", href: "/console/projects", icon: "FolderOpen" },
      { label: "Programs", href: "/console/programs", icon: "Layers" },
      { label: "Venues", href: "/console/venues", icon: "Building2" },
      { label: "Risk Register", href: "/console/programs/risk", icon: "AlertTriangle" },
      { label: "Readiness", href: "/console/programs/readiness", icon: "ShieldCheck" },
      { label: "Reviews", href: "/console/programs/reviews", icon: "ClipboardCheck" },
      // Finance
      { label: "Invoices", href: "/console/finance/invoices", icon: "Receipt" },
      { label: "Pay Apps", href: "/console/finance/pay-apps", icon: "FileSpreadsheet" },
      { label: "Expenses", href: "/console/finance/expenses", icon: "CreditCard" },
      { label: "Budgets", href: "/console/finance/budgets", icon: "PiggyBank" },
      { label: "Payouts", href: "/console/finance/payouts", icon: "Wallet" },
      { label: "Time", href: "/console/finance/time", icon: "Clock" },
      { label: "Periods", href: "/console/finance/periods", icon: "CalendarDays" },
      { label: "Reports", href: "/console/finance/reports", icon: "ChartBar" },
      { label: "Subscriptions", href: "/console/subscriptions", icon: "BadgeCheck" },
      // Procurement (a finance arm — buying)
      { label: "Vendors", href: "/console/procurement/vendors", icon: "Store" },
      { label: "Prequalification", href: "/console/procurement/prequalification", icon: "BookOpenCheck" },
      { label: "Sourcing", href: "/console/procurement/sourcing", icon: "Compass" },
      { label: "Requisitions", href: "/console/procurement/requisitions", icon: "ShoppingCart" },
      { label: "Purchase Orders", href: "/console/procurement/purchase-orders", icon: "Package" },
      { label: "RFQs", href: "/console/procurement/rfqs", icon: "PackageCheck" },
      { label: "Submittals", href: "/console/submittals", icon: "Inbox" },
      { label: "Rate Card", href: "/console/logistics/ratecard", icon: "ListOrdered" },
      // HR / Workspace people
      { label: "Directory", href: "/console/people", icon: "Users" },
      // Sustainability / Compliance reporting
      { label: "Sustainability", href: "/console/sustainability", icon: "Leaf" },
    ],
  },
  {
    // 1 CREATIVE — Authoring class. The work itself: design, art
    // direction, brand, IP, source files. Programa lives mostly here.
    label: "1 CREATIVE",
    items: [
      { label: "Proposals", href: "/console/proposals", icon: "FileText" },
      { label: "Proposal Templates", href: "/console/proposals/templates", icon: "Files" },
      // Site Plans is a CAD-rooted creative artifact — primary class is
      // CREATIVE, secondary BUILD (where it materializes).
      { label: "Site Plans", href: "/console/site-plans", icon: "Map" },
    ],
  },
  {
    // 2 TALENT — Anyone in front of the audience: bookings, programming,
    // curation, talent ops, agency, riders. Show economy.
    label: "2 TALENT",
    items: [
      { label: "Bookings", href: "/console/bookings", icon: "TrendingUp" },
      { label: "Deal Tracker", href: "/console/bookings/deals", icon: "Gavel" },
      { label: "Holds", href: "/console/bookings/holds", icon: "Lock" },
      { label: "Booking Calendar", href: "/console/bookings/calendar", icon: "CalendarDays" },
      { label: "Settlements", href: "/console/bookings/settlements", icon: "Coins" },
      { label: "Tours", href: "/console/agency/tours", icon: "Route" },
      { label: "Talent Roster", href: "/console/marketplace/talent", icon: "Music" },
      { label: "Offers", href: "/console/marketplace/offers", icon: "Gavel" },
      { label: "Rosters", href: "/console/workforce/rosters", icon: "ClipboardSignature" },
    ],
  },
  {
    // 3 MARKETING — Audience acquisition + revenue partnerships.
    // Sponsorship sales, CRM, public marketplace surfaces.
    label: "3 MARKETING",
    items: [
      { label: "Leads", href: "/console/leads", icon: "UserPlus" },
      { label: "Clients", href: "/console/clients", icon: "Handshake" },
      { label: "Sponsors", href: "/console/commercial/sponsors", icon: "Award" },
      { label: "Marketing", href: "/console/marketing", icon: "Megaphone" },
      { label: "Insights", href: "/console/insights", icon: "BarChart3" },
      { label: "Marketplace", href: "/console/marketplace", icon: "Globe" },
      { label: "Job Postings", href: "/console/marketplace/postings", icon: "Megaphone" },
      { label: "Open Calls", href: "/console/marketplace/calls", icon: "Mic2" },
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
    ],
  },
  {
    // 5 PRODUCTION — Show systems: audio, lighting, video, staging,
    // rigging, power, SFX. The technical envelope.
    label: "5 PRODUCTION",
    items: [
      { label: "Equipment", href: "/console/production/equipment", icon: "Wrench" },
      { label: "AV Inventory", href: "/console/production/av", icon: "Speaker" },
      { label: "Rentals", href: "/console/production/rentals", icon: "ArrowLeftRight" },
      { label: "Production Logistics", href: "/console/production/logistics", icon: "Crosshair" },
      { label: "Run of Show", href: "/console/production/ros", icon: "Play" },
      { label: "Live Dispatch", href: "/console/production/dispatch/live", icon: "Radio" },
    ],
  },
  {
    // 6 OPERATIONS — People + flow. Largest class: event ops, labor,
    // logistics, transport, security, medical, permits, workplace.
    // Today's Run + Safety + Logistics + Workforce + Delegations all
    // collapse here. Dense — pin frequently-used items.
    label: "6 OPERATIONS",
    items: [
      // Coordination
      { label: "Schedule", href: "/console/schedule", icon: "Calendar" },
      { label: "Look-ahead", href: "/console/operations/look-ahead", icon: "Telescope" },
      { label: "Daily Log", href: "/console/operations/daily-log", icon: "ScrollText" },
      { label: "Tasks", href: "/console/tasks", icon: "ListTodo" },
      { label: "Annotations", href: "/console/annotations", icon: "AlertTriangle" },
      { label: "Events", href: "/console/events", icon: "CalendarDays" },
      { label: "RFIs", href: "/console/rfis", icon: "MessageCircleQuestion" },
      // Workforce
      { label: "Teams", href: "/console/people/teams", icon: "UsersRound" },
      { label: "Workforce", href: "/console/workforce", icon: "HardHat" },
      { label: "Training", href: "/console/workforce/training", icon: "GraduationCap" },
      { label: "Delegations", href: "/console/participants/delegations", icon: "UsersRound" },
      { label: "Visa", href: "/console/participants/visa", icon: "Stamp" },
      // Logistics flow
      { label: "Transport", href: "/console/transport", icon: "Truck" },
      { label: "Dispatch", href: "/console/transport/dispatch", icon: "Send" },
      { label: "Freight", href: "/console/logistics/freight", icon: "Container" },
      { label: "Warehouse", href: "/console/logistics/warehouse", icon: "Warehouse" },
      { label: "Disposition", href: "/console/logistics/disposition", icon: "PackageOpen" },
      // Safety (operational care of humans)
      { label: "Incidents", href: "/console/safety/incidents", icon: "Siren" },
      { label: "Crisis", href: "/console/safety/crisis", icon: "Flame" },
      { label: "Medical", href: "/console/safety/medical", icon: "Stethoscope" },
      { label: "Safeguarding", href: "/console/safety/safeguarding", icon: "HeartHandshake" },
      { label: "Inspections", href: "/console/inspections", icon: "Search" },
      { label: "OSHA 300", href: "/console/safety/osha", icon: "ShieldAlert" },
      { label: "Briefings", href: "/console/safety/briefings", icon: "ClipboardPlus" },
      { label: "Playbooks", href: "/console/safety/playbooks", icon: "BookOpenCheck" },
    ],
  },
  {
    // 7 EXPERIENCE — Audience-facing surface. Guest experience,
    // activations, retail, accessibility, sponsor fulfillment.
    label: "7 EXPERIENCE",
    items: [
      { label: "Tickets", href: "/console/commercial/tickets", icon: "Ticket" },
      { label: "Hospitality (guest)", href: "/console/commercial/hospitality", icon: "ConciergeBell" },
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
      { label: "Articles", href: "/console/knowledge", icon: "BookOpen" },
      { label: "Guides", href: "/console/guides", icon: "Atlas" },
      // The XPMS Catalog (atom registry) is the canonical TECHNOLOGY-
      // class surface — a typed, searchable atom browse.
      { label: "Catalog", href: "/console/xpms", icon: "Spline" },
    ],
  },
];

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
      { label: "Governance", href: "/console/settings/governance" },
    ],
  },
  {
    label: "Billing & Data",
    items: [
      { label: "Billing", href: "/console/settings/billing" },
      { label: "Exports", href: "/console/settings/exports" },
      { label: "Imports", href: "/console/settings/imports" },
    ],
  },
  {
    label: "Integrations",
    items: [
      { label: "Apps", href: "/console/settings/integrations" },
      { label: "Marketplace", href: "/console/settings/integrations/marketplace" },
      { label: "Ticketing", href: "/console/settings/integrations/ticketing" },
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

export type PortalPersona =
  | "artist"
  | "vendor"
  | "client"
  | "sponsor"
  | "guest"
  | "crew"
  | "delegation"
  | "media"
  | "vip"
  | "hospitality"
  | "volunteer"
  | "athlete";

export function portalNav(slug: string, persona: PortalPersona) {
  const base = `/p/${slug}/${persona}`;
  const guide: NavItem = { label: "Guide", href: `/p/${slug}/guide` };
  const privacy: NavItem = { label: "Privacy", href: `${base}/privacy` };
  const map: Record<PortalPersona, NavItem[]> = {
    artist: [
      { label: "Overview", href: base },
      guide,
      { label: "Advancing", href: `${base}/advancing` },
      { label: "Catering", href: `${base}/catering` },
      { label: "Venue", href: `${base}/venue` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Travel", href: `${base}/travel` },
    ],
    vendor: [
      { label: "Overview", href: base },
      guide,
      { label: "Submissions", href: `${base}/submissions` },
      { label: "Equipment Pull List", href: `${base}/equipment-pull-list` },
      { label: "Purchase Orders", href: `${base}/purchase-orders` },
      { label: "Invoices", href: `${base}/invoices` },
      { label: "Credentials", href: `${base}/credentials` },
      { label: "Training", href: `${base}/training` },
      privacy,
    ],
    client: [
      { label: "Overview", href: base },
      guide,
      { label: "Proposals", href: `${base}/proposals` },
      { label: "Deliverables", href: `${base}/deliverables` },
      { label: "Invoices", href: `${base}/invoices` },
      { label: "Messages", href: `${base}/messages` },
      { label: "Files", href: `${base}/files` },
      privacy,
    ],
    sponsor: [
      { label: "Overview", href: base },
      guide,
      { label: "Entitlements", href: `${base}/entitlements` },
      { label: "Activations", href: `${base}/activations` },
      { label: "Assets", href: `${base}/assets` },
      { label: "Reporting", href: `${base}/reporting` },
      privacy,
    ],
    guest: [
      { label: "Overview", href: base },
      guide,
      { label: "Tickets", href: `${base}/tickets` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Logistics", href: `${base}/logistics` },
      privacy,
    ],
    crew: [
      { label: "Overview", href: base },
      guide,
      { label: "Call Sheet", href: `${base}/call-sheet` },
      { label: "Time", href: `${base}/time` },
    ],
    delegation: [
      { label: "Overview", href: base },
      guide,
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
    media: [
      { label: "Overview", href: base },
      guide,
      { label: "Services", href: `${base}/services` },
      { label: "Accommodation", href: `${base}/accommodation` },
      { label: "Transport", href: `${base}/transport` },
      { label: "Press Conferences", href: `${base}/pressconf` },
      { label: "Info-On-Demand", href: `${base}/info` },
    ],
    vip: [
      { label: "Overview", href: base },
      guide,
      { label: "Transport", href: `${base}/transport` },
      { label: "Accommodation", href: `${base}/accommodation` },
      { label: "Itinerary", href: `${base}/itinerary` },
    ],
    hospitality: [
      { label: "Overview", href: base },
      guide,
      { label: "Guests", href: `${base}/guests` },
      { label: "Itinerary", href: `${base}/itinerary` },
    ],
    volunteer: [
      { label: "Overview", href: base },
      guide,
      { label: "Application", href: `${base}/application` },
      { label: "Training", href: `${base}/training` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Uniform", href: `${base}/uniform` },
    ],
    athlete: [
      { label: "Overview", href: base },
      guide,
      { label: "Requests", href: `${base}/requests` },
      { label: "Training", href: `${base}/training` },
      { label: "Safeguarding", href: `${base}/safeguarding` },
      { label: "Visa", href: `${base}/visa` },
      privacy,
    ],
  };
  return map[persona];
}

export const mobileTabs: NavItem[] = [
  { label: "Home", href: "/m" },
  { label: "Gate", href: "/m/gate" },
  { label: "Shift", href: "/m/shift" },
  { label: "Alerts", href: "/m/alerts" },
  { label: "Me", href: "/m/settings" },
];

/**
 * The 19 secondary mobile surfaces. Reachable from the Tools tab on /m
 * and from the mobile cmd-K palette. Phase D of the WAYFINDER remediation
 * unblocks discovery — these were dead routes before.
 */
export const mobileSurfaces: NavItem[] = [
  { label: "Gate Scan", href: "/m/gate" },
  { label: "Wallet", href: "/m/wallet" },
  { label: "Shift", href: "/m/shift" },
  { label: "Check-in", href: "/m/clock" },
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
];
