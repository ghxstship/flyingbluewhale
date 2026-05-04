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
  // Projects
  | "FolderOpen"
  | "Layers"
  | "Building2"
  | "Map"
  | "GraduationCap"
  | "AlertTriangle"
  | "ShieldCheck"
  | "ClipboardCheck"
  // Operations
  | "Calendar"
  | "Telescope"
  | "ScrollText"
  | "ListTodo"
  | "CalendarDays"
  | "ClipboardList"
  | "MessageCircleQuestion"
  | "Image"
  | "Play"
  | "Sparkles"
  | "Siren"
  | "Flame"
  | "Stethoscope"
  | "HeartHandshake"
  | "Radio"
  | "Headset"
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
  | "UserCircle2"
  | "FileSignature"
  | "IdCard"
  | "BadgeCheck"
  | "UsersRound"
  | "Stamp"
  | "ClipboardSignature"
  // Revenue
  | "UserPlus"
  | "Handshake"
  | "FileText"
  | "Files"
  | "Award"
  | "ConciergeBell"
  | "Ticket"
  // Finance
  | "Receipt"
  | "FileSpreadsheet"
  | "CreditCard"
  | "PiggyBank"
  | "Hash"
  | "Wallet"
  | "Clock"
  | "Car"
  | "Banknote"
  | "ChartBar"
  // Procurement
  | "Store"
  | "Compass"
  | "Trophy"
  | "ShoppingCart"
  | "Package"
  | "PackageCheck"
  | "RefreshCw"
  | "Megaphone"
  | "Inbox"
  | "Boxes"
  | "ListOrdered"
  | "Wrench"
  | "Speaker"
  | "ArrowLeftRight"
  | "Hammer"
  | "Tent"
  | "Network"
  | "Crosshair"
  // Compliance & Safety
  | "Search"
  | "ClipboardPlus"
  | "ShieldAlert"
  | "BookOpenCheck"
  | "LifeBuoy"
  | "OctagonAlert"
  // Knowledge
  | "BookOpen"
  | "Atlas"
  | "Bot"
  | "Leaf"
  | "Spline";

export type NavItem = {
  label: string;
  href: string;
  /** Icon registry key. Resolved to a Lucide component in
   *  `src/components/nav-icons.ts`. Each item carries a unique key. */
  icon?: IconName;
};
export type NavGroup = { label: string; items: NavItem[] };

/**
 * Primary console navigation. Compressed from 24 → 9 groups in 2026-04 per
 * `docs/ia/03-ia-compression-proposal.md`; XPMS demoted from top-level into
 * a Knowledge hub in 2026-05 (the spine pages are reference material, not
 * daily-driver workflows — overview page carries its own secondary nav for
 * the eight sub-pages, and the command palette still resolves
 * `xpms.atoms`, `xpms.codebook`, etc. for power-user direct jumps).
 *
 * Conventional SaaS labels; admin moves to the avatar menu (see
 * `settingsNav`); AI is ambient via ⌘K, not a destination.
 */
export const platformNav: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Overview", href: "/console", icon: "LayoutDashboard" },
      { label: "Portfolio", href: "/console/dashboards", icon: "Briefcase" },
      { label: "Action Items", href: "/console/action-items", icon: "CheckSquare" },
      { label: "Command Palette", href: "/console/command", icon: "Command" },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "All Projects", href: "/console/projects", icon: "FolderOpen" },
      { label: "Programs", href: "/console/programs", icon: "Layers" },
      { label: "Venues", href: "/console/venues", icon: "Building2" },
      { label: "Site Plans", href: "/console/site-plans", icon: "Map" },
      { label: "Venue Training", href: "/console/venues/training", icon: "GraduationCap" },
      { label: "Risk Register", href: "/console/programs/risk", icon: "AlertTriangle" },
      { label: "Readiness", href: "/console/programs/readiness", icon: "ShieldCheck" },
      { label: "Reviews", href: "/console/programs/reviews", icon: "ClipboardCheck" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Schedule", href: "/console/schedule", icon: "Calendar" },
      { label: "Look-ahead (21d)", href: "/console/operations/look-ahead", icon: "Telescope" },
      { label: "Daily Log", href: "/console/operations/daily-log", icon: "ScrollText" },
      { label: "Tasks", href: "/console/tasks", icon: "ListTodo" },
      { label: "Events", href: "/console/events", icon: "CalendarDays" },
      { label: "Punch List", href: "/console/punch", icon: "ClipboardList" },
      { label: "RFIs", href: "/console/rfis", icon: "MessageCircleQuestion" },
      { label: "Photos", href: "/console/photos", icon: "Image" },
      { label: "Run of Show", href: "/console/production/ros", icon: "Play" },
      { label: "Ceremonies", href: "/console/programs/ceremonies", icon: "Sparkles" },
      { label: "Incidents", href: "/console/safety/incidents", icon: "Siren" },
      { label: "Crisis", href: "/console/safety/crisis", icon: "Flame" },
      { label: "Medical", href: "/console/safety/medical", icon: "Stethoscope" },
      { label: "Safeguarding", href: "/console/safety/safeguarding", icon: "HeartHandshake" },
      { label: "TOC", href: "/console/ops/toc", icon: "Radio" },
      { label: "Services Desk", href: "/console/services/requests", icon: "Headset" },
    ],
  },
  {
    label: "Logistics",
    items: [
      { label: "Transport", href: "/console/transport", icon: "Truck" },
      { label: "Accommodation", href: "/console/accommodation", icon: "BedDouble" },
      { label: "Dispatch", href: "/console/transport/dispatch", icon: "Send" },
      { label: "Freight", href: "/console/logistics/freight", icon: "Container" },
      { label: "Warehouse", href: "/console/logistics/warehouse", icon: "Warehouse" },
      { label: "Catering", href: "/console/logistics/services", icon: "UtensilsCrossed" },
      { label: "Disposition", href: "/console/logistics/disposition", icon: "PackageOpen" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Directory", href: "/console/people", icon: "Users" },
      { label: "Workforce", href: "/console/workforce", icon: "HardHat" },
      { label: "Crew", href: "/console/people/crew", icon: "UserCircle2" },
      { label: "Offer Letters", href: "/console/people/offer-letters", icon: "FileSignature" },
      { label: "Credentials", href: "/console/people/credentials", icon: "IdCard" },
      { label: "Accreditation", href: "/console/accreditation", icon: "BadgeCheck" },
      { label: "Delegations", href: "/console/participants/delegations", icon: "UsersRound" },
      { label: "Visa", href: "/console/participants/visa", icon: "Stamp" },
      { label: "Rosters", href: "/console/workforce/rosters", icon: "ClipboardSignature" },
      // Training shares the GraduationCap icon with Venue Training above —
      // semantically the same affordance (a learning track), so the
      // duplicate is intentional. Marked here so future audits know.
      { label: "Training", href: "/console/workforce/training", icon: "GraduationCap" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Leads", href: "/console/leads", icon: "UserPlus" },
      { label: "Clients", href: "/console/clients", icon: "Handshake" },
      { label: "Proposals", href: "/console/proposals", icon: "FileText" },
      { label: "Proposal Templates", href: "/console/proposals/templates", icon: "Files" },
      { label: "Sponsors", href: "/console/commercial/sponsors", icon: "Award" },
      { label: "Hospitality", href: "/console/commercial/hospitality", icon: "ConciergeBell" },
      { label: "Tickets", href: "/console/commercial/tickets", icon: "Ticket" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Invoices", href: "/console/finance/invoices", icon: "Receipt" },
      { label: "Pay Apps", href: "/console/finance/pay-apps", icon: "FileSpreadsheet" },
      { label: "Expenses", href: "/console/finance/expenses", icon: "CreditCard" },
      { label: "Budgets", href: "/console/finance/budgets", icon: "PiggyBank" },
      { label: "Cost Codes", href: "/console/finance/cost-codes", icon: "Hash" },
      { label: "Payouts", href: "/console/finance/payouts", icon: "Wallet" },
      { label: "Time", href: "/console/finance/time", icon: "Clock" },
      { label: "Mileage", href: "/console/finance/mileage", icon: "Car" },
      { label: "Treasury", href: "/console/finance/treasury", icon: "Banknote" },
      { label: "Reports", href: "/console/finance/reports", icon: "ChartBar" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { label: "Vendors", href: "/console/procurement/vendors", icon: "Store" },
      // Prequalification shares BookOpenCheck with Playbooks below —
      // both surface "vetted reference material to act against". OK.
      { label: "Prequalification", href: "/console/procurement/prequalification", icon: "BookOpenCheck" },
      { label: "Sourcing", href: "/console/procurement/sourcing", icon: "Compass" },
      { label: "Scorecards", href: "/console/procurement/scorecards", icon: "Trophy" },
      { label: "Requisitions", href: "/console/procurement/requisitions", icon: "ShoppingCart" },
      { label: "Purchase Orders", href: "/console/procurement/purchase-orders", icon: "Package" },
      { label: "PO Change Orders", href: "/console/procurement/po-change-orders", icon: "RefreshCw" },
      { label: "RFQs", href: "/console/procurement/rfqs", icon: "PackageCheck" },
      { label: "WO Broadcasts", href: "/console/procurement/wo-broadcasts", icon: "Megaphone" },
      { label: "Submittals", href: "/console/submittals", icon: "Inbox" },
      { label: "Catalog", href: "/console/procurement/catalog", icon: "Boxes" },
      { label: "Rate Card", href: "/console/logistics/ratecard", icon: "ListOrdered" },
      { label: "Equipment", href: "/console/production/equipment", icon: "Wrench" },
      { label: "AV Inventory", href: "/console/production/av", icon: "Speaker" },
      { label: "Rentals", href: "/console/production/rentals", icon: "ArrowLeftRight" },
      { label: "Fabrication", href: "/console/production/fabrication", icon: "Hammer" },
      { label: "Compounds", href: "/console/production/compounds", icon: "Tent" },
      { label: "Warehouse", href: "/console/production/warehouse", icon: "Network" },
      { label: "Production Logistics", href: "/console/production/logistics", icon: "Crosshair" },
      // Live Dispatch shares the Radio icon with TOC — both are real-time
      // ops radio surfaces. Intentional.
      { label: "Live Dispatch", href: "/console/production/dispatch/live", icon: "Radio" },
    ],
  },
  {
    label: "Compliance & Safety",
    items: [
      { label: "Inspections", href: "/console/inspections", icon: "Search" },
      { label: "Briefings", href: "/console/safety/briefings", icon: "ClipboardPlus" },
      { label: "OSHA 300", href: "/console/safety/osha", icon: "ShieldAlert" },
      { label: "Playbooks", href: "/console/safety/playbooks", icon: "BookOpenCheck" },
      { label: "BC/DR", href: "/console/safety/bcdr", icon: "LifeBuoy" },
      { label: "Threats", href: "/console/safety/threats", icon: "OctagonAlert" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Articles", href: "/console/knowledge", icon: "BookOpen" },
      { label: "Guides", href: "/console/guides", icon: "Atlas" },
      { label: "Automations", href: "/console/ai/automations", icon: "Bot" },
      { label: "Sustainability", href: "/console/sustainability", icon: "Leaf" },
      // XPMS spine — addressable layer beneath every other module. The
      // overview page exposes its own secondary nav for Atoms / Codebook /
      // Classes / Tier Composition / Phases / Variance Ledger / Provenance
      // so this single entry keeps the primary sidebar tidy.
      { label: "XPMS Spine", href: "/console/xpms", icon: "Spline" },
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
      { label: "API", href: "/console/settings/api" },
      { label: "Webhooks", href: "/console/settings/webhooks" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Audit Log", href: "/console/settings/audit" },
      { label: "Compliance", href: "/console/settings/compliance" },
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
];
