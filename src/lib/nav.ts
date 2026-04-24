export type NavItem = { label: string; href: string };
export type NavGroup = { label: string; items: NavItem[] };

export const platformNav: NavGroup[] = [
  { label: "Dashboard", items: [{ label: "Overview", href: "/console" }] },
  {
    label: "Programs",
    items: [
      { label: "Hub", href: "/console/programs" },
      { label: "Master schedule", href: "/console/programs/schedule" },
      { label: "Risk register", href: "/console/programs/risk" },
      { label: "Reviews", href: "/console/programs/reviews" },
      { label: "Readiness", href: "/console/programs/readiness" },
      { label: "Scope", href: "/console/programs/scope" },
      { label: "Sessions", href: "/console/programs/sessions" },
      { label: "Ceremonies", href: "/console/programs/ceremonies" },
      { label: "Protocol", href: "/console/programs/protocol" },
      { label: "Press conferences", href: "/console/programs/pressconf" },
      { label: "Cases", href: "/console/programs/cases" },
    ],
  },
  {
    label: "Venues",
    items: [
      { label: "All venues", href: "/console/venues" },
      { label: "Training venues", href: "/console/venues/training" },
    ],
  },
  {
    label: "Accreditation",
    items: [
      { label: "Hub", href: "/console/accreditation" },
      { label: "Policy", href: "/console/accreditation/policy" },
      { label: "Categories", href: "/console/accreditation/categories" },
      { label: "Zones", href: "/console/accreditation/zones" },
      { label: "Vetting", href: "/console/accreditation/vetting" },
      { label: "Print queue", href: "/console/accreditation/print" },
      { label: "Scans", href: "/console/accreditation/scans" },
      { label: "Changes", href: "/console/accreditation/changes" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { label: "Hub", href: "/console/workforce" },
      { label: "Planning", href: "/console/workforce/planning" },
      { label: "Deployment", href: "/console/workforce/deployment" },
      { label: "Paid staff", href: "/console/workforce/staff" },
      { label: "Volunteers", href: "/console/workforce/volunteers" },
      { label: "Contractors", href: "/console/workforce/contractors" },
      { label: "Uniforms", href: "/console/workforce/uniforms" },
      { label: "Services", href: "/console/workforce/services" },
      { label: "Training", href: "/console/workforce/training" },
      { label: "Rosters", href: "/console/workforce/rosters" },
      { label: "Housing", href: "/console/workforce/housing" },
    ],
  },
  {
    label: "Safety",
    items: [
      { label: "Hub", href: "/console/safety" },
      { label: "Threats", href: "/console/safety/threats" },
      { label: "Playbooks", href: "/console/safety/playbooks" },
      { label: "Guard tours", href: "/console/safety/guard-tours" },
      { label: "Incidents", href: "/console/safety/incidents" },
      { label: "Major incident", href: "/console/safety/major-incident" },
      { label: "Cyber IR", href: "/console/safety/cyber-ir" },
      { label: "Medical", href: "/console/safety/medical" },
      { label: "Environmental", href: "/console/safety/environmental" },
      { label: "Crisis comms", href: "/console/safety/crisis" },
      { label: "Safeguarding", href: "/console/safety/safeguarding" },
      { label: "BC/DR", href: "/console/safety/bcdr" },
    ],
  },
  {
    label: "Transport",
    items: [
      { label: "Hub", href: "/console/transport" },
      { label: "Dispatch", href: "/console/transport/dispatch" },
      { label: "A&D", href: "/console/transport/ad" },
      { label: "Workforce shuttles", href: "/console/transport/workforce" },
      { label: "Fleets", href: "/console/transport/fleets" },
    ],
  },
  {
    label: "Accommodation",
    items: [
      { label: "Hub", href: "/console/accommodation" },
      { label: "Group blocks", href: "/console/accommodation/blocks" },
      { label: "Village", href: "/console/accommodation/village" },
    ],
  },
  {
    label: "Participants",
    items: [
      { label: "Hub", href: "/console/participants" },
      { label: "Delegations", href: "/console/participants/delegations" },
      { label: "Entries", href: "/console/participants/entries" },
      { label: "Visa", href: "/console/participants/visa" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { label: "Hub", href: "/console/commercial" },
      { label: "Sponsors", href: "/console/commercial/sponsors" },
      { label: "Hospitality", href: "/console/commercial/hospitality" },
      { label: "Ticketing", href: "/console/commercial/tickets" },
      { label: "Licensing", href: "/console/commercial/licensing" },
      { label: "Brand", href: "/console/commercial/brand" },
    ],
  },
  {
    label: "Logistics",
    items: [
      { label: "Hub", href: "/console/logistics" },
      { label: "Rate card", href: "/console/logistics/ratecard" },
      { label: "Freight", href: "/console/logistics/freight" },
      { label: "Warehouse", href: "/console/logistics/warehouse" },
      { label: "Services", href: "/console/logistics/services" },
      { label: "Disposition", href: "/console/logistics/disposition" },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Projects", href: "/console/projects" },
      { label: "Tasks", href: "/console/tasks" },
      { label: "Schedule", href: "/console/schedule" },
      { label: "Events", href: "/console/events" },
      { label: "Locations", href: "/console/locations" },
      { label: "Meetings", href: "/console/meetings" },
      { label: "Services desk", href: "/console/services/requests" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Pipeline", href: "/console/pipeline" },
      { label: "Leads", href: "/console/leads" },
      { label: "Clients", href: "/console/clients" },
      { label: "Proposals", href: "/console/proposals" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Hub", href: "/console/finance" },
      { label: "Invoices", href: "/console/finance/invoices" },
      { label: "Expenses", href: "/console/finance/expenses" },
      { label: "Budgets", href: "/console/finance/budgets" },
      { label: "Time", href: "/console/finance/time" },
      { label: "Mileage", href: "/console/finance/mileage" },
      { label: "Advances", href: "/console/finance/advances" },
      { label: "Payouts", href: "/console/finance/payouts" },
      { label: "Reports", href: "/console/finance/reports" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { label: "Hub", href: "/console/procurement" },
      { label: "Requisitions", href: "/console/procurement/requisitions" },
      { label: "Purchase Orders", href: "/console/procurement/purchase-orders" },
      { label: "Vendors", href: "/console/procurement/vendors" },
      { label: "Catalog", href: "/console/procurement/catalog" },
    ],
  },
  {
    label: "Production",
    items: [
      { label: "Fabrication", href: "/console/production/fabrication" },
      { label: "Dispatch", href: "/console/production/dispatch" },
      { label: "Rentals", href: "/console/production/rentals" },
      { label: "Equipment", href: "/console/production/equipment" },
      { label: "Logistics", href: "/console/production/logistics" },
      { label: "Compounds", href: "/console/production/compounds" },
      { label: "AV systems", href: "/console/production/av" },
      { label: "Run of show", href: "/console/production/ros" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Directory", href: "/console/people" },
      { label: "Crew", href: "/console/people/crew" },
      { label: "Credentials", href: "/console/people/credentials" },
      { label: "Roles", href: "/console/people/roles" },
      { label: "Invites", href: "/console/people/invites" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Hub", href: "/console/ops" },
      { label: "TOC", href: "/console/ops/toc" },
      { label: "Problems", href: "/console/ops/toc/problems" },
      { label: "Changes", href: "/console/ops/toc/changes" },
      { label: "Integrations", href: "/console/integrations" },
    ],
  },
  {
    label: "Legal",
    items: [
      { label: "Hub", href: "/console/legal" },
      { label: "IP", href: "/console/legal/ip" },
      { label: "Privacy", href: "/console/legal/privacy" },
      { label: "DSAR", href: "/console/legal/privacy/dsar" },
      { label: "Consent", href: "/console/legal/privacy/consent" },
      { label: "Data map", href: "/console/legal/privacy/datamap" },
      { label: "Insurance", href: "/console/legal/insurance" },
    ],
  },
  {
    label: "Comms",
    items: [
      { label: "Hub", href: "/console/comms" },
      { label: "Internal", href: "/console/comms/internal" },
      { label: "External PR", href: "/console/comms/external" },
    ],
  },
  {
    label: "Sustainability",
    items: [
      { label: "Hub", href: "/console/sustainability" },
      { label: "Carbon", href: "/console/sustainability/carbon" },
    ],
  },
  {
    label: "AI",
    items: [
      { label: "Hub", href: "/console/ai" },
      { label: "Assistant", href: "/console/ai/assistant" },
      { label: "Drafting", href: "/console/ai/drafting" },
    ],
  },
  {
    label: "Knowledge",
    items: [{ label: "KB", href: "/console/kb" }],
  },
  {
    label: "Collaboration",
    items: [
      { label: "Inbox", href: "/console/inbox" },
      { label: "Files", href: "/console/files" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Hub", href: "/console/settings" },
      { label: "Organization", href: "/console/settings/organization" },
      { label: "Governance", href: "/console/settings/governance" },
      { label: "Billing", href: "/console/settings/billing" },
      { label: "Integrations", href: "/console/settings/integrations" },
      { label: "API", href: "/console/settings/api" },
      { label: "Webhooks", href: "/console/settings/webhooks" },
      { label: "Audit", href: "/console/settings/audit" },
      { label: "Compliance", href: "/console/settings/compliance" },
      { label: "Exports", href: "/console/settings/exports" },
      { label: "Imports", href: "/console/settings/imports" },
      { label: "Email templates", href: "/console/settings/email-templates" },
      { label: "Branding", href: "/console/settings/branding" },
      { label: "Domains", href: "/console/settings/domains" },
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
      { label: "Rate card", href: `${base}/ratecard` },
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
      { label: "Press conferences", href: `${base}/pressconf` },
      { label: "Info-on-demand", href: `${base}/info` },
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
  { label: "Gate scan", href: "/m/gate" },
  { label: "Wallet", href: "/m/wallet" },
  { label: "Shift", href: "/m/shift" },
  { label: "Check-in", href: "/m/checkin" },
  { label: "Incident", href: "/m/incident" },
  { label: "Medic", href: "/m/medic" },
  { label: "Safeguarding", href: "/m/safeguarding" },
  { label: "Alerts", href: "/m/alerts" },
  { label: "Driver", href: "/m/driver" },
  { label: "A&D", href: "/m/ad" },
  { label: "Run of show", href: "/m/ros" },
  { label: "Guard", href: "/m/guard" },
  { label: "Warehouse", href: "/m/wms" },
  { label: "Punch", href: "/m/punch" },
  { label: "Handover", href: "/m/handover" },
  { label: "Requests", href: "/m/requests" },
  { label: "Chain of custody", href: "/m/coc" },
  { label: "Wayfind", href: "/m/wayfind" },
];
