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
  | "CalendarClock"
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
  | "UserCircle"
  | "FileClock"
  // Kit 20 console-identity rail (verbatim prototype icons)
  | "House"
  | "SquareCheck"
  | "ChartColumn"
  | "Contact"
  | "CalendarCheck"
  | "Clapperboard"
  | "Video"
  | "FolderKanban"
  | "PencilRuler"
  | "Calculator"
  | "ClipboardPen"
  | "FileCheck"
  | "Boxes"
  | "ClipboardType"
  | "CalendarRange"
  | "ListChecks"
  | "ScanLine"
  | "SearchCheck"
  | "Banknote"
  | "Landmark"
  | "RadioTower"
  | "Headset"
  | "MapPin"
  | "Mic"
  | "CheckCheck"
  | "TriangleAlert"
  | "MessagesSquare";

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
  /**
   * One-line hover subtitle (v7.8 zero-training layer). Surfaces as a
   * tooltip/title on the sidebar entry so a new operator learns what a
   * noun is without clicking through. Optional — high-traffic items first.
   */
  sub?: string;
  /**
   * Live count badge slot (kit 21 wave W1). Names which computed count this
   * item displays — the (platform) layout resolves the numbers per request
   * (src/lib/nav-counts.ts) and PlatformSidebar renders the pill. Counts
   * are "needing you" numbers, never vanity totals: unread rooms · my open
   * tasks · approvals waiting on me.
   */
  countKey?: NavCountKey;
};

/** The three live sidebar counts (kit 21 W1). */
export type NavCountKey = "inbox" | "myWork" | "approvals";
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
export type NavGroup = {
  label: string;
  /** Group descriptor (kit rail sub-label, e.g. Talent · "Book") — rendered
   *  in page eyebrows and header tooltips, not as rail text. */
  sub?: string;
  href?: string;
  items: NavItem[];
  sections?: NavSection[];
};

/**
 * Second-shelf page-tab family (kit 20). `owner` is the rail item href the
 * family belongs to — the sidebar highlights it while any member tab is
 * active, and ModuleHeader auto-renders the family on every member route.
 */
export type PlatformTabFamily = { owner: string; eyebrow: string; tabs: RouteTabDef[] };
export type RouteTabDef = { label: string; href: string };

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
 * Narrow the rail to a scope-gated member's module allow-list (kit 21 W4).
 * `moduleScope` is the set of NavGroup labels the subcontractor was invited
 * for; null/empty = full access (ordinary members). Home is always kept — it
 * carries the personal-work spine (My Work · My Inbox) every seat needs. This
 * is a UI narrowing layered on the org-membership RLS every surface already
 * enforces, not a security boundary on its own.
 */
export function filterNavByModuleScope(groups: NavGroup[], moduleScope: string[] | null | undefined): NavGroup[] {
  if (!moduleScope || moduleScope.length === 0) return groups;
  const allowed = new Set(moduleScope);
  return groups.filter((g) => g.label === "Home" || allowed.has(g.label));
}

/**
 * Kit 20 console-identity rail (design_handoff_console_rebuild/_ia-dump.md,
 * landed 2026-07-04) — the VERBATIM 10-group / 60-item map. Labels, order,
 * and icons are the prototype contract; hrefs are the repo's canonical
 * routes (the A1-A4 store merges made /studio/crm · /studio/schedule ·
 * /studio/assets · /studio/finance/invoices the one-store-per-noun homes).
 * The second shelf lives in `platformTabs` below (30 tab families, every
 * tab a real route); surfaces the kit rail does not carry stay first-class
 * in `platformUtility` (⌘K + hubs + sitemap), so no URL died in the
 * reshape. Do not add rail items here without a kit revision — the rail is
 * the acceptance fixture (REPO_LANDING.md §4.1).
 */
export const platformNavDomain: NavGroup[] = [
  {
    label: "Home",
    items: [
      { label: "Dashboard", href: "/studio", icon: "House", sub: "Production Home · The Event Spine" },
      { label: "My Inbox", href: "/studio/inbox", icon: "Inbox", sub: "Channels & Direct Messages", countKey: "inbox" },
      {
        label: "My Work",
        href: "/studio/my-work",
        icon: "SquareCheck",
        sub: "Tasks · Approvals · My Requests",
        countKey: "myWork",
      },
      { label: "My Calendar", href: "/studio/calendar", icon: "CalendarDays", sub: "Your Cross-Module Calendar" },
      { label: "Reports", href: "/studio/reports", icon: "ChartColumn", sub: "43-Report Library · Print & PDF" },
      { label: "Insights", href: "/studio/insights", icon: "TrendingUp", sub: "Cross-Domain Analytics" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Sales & CRM", href: "/studio/crm", icon: "Handshake", sub: "One Pursuit Store · Deals · Leads · RFPs" },
      { label: "Clients", href: "/studio/clients", icon: "Contact", sub: "Client Accounts & Contacts" },
      { label: "Marketing", href: "/studio/marketing", icon: "Megaphone", sub: "Audiences, Campaigns & Channels" },
      {
        label: "Hospitality",
        href: "/studio/commercial/hospitality",
        icon: "ConciergeBell",
        sub: "Hosted Guests & Service Programs",
      },
      { label: "Marketplace", href: "/studio/marketplace", icon: "Store", sub: "Public Postings · Calls · EPKs" },
      { label: "Revenue", href: "/studio/revenue/orders", icon: "ShoppingCart", sub: "Orders, Transactions & Payouts" },
    ],
  },
  {
    label: "Talent",
    sub: "Book",
    items: [
      {
        label: "Artist Roster",
        href: "/studio/marketplace/talent",
        icon: "Mic",
        sub: "Artists & Performers · EPKs & Riders",
      },
      {
        label: "Artist Offers & Holds",
        href: "/studio/bookings",
        icon: "CalendarCheck",
        sub: "Holds & Offers · Confirmed Books Spawn The Advance Chain",
      },
      {
        label: "Tours",
        href: "/studio/agency/tours",
        icon: "Route",
        sub: "Routed Runs Of Dates · Legs, Advancing & Settlement",
      },
      {
        label: "Casting",
        href: "/studio/marketplace/calls",
        icon: "Clapperboard",
        sub: "Post A Role · Submissions Queue Per Role",
      },
    ],
  },
  {
    label: "Projects",
    sub: "Plan",
    items: [
      { label: "Events", href: "/studio/projects", icon: "FolderKanban", sub: "The Event Portfolio · Sell To Settle" },
      { label: "Programs", href: "/studio/programs", icon: "Layers", sub: "Multi-Project Portfolios" },
      { label: "Locations", href: "/studio/locations", icon: "MapPin", sub: "The Canonical Space Registry" },
      { label: "Proposals", href: "/studio/proposals", icon: "FileSignature", sub: "Pitch, Sign, Convert To Project" },
      { label: "Documents", href: "/studio/documents", icon: "FileText", sub: "29 Doc Types · Merge & Print" },
      { label: "Drawings", href: "/studio/drawings", icon: "PencilRuler", sub: "Sheet Sets & Revisions" },
      { label: "Estimates", href: "/studio/estimates", icon: "Calculator", sub: "Price The Job · Convert To Budget" },
      {
        label: "Approvals",
        href: "/studio/governance/approvals",
        icon: "CheckCheck",
        sub: "The Approval Queue · Every Chain",
        countKey: "approvals",
      },
    ],
  },
  {
    label: "Procurement",
    sub: "Source",
    items: [
      { label: "Vendors", href: "/studio/procurement/vendors", icon: "Building2", sub: "Supplier & Sub Directory" },
      {
        label: "Requisitions",
        href: "/studio/procurement/requisitions",
        icon: "ClipboardPen",
        sub: "Capture Demand Before Money Moves · Convert To PO Or RFQ",
      },
      {
        label: "RFQs & Sourcing",
        href: "/studio/procurement/rfqs",
        icon: "Gavel",
        sub: "Run A Sourcing Event · Three Bids And A Buy",
      },
      {
        label: "Purchase Orders",
        href: "/studio/procurement/purchase-orders",
        icon: "FileCheck",
        sub: "Commit Spend · Receive · Match",
      },
      {
        label: "Advancing",
        href: "/studio/advancing",
        icon: "ClipboardCheck",
        sub: "Catalog Fulfillment Per Party · Gear, Travel & Credentials",
      },
      {
        label: "Contracts",
        href: "/studio/legal/contracts",
        icon: "ScrollText",
        sub: "One Contract Store · Every Scope",
      },
      { label: "Catalog", href: "/studio/procurement/catalog", icon: "Boxes", sub: "Approved Items & Rate References" },
    ],
  },
  {
    label: "Production",
    sub: "Build",
    items: [
      { label: "Run Of Show", href: "/studio/production/ros", icon: "Clapperboard", sub: "Cue-By-Cue Show Timeline" },
      {
        label: "Build & Fabrication",
        href: "/studio/production/fabrication",
        icon: "Hammer",
        sub: "Work Orders Through QC",
      },
      {
        label: "Assets & Inventory",
        href: "/studio/assets",
        icon: "Package",
        sub: "One Physical-Asset Store · Gear, Fleet & Lots",
      },
      {
        label: "Work Orders",
        href: "/studio/production/work-orders",
        icon: "ClipboardType",
        sub: "Dispatch Jobs To Outside Crews",
      },
      {
        label: "Activations",
        href: "/studio/commercial/sponsors",
        icon: "Sparkles",
        sub: "Sponsor & Brand Activations",
      },
    ],
  },
  {
    label: "People",
    sub: "Crew",
    items: [
      { label: "Team Roster", href: "/studio/people/crew", icon: "Users", sub: "The Internal Team Directory" },
      {
        label: "Staff Schedule",
        href: "/studio/workforce/deployment",
        icon: "CalendarRange",
        sub: "Shift Deployment & Coverage",
      },
      { label: "Manning", href: "/studio/workforce/rosters", icon: "UsersRound", sub: "Muster Lists & Site Headcount" },
      {
        label: "Credentialing",
        href: "/studio/people/credentials",
        icon: "BadgeCheck",
        sub: "Issue & Track Credentials",
      },
    ],
  },
  {
    label: "Operations",
    sub: "Run",
    items: [
      {
        label: "Schedule",
        href: "/studio/schedule",
        icon: "CalendarDays",
        sub: "One Schedule Store · Events & Meetings",
      },
      {
        label: "Dispatch",
        href: "/studio/operations/schedule",
        icon: "CalendarRange",
        sub: "Unified Ops Timeline · Crew · Fleet · Spaces",
      },
      { label: "Tasks", href: "/studio/tasks", icon: "ListChecks", sub: "Phase × Department Work Items" },
      {
        label: "Day Sheets",
        href: "/studio/operations/day-sheets",
        icon: "FileClock",
        sub: "One Composed Page Per Date · Publish To Field",
      },
      { label: "Daily Log", href: "/studio/operations/daily-log", icon: "ClipboardList", sub: "The Signed Site Diary" },
      { label: "Transport", href: "/studio/logistics/freight", icon: "Truck", sub: "Freight & Ground Movement" },
      {
        label: "Catering",
        href: "/studio/logistics/services",
        icon: "UtensilsCrossed",
        sub: "Crew Meals & Site Services",
      },
      { label: "Accommodation", href: "/studio/accommodation", icon: "BedDouble", sub: "Rooming Lists & Hotel Blocks" },
    ],
  },
  {
    label: "Safety",
    sub: "Protect",
    items: [
      { label: "Incidents", href: "/studio/operations/incidents", icon: "Siren", sub: "Report, Triage & Resolve" },
      { label: "Access Control", href: "/studio/access-control", icon: "ScanLine", sub: "Checkpoints, Scans & Zones" },
      { label: "Inspections", href: "/studio/inspections", icon: "SearchCheck", sub: "Scheduled & Spot Checks" },
      {
        label: "Risk",
        href: "/studio/programs/risk",
        icon: "TriangleAlert",
        sub: "The Risk Register · Probability × Impact",
      },
      { label: "Compliance", href: "/studio/compliance", icon: "ShieldCheck", sub: "Requirements, Permits & Evidence" },
    ],
  },
  {
    label: "Finance",
    sub: "Settle",
    items: [
      { label: "Invoices", href: "/studio/finance/invoices", icon: "Receipt", sub: "AR & AP · One Invoice Store" },
      { label: "Expenses", href: "/studio/finance/expenses", icon: "Wallet", sub: "Capture, Submit & Approve" },
      { label: "Budgets", href: "/studio/finance/budgets", icon: "PiggyBank", sub: "Plan, Track & Settle" },
      { label: "Payroll", href: "/studio/finance/payroll", icon: "Banknote", sub: "Crew Pay & Certified Runs" },
      { label: "Ledger", href: "/studio/finance/ledger", icon: "Landmark", sub: "The General Ledger & Cost Codes" },
    ],
  },
  {
    label: "Comms",
    sub: "Connect",
    items: [
      {
        label: "Communications",
        href: "/studio/comms/announcements",
        icon: "RadioTower",
        sub: "Announcements & Broadcasts",
      },
      { label: "Community", href: "/legend/community", icon: "MessagesSquare", sub: "Cohorts, Members & Crews" },
      { label: "Knowledge Base", href: "/studio/knowledge", icon: "BookOpen", sub: "The Standard · Articles & SOPs" },
      { label: "Service Desk", href: "/studio/services", icon: "Headset", sub: "IT & Facilities Tickets" },
    ],
  },
];

export const platformTabs: PlatformTabFamily[] = [
  {
    owner: "/studio",
    eyebrow: "Home",
    tabs: [
      { label: "Overview", href: "/studio" },
      { label: "Dashboards", href: "/studio/dashboards" },
      { label: "Insights", href: "/studio/insights" },
      { label: "Reports", href: "/studio/reports" },
      { label: "Goals", href: "/studio/goals" },
      { label: "Sustainability", href: "/studio/sustainability" },
    ],
  },
  {
    // Casting is the one Talent workspace with real sub-entity tabs: a call
    // RECEIVES submissions. (The old rail-mirror family was collapsed — sidebar
    // is the noun, tabs are lenses/sub-entities that live only inside it.)
    owner: "/studio/marketplace/calls",
    eyebrow: "Talent · Book",
    tabs: [
      { label: "Calls", href: "/studio/marketplace/calls" },
      { label: "Submissions", href: "/studio/marketplace/submissions" },
    ],
  },
  {
    // Tours cockpit — Routing is the one lens (all routed dates across the run);
    // Settlement lives in Finance (Finance · Settle → Tour Settlement).
    owner: "/studio/agency/tours",
    eyebrow: "Talent · Book",
    tabs: [
      { label: "Tours", href: "/studio/agency/tours" },
      { label: "Routing", href: "/studio/agency/tours/routing" },
    ],
  },
  {
    owner: "/studio/crm",
    eyebrow: "Sales",
    tabs: [
      { label: "CRM", href: "/studio/crm" },
      { label: "Leads", href: "/studio/leads" },
      { label: "Deals", href: "/studio/pipeline" },
      // Kit 21 R2 (ADR-0015) — Opportunities is now the business-development
      // lens over crm(kind=rfp), distinct from the deals pipeline.
      { label: "Opportunities", href: "/studio/opportunities" },
    ],
  },
  {
    owner: "/studio/projects",
    eyebrow: "Projects · Plan",
    tabs: [
      { label: "Events", href: "/studio/projects" },
      { label: "Timeline", href: "/studio/schedule/baselines" },
      { label: "Coordinate Matrix", href: "/studio/position" },
      { label: "Deliverables", href: "/studio/advancing" },
      { label: "Proofs", href: "/studio/annotations" },
    ],
  },
  {
    owner: "/studio/revenue/orders",
    eyebrow: "Sales",
    tabs: [
      { label: "Orders", href: "/studio/revenue/orders" },
      { label: "Transactions", href: "/studio/revenue/transactions" },
      { label: "Box Office", href: "/studio/marketplace/box-office" },
      { label: "Guest List", href: "/studio/commercial/hospitality?audience=guest" },
      { label: "Merch", href: "/studio/marketplace/box-office/listings" },
      { label: "Discounts", href: "/studio/marketplace/discounts" },
      { label: "Payouts", href: "/studio/revenue/payouts" },
    ],
  },
  {
    owner: "/studio/documents",
    eyebrow: "Projects · Plan",
    tabs: [
      { label: "Files", href: "/studio/documents" },
      { label: "Whiteboards", href: "/studio/collaborate/whiteboards" },
      { label: "Document Control", href: "/studio/transmittals" },
    ],
  },
  {
    owner: "/studio/drawings",
    eyebrow: "Projects · Plan",
    tabs: [
      { label: "Sheet Sets", href: "/studio/drawings" },
      { label: "RFIs", href: "/studio/rfis" },
      { label: "Submittals", href: "/studio/submittals" },
    ],
  },
  {
    owner: "/studio/procurement/vendors",
    eyebrow: "Procurement · Source",
    tabs: [
      { label: "Directory", href: "/studio/procurement/vendors" },
      { label: "Scorecard", href: "/studio/procurement/scorecard" },
      { label: "COIs", href: "/studio/procurement/compliance" },
      { label: "Sub Network", href: "/studio/procurement/network" },
      { label: "Sub Compliance", href: "/studio/procurement/prequalification" },
    ],
  },
  {
    owner: "/studio/procurement/purchase-orders",
    eyebrow: "Procurement · Source",
    tabs: [
      { label: "Purchase Orders", href: "/studio/procurement/purchase-orders" },
      { label: "Receiving", href: "/studio/procurement/receiving" },
      { label: "Change Orders", href: "/studio/procurement/po-change-orders" },
    ],
  },
  {
    owner: "/studio/procurement/catalog",
    eyebrow: "Procurement · Source",
    tabs: [
      { label: "Catalog", href: "/studio/procurement/catalog" },
      { label: "Rate Cards", href: "/studio/logistics/ratecard" },
      { label: "Job Templates", href: "/studio/settings/job-templates" },
    ],
  },
  {
    owner: "/studio/assets",
    eyebrow: "Production · Build",
    tabs: [
      { label: "Registry", href: "/studio/assets" },
      { label: "Fleet", href: "/studio/production/equipment" },
      { label: "Lots", href: "/studio/logistics/warehouse" },
      { label: "Pull Sheets", href: "/studio/assets/pull-sheets" },
      { label: "Scan Sessions", href: "/studio/assets/scans" },
      { label: "Sub-Rentals", href: "/studio/production/rentals" },
      { label: "Warranties", href: "/studio/assets/warranties" },
      { label: "Maintenance", href: "/studio/operations/maintenance" },
      { label: "Power Plan", href: "/studio/assets/power" },
    ],
  },
  {
    owner: "/studio/production/fabrication",
    eyebrow: "Production · Build",
    tabs: [
      { label: "Fabrication", href: "/studio/production/fabrication" },
      { label: "Punch List", href: "/studio/punch" },
    ],
  },
  {
    owner: "/studio/people/crew",
    eyebrow: "People · Crew",
    tabs: [
      { label: "Roster", href: "/studio/people/crew" },
      { label: "Hiring", href: "/studio/marketplace/postings" },
      { label: "Onboarding", href: "/studio/workforce/onboarding" },
      { label: "Positions", href: "/studio/people/roles" },
      { label: "Performance", href: "/legend/console" },
      { label: "Recognition", href: "/studio/workforce/recognition" },
    ],
  },
  {
    owner: "/studio/workforce/deployment",
    eyebrow: "People · Crew",
    tabs: [
      { label: "Shifts", href: "/studio/workforce/deployment" },
      { label: "Capacity", href: "/studio/workforce/forecast" },
      { label: "Time Off", href: "/studio/workforce/time-off" },
      { label: "Shift Offers", href: "/studio/workforce/shift-swaps" },
      { label: "Hours & Fatigue", href: "/studio/finance/timesheets" },
    ],
  },
  {
    owner: "/studio/workforce/rosters",
    eyebrow: "People · Crew",
    tabs: [{ label: "Manning", href: "/studio/workforce/rosters" }],
  },
  {
    owner: "/studio/people/credentials",
    eyebrow: "People · Crew",
    tabs: [
      { label: "Credentials", href: "/studio/people/credentials" },
      { label: "Access Matrix", href: "/studio/accreditation" },
      { label: "Training", href: "/studio/workforce/training" },
      { label: "Delegations", href: "/studio/participants/delegations" },
      { label: "Visa & Immigration", href: "/studio/participants/visa" },
    ],
  },
  {
    owner: "/studio/schedule",
    eyebrow: "Operations · Run",
    tabs: [
      { label: "Schedule", href: "/studio/schedule" },
      { label: "Calendar", href: "/studio/calendar" },
      { label: "Event Orders", href: "/studio/sales/beos" },
      { label: "Meetings", href: "/studio/meetings" },
    ],
  },
  {
    owner: "/studio/locations",
    eyebrow: "Projects · Plan",
    tabs: [
      { label: "Registry", href: "/studio/locations" },
      { label: "Reservations", href: "/studio/operations/reservations" },
      { label: "Date Holds", href: "/studio/sales/diary" },
      { label: "Occupancy", href: "/studio/venues" },
    ],
  },
  {
    owner: "/studio/operations/incidents",
    eyebrow: "Safety · Protect",
    tabs: [
      { label: "Incidents", href: "/studio/operations/incidents" },
      { label: "Field Reports", href: "/studio/safety" },
      { label: "Medical Log", href: "/studio/safety/medical" },
      { label: "Weather Triggers", href: "/studio/safety/environmental" },
      { label: "Lost & Found", href: "/studio/safety/lost-found" },
    ],
  },
  {
    owner: "/studio/programs/risk",
    eyebrow: "Safety · Protect",
    tabs: [
      { label: "Register", href: "/studio/programs/risk" },
      { label: "Matrix", href: "/studio/risk" },
    ],
  },
  {
    owner: "/studio/compliance",
    eyebrow: "Safety · Protect",
    tabs: [
      { label: "Compliance", href: "/studio/compliance" },
      { label: "Permits", href: "/studio/compliance/permits" },
      { label: "Governance & Privacy", href: "/studio/settings/governance" },
      { label: "Security Ops", href: "/studio/safety/threats" },
    ],
  },
  {
    owner: "/studio/finance/invoices",
    eyebrow: "Finance · Settle",
    tabs: [
      { label: "Invoices", href: "/studio/finance/invoices" },
      { label: "Auto-Invoicing", href: "/studio/finance/auto-invoicing" },
      { label: "Pay Applications", href: "/studio/finance/pay-apps" },
      { label: "Sub Invoices", href: "/studio/finance/sub-invoices" },
      { label: "Lien Waivers", href: "/studio/finance/lien-waivers" },
    ],
  },
  {
    owner: "/studio/finance/budgets",
    eyebrow: "Finance · Settle",
    tabs: [
      { label: "Budgets", href: "/studio/finance/budgets" },
      { label: "Variance", href: "/studio/finance/budgets/variance" },
      { label: "Profitability", href: "/studio/finance/reports" },
      { label: "Scenario", href: "/studio/finance/forecasts" },
      { label: "Settlement", href: "/studio/finance/wip" },
      { label: "Tour Settlement", href: "/studio/finance/wip?scope=tour" },
      { label: "Close", href: "/studio/finance/periods" },
    ],
  },
  {
    owner: "/studio/finance/ledger",
    eyebrow: "Finance · Settle",
    tabs: [
      { label: "General Ledger", href: "/studio/finance/ledger" },
      { label: "Cost Codes", href: "/studio/finance/cost-codes" },
    ],
  },
  {
    owner: "/studio/finance/payroll",
    eyebrow: "Finance · Settle",
    tabs: [
      { label: "Payroll", href: "/studio/finance/payroll" },
      { label: "Time Tracker", href: "/studio/finance/time" },
    ],
  },
  {
    owner: "/studio/comms/announcements",
    eyebrow: "Comms · Connect",
    tabs: [
      { label: "Communications", href: "/studio/comms/announcements" },
      { label: "Channel Plan", href: "/studio/comms/channels" },
      { label: "Advance Sends", href: "/studio/comms/advances" },
    ],
  },
  {
    owner: "/studio/production/ros",
    eyebrow: "Production · Build",
    tabs: [
      { label: "Cues", href: "/studio/production/ros" },
      { label: "Lineup & Set Times", href: "/studio/events" },
    ],
  },
  {
    owner: "/studio/logistics/freight",
    eyebrow: "Operations · Run",
    tabs: [
      { label: "Freight", href: "/studio/logistics/freight" },
      { label: "Ground", href: "/studio/transport" },
    ],
  },
  {
    owner: "/studio/access-control",
    eyebrow: "Safety · Protect",
    tabs: [
      { label: "Checkpoints", href: "/studio/access-control" },
      { label: "Crowd Counts", href: "/studio/access-control/counts" },
    ],
  },
  {
    owner: "/studio/tasks",
    eyebrow: "Operations · Run",
    tabs: [
      { label: "Tasks", href: "/studio/tasks" },
      { label: "Forms", href: "/studio/forms" },
      { label: "Playbooks", href: "/studio/safety/playbooks" },
      { label: "Automations", href: "/studio/ai/automations" },
    ],
  },
];

export const platformUtility: NavItem[] = [
  // Utility, not rail: the kit 20 rail is the acceptance fixture and must
  // not grow without a kit revision. The corrections queue is where a
  // worker's disputed punch lands for a manager — without it, separation of
  // duties is a rule nobody can act on.
  {
    label: "Time Corrections",
    href: "/studio/finance/timesheets/corrections",
    icon: "CheckSquare",
    sub: "Approve The Field's Time Fixes",
  },
  { label: "Assistant", href: "/studio/assistant", icon: "Bot", sub: "Free-Form AI Chat" },
  { label: "Copilot", href: "/studio/copilot", icon: "Sparkles", sub: "Grounded Answers With Citations" },
  { label: "Notifications", href: "/me/notifications/inbox", icon: "Inbox", sub: "Cross-App Activity Feed" },
  { label: "Triage", href: "/studio/triage", icon: "CheckSquare", sub: "Clear The Decision Queue" },
  { label: "Proposal Templates", href: "/studio/proposals/templates", icon: "Files", sub: "Reusable Proposal Blocks" },
  { label: "Project Templates", href: "/studio/templates", icon: "Files", sub: "Clone-To-Start Project Shapes" },
  { label: "Event Kits", href: "/studio/kits", icon: "Layers", sub: "Zones · Lines · Touchpoints · Gates" },
  { label: "Site Plans", href: "/studio/site-plans", icon: "Map", sub: "Overlays On The Venue Map" },
  { label: "Specifications", href: "/studio/specs", icon: "BookOpen", sub: "Technical Spec Sections" },
  { label: "BIM Models", href: "/studio/bim", icon: "Network", sub: "3D Model Registry" },
  { label: "Takeoffs", href: "/studio/takeoffs", icon: "Crosshair", sub: "Quantity Counts From Drawings" },
  { label: "Readiness", href: "/studio/programs/readiness", icon: "ShieldCheck", sub: "Go-Live Gate Checks" },
  { label: "Reviews", href: "/studio/programs/reviews", icon: "ClipboardCheck", sub: "Stage-Gate Program Reviews" },
  { label: "Compounds", href: "/studio/production/compounds", icon: "Tent", sub: "Site Compound Layouts" },
  { label: "Reality Captures", href: "/studio/captures", icon: "Telescope", sub: "Scans & As-Built Captures" },
  { label: "Photo Log", href: "/studio/photos", icon: "Telescope", sub: "Timestamped Site Photos" },
  { label: "Warranties", href: "/studio/warranties", icon: "ShieldCheck", sub: "Closeout Warranty Records" },
  {
    label: "Live Dispatch",
    href: "/studio/production/dispatch/live",
    icon: "Radio",
    sub: "Real-Time Crew Dispatch Board",
  },
  {
    label: "Production Logistics",
    href: "/studio/production/logistics",
    icon: "Crosshair",
    sub: "Show-Side Moves & Staging",
  },
  { label: "Teams", href: "/studio/people/teams", icon: "UsersRound", sub: "Org Team Structure" },
  { label: "Workforce", href: "/studio/workforce", icon: "HardHat", sub: "Deskless Crew Directory" },
  { label: "Crew Contracts", href: "/studio/people/msas", icon: "FileSignature", sub: "MSAs & Engagement Terms" },
  {
    label: "Offer Letters",
    href: "/studio/people/offer-letters",
    icon: "FileText",
    sub: "Send, Countersign, Activate",
  },
  { label: "Courses", href: "/legend/learn", icon: "BookOpen", sub: "LEG3ND Learning Paths" },
  { label: "Badges", href: "/studio/workforce/badges", icon: "BadgeCheck", sub: "Award & Track Badges" },
  { label: "Sales", href: "/studio/sales", icon: "TrendingUp", sub: "The Sales & CRM Hub" },
  { label: "Campaigns", href: "/studio/campaigns", icon: "Star", sub: "Campaign Planning & Results" },
  { label: "Agency Roster", href: "/studio/agency/roster", icon: "Users", sub: "Represented Artists" },
  { label: "Offers", href: "/studio/marketplace/offers", icon: "Gavel", sub: "Booking Offers · 60/40 Terms" },
  { label: "Inquiries", href: "/studio/marketplace/inquiries", icon: "Inbox", sub: "Inbound Booking Interest" },
  {
    label: "E-Sign Envelopes",
    href: "/studio/envelopes",
    icon: "ClipboardSignature",
    sub: "Signature Packets & Status",
  },
  { label: "AP Invoice OCR", href: "/studio/finance/ap-ocr", icon: "Sparkles", sub: "Captured Invoice Intake" },
  { label: "Mileage", href: "/studio/finance/mileage", icon: "Truck", sub: "Mileage Logs & Rate Math" },
  { label: "Vendor Payouts", href: "/studio/finance/payouts", icon: "Wallet", sub: "Stripe Connect Vendor Status" },
  { label: "Entities", href: "/studio/finance/entities", icon: "Building2", sub: "Legal Entities & Books" },
  { label: "Chart of Accounts", href: "/studio/finance/accounts", icon: "ListOrdered", sub: "GL Account Structure" },
  { label: "Tax", href: "/studio/finance/tax", icon: "Coins", sub: "Tax Rates & Filings" },
  { label: "Subscriptions", href: "/studio/subscriptions", icon: "BadgeCheck", sub: "Plan, Seats & Billing" },
  { label: "Trades Marketplace", href: "/studio/procurement/marketplace", icon: "Store", sub: "Open Work Order Board" },
  { label: "Sourcing", href: "/studio/procurement/sourcing", icon: "Compass", sub: "Sourcing Events & Bids" },
  { label: "ITB", href: "/studio/procurement/itb", icon: "Gavel", sub: "Invitations To Bid" },
  {
    label: "WO Broadcasts",
    href: "/studio/procurement/wo-broadcasts",
    icon: "Send",
    sub: "Blast Work To Eligible Subs",
  },
  { label: "Master Catalog", href: "/studio/settings/catalog", icon: "Spline", sub: "Reusable SKUs For Advancing" },
  { label: "Look-Ahead", href: "/studio/operations/look-ahead", icon: "Telescope", sub: "Rolling 2-Week Plan" },
  { label: "Action Items", href: "/studio/action-items", icon: "CheckSquare", sub: "Cross-Domain Follow-Ups" },
  { label: "Guides", href: "/studio/guides", icon: "Atlas", sub: "Know-Before-You-Go Guides" },
  { label: "Dispatch", href: "/studio/transport/dispatch", icon: "Send", sub: "Driver & Vehicle Dispatch" },
  {
    label: "Disposition",
    href: "/studio/logistics/disposition",
    icon: "PackageOpen",
    sub: "Sell · Store · Scrap Decisions",
  },
  { label: "Major Incident", href: "/studio/safety/major-incident", icon: "Flame", sub: "MIM Bridge & Comms" },
  { label: "Crisis", href: "/studio/safety/crisis", icon: "Flame", sub: "Crisis Playbook Activation" },
  {
    label: "Safeguarding",
    href: "/studio/safety/safeguarding",
    icon: "HeartHandshake",
    sub: "Welfare & Vulnerable Persons",
  },
  { label: "Guard Tours", href: "/studio/safety/guard-tours", icon: "ShieldCheck", sub: "Patrol Routes & Checkpoints" },
  { label: "OSHA 300", href: "/studio/safety/osha", icon: "ShieldAlert", sub: "Recordable Injury Log" },
  { label: "Briefings", href: "/studio/safety/briefings", icon: "ClipboardPlus", sub: "Toolbox Talks & Sign-Ins" },
  { label: "Chain of Custody", href: "/studio/compliance/coc", icon: "FileSignature", sub: "Evidence Handling Log" },
  { label: "Meeting Notes", href: "/studio/meetings/notes", icon: "FileText", sub: "Minutes & Decisions" },
  { label: "Polls", href: "/studio/comms/polls", icon: "BarChart3", sub: "Quick Votes" },
  { label: "Surveys", href: "/studio/comms/surveys", icon: "ClipboardCheck", sub: "Structured Feedback Runs" },
  // Kit 27 — the advancing merge engine's send console + bespoke scheduler.
  { label: "Advance Sends", href: "/studio/comms/advances", icon: "Send", sub: "Packet Merge & Tracking Board" },
  { label: "Scheduler", href: "/studio/scheduler", icon: "CalendarClock", sub: "Bookable Event Types & Availability" },
  { label: "Email Inbox", href: "/studio/email-inbox", icon: "Inbox", sub: "Shared Org Mailbox" },
  { label: "Service Desk", href: "/studio/services/requests", icon: "ConciergeBell", sub: "IT & Facilities Tickets" },
  { label: "TOC — ITIL", href: "/studio/ops/toc", icon: "Network", sub: "Tech Ops Center · Service Health" },
  { label: "Pages", href: "/studio/collaborate/docs", icon: "FileText", sub: "Block-Based Collaborative Pages" },
  { label: "Sheets", href: "/studio/collaborate/sheets", icon: "FileSpreadsheet", sub: "Lightweight Grid Workspaces" },
  { label: "Notes", href: "/studio/notes", icon: "FileText", sub: "Rich-Text Scratch Notes" },
  { label: "Board", href: "/studio/board", icon: "Layers", sub: "Freeform Kanban" },
  // Kit 21 W6 — console Help surfaces (reached via the chrome ? menu + ⌘K).
  { label: "Help Center", href: "/studio/help", icon: "BookOpen", sub: "Product Help · Release Notes · Status" },
  { label: "What's New", href: "/studio/help/whats-new", icon: "Sparkles", sub: "Every Release, Newest First" },
  { label: "System Status", href: "/studio/help/status", icon: "ShieldCheck", sub: "Live Platform Component Health" },
];

/**
 * Canonical platform nav — the single domain-noun shape. Consumers import
 * `platformNav` directly; there is no per-user nav-mode switch.
 */
export const platformNav: NavGroup[] = platformNavDomain;

/**
 * Role Lenses (v7.8 zero-training layer) — persona presets over the
 * platform rail. Each lens is an allow-list of `platformNav` group labels;
 * `null` = All (everything). Defaults, not cages: the sidebar always offers
 * "All", pinned items escape the lens, and the group holding the active
 * route is always kept so the user can never lose their current page.
 * Persisted per user via `user_preferences.ui_state.nav_lens`.
 *
 * Kit map (design_handoff_console_rebuild/_ia-dump.md §Role Lenses) —
 * VERBATIM since the kit 20 rail landed; group nouns now match the kit.
 */
export type NavLens = "All" | "Produce" | "Ops" | "Crew" | "Finance" | "Safety";
export const NAV_LENSES: Record<NavLens, string[] | null> = {
  All: null,
  Produce: ["Home", "Sales", "Talent", "Projects", "Procurement", "Production", "Finance"],
  Ops: ["Home", "Projects", "Production", "Operations", "Safety", "Comms"],
  Crew: ["Home", "Operations", "People", "Comms"],
  Finance: ["Home", "Sales", "Procurement", "Finance"],
  Safety: ["Home", "Safety", "Operations", "Comms"],
};
export const NAV_LENS_ORDER: NavLens[] = ["All", "Produce", "Ops", "Crew", "Finance", "Safety"];

/**
 * LEG3ND shell nav (ADR-0011) — the standalone Knowledge · LMS · resource hub
 * promoted out of the console into its own `(legend)` route group / `legend`
 * subdomain. Rendered by `src/app/(legend)/layout.tsx`. The three kit modes
 * (public funnel · learner · authoring/compliance) share this rail; page-level
 * `requireSession()` gates the authoring/compliance surfaces.
 */
export const legendNav: NavGroup[] = [
  {
    // ORGANIZATION — the hub (marketing rebuild P3; app ownership canon:
    // LEG3ND owns 0000 Executive, the org level itself). Where organizations
    // are configured once and every project inherits it.
    label: "Organization",
    items: [
      { label: "Hub", href: "/legend/hub", icon: "LayoutDashboard" },
      { label: "Brand Studio", href: "/legend/hub/brand", icon: "Stamp" },
      { label: "Positions", href: "/legend/hub/organization", icon: "Users" },
      { label: "Finance Codes", href: "/legend/hub/finance-codes", icon: "Receipt" },
      { label: "Locations", href: "/legend/hub/locations", icon: "MapPin" },
      { label: "Catalogs", href: "/legend/hub/catalogs", icon: "Boxes" },
      { label: "Templates", href: "/legend/hub/templates", icon: "FileStack" },
      { label: "Start Your Organization", href: "/legend/start", icon: "Compass" },
    ],
  },
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
    // COMMUNITY — cohort-community-class discussion, directory, and learning crews.
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
      // The live-event center (design_handoff §2): now/next set times,
      // find-my-friends, order-to-seat, read-only linked passes, gamification.
      // Rehomed from the COMPVSS tab bar 2026-07-15 — the audience is the
      // ticket-holder, not the crew member working the show.
      { label: "Onsite", href: "/p/onsite", icon: "MapPin" },
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
      { label: "Advancing", href: "/studio/settings/advancing", minRole: "manager" },
      { label: "Locations", href: "/studio/locations" },
      { label: "Marketplace", href: "/studio/marketplace/settings", minRole: "admin" },
    ],
  },
  {
    label: "Team & Access",
    items: [
      { label: "Roles", href: "/studio/people/roles", minRole: "admin" },
      // Capabilities (ADR-0015 grant admin) is readable by the manager band —
      // seeing who holds what is how a shift supervisor answers "why was Bob
      // refused at the gate" — while every write stays admin (the RLS agrees:
      // 20260715171424_capability_grants_admin_band).
      { label: "Capabilities", href: "/studio/settings/capabilities", minRole: "manager" },
      { label: "Crew Roles", href: "/studio/settings/capabilities/roles", minRole: "manager" },
      { label: "Scan Misses", href: "/studio/settings/capabilities/scan-misses", minRole: "manager" },
      // The enforcement flip is its own surface so it can never happen
      // without the who-loses-access preview (backlog P2.4). Readable by the
      // manager band: the diff is exactly what a manager studies before
      // asking for the flip; the switch itself stays admin (form + action +
      // RLS all re-check). The settings LAYOUT enforces this minRole
      // server-side, so this line is an access decision, not just nav.
      { label: "Enforcement", href: "/studio/settings/capabilities/enforcement", minRole: "manager" },
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
      { label: "Schema Builder", href: "/studio/settings/schema", minRole: "admin" },
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
  // A membership persona that IS a portal sub-persona maps to itself —
  // covers orgs that store the granular persona (artist, sponsor, vip,
  // …) directly on the membership row.
  if (persona && (PORTAL_PERSONAS as readonly string[]).includes(persona)) {
    return persona as PortalPersona;
  }
  switch (persona) {
    case "contractor":
      return "vendor";
    case "member":
    case "viewer":
    case "community":
    case "visitor":
      return "guest";
    default:
      // Operator personas (owner/admin/manager/collaborator) preview
      // every persona's portal — callers fall back to the full set.
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

export function portalNav(slug: string, persona: PortalPersona | null): NavGroup {
  // `null` = no mapped sub-persona (operator preview / shared surfaces):
  // render the neutral Workspace-only rail with Overview at the gateway.
  const base = persona ? `/p/${slug}/${persona}` : `/p/${slug}`;
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
  // Notification preferences — portal-wide, every persona manages their own
  // per-kind matrix at the slug root (mirrors /m/settings/notifications).
  const notifications: NavItem = { label: "Notifications", href: `/p/${slug}/settings/notifications` };
  // ADR-0005: workspace items (the shared 6) lift into their own section
  // so the persona-specific section stays inside Miller's band. Every
  // persona rail used to start with these 6, eating the operator's
  // recognition budget before any persona-specific work appeared.
  const overview: NavItem = { label: "Overview", href: base };
  // Kit 27 — the shared advance-packet surface. Token recipients arrive by
  // emailed link; org members get the read-only outline preview.
  const advancing: NavItem = { label: "Advancing", href: `/p/${slug}/advancing` };
  const workspaceSection: NavSection = {
    label: "Workspace",
    items: [overview, guide, calendar, updates, inbox, tasks, messages, advancing, accreditation, notifications],
  };
  if (!persona) {
    return { label: "Portal", items: [], sections: [workspaceSection] };
  }
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
    // ADR-0008 Move 3 — Workforce-parity surfaces backfilled into vendor
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
      { label: "Docs", href: `${base}/docs` },
      { label: "Directory", href: `${base}/directory` },
      privacy,
    ],
    // ADR-0008 Move 2 — Workforce-parity surfaces backfilled into the
    // portal crew persona so desktop crew users don't have to install
    // the PWA. Same data as /m/* surfaces; shared component extraction
    // (ADR-0008 Move 1) lifts the rendering pattern in a follow-up. v1
    // at 11 items is over Miller's ceiling — future cut splits into
    // Crew/Engagement + Crew/Operations sub-sections.
    //
    // Kudos is NOT here: peer recognition is org-internal COMPVSS/crew
    // tooling, and it lives in the COMPVSS feed (`/m/feed`, which renders
    // `recognition_posts` beside announcements). It briefly existed only in
    // this portal — org-wide, writable, to external counterparties — and was
    // removed 2026-07-15. Don't backfill it here.
    crew: [
      { label: "Call Sheet", href: `${base}/call-sheet` },
      { label: "Advances", href: `${base}/advances` },
      { label: "Schedule", href: `${base}/schedule` },
      { label: "Time", href: `${base}/time` },
      { label: "Timesheets", href: `${base}/timesheets` },
      { label: "Time Off", href: `${base}/time-off` },
      { label: "Feed", href: `${base}/feed` },
      { label: "Chat", href: `${base}/chat` },
      { label: "Learning", href: `${base}/learning` },
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
  // ADR-0008 §Open questions #1 (resolved 2026-07-15) — the two Workforce-
  // parity personas outgrew Miller's band once the backfill landed, so each
  // splits into Engagement (the paperwork you have WITH the org: terms,
  // money, compliance, training) + Operations (the day-to-day of doing the
  // work: where to be, who with, what's changed).
  //
  // Vendor was split when it hit 14. Crew was left at 11 with a comment
  // promising a "future cut" and quietly drifted to 12 — so the ADR's own
  // acceptance check ("rails respect Miller's band per section, max 10") had
  // been failing in production ever since. Both are split now, and
  // `portal-rail-canon.test.ts` enforces the ceiling so the next persona to
  // outgrow it fails CI instead of shipping.
  //
  // Personas under the ceiling keep a single section — a split that isn't
  // needed is just two headings where one would do.
  const SPLITS: Partial<Record<PortalPersona, { engagement: string[]; operations: string[] }>> = {
    vendor: {
      engagement: ["submissions", "purchase-orders", "invoices", "credentials", "training", "time-off"],
      operations: ["equipment-pull-list", "schedule", "feed", "chat", "docs", "directory", "privacy"],
    },
    crew: {
      engagement: ["advances", "time", "timesheets", "time-off", "learning"],
      operations: ["call-sheet", "schedule", "feed", "chat", "docs", "directory", "privacy"],
    },
  };
  const split = SPLITS[persona];
  if (split) {
    const byHref = new Map(personaSubItems[persona].map((i) => [i.href, i] as const));
    const pick = (slugs: string[]): NavItem[] =>
      slugs.map((s) => byHref.get(`${base}/${s}`)).filter((v): v is NavItem => !!v);
    const title = PERSONA_TITLE[persona];
    return {
      label: SUPER_PERSONA_LABEL[superPersonaOf(persona)],
      items: [],
      sections: [
        workspaceSection,
        { label: `${title} / Engagement`, items: pick(split.engagement) },
        { label: `${title} / Operations`, items: pick(split.operations) },
      ],
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
 * security-team-only tool. The common deskless-workforce convention
 * puts Inbox in the primary tab bar so messaging is one
 * tap from anywhere. Gate stays a first-class surface, just reachable
 * via the Tools drawer / persona-routed home rather than the global bar.
 * Persona-routed tab bars (ADR-0009, deferred) will customize per role
 * for security / driver / medic / admin without changing this default.
 */
// COMPVSS kit tab model (kit 33 v3.0, 2026-07-18): the field app's primary bar
// is Home · Calendar · Tasks · Inbox · Aurora, then More. The 5th slot was
// Assets through kit 32; kit 33 swaps it for **Aurora** — the AI agentic-chat
// surface (`/m/aurora`). Assets moved into the More nav drawer under My Work.
// Icons resolve via the MobileTabBar ICONS map (keyed by href).
//
// Crew-only by construction: the crew entitlement band carries no GVTEWAY reach
// (`entitlements.json`), so no consumer surface belongs in this bar. The GVTEWAY
// Onsite tab that shipped here 2026-06-23 was rehomed to `/p/onsite` (the
// consumer shell its audience actually lands in) 2026-07-15.
//
// Order/hrefs are the kit's TABS array (kit 33,
// design_handoff_compvss_field/runtime/app.jsx:938). Two slots behave specially
// in the MobileTabBar client: **Aurora** navigates to the full-screen chat
// route, and **More** opens the left nav drawer rather than routing (the
// `/m/more` route stays as a deep-linkable / no-JS fallback of the same IA).
export const mobileTabs: NavItem[] = [
  { label: "Home", href: "/m" },
  { label: "Calendar", href: "/m/schedule" },
  { label: "Tasks", href: "/m/tasks" },
  { label: "Inbox", href: "/m/inbox" },
  { label: "Aurora", href: "/m/aurora" },
  { label: "More", href: "/m/more" },
];

/**
 * Secondary mobile surfaces. Reachable from the Tools tab on /m and
 * from the mobile cmd-K palette. Workforce-parity additions live in
 * the second cluster.
 *
 * ADR-0005 cleanup: the three near-twins (/m/clock, /m/checkin,
 * /m/check-in) do different things — /m/clock is the punch surface,
 * /m/checkin is the meal-credit read view, /m/check-in is the ticket
 * scanner. Labels rewritten so operators can tell them apart at a
 * glance without having to remember which dash spelling does what.
 *
 * Kit 29 §C route policy (directive 2026-07-17: no live surface is
 * deleted; alias pairs render ONE shared surface): /m/scan is an alias
 * of /m/check-in (both render the shared ScanSurface), /m/inventory/scan
 * renders it preset to the Asset (inventory) mode, and /m/incident is an
 * alias of /m/incidents (shared IncidentSurface, preset to My Reports).
 * All four hrefs stay listed here so every live route remains navigable.
 */
// COMPVSS kit More-hub surfaces (rebuild 2026-06-21). Every secondary
// destination reachable from the More tab (/m/more), the org/project switcher,
// and the cmd-K palette — grouped Tools · People · Network · Account. Title Case
// labels; middot `·` only inside headers, never here.
export const mobileSurfaces: NavItem[] = [
  // Tools.
  // Kit 34 (v3.1/v3.2): Field-Operations HUB landing screens (MetricBar +
  // member launcher). Drawer's Field Operations group points here; each hub's
  // members are the individual routes below. SSOT: `mobileHubs`.
  { label: "Daily Report", href: "/m/daily-report" },
  { label: "Time Sheets", href: "/m/time-sheets" },
  // Kit 34 v3.x: the hub launcher routes (/m/projects, /m/operations, /m/workforce,
  // /m/equipment) were removed — the drawer/hub now lands straight on the first
  // member. Only the member routes below are navigable surfaces.
  { label: "Project Timeline", href: "/m/projects/timeline" },
  { label: "Milestones", href: "/m/projects/milestones" },
  { label: "Project Calendar", href: "/m/projects/calendar" },
  { label: "Project Tasks", href: "/m/projects/tasks" },
  { label: "Docks", href: "/m/logistics/docks" },
  { label: "Gate", href: "/m/logistics/gate" },
  { label: "Delivery", href: "/m/logistics/delivery" },
  // Kit 33 (v3.0): Aurora is the 5th bottom tab — the AI agentic-chat surface.
  // Listed here so the route is sitemap-navigable; the tab itself routes to it.
  { label: "Aurora", href: "/m/aurora" },
  // Assets left the bottom bar (Aurora took its slot) and now lives in the nav
  // drawer under My Work — still a first-class secondary surface.
  { label: "Assets", href: "/m/assets" },
  // Kit 29: Global Search is a first-class route (top-bar search button).
  { label: "Search", href: "/m/search" },
  { label: "Catalog", href: "/m/catalog" },
  { label: "Inventory", href: "/m/inventory" },
  // Kit 33 (v3.0) Operations SSOT ledgers — field-first freight/checklist/
  // permit/travel/report surfaces under the drawer's Operations group.
  { label: "Reports", href: "/m/reports" },
  { label: "Inspections", href: "/m/inspections" },
  { label: "Logistics", href: "/m/logistics" },
  { label: "Permits & Compliance", href: "/m/permits" },
  { label: "Travel & Lodging", href: "/m/travel" },
  { label: "Inventory Scan", href: "/m/inventory/scan" },
  { label: "Scan", href: "/m/check-in" },
  { label: "Quick Scan", href: "/m/scan" },
  { label: "Door Scanner", href: "/m/door" },
  { label: "Advancing", href: "/m/advances" },
  { label: "Time Clock", href: "/m/clock" },
  // Kit 32 (v2.9): the Shift Scheduler field window (More · Time & Work,
  // schedule:write band — the full scheduling engine stays in ATLVS).
  { label: "Shift Scheduler", href: "/m/scheduler" },
  { label: "My Work", href: "/m/my-work" },
  { label: "Requests", href: "/m/requests" },
  { label: "Expenses", href: "/m/expenses" },
  { label: "File An Expense", href: "/m/expenses/new" },
  { label: "Timesheets", href: "/m/timesheets" },
  { label: "New Message", href: "/m/inbox/new" },
  // Kit 33 (v3.0) renames: Spaces & Clubs → Groups, Engagement → Insights,
  // Reporting Structure → Org Chart.
  { label: "Groups", href: "/m/spaces" },
  { label: "Knowledge", href: "/m/docs" },
  { label: "Insights", href: "/m/engagement" },
  { label: "Mileage", href: "/m/mileage" },
  { label: "Log A Drive", href: "/m/mileage/new" },
  { label: "Purchase Requests", href: "/m/requisitions" },
  { label: "Request A Purchase", href: "/m/requisitions/new" },
  { label: "New Task", href: "/m/tasks/new" },
  { label: "Documents", href: "/m/documents" },
  { label: "Upload Document", href: "/m/documents/new" },
  // Kit 31 (2026-07-17): the universal template library + the field finance
  // window (More · Operations group; finance is manager-gated on-surface).
  { label: "Templates", href: "/m/templates" },
  { label: "New Template", href: "/m/templates/new" },
  { label: "Finance", href: "/m/finance" },
  { label: "Time", href: "/m/time" },
  { label: "Handover", href: "/m/handover" },
  { label: "Daily Log", href: "/m/daily-log" },
  // Kit 29 (ratified 2026-07-17): /m/punch IS the inspection punch list —
  // the field view of the /studio/punch `punch_items` store. The former
  // occupant (a duplicate punch-in/out time surface) yielded; punching in
  // and out lives on /m/clock (Time Clock).
  { label: "Punch List", href: "/m/punch" },
  { label: "Chain of Custody", href: "/m/coc" },
  // Kit-28 §3 capabilities landed 2026-07-17: briefing sign-in + snag capture.
  { label: "Safety Briefings", href: "/m/briefings" },
  { label: "My Snags", href: "/m/snags" },
  { label: "Report A Snag", href: "/m/snags/new" },
  { label: "Incidents", href: "/m/incidents" },
  { label: "My Incidents", href: "/m/incident" },
  { label: "Lost & Found", href: "/m/lost-found" },
  { label: "Log Lost Item", href: "/m/lost-found/new" },
  { label: "Guide", href: "/m/guide" },
  // People.
  { label: "Team Roster", href: "/m/directory" },
  // Kit 30 lifecycle suite (manager-gated people:manage surfaces).
  { label: "Project Roster", href: "/m/roster" },
  { label: "Assign To Project", href: "/m/roster/assign" },
  { label: "Org Chart", href: "/m/roster/reporting" },
  { label: "Vendors", href: "/m/companies" },
  { label: "Connections", href: "/m/connections" },
  // Network.
  { label: "Community", href: "/m/feed" },
  { label: "Jobs", href: "/m/jobs" },
  { label: "Marketplace", href: "/m/market" },
  // Account / credential.
  { label: "The Rose", href: "/m/pass" },
  { label: "Time Off", href: "/m/time-off" },
  { label: "Profile", href: "/m/profile" },
  { label: "Activity History", href: "/m/activity" },
  { label: "Referrals & Rewards", href: "/m/referrals" },
  { label: "Emergency", href: "/m/emergency" },
  // Kit 31 (live-test resolution #9): the emergency quick actions are real
  // PAGES under the Emergency Card, not modals. Home-tab-owned sub-pages.
  { label: "Emergency Codes", href: "/m/emergency/codes" },
  { label: "Fire Safety", href: "/m/emergency/fire" },
  { label: "Evacuation Routes", href: "/m/emergency/evacuation" },
  { label: "Shelter In Place", href: "/m/emergency/shelter" },
  // Kit 29: mass-notify crisis alert log with acknowledge actions. Distinct
  // from Notifications (the bell), which carries the routine per-person feed.
  { label: "Crisis Alerts", href: "/m/alerts" },
  { label: "Notifications", href: "/m/notifications" },
  { label: "Notification Preferences", href: "/m/settings/notifications" },
  { label: "Onboarding", href: "/m/onboarding" },
  { label: "Team", href: "/m/settings/team" },
  { label: "Invite Someone", href: "/m/settings/team/invite" },
  { label: "Settings", href: "/m/settings" },
  // Kit 29 standalone-app surfaces (app-store requirements).
  { label: "Help & Support", href: "/m/support" },
  { label: "About & Legal", href: "/m/settings/about" },
];

/**
 * COMPVSS nav-drawer IA — kit 33 v3.0 SSOT (design_handoff_compvss_field/
 * runtime/app.jsx:1034 `NAV_GROUPS` × `MORE_LINKS`). Drives BOTH the left
 * slide-in nav drawer (`MobileNavDrawer`, opened by the More tab) and the
 * `/m/more` route (its deep-linkable / no-JS fallback), so the two can never
 * drift. Ordered for every project role, internal + external: the personal /
 * daily surfaces everyone touches lead, then Workplace, Operations, People,
 * Opportunities, and finally the perm-gated **Manage** control plane (which
 * self-hides entirely for crew / external roles).
 *
 * `managerOnly` mirrors the kit's per-row `perm` (create/approve/assign/
 * reports) — the repo collapses those onto the manager band (`isManagerPlus`);
 * hiding is UX, every gated surface re-checks server-side. `settings`, theme,
 * and sign-out live in the drawer footer, and profile in the identity header —
 * none are groups here.
 */
export type MoreNavLink = {
  href: string;
  label: string;
  /** KIcon registry key (mobile kit `src/components/mobile/kit/icon.tsx`). */
  icon: string;
  sub: string;
  /** Manager+ gate — hides the row for crew/external (surface re-checks). */
  managerOnly?: boolean;
  /** Live badge slot the drawer resolves (currently only pending approvals). */
  badge?: "approvals";
};
export type MoreNavGroup = { key: string; label: string; links: MoreNavLink[] };

export const moreNavGroups: MoreNavGroup[] = [
  {
    key: "mywork",
    label: "My Work",
    links: [
      { href: "/m/tasks", label: "My Tasks", icon: "ListChecks", sub: "Work Assigned To You" },
      { href: "/m/schedule", label: "My Calendar", icon: "CalendarDays", sub: "Your Shifts & Events" },
      { href: "/m/time", label: "My Time", icon: "Timer", sub: "Clock In/Out & My Timesheets" },
      { href: "/m/assets", label: "My Gear", icon: "Package", sub: "Gear Assigned To You" },
      { href: "/m/documents", label: "My Documents", icon: "FolderOpen", sub: "Docs Shared With You" },
      { href: "/m/activity", label: "My Activity", icon: "History", sub: "Scans, Access, Reports & More" },
    ],
  },
  {
    // Field Operations — each row is a HUB (one screen = MetricBar + viewseg of
    // sub-tabs), not a loose page. See `mobileHubs` for each hub's members.
    key: "fieldops",
    label: "Field Operations",
    links: [
      // Kit 34 v3.x: hubs have NO launcher screen — the drawer row routes straight
      // to the hub's first (role-visible) member; every member carries the hub
      // viewseg to switch. Workforce is managerOnly, so Schedule is its first member.
      { href: "/m/projects/timeline", label: "Projects", icon: "Waypoints", sub: "Timeline, Milestones, Calendar & Tasks" },
      { href: "/m/daily-report", label: "Operations", icon: "ClipboardList", sub: "Daily Report, Reports, Inspections, Permits & Travel" },
      { href: "/m/logistics", label: "Logistics", icon: "Truck", sub: "Shipments, Docks, Gate & Delivery" },
      { href: "/m/scheduler", label: "Workforce", icon: "CalendarClock", sub: "Schedule, Time Sheets, Roster & Time Off", managerOnly: true },
      { href: "/m/inventory", label: "Assets & Equipment", icon: "Boxes", sub: "Inventory, Catalog & Requests" },
      { href: "/m/finance", label: "Finance", icon: "Banknote", sub: "Budget & Expenses", managerOnly: true },
    ],
  },
  {
    key: "workplace",
    label: "Workplace",
    links: [
      { href: "/m/feed", label: "Community", icon: "Megaphone", sub: "Your Professional Feed" },
      { href: "/m/spaces", label: "Groups", icon: "Users2", sub: "Team, Location & Interest Channels" },
      { href: "/m/docs", label: "Knowledge", icon: "BookOpen", sub: "Policies, SOPs & How-Tos" },
    ],
  },
  {
    key: "network",
    label: "Network",
    links: [
      { href: "/m/companies", label: "Vendors", icon: "Building2", sub: "All Orgs On This Project" },
      { href: "/m/connections", label: "Connections", icon: "Network", sub: "Your ATLVS Network" },
    ],
  },
  {
    key: "opportunities",
    label: "Opportunities",
    links: [
      { href: "/m/jobs", label: "Jobs", icon: "Briefcase", sub: "Open Shifts & Gigs" },
      { href: "/m/market", label: "Marketplace", icon: "Tag", sub: "Buy, Sell & Trade Gear" },
      { href: "/m/referrals", label: "Referrals & Rewards", icon: "Gift", sub: "Refer Crew, Earn Rewards" },
    ],
  },
  {
    // Control plane — every row manager-gated, so this whole section hides for
    // crew / external roles and only appears for elevated leads & admins.
    key: "manage",
    label: "Manage",
    links: [
      { href: "/m/requests", label: "Approvals", icon: "CheckCheck", sub: "Review & Action Requests", managerOnly: true, badge: "approvals" },
      { href: "/m/roster", label: "Project Roster", icon: "UserRoundCheck", sub: "Contracts, Onboarding & Advances", managerOnly: true },
      { href: "/m/roster/reporting", label: "Org Chart", icon: "Network", sub: "Who Reports To Whom", managerOnly: true },
      { href: "/m/templates", label: "Templates", icon: "LayoutTemplate", sub: "Org & Project Template Library", managerOnly: true },
      { href: "/m/engagement", label: "Insights", icon: "ChartNoAxesColumn", sub: "Reach & Adoption Analytics", managerOnly: true },
    ],
  },
];

/**
 * Field-Operations HUBS — kit 34 v3.1/v3.2 (design_handoff_compvss_field
 * `HUBS`). Each hub is ONE screen: back · title · MetricBar · `viewseg` of
 * 3–5 members (no hub-of-hub). Rule: a surface that needs its own sub-tabs IS
 * its own hub. Every member resolves to exactly one home — no surface is both a
 * hub member and a standalone drawer row.
 *
 * `managerOnly` members self-hide from the viewseg for crew/external (the
 * surface re-checks server-side), so lower-privilege crew see a shorter hub.
 * `landing` is the hub's route; the drawer's Field Operations rows point here.
 */
export type MobileHubMember = {
  key: string;
  label: string;
  icon: string;
  href: string;
  managerOnly?: boolean;
  /** Route not built yet (later wave) — kept here as SSOT truth, but HubChrome
   *  omits it from the viewseg so no dead link ships. */
  pending?: boolean;
};
export type MobileHub = { key: string; label: string; landing: string; members: MobileHubMember[] };

export const mobileHubs: MobileHub[] = [
  {
    key: "projects",
    label: "Projects",
    landing: "/m/projects/timeline",
    members: [
      { key: "timeline", label: "Timeline", icon: "Waypoints", href: "/m/projects/timeline" },
      { key: "milestones", label: "Milestones", icon: "Flag", href: "/m/projects/milestones" },
      { key: "calendar", label: "Calendar", icon: "CalendarDays", href: "/m/projects/calendar" },
      { key: "tasks", label: "Tasks", icon: "ListChecks", href: "/m/projects/tasks" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    landing: "/m/daily-report",
    members: [
      { key: "dailyreport", label: "Daily Report", icon: "SunMedium", href: "/m/daily-report" },
      { key: "reports", label: "Reports", icon: "TriangleAlert", href: "/m/reports" },
      { key: "inspections", label: "Inspections", icon: "ClipboardCheck", href: "/m/inspections" },
      { key: "permits", label: "Permits", icon: "ShieldCheck", href: "/m/permits" },
      { key: "travel", label: "Travel", icon: "Plane", href: "/m/travel" },
    ],
  },
  {
    key: "logistics",
    label: "Logistics",
    landing: "/m/logistics",
    members: [
      { key: "shipments", label: "Shipments", icon: "Truck", href: "/m/logistics" },
      { key: "docks", label: "Docks", icon: "Warehouse", href: "/m/logistics/docks" },
      { key: "gate", label: "Gate", icon: "ScanLine", href: "/m/logistics/gate" },
      { key: "delivery", label: "Delivery", icon: "PackageCheck", href: "/m/logistics/delivery" },
    ],
  },
  {
    key: "workforce",
    label: "Workforce",
    landing: "/m/scheduler",
    members: [
      { key: "schedule", label: "Schedule", icon: "CalendarDays", href: "/m/scheduler", managerOnly: true },
      { key: "timesheets", label: "Time Sheets", icon: "ClipboardList", href: "/m/time-sheets", managerOnly: true },
      { key: "roster", label: "Roster", icon: "Users", href: "/m/directory" },
      { key: "timeoff", label: "Time Off", icon: "CalendarOff", href: "/m/time-off" },
    ],
  },
  {
    key: "equipment",
    label: "Assets & Equipment",
    landing: "/m/inventory",
    members: [
      { key: "inventory", label: "Inventory", icon: "Boxes", href: "/m/inventory" },
      { key: "catalog", label: "Catalog", icon: "BookOpen", href: "/m/catalog" },
      { key: "requests", label: "Requests", icon: "ClipboardList", href: "/m/advances" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    landing: "/m/finance",
    members: [
      { key: "budget", label: "Budget", icon: "ChartNoAxesColumn", href: "/m/finance", managerOnly: true },
      { key: "expenses", label: "Expenses", icon: "Receipt", href: "/m/expenses" },
    ],
  },
];

/** Resolve a hub by key, or the hub that owns a member href. */
export function hubByKey(key: string): MobileHub | undefined {
  return mobileHubs.find((h) => h.key === key);
}


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
  development: ["/m/feed", "/m/documents"],
  advance: ["/m/onboarding", "/m/advances", "/m/documents", "/m/directory"],
  build: ["/m/punch", "/m/daily-log", "/m/handover", "/m/coc"],
  show: ["/m/check-in", "/m/incidents", "/m/clock", "/m/notifications"],
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
        href: "/atlvs",
        descriptionKey: "marketing.header.product.atlvs.description",
      },
      {
        labelKey: "marketing.header.product.compvss.label",
        href: "/compvss",
        descriptionKey: "marketing.header.product.compvss.description",
      },
      {
        labelKey: "marketing.header.product.gvteway.label",
        href: "/gvteway",
        descriptionKey: "marketing.header.product.gvteway.description",
      },
      {
        labelKey: "marketing.header.product.legend.label",
        href: "/legend",
        descriptionKey: "marketing.header.product.legend.description",
      },
      {
        labelKey: "marketing.header.product.aurora.label",
        href: "/aurora",
        descriptionKey: "marketing.header.product.aurora.description",
      },
      {
        labelKey: "marketing.header.product.integrations.label",
        href: "/integrations",
        descriptionKey: "marketing.header.product.integrations.description",
      },
    ],
  },
  {
    labelKey: "marketing.header.solutions.label",
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
        labelKey: "marketing.header.resources.developers.label",
        href: "/developers",
        descriptionKey: "marketing.header.resources.developers.description",
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
      {
        labelKey: "marketing.header.resources.compare.label",
        href: "/alternatives",
        descriptionKey: "marketing.header.resources.compare.description",
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
      { labelKey: "marketing.layout.footer.product.atlvs", href: "/atlvs" },
      { labelKey: "marketing.layout.footer.product.gvteway", href: "/gvteway" },
      { labelKey: "marketing.layout.footer.product.compvss", href: "/compvss" },
      { labelKey: "marketing.layout.footer.product.legend", href: "/legend" },
      { labelKey: "marketing.layout.footer.product.features", href: "/features" },
      { labelKey: "marketing.layout.footer.product.aurora", href: "/aurora" },
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
      { labelKey: "marketing.layout.footer.resources.developers", href: "/developers" },
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
