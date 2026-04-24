export type NavItem = { label: string; href: string };
export type NavGroup = { label: string; items: NavItem[] };

/**
 * Primary console navigation. Compressed from 24 → 9 groups in 2026-04
 * per `docs/ia/03-ia-compression-proposal.md`. Conventional SaaS labels;
 * admin moves to the avatar menu (see `settingsNav`); AI is ambient via
 * ⌘K, not a destination.
 */
export const platformNav: NavGroup[] = [
  { label: "Dashboard", items: [{ label: "Overview", href: "/console" }] },
  {
    label: "Projects",
    items: [
      { label: "All Projects", href: "/console/projects" },
      { label: "Programs", href: "/console/programs" },
      { label: "Venues", href: "/console/venues" },
      { label: "Risk Register", href: "/console/programs/risk" },
      { label: "Readiness", href: "/console/programs/readiness" },
      { label: "Reviews", href: "/console/programs/reviews" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Schedule", href: "/console/schedule" },
      { label: "Tasks", href: "/console/tasks" },
      { label: "Events", href: "/console/events" },
      { label: "Run of Show", href: "/console/production/ros" },
      { label: "Ceremonies", href: "/console/programs/ceremonies" },
      { label: "Incidents", href: "/console/safety/incidents" },
      { label: "Crisis", href: "/console/safety/crisis" },
      { label: "Medical", href: "/console/safety/medical" },
      { label: "Safeguarding", href: "/console/safety/safeguarding" },
      { label: "TOC", href: "/console/ops/toc" },
      { label: "Services Desk", href: "/console/services/requests" },
    ],
  },
  {
    label: "Logistics",
    items: [
      { label: "Transport", href: "/console/transport" },
      { label: "Accommodation", href: "/console/accommodation" },
      { label: "Dispatch", href: "/console/transport/dispatch" },
      { label: "Freight", href: "/console/logistics/freight" },
      { label: "Warehouse", href: "/console/logistics/warehouse" },
      { label: "Catering", href: "/console/logistics/services" },
      { label: "Disposition", href: "/console/logistics/disposition" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Directory", href: "/console/people" },
      { label: "Workforce", href: "/console/workforce" },
      { label: "Crew", href: "/console/people/crew" },
      { label: "Credentials", href: "/console/people/credentials" },
      { label: "Accreditation", href: "/console/accreditation" },
      { label: "Delegations", href: "/console/participants/delegations" },
      { label: "Visa", href: "/console/participants/visa" },
      { label: "Rosters", href: "/console/workforce/rosters" },
      { label: "Training", href: "/console/workforce/training" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Leads", href: "/console/leads" },
      { label: "Clients", href: "/console/clients" },
      { label: "Proposals", href: "/console/proposals" },
      { label: "Sponsors", href: "/console/commercial/sponsors" },
      { label: "Hospitality", href: "/console/commercial/hospitality" },
      { label: "Tickets", href: "/console/commercial/tickets" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Invoices", href: "/console/finance/invoices" },
      { label: "Expenses", href: "/console/finance/expenses" },
      { label: "Budgets", href: "/console/finance/budgets" },
      { label: "Payouts", href: "/console/finance/payouts" },
      { label: "Time", href: "/console/finance/time" },
      { label: "Mileage", href: "/console/finance/mileage" },
      { label: "Advances", href: "/console/finance/advances" },
      { label: "Reports", href: "/console/finance/reports" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { label: "Vendors", href: "/console/procurement/vendors" },
      { label: "Requisitions", href: "/console/procurement/requisitions" },
      { label: "Purchase Orders", href: "/console/procurement/purchase-orders" },
      { label: "RFQs", href: "/console/procurement/rfqs" },
      { label: "Catalog", href: "/console/procurement/catalog" },
      { label: "Rate Card", href: "/console/logistics/ratecard" },
      { label: "Equipment", href: "/console/production/equipment" },
      { label: "Rentals", href: "/console/production/rentals" },
      { label: "Fabrication", href: "/console/production/fabrication" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Articles", href: "/console/kb" },
      { label: "Guides", href: "/console/guides" },
      { label: "Playbooks", href: "/console/safety/playbooks" },
      { label: "BC/DR", href: "/console/safety/bcdr" },
      { label: "Threats", href: "/console/safety/threats" },
      { label: "Automations", href: "/console/ai/automations" },
      { label: "Sustainability", href: "/console/sustainability" },
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
      { label: "Advances", href: `${base}/advances` },
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
  { label: "Check-in", href: "/m/checkin" },
  { label: "Incident", href: "/m/incident" },
  { label: "Medic", href: "/m/medic" },
  { label: "Safeguarding", href: "/m/safeguarding" },
  { label: "Alerts", href: "/m/alerts" },
  { label: "Driver", href: "/m/driver" },
  { label: "A&D", href: "/m/ad" },
  { label: "Run of Show", href: "/m/ros" },
  { label: "Guard", href: "/m/guard" },
  { label: "Warehouse", href: "/m/wms" },
  { label: "Punch", href: "/m/punch" },
  { label: "Handover", href: "/m/handover" },
  { label: "Requests", href: "/m/requests" },
  { label: "Chain of Custody", href: "/m/coc" },
  { label: "Wayfind", href: "/m/wayfind" },
];
