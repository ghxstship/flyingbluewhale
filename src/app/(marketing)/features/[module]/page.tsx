import Link from "next/link";
import type { Metadata } from "next";
import {
  Terminal,
  ExternalLink,
  Smartphone,
  Bot,
  Banknote,
  ClipboardList,
  Wrench,
  ShieldCheck,
  FileSignature,
  BookOpen,
  QrCode,
  PackageSearch,
  ArrowRight,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, softwareApplicationSchema } from "@/lib/seo";
type ModuleConfig = {
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
};

const MODULES: Record<string, ModuleConfig> = {
  console: {
    slug: "console",
    name: "Office console",
    eyebrow: "ATLVS · Office console",
    title: "The production console your team actually uses.",
    blurb:
      "Projects, finance, procurement, production, people, AI — every internal module in one sidebar, scoped by role.",
    heroTitle: "One console. Every module. Role-aware access.",
    heroBody:
      "ATLVS is where your office team works. Nine modules covering projects, finance, procurement, production, people, advancing, CMS, AI, and compliance — all reading from the same backbone, all scoped to your organization.",
    highlights: [
      { title: "Nine modules", body: "Overview, Projects, Advancing, Finance, Procurement, Production, People, CMS, AI, Compliance." },
      { title: "Role-aware nav", body: "Owner, admin, manager, member, viewer — each tier sees exactly what they should, nothing they shouldn't." },
      { title: "Data walled off", body: "Every row scoped to your organization at the database layer — not just in the app." },
      { title: "Immutable audit log", body: "Who, when, what changed, what it was before. Every action. Exportable." },
      { title: "AI built in", body: "An assistant that reads your projects, crew, and budgets — and drafts from them." },
      { title: "Enterprise-ready", body: "Signed DPA and 99.9% uptime SLA on the Enterprise tier." },
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
      { slug: "ai", label: "AI assistant" },
    ],
    keywords: ["production management console", "ATLVS", "internal operations software", "event production software"],
  },
  portals: {
    slug: "portals",
    name: "Stakeholder portals",
    eyebrow: "GVTEWAY · Stakeholder portals",
    title: "Share exactly the right view. Nothing more.",
    blurb:
      "Tailored portals for artists, vendors, clients, sponsors, guests, and crew. No passwords. Revocable in one click.",
    heroTitle: "Six personas. Zero leakage. Branded per project.",
    heroBody:
      "GVTEWAY gives every outside stakeholder a workspace built for them. Artists see their advancing. Vendors see their POs. Clients see their proposal. Guests see their guide. Each link is the access — rotate it and access revokes everywhere, instantly.",
    highlights: [
      { title: "Six persona rails", body: "Artist, Vendor, Client, Sponsor, Guest, Crew — each with a nav built for their job." },
      { title: "Link is the access", body: "Share a URL. Revoke it and access ends. No passwords to reset, no accounts to deprovision." },
      { title: "Interactive proposals", body: "Clients open their link to a scrolling proposal — read, accept or decline, signed in place." },
      { title: "Role-scoped guides", body: "Each persona sees only the Know Before You Go sections written for them." },
      { title: "No signup required", body: "Your stakeholders never create an account. They click the link, they see their lane." },
      { title: "White-label ready", body: "Per-project color, logo, and OG image. It feels like your brand, because it is." },
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
      { slug: "proposals", label: "Interactive proposals" },
      { slug: "guides", label: "Event guides (KBYG)" },
    ],
    keywords: ["stakeholder portal", "client portal software", "vendor portal", "event guest portal", "crew portal"],
  },
  mobile: {
    slug: "mobile",
    name: "Field mobile app",
    eyebrow: "COMPVSS · Field kit",
    title: "Install it once. Works when the venue doesn't.",
    blurb:
      "Ticket scan, geo-verified clock-in, inventory, incident reports — from any phone. Keeps working when venue signal drops.",
    heroTitle: "A field kit, not an app store submission.",
    heroBody:
      "COMPVSS installs from the browser — no app store, no build pipeline, no version fragmentation. Your crew opens a link, adds it to the home screen, and has a full-screen scanner that works on day one. And on the worst day, when venue signal drops, it keeps working.",
    highlights: [
      { title: "Install from the browser", body: "A mobile app you add from the web — no app store, no approval queue. Ready on day one." },
      { title: "Offline-first", body: "Scanner, today's call sheet, and the guide cached locally. Load with zero bars." },
      { title: "No duplicate scans", body: "Every ticket scans exactly once, even under concurrent load at the gate." },
      { title: "Scan queue replays", body: "Offline scans queue on the device, then sync in order when signal returns. No scan gets lost." },
      { title: "Geo-verified clock-in", body: "GPS check with a graceful manual fallback when the venue's a dead zone." },
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
      { slug: "guides", label: "Event guides" },
      { slug: "production", label: "Production operations" },
    ],
    keywords: ["event check-in app", "offline ticket scanner", "production mobile app"],
  },
  ai: {
    slug: "ai",
    name: "AI assistant",
    eyebrow: "ATLVS · AI",
    title: "An assistant that actually knows your org.",
    blurb:
      "An AI that reads your projects, crew, and budgets — not the public internet. Drafts riders, RFPs, call sheets, and recaps on demand.",
    heroTitle: "Claude, wired into your production.",
    heroBody:
      "The assistant drafts from your actual data — your projects, your crew, your budgets, your schedule. Ask for a hospitality rider in the venue's voice. Ask for an RFP for lighting. Ask for a recap. Every conversation is scoped to your workspace and logged.",
    highlights: [
      { title: "Streams responses", body: "Answers stream as they generate — no waiting for the wall of text." },
      { title: "Grounded in your data", body: "Riders, RFPs, call sheets, recaps, safety briefings — drafted from your projects, not the public internet." },
      { title: "Per-org history", body: "Every conversation scoped to your workspace, searchable, never cross-organization." },
      { title: "Fast or deep", body: "Pick the quick model for day-to-day, the deep one when you need reasoning — per conversation." },
      { title: "Cost-controlled", body: "Rate limits and budgets keep runaway usage from ever being a surprise." },
      { title: "Auditable", body: "Every interaction logged — who, when, which model, which data it touched." },
    ],
    faqs: [
      {
        q: "Does the AI see other orgs' data?",
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
    keywords: ["AI assistant", "AI for event production", "production AI"],
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
    blurb:
      "Requisition to PO to delivery to invoice — with COIs and W-9s on file and direct vendor payouts.",
    heroTitle: "From request to payout. End to end.",
    heroBody:
      "A crew member requests from the field. A manager turns it into a PO against a vendor who has COI and W-9 on file. Delivery gets scanned. The vendor invoices. Payout goes direct — ACH, card, or wire. Every step logged.",
    highlights: [
      { title: "Vendors", body: "Profiles, categories, COI expiry tracking, W-9 uploads." },
      { title: "Requisitions", body: "Crew-initiated requests with approval thresholds." },
      { title: "Purchase orders", body: "Line-itemed, versioned, signed by the vendor." },
      { title: "Direct payouts", body: "Vendors onboard a payout account and get paid directly — ACH, card, or international wire." },
      { title: "Compliance gating", body: "POs blocked if COI is expired or W-9 is missing. No surprises on audit day." },
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
      { slug: "portals", label: "Vendor portal" },
      { slug: "compliance", label: "Compliance" },
    ],
    keywords: ["procurement software", "purchase order system", "vendor management", "vendor payouts"],
  },
  production: {
    slug: "production",
    name: "Production",
    eyebrow: "ATLVS · Production",
    title: "Equipment, rentals, fabrication, logistics.",
    blurb:
      "Track inventory across the season, dispatch to shows, reconcile returns — tied to the field scanner.",
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
    blurb:
      "Data walled off per organization. Immutable audit log. Retention policies. Signed DPA on Enterprise.",
    heroTitle: "Built to pass a security review.",
    heroBody:
      "The Second Star Technologies platform's security posture is not a checklist — it's enforced on the data. Every organization's data walled off at the deepest layer. Every change written to an immutable audit trail. Files shared through auto-expiring links, not public buckets.",
    highlights: [
      { title: "Data walled off per org", body: "No exceptions. Enforced at the database, not in the app." },
      { title: "Immutable audit trail", body: "Every change captured — before, after, who, when, from where. Queryable and exportable." },
      { title: "Retention", body: "Configurable per-category retention with soft-delete and purge." },
      { title: "Auto-expiring file links", body: "Sensitive files share through signed links with short expiry. No public buckets." },
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
      { slug: "ai", label: "AI assistant" },
    ],
    keywords: ["SOC 2 production software", "multi-tenant security", "audit log", "event production compliance"],
  },
  proposals: {
    slug: "proposals",
    name: "Interactive proposals",
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
      { title: "Template library", body: "Start from proven templates — festival, tour, corporate activation, private event." },
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
      { slug: "portals", label: "Client portal" },
      { slug: "ai", label: "AI drafting" },
      { slug: "finance", label: "Finance" },
    ],
    keywords: ["interactive proposal software", "event proposal generator", "production proposals"],
  },
  guides: {
    slug: "guides",
    name: "Event guides (KBYG)",
    eyebrow: "ATLVS · Event guides",
    title: "One Know Before You Go. Every role sees their version.",
    blurb:
      "A role-scoped KBYG shared across portal and mobile. Written once, rendered differently for each audience.",
    heroTitle: "One source. Six personas. Zero duplication.",
    heroBody:
      "Write a single KBYG per project. A guest sees parking, schedule, FAQ. Crew sees call sheet, radio channels, PPE, SOPs. Artist sees rider, catering, dressing room. Same canonical data, different views — edited once.",
    highlights: [
      { title: "Write once", body: "One guide per project. Every persona auto-scoped to their sections." },
      { title: "Section library", body: "Overview, schedule, set times, timeline, credentials, contacts, FAQ, SOPs, PPE, radio channels, evacuation, fire safety, accessibility, sustainability, code of conduct — and custom." },
      { title: "Auto-scoped render", body: "Each viewer lands on the persona view built for them. No manual link-juggling." },
      { title: "Portal and mobile", body: "Same guide, rendered cleanly whether the viewer is on a laptop or at the gate." },
      { title: "Publish flow", body: "Draft, preview, publish. Update the morning of the show and every viewer sees the latest." },
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
    blurb:
      "Issue, track, and scan tickets — with an offline-first scan queue and sub-100ms response at the gate.",
    heroTitle: "Sub-100ms server-side. Zero duplicates.",
    heroBody:
      "Tickets issue in ATLVS, deliver as QR codes, and scan in COMPVSS. Every ticket scans exactly once, even under concurrent load. Offline scans queue on the device and replay in order when the signal comes back.",
    highlights: [
      { title: "Issue in ATLVS", body: "Generate tickets by allocation, by persona, with QR codes ready to go." },
      { title: "Scan in COMPVSS", body: "Phone camera. Sub-100ms scan response. Four clear result states." },
      { title: "Zero duplicates", body: "Every ticket scans exactly once, even with multiple gates scanning under pressure." },
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
      { slug: "portals", label: "Guest portal" },
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
      { title: "16 deliverable types", body: "Tech rider, hospitality, ground transport, hotel, stage plot, input list, COI, passes, and more." },
      { title: "Per-deliverable thread", body: "Comments, mentions, status changes — every change written to history." },
      { title: "File attachments", body: "PDFs, diagrams, riders — delivered through auto-expiring signed links." },
      { title: "Status workflow", body: "Draft, sent, received, approved, complete — with automatic notifications." },
      { title: "Overdue tracking", body: "The dashboard surfaces what's slipping against show dates." },
      { title: "Portal exposure", body: "Artists and vendors see their deliverables in their own portal and upload responses directly." },
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
      { slug: "portals", label: "Stakeholder portals" },
      { slug: "finance", label: "Finance (advances)" },
    ],
    keywords: ["event advancing software", "show advancing", "artist advancing", "production advancing workflow"],
  },
};

export function generateStaticParams() {
  return Object.keys(MODULES).map((module) => ({ module }));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module } = await params;
  const config = MODULES[module];
  if (!config) {
    return buildMetadata({
      title: "Feature",
      description: "Second Star Technologies — the unified production management platform.",
      path: `/features/${module}`,
    });
  }
  return buildMetadata({
    title: `${config.name} — ${config.title}`,
    description: config.blurb,
    path: `/features/${config.slug}`,
    keywords: config.keywords,
    ogImageEyebrow: config.eyebrow,
    ogImageTitle: config.name,
  });
}

export default async function FeatureDetail({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const config = MODULES[module];
  if (!config) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Feature</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{module}</h1>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Module detail coming soon.</p>
        <div className="mt-8">
          <Link href="/features" className="text-sm text-[var(--org-primary)]">← All features</Link>
        </div>
      </div>
    );
  }

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: config.name, href: `/features/${config.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[softwareApplicationSchema({
            name: `Second Star Technologies — ${config.name}`,
            description: config.blurb,
            url: `https://flyingbluewhale.app/features/${config.slug}`,
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">{config.eyebrow}</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">{config.heroTitle}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{config.heroBody}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">Start free</Button>
          <Button href="/contact" variant="secondary">Book a demo</Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What This Module Does.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.highlights.map((h) => (
            <div key={h.title} className="surface-raised p-6">
              <div className="text-sm font-semibold">{h.title}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection title={`${config.name} · FAQ`} faqs={config.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Related Modules</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {config.related.map((r) => (
            <Link
              key={r.slug}
              href={`/features/${r.slug}`}
              className="surface-raised hover-lift group flex items-center justify-between p-5 text-sm"
            >
              <span>{r.label}</span>
              <ArrowRight size={14} className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="Ship this module on show day" subtitle="Start free. No credit card. Migrate when you're ready." />
    </div>
  );
}

// Keep icon imports referenced — used for per-module glyphs in a follow-up pass.
void [Terminal, ExternalLink, Smartphone, Bot, Banknote, ClipboardList, Wrench, ShieldCheck, FileSignature, BookOpen, QrCode, PackageSearch];
