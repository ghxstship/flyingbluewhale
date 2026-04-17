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
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo";

type ModuleConfig = {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  blurb: string;
  heroTitle: string;
  heroBody: string;
  highlights: Array<{ title: string; body: string }>;
  specs: string[];
  faqs: Array<{ q: string; a: string }>;
  related: Array<{ slug: string; label: string }>;
  keywords?: string[];
};

const MODULES: Record<string, ModuleConfig> = {
  console: {
    slug: "console",
    name: "Platform console",
    eyebrow: "ATLVS · Internal console",
    title: "The production console your team actually uses.",
    blurb:
      "Projects, finance, procurement, production, people, AI — every internal module under one roof, role-gated by tier.",
    heroTitle: "One console. Every module. Role-aware access.",
    heroBody:
      "ATLVS is the internal operating system for your production org. Nine modules covering projects, finance, procurement, production, people, advancing, CMS, AI and compliance — all sharing one row-level-secured schema, one identity, and one design system.",
    highlights: [
      { title: "Nine modules", body: "Overview, Projects, Advancing, Finance, Procurement, Production, People, CMS, AI, Compliance." },
      { title: "Role-gated tiers", body: "Owner / admin / manager / member / viewer mapped per-module to exactly what they can see and do." },
      { title: "One schema", body: "Thirty-plus tables, every row RLS-scoped by org. No cross-tenant leakage is possible at the database." },
      { title: "Audit log", body: "Every mutation writes a structured audit entry: who, what, when, before/after payloads, from which IP." },
      { title: "Streaming AI", body: "Claude Sonnet 4.6 and Opus 4.7 wired directly, grounded in the active workspace." },
      { title: "Enterprise-ready", body: "SSO/SCIM hooks, CSP/CORS headers, webhook HMAC verification, signed-URL file delivery." },
    ],
    specs: [
      "Next.js 16 App Router with React 19 + React Compiler",
      "Supabase Postgres with 33+ RLS-protected tables",
      "SECURITY DEFINER helpers: is_org_member(), has_org_role()",
      "Server actions + Zod validation on every mutation",
      "In-memory sliding-window rate limiter (ai / scan / webhook / auth buckets)",
      "Structured audit_log with jsonb diff",
    ],
    faqs: [
      {
        q: "Can different roles see different modules?",
        a: "Yes. The left nav is filtered by tier membership. Owners see everything. Members see project execution. Viewers are read-only. Finance-only roles can be scoped to budgets, invoices, expenses, advances and time without touching people or procurement.",
      },
      {
        q: "Is ATLVS multi-tenant?",
        a: "Yes — strictly. Every table has an org_id column and RLS policies gated by is_org_member(org_id). A user in Org A cannot read, update, or delete a row belonging to Org B even if they guess the primary key.",
      },
      {
        q: "How is access changed when someone leaves?",
        a: "Revoke the membership row. RLS immediately rejects every subsequent request — for API, server components, background jobs and the dashboard alike. No cache to invalidate, no permission propagation to wait on.",
      },
    ],
    related: [
      { slug: "portals", label: "GVTEWAY stakeholder portals" },
      { slug: "mobile", label: "COMPVSS mobile PWA" },
      { slug: "ai", label: "AI assistant" },
    ],
    keywords: ["production management console", "ATLVS", "internal operations software", "event production software"],
  },
  portals: {
    slug: "portals",
    name: "Stakeholder portals",
    eyebrow: "GVTEWAY · External portals",
    title: "Share exactly the right view. Nothing more.",
    blurb:
      "Slug-scoped portals for artists, vendors, clients, sponsors, guests and crew — no login required, revocable in one click.",
    heroTitle: "Six personas. Zero leakage. Branded per project.",
    heroBody:
      "GVTEWAY gives every external stakeholder a dedicated workspace at /p/[slug]/[persona]. Each portal reveals only the data that persona is entitled to. Slugs are the authorization boundary — anon cookies identify the viewer, RLS enforces scope.",
    highlights: [
      { title: "Six persona rails", body: "Artist, Vendor, Client, Sponsor, Guest, Crew — each with a purpose-built nav." },
      { title: "Slug = auth boundary", body: "The slug is the grant. Rotate it and access revokes globally, instantly." },
      { title: "Interactive proposals", body: "Client portals open to a scroll-activated proposal with accept/decline actions persisted to Postgres." },
      { title: "Role-scoped guides", body: "The Boarding Pass (KBYG) event guide renders only the sections this persona is permitted to see." },
      { title: "No password required", body: "Share a URL; the viewer gets an anon session cookie. Revoke by deleting the share link." },
      { title: "White-label ready", body: "Per-project branding tokens override --org-primary, logo, and OG assets." },
    ],
    specs: [
      "Dynamic routes: /p/[slug]/{artist,vendor,client,sponsor,guest,crew}/...",
      "proposal_share_links + proposal_org_id() SECURITY DEFINER helper (no RLS recursion)",
      "event_guides_select_public policy for anon-visible guides",
      "Per-slug view counts + last_accessed_at telemetry",
      "Revocation cascades through RLS — no TTL, no cache",
    ],
    faqs: [
      {
        q: "Do external stakeholders need to create accounts?",
        a: "No. Each stakeholder gets a unique slug URL. Opening it drops an anonymous session cookie; RLS policies check that cookie against proposal_share_links or event_guides to determine what's visible. You can revoke access by deleting the row.",
      },
      {
        q: "Can a vendor see another vendor's pricing?",
        a: "No. Vendor portals are project × vendor × persona scoped. Even two vendors on the same project see only their own POs, COIs, W-9s, and requisitions. RLS enforces this at the database; it is not possible to bypass via API or by guessing IDs.",
      },
      {
        q: "Can I brand the portal for my client?",
        a: "Yes. Each project has branding tokens — accent color, logo, OG image — that override the default GVTEWAY blue. The portal renders under the client's brand while the underlying infrastructure stays the same.",
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
    name: "Mobile PWA",
    eyebrow: "COMPVSS · Mobile field kit",
    title: "Install it once. Works when the venue doesn't.",
    blurb:
      "Offline ticket scan, geo-verified clock-in, inventory scan, incident reports — a PWA that survives dead venues.",
    heroTitle: "A field kit, not an app store submission.",
    heroBody:
      "COMPVSS is a progressive web app. Install from the browser, launch full-screen, scan tickets sub-100ms with race-safe atomic Postgres updates. The service worker caches the shell so the scanner loads without signal. Scans queue locally and replay on reconnect.",
    highlights: [
      { title: "Offline-first shell", body: "Service worker caches app shell, today's data, and the scanner — load with zero signal." },
      { title: "Race-safe scans", body: "Postgres atomic UPDATE ... WHERE status = 'issued' rejects duplicates in under 100 ms." },
      { title: "Scan queue + replay", body: "Offline scans append to an IndexedDB queue; network restore triggers ordered replay." },
      { title: "Geo-verified clock", body: "GPS with accuracy threshold; graceful manual fallback if the signal is poor." },
      { title: "Inventory scan", body: "Asset tags in / out. Works offline. Syncs on reconnect." },
      { title: "Incident reporting", body: "Photos, location, witnesses. Admin + EHS lead paged immediately on network." },
    ],
    specs: [
      "Installable via Add to Home Screen (iOS + Android)",
      "Service worker scope: / with app-shell caching strategy",
      "Scan POST → /api/v1/tickets/scan — Postgres CAS, sub-100ms p50",
      "Scan bucket rate-limited in middleware.ts",
      "Camera + geolocation permissions requested per-shell",
      "data-platform=\"compvss\" brand overlay (compass yellow)",
    ],
    faqs: [
      {
        q: "Is COMPVSS a native iOS or Android app?",
        a: "No — it's a progressive web app. That means no App Store review, no build pipeline, no fragmentation. Your crew opens a URL, taps Add to Home Screen, and gets a full-screen launcher indistinguishable from native.",
      },
      {
        q: "What if the venue has zero cell signal?",
        a: "The scanner still works. The app shell is cached by the service worker. Scans queue locally in IndexedDB and replay in order when connectivity returns. No scan is ever dropped.",
      },
      {
        q: "How do you prevent duplicate scans at the gate?",
        a: "Every scan attempts a conditional atomic Postgres UPDATE that only succeeds if the ticket is still 'issued'. A second scan falls through to 'duplicate' cleanly. Server-side latency is sub-100ms.",
      },
    ],
    related: [
      { slug: "ticketing", label: "Ticketing" },
      { slug: "guides", label: "Event guides" },
      { slug: "production", label: "Production operations" },
    ],
    keywords: ["event check-in app", "offline ticket scanner", "production mobile app", "PWA ticketing"],
  },
  ai: {
    slug: "ai",
    name: "AI assistant",
    eyebrow: "ATLVS · AI",
    title: "An assistant grounded in your workspace.",
    blurb:
      "Streaming chat with Claude Sonnet 4.6 / Opus 4.7, drafting templates, and managed agents for routine ops.",
    heroTitle: "Claude, wired directly to the console.",
    heroBody:
      "Conversations persist in ai_conversations and ai_messages, scoped by org via RLS. Every response streams via Server-Sent Events for perceived latency under 500ms. Built-in templates draft advancing emails, RFPs, incident summaries, and production schedules from your actual data.",
    highlights: [
      { title: "Streaming responses", body: "SSE transport; token-level streaming from Anthropic with backpressure handled." },
      { title: "Grounded templates", body: "Drafting prompts for advancing, vendor RFPs, incident reports, staffing plans." },
      { title: "Per-org history", body: "Conversations and messages stored in Postgres, RLS-scoped, never cross-tenant." },
      { title: "Model switch", body: "Toggle Sonnet 4.6 (fast/cheap) vs Opus 4.7 (deep reasoning) per conversation." },
      { title: "Rate limited", body: "/api/v1/ai/* is gated by the ai bucket in middleware — no runaway costs." },
      { title: "Auditable", body: "Every AI interaction writes to audit_log with model, token counts, cost estimate." },
    ],
    specs: [
      "@anthropic-ai/sdk with streaming responses",
      "ai_conversations / ai_messages tables with RLS",
      "Model selector: claude-sonnet-4-6 | claude-opus-4-7",
      "Middleware rate budget: ai bucket",
      "Token + cost accounting per message",
    ],
    faqs: [
      {
        q: "Does the AI see other orgs' data?",
        a: "No. Every tool the assistant can call is RLS-scoped to the calling user's org. Even if the model generated a query referencing another org, Postgres would return zero rows.",
      },
      {
        q: "Which model does it use?",
        a: "Claude Sonnet 4.6 by default for speed and cost; Opus 4.7 available per-conversation for deep reasoning tasks like proposal drafting or contract analysis.",
      },
      {
        q: "Do you train on our data?",
        a: "No. Anthropic does not train on API data. We don't train models at all — we're not an LLM vendor; we're a production platform that uses Claude.",
      },
    ],
    related: [
      { slug: "console", label: "ATLVS console" },
      { slug: "proposals", label: "Proposals" },
      { slug: "advancing", label: "Advancing" },
    ],
    keywords: ["AI assistant", "Claude production software", "AI for event production", "streaming LLM chat"],
  },
  finance: {
    slug: "finance",
    name: "Finance",
    eyebrow: "ATLVS · Finance",
    title: "Finance that speaks production.",
    blurb:
      "Invoices, expenses, budgets, time entries, mileage, advances, live P&L — modeled for event and show accounting.",
    heroTitle: "The numbers your accountant understands.",
    heroBody:
      "Budgets roll up by project and category. Expenses attach receipts via Supabase Storage signed URLs. Time entries and mileage feed into payroll exports. Advances are tracked against deliverables and reconciled automatically on close-out.",
    highlights: [
      { title: "Budgets", body: "Per-project budget lines with committed / actual / variance in real time." },
      { title: "Invoices", body: "Line-itemed, branded, PDF-exportable; Stripe Checkout optional." },
      { title: "Expenses", body: "Receipts in Storage, category rollups, approval flow, reimbursable flag." },
      { title: "Time", body: "Start/stop clock or bulk entry; exports to CSV for payroll." },
      { title: "Mileage", body: "Trip logs with deductible / reimbursable rates." },
      { title: "Advances", body: "Cash advances tracked against reconciled deliverables." },
    ],
    specs: [
      "Tables: invoices, invoice_line_items, expenses, budgets, time_entries, mileage_logs, advances",
      "Receipt storage: Storage bucket `receipts`, signed URL delivery",
      "CSV + PDF export (server-rendered)",
      "Stripe Checkout session creation at /api/v1/stripe/checkout",
    ],
    faqs: [
      {
        q: "Does it replace QuickBooks?",
        a: "No — it feeds QuickBooks. The goal is to capture production-native data (show dates, crew shifts, per-day advances) cleanly, then export to your accounting system. Direct QuickBooks Online sync is on the roadmap.",
      },
      {
        q: "Can crew submit their own expenses?",
        a: "Yes. Crew with tier-member access submit expenses through the portal; managers approve; the expense writes to budgets and is available for payroll export.",
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
      "Full requisition → PO → delivery → invoice cycle, with vendor COI/W-9 on file and Stripe Connect Express payouts.",
    heroTitle: "From request to payout, end-to-end.",
    heroBody:
      "A crew member opens a requisition from the field. A manager converts it to a PO against a vendor with COI and W-9 on file. Delivery gets scanned into inventory. The vendor invoices; Stripe Connect Express pays them out. Every step writes to audit_log.",
    highlights: [
      { title: "Vendors", body: "Profiles, categories, COI expiry tracking, W-9 uploads." },
      { title: "Requisitions", body: "Crew-initiated requests with approval thresholds." },
      { title: "Purchase orders", body: "Line-itemed POs, versioned, e-signed by vendor." },
      { title: "Stripe Connect", body: "Vendors onboard Express accounts; payouts triggered on invoice approval." },
      { title: "Compliance gating", body: "POs blocked if COI is expired or W-9 missing." },
      { title: "Portal integration", body: "Vendors see their POs and invoices via GVTEWAY vendor rail." },
    ],
    specs: [
      "Tables: vendors, requisitions, purchase_orders, po_line_items",
      "Stripe Connect Express onboarding: /api/v1/stripe/connect/onboarding",
      "Stripe webhook: /api/v1/webhooks/stripe (HMAC-SHA256 verified)",
      "COI/W-9 storage: Supabase Storage `credentials` bucket",
    ],
    faqs: [
      {
        q: "What happens if a vendor's COI expires?",
        a: "New POs against that vendor are blocked at the application layer, and the vendor is flagged in ATLVS until the document is refreshed. Existing POs are not retroactively invalidated.",
      },
      {
        q: "Do vendors need a Stripe account to receive payment?",
        a: "If you're using Stripe Connect payouts, yes — each vendor onboards a Connect Express account via a branded link from their portal. Traditional ACH/check workflows work too; Stripe is optional.",
      },
    ],
    related: [
      { slug: "finance", label: "Finance" },
      { slug: "portals", label: "Vendor portal" },
      { slug: "compliance", label: "Compliance" },
    ],
    keywords: ["procurement software", "purchase order system", "vendor management", "Stripe Connect payouts"],
  },
  production: {
    slug: "production",
    name: "Production",
    eyebrow: "ATLVS · Production",
    title: "Equipment, rentals, fabrication, logistics.",
    blurb:
      "Track inventory across the season, dispatch to shows, reconcile returns — with barcode scan integration into COMPVSS.",
    heroTitle: "Where the gear lives between shows.",
    heroBody:
      "Production tracks every asset — truss, LED wall, comms, barricade — across its lifecycle. Outbound dispatch, in-field scans, damage reports, rentals from subs, fab orders from the shop. It's one table, one source of truth, all tied to the COMPVSS mobile scanner.",
    highlights: [
      { title: "Equipment registry", body: "Every asset tagged with a barcode and lifecycle status." },
      { title: "Rentals", body: "Sub-rented gear in, with return date tracking and automated followups." },
      { title: "Fabrication orders", body: "In-house shop work with cost, timeline, and delivery photos." },
      { title: "Dispatch sheets", body: "Per-show load-out with checkin at venue via COMPVSS scan." },
      { title: "Damage reports", body: "Attach photos + cost estimates; billed automatically to sub or client." },
      { title: "Cross-season view", body: "Where is each asset right now? Is it available next weekend?" },
    ],
    specs: [
      "Tables: equipment, rentals, fabrication_orders",
      "Asset tag scan integration with COMPVSS inventory scan flow",
      "Dispatch sheet server-rendered PDF export",
    ],
    faqs: [
      {
        q: "Do we need barcode hardware?",
        a: "No. COMPVSS uses the phone camera. If you have existing hardware scanners with keyboard-wedge USB output, they work too.",
      },
      {
        q: "Can we track sub-rentals?",
        a: "Yes. The rentals table captures sub source, return date, and associated PO. Late return flags show in the procurement rail.",
      },
    ],
    related: [
      { slug: "mobile", label: "COMPVSS mobile" },
      { slug: "procurement", label: "Procurement" },
      { slug: "console", label: "ATLVS console" },
    ],
    keywords: ["production inventory", "equipment tracking", "rental management", "fabrication tracking"],
  },
  compliance: {
    slug: "compliance",
    name: "Compliance",
    eyebrow: "ATLVS · Compliance",
    title: "Audit, retention, SSO, SOC-2 posture.",
    blurb:
      "Per-org RLS enforced at the database, structured audit log, retention policies, SSO/SCIM on enterprise tiers.",
    heroTitle: "Built to pass a security review.",
    heroBody:
      "flyingbluewhale's security posture is not a checklist — it's enforced in code. Every table has RLS. Every mutation writes audit_log. Webhooks are HMAC-verified. File delivery uses signed, expiring URLs. Rate limits protect every auth-adjacent endpoint. SSO/SCIM and SOC-2 certification are available on enterprise.",
    highlights: [
      { title: "RLS on every table", body: "No exceptions. is_org_member and has_org_role enforced in Postgres, not in application code." },
      { title: "Structured audit_log", body: "jsonb before/after, actor, IP, session — queryable and exportable." },
      { title: "Retention", body: "Configurable per-table retention with soft-delete + purge workers." },
      { title: "SSO / SCIM", body: "SAML + SCIM 2.0 on enterprise tier; bring your IdP." },
      { title: "Signed URLs", body: "All sensitive files served via Storage signed URLs with short expiry." },
      { title: "CSP + CORS", body: "Strict Content Security Policy and origin whitelist set in vercel.json." },
    ],
    specs: [
      "SOC-2 Type II in progress",
      "HMAC-SHA256 webhook signature verification (no SDK dep)",
      "In-memory sliding-window rate limits on ai / scan / webhook / auth",
      "GDPR-style data subject export available on request",
    ],
    faqs: [
      {
        q: "Are you SOC-2 certified?",
        a: "Type II is in progress. The controls that SOC-2 attests to — access control, change management, audit logging, encryption, monitoring — are already in production. We publish our posture on /trust.",
      },
      {
        q: "How is tenant isolation enforced?",
        a: "At the database. Row-Level Security is enabled on every table, and every policy checks is_org_member(org_id). No application code path can return a row from another org — by design.",
      },
    ],
    related: [
      { slug: "console", label: "ATLVS console" },
      { slug: "ai", label: "AI assistant" },
    ],
    keywords: ["SOC-2 production software", "multi-tenant RLS", "audit log", "event production compliance"],
  },
  proposals: {
    slug: "proposals",
    name: "Interactive proposals",
    eyebrow: "ATLVS · Proposals",
    title: "Proposals that scroll, quantify, and convert.",
    blurb:
      "Generate full interactive proposals from templates. Scroll-activated sections, embedded pricing, accept-in-place.",
    heroTitle: "Stop attaching PDFs. Start sending URLs.",
    heroBody:
      "The proposals module synthesizes the best of F1-Miami's scroll storytelling and proposalzero's structured pricing. Clients open a link, scroll through a branded presentation, see live pricing, and accept or decline — every action logged and tied to a revocable share link.",
    highlights: [
      { title: "Scroll storytelling", body: "Framer-motion scroll reveals. Sections load as the client reads." },
      { title: "Structured pricing", body: "Line items, options, upsells, taxes — computed server-side, not a PDF." },
      { title: "Accept in place", body: "Accept/decline buttons persist to Postgres with IP, timestamp, and signature." },
      { title: "Versioned", body: "Every edit creates a new version; old versions remain addressable." },
      { title: "Revocable share links", body: "Share via /p/[slug]/client. Revoke instantly; access dies at the DB." },
      { title: "Template library", body: "Start from proven templates (festival, tour, corporate activation, private event)." },
    ],
    specs: [
      "Tables: proposals, proposal_versions, proposal_share_links, proposal_line_items",
      "proposal_org_id() SECURITY DEFINER helper prevents RLS policy recursion",
      "Server-rendered pricing computation; no client-side trust",
      "Accept/decline signs into audit_log + proposals.status",
    ],
    faqs: [
      {
        q: "Can clients redline a proposal?",
        a: "Not in v1 — the client flow is accept or decline. Comments are coming in a future release. For now, redlines are handled offline and reflected in a new version.",
      },
      {
        q: "Is the accept signature legally binding?",
        a: "It captures IP, timestamp, typed name, and the exact version hash. Whether it constitutes an e-signature under your jurisdiction's law is a question for your counsel; most US e-sign laws are permissive.",
      },
    ],
    related: [
      { slug: "portals", label: "Client portal" },
      { slug: "ai", label: "AI drafting" },
      { slug: "finance", label: "Finance" },
    ],
    keywords: ["interactive proposal software", "event proposal generator", "scroll proposal", "production proposals"],
  },
  guides: {
    slug: "guides",
    name: "Event guides (KBYG)",
    eyebrow: "ATLVS · CMS · Event guides",
    title: "Boarding Pass, for every persona, managed in one place.",
    blurb:
      "A role-scoped Know-Before-You-Go guide shared across portal and mobile, edited in ATLVS CMS.",
    heroTitle: "One schema. Six personas. Zero duplication.",
    heroBody:
      "Inspired by the Black Coffee Boarding Pass pattern, event guides let you publish a single canonical KBYG per project, with sections automatically scoped per persona. A guest sees parking + schedule + FAQ. Crew sees radio channels + SOPs + PPE. Same data, different view — edited once in the CMS.",
    highlights: [
      { title: "Shared schema", body: "One GuideConfig per project × persona, authored in ATLVS CMS." },
      { title: "Section library", body: "Overview, schedule, set times, timeline, credentials, contacts, FAQ, SOPs, PPE, radio, resources, evacuation, fire safety, accessibility, sustainability, code of conduct, custom." },
      { title: "Auto-scoped render", body: "mapSessionToGuidePersona() routes the viewer to their persona's guide." },
      { title: "Portal + mobile", body: "Renders at /p/[slug]/guide and /m/guide — same component, different shell." },
      { title: "Publish flow", body: "Draft → preview → publish. Public guides readable by anon via RLS policy." },
      { title: "Revision history", body: "Every publish writes a version row; you can roll back from the CMS." },
    ],
    specs: [
      "Table: event_guides (one row per project × persona)",
      "JSONB config with typed sections",
      "RLS: event_guides_select_public when status='published'",
      "Component: <GuideView /> shared by portal + mobile",
    ],
    faqs: [
      {
        q: "Do guests need an account to view the guide?",
        a: "No. Published guides are readable by anon via a targeted RLS policy. Share the URL; the guest scans for the persona sections they're scoped to.",
      },
      {
        q: "How is this different from a PDF KBYG?",
        a: "A PDF can't be scoped by role. A PDF can't be updated the morning of the show. A PDF can't be rolled back. Event guides are one of each, instantly.",
      },
    ],
    related: [
      { slug: "portals", label: "GVTEWAY portals" },
      { slug: "mobile", label: "COMPVSS mobile" },
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
      "Issue, track, and scan tickets with race-safe atomic Postgres updates and an offline-first scan queue.",
    heroTitle: "Sub-100ms server-side. Zero duplicates.",
    heroBody:
      "Tickets are issued in ATLVS, delivered as QR codes, and scanned by COMPVSS. The scan endpoint attempts an atomic UPDATE tickets SET status='scanned' WHERE status='issued' — a duplicate hits the wall cleanly. Offline scans queue locally and replay in order.",
    highlights: [
      { title: "Issue in ATLVS", body: "Generate tickets by allocation, per-persona, with QR payload." },
      { title: "Scan in COMPVSS", body: "Phone camera; sub-100ms scan response; four result states." },
      { title: "Race-safe", body: "Conditional UPDATE guarantees single-scan-wins under concurrent load." },
      { title: "Offline queue", body: "IndexedDB queue replays in order when network returns." },
      { title: "History", body: "ticket_scans records every attempt with result + scanner identity." },
      { title: "Rate limited", body: "scan bucket prevents abuse; legitimate flow unaffected." },
    ],
    specs: [
      "Tables: tickets, ticket_scans",
      "Endpoint: POST /api/v1/tickets/scan",
      "Scan results: accepted | duplicate | voided | not_found",
      "Middleware scan rate budget",
    ],
    faqs: [
      {
        q: "What's the scan latency?",
        a: "Sub-100ms server-side for the atomic UPDATE path. Network adds on top; a typical US cell connection yields 200-400ms end-to-end. Offline scans are instant locally.",
      },
      {
        q: "How do we handle refunded tickets?",
        a: "Void them in ATLVS — status flips to 'voided'. A subsequent scan resolves as 'voided', not 'accepted', and the scanner sees a clear denial UI.",
      },
    ],
    related: [
      { slug: "mobile", label: "COMPVSS mobile" },
      { slug: "portals", label: "Guest portal" },
      { slug: "console", label: "ATLVS" },
    ],
    keywords: ["event ticketing", "QR ticket scanner", "offline check-in", "race-safe ticket scanning"],
  },
  advancing: {
    slug: "advancing",
    name: "Advancing",
    eyebrow: "ATLVS · Advancing",
    title: "Advancing, organized by deliverable.",
    blurb:
      "Track 16 standard deliverable types per show — from tech rider to hotel block — with comments, history, and file attachments.",
    heroTitle: "Stop advancing in email threads.",
    heroBody:
      "Every show has a predictable set of deliverables: tech rider, hospitality, ground transport, hotel block, stage plot, input list, insurance certs, credentials. Advancing models each as a typed deliverable with status, owner, due date, comments, file attachments, and full history.",
    highlights: [
      { title: "16 deliverable types", body: "Tech rider, hospitality, ground transport, hotel, stage plot, input list, COI, passes, and more." },
      { title: "Per-deliverable thread", body: "Comments, @mentions, status changes — every event written to deliverable_history." },
      { title: "File attachments", body: "PDFs, diagrams, riders — stored in Storage, delivered via signed URLs." },
      { title: "Status workflow", body: "Draft → sent → received → approved → complete, with automatic notifications." },
      { title: "Overdue tracking", body: "Dashboard surfaces what's slipping against show dates." },
      { title: "Portal exposure", body: "Artist/vendor portals show their deliverables and let them upload responses." },
    ],
    specs: [
      "Tables: deliverables, deliverable_comments, deliverable_history",
      "Storage bucket: advancing (signed URL delivery)",
      "Download endpoint: /api/v1/deliverables/[id]/download",
    ],
    faqs: [
      {
        q: "Why not just use email + Google Drive?",
        a: "Because email doesn't have status, history, typed fields, or role-scoped access. Advancing tracks what an email thread can't: who's waiting on what, what slipped, and who approved.",
      },
      {
        q: "Can external parties upload directly?",
        a: "Yes. Artists and vendors see their deliverables in their portal and upload files there. Everything writes back to deliverables + history for the internal team.",
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
      description: "flyingbluewhale — the unified production management platform.",
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
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: config.name, path: `/features/${config.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: `flyingbluewhale — ${config.name}`,
            description: config.blurb,
            url: `https://flyingbluewhale.app/features/${config.slug}`,
          }),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What this module does.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.highlights.map((h) => (
            <div key={h.title} className="surface-raised p-6">
              <div className="text-sm font-semibold">{h.title}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">How it's built</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Specs.</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {config.specs.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--org-primary)]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection title={`${config.name} · FAQ`} faqs={config.faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Related modules</h2>
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
