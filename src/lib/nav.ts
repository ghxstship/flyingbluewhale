export type NavItem = { label: string; href: string };
export type NavGroup = { label: string; items: NavItem[] };

export const platformNav: NavGroup[] = [
  { label: "Dashboard", items: [{ label: "Overview", href: "/console" }] },
  {
    label: "Work",
    items: [
      { label: "Projects", href: "/console/projects" },
      { label: "Tasks", href: "/console/tasks" },
      { label: "Schedule", href: "/console/schedule" },
      { label: "Events", href: "/console/events" },
      { label: "Locations", href: "/console/locations" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Pipeline", href: "/console/pipeline" },
      { label: "Leads", href: "/console/leads" },
      { label: "Clients", href: "/console/clients" },
      { label: "Proposals", href: "/console/proposals" },
      { label: "Campaigns", href: "/console/campaigns" },
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
      { label: "RFQs", href: "/console/procurement/rfqs" },
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
      { label: "Warehouse", href: "/console/production/warehouse" },
      { label: "Logistics", href: "/console/production/logistics" },
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
    label: "AI",
    items: [
      { label: "Hub", href: "/console/ai" },
      { label: "Assistant", href: "/console/ai/assistant" },
      { label: "Drafting", href: "/console/ai/drafting" },
      { label: "Automations", href: "/console/ai/automations" },
      { label: "Agents", href: "/console/ai/agents" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { label: "Inbox", href: "/console/inbox" },
      { label: "Files", href: "/console/files" },
      { label: "Forms", href: "/console/forms" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Hub", href: "/console/settings" },
      { label: "Organization", href: "/console/settings/organization" },
      { label: "Billing", href: "/console/settings/billing" },
      { label: "Integrations", href: "/console/settings/integrations" },
      { label: "API", href: "/console/settings/api" },
      { label: "Webhooks", href: "/console/settings/webhooks" },
      { label: "Audit", href: "/console/settings/audit" },
      { label: "Compliance", href: "/console/settings/compliance" },
      { label: "Branding", href: "/console/settings/branding" },
      { label: "Domains", href: "/console/settings/domains" },
    ],
  },
];

export function portalNav(slug: string, persona: "artist" | "vendor" | "client" | "sponsor" | "guest" | "crew") {
  const base = `/p/${slug}/${persona}`;
  const guide: NavItem = { label: "Guide", href: `/p/${slug}/guide` };
  const map: Record<typeof persona, NavItem[]> = {
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
    ],
    client: [
      { label: "Overview", href: base },
      guide,
      { label: "Proposals", href: `${base}/proposals` },
      { label: "Deliverables", href: `${base}/deliverables` },
      { label: "Invoices", href: `${base}/invoices` },
      { label: "Messages", href: `${base}/messages` },
      { label: "Files", href: `${base}/files` },
    ],
    sponsor: [
      { label: "Overview", href: base },
      guide,
      { label: "Activations", href: `${base}/activations` },
      { label: "Assets", href: `${base}/assets` },
      { label: "Reporting", href: `${base}/reporting` },
    ],
    guest: [
      { label: "Overview", href: base },
      guide,
      { label: "Tickets", href: `${base}/tickets` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Logistics", href: `${base}/logistics` },
    ],
    crew: [
      { label: "Overview", href: base },
      guide,
      { label: "Call Sheet", href: `${base}/call-sheet` },
      { label: "Time", href: `${base}/time` },
      { label: "Advances", href: `${base}/advances` },
    ],
  };
  return map[persona];
}

export const mobileTabs: NavItem[] = [
  { label: "Home", href: "/m" },
  { label: "Check-in", href: "/m/check-in" },
  { label: "Guide", href: "/m/guide" },
  { label: "Tasks", href: "/m/tasks" },
  { label: "Me", href: "/m/settings" },
];
