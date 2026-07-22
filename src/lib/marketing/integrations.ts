/**
 * Integrations directory. Each entry powers /integrations/[slug].
 *
 * Listed integrations are wired in code today (not aspirational). The
 * point of this surface is two-fold: SEO long-tail ("Stripe Connect
 * event production", "Supabase event ticketing") and trust ("show me
 * what's actually integrated, with receipts").
 */

export type Integration = {
  slug: string;
  name: string;
  category: "payments" | "ai" | "infra" | "comms" | "auth" | "observability" | "geo" | "calendar";
  short: string;
  long: string;
  /** What the integration does inside the product. */
  capabilities: string[];
  /** How it's wired — short technical anchor. */
  technicalAnchor: string;
  /** Modules that depend on this integration. */
  modules: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const INTEGRATIONS: Integration[] = [
  {
    slug: "stripe-connect",
    name: "Stripe Connect",
    category: "payments",
    short: "Direct vendor payouts on PO fulfillment. ACH, card, international wire.",
    long: "Stripe Connect powers the vendor-payout rail. Vendors onboard a Connected Account from the GVTEWAY portal, you approve a PO inside ATLVS, and the payout routes direct from your treasury to theirs — ACH, card, or international wire. Money never crosses our books. Every event is HMAC-SHA256-signed at the webhook.",
    capabilities: [
      "Connected Account onboarding in the vendor portal",
      "PO approval → payout in one workflow",
      "Domestic ACH, card-on-file, international wire",
      "Express + Standard Connect tiers supported",
      "Webhook signature verification on every event",
    ],
    technicalAnchor: "Webhook receiver at /api/v1/webhooks/stripe; checkout + Connect onboarding at /api/v1/stripe/*",
    modules: ["finance", "procurement", "portals"],
    faqs: [
      {
        q: "Does ATLVS hold vendor funds?",
        a: "No. Funds route direct from your treasury account (your Stripe instance) to vendor Connected Accounts. We're the orchestration layer; we never touch the money.",
      },
      {
        q: "What about international vendors?",
        a: "Stripe Cross-Border Payouts handle international wire to 30+ countries. Currency conversion happens at Stripe's published FX rates.",
      },
    ],
  },
  {
    slug: "anthropic",
    name: "Anthropic Claude",
    category: "ai",
    short: "Claude Sonnet 4.6 + Opus 4.7 power Aurora AI, the assistant grounded in your workspace.",
    long: "Aurora AI runs on Anthropic Claude — Sonnet 4.6 for day-to-day, Opus 4.7 for deeper reasoning. We don't train models. Conversations log in your tenant, scoped to your organization at the database, and never cross-organization. Anthropic's API receives only the context we explicitly assemble per turn.",
    capabilities: [
      "Streaming chat with conversation persistence",
      "Tool calling scoped to your workspace data",
      "Per-org model selection + monthly cost cap",
      "Prompt caching for repeated context",
      "Audit log: who asked what, which model, which data touched",
    ],
    technicalAnchor: "Streaming chat at /api/v1/ai/chat (claude-sonnet-4-6 / claude-opus-4-7 via @anthropic-ai/sdk)",
    modules: ["ai", "advancing", "proposals", "safety"],
    faqs: [
      {
        q: "Is our data used to train Claude?",
        a: "No. Anthropic's API is zero-data-retention by default for our usage tier — your prompts and completions aren't stored beyond the request lifecycle on Anthropic's side, and they don't train on them.",
      },
      {
        q: "Can we self-host the model?",
        a: "Not today. Festival tier customers can BYO an Anthropic API key if they have a separate ZDR contract or specific compliance needs.",
      },
    ],
  },
  {
    slug: "supabase",
    name: "Supabase",
    category: "infra",
    short: "Postgres + RLS + Realtime + Storage + Auth — the data backbone.",
    long: "Supabase hosts the Postgres database, file storage buckets, realtime channels, and the auth layer that the entire platform runs on. RLS policies enforce per-org tenancy at the database layer — no application path can return a row from another organization, by design.",
    capabilities: [
      "Postgres with row-level security policies on every table",
      "Storage buckets: advancing, receipts, proposals, credentials, branding",
      "Realtime channels powering live announcement + chat surfaces",
      "Auth with magic-link, OAuth, MFA, SAML on enterprise tier",
      "Read-replicas + point-in-time recovery",
    ],
    technicalAnchor: "@supabase/ssr + @supabase/supabase-js with createClient pattern across server actions",
    modules: ["console", "portals", "mobile", "compliance"],
    faqs: [
      {
        q: "Where is the data hosted?",
        a: "AWS us-east-1 by default. EU + APAC regions available on Enterprise. Customer-controlled region for Enterprise customers with data-residency requirements.",
      },
      {
        q: "What happens on a Supabase outage?",
        a: "We carry a documented BC/DR runbook with read-only fallback to a hot-standby region. Compvss (the offline-first PWA) continues to operate; the office console degrades to read-only until failover completes.",
      },
    ],
  },
  {
    slug: "twilio",
    name: "Twilio",
    category: "comms",
    short: "SMS + voice for critical alerts and the OTP backstop on auth.",
    long: "Twilio powers SMS alerts (crisis comms, shift confirmations, incident escalations) and serves as the OTP fallback for auth when magic links don't work. Per-org sender numbers available on Enterprise so messages come from your line, not ours.",
    capabilities: [
      "Critical-alert SMS routing",
      "Two-factor auth fallback for users without OAuth",
      "Per-org sender numbers (Enterprise)",
      "Cost cap per org with hard ceiling",
    ],
    technicalAnchor: "Used by /api/v1/notifications/* fan-out and /api/v1/auth/* OTP paths",
    modules: ["safety", "compliance"],
    faqs: [],
  },
  {
    slug: "resend",
    name: "Resend",
    category: "comms",
    short: "Transactional email for invites, magic-link auth, proposals, recap delivery.",
    long: "Resend handles transactional email — invites, magic-link auth, proposal-share notifications, recap PDFs. Branded per org with verified-domain support on Enterprise. Bounce + complaint webhooks land in the audit log.",
    capabilities: [
      "Branded transactional email per org",
      "DKIM + SPF + DMARC alignment for deliverability",
      "Bounce + complaint webhook handling",
      "Magic-link auth deliveries with rate limiting",
    ],
    technicalAnchor: "src/lib/email.ts — transactional templates + signed send",
    modules: ["proposals", "portals", "console"],
    faqs: [],
  },
  {
    slug: "google-oauth",
    name: "Google",
    category: "auth",
    short: "Google sign-in + Google Calendar ICS feed for crew + talent schedules.",
    long: "Sign in with Google for the console + portal users. Google Calendar receives an ICS subscription URL per persona so crew see their calls and artists see their set times in their primary calendar.",
    capabilities: [
      "OAuth sign-in with Google Workspace + personal accounts",
      "Calendar ICS feed per persona (scoped subscription URL)",
      "SAML SSO for Workspace Enterprise customers",
    ],
    technicalAnchor: "OAuth via Supabase Auth providers; ICS feed at /api/v1/calendar/feed",
    modules: ["portals", "schedule"],
    faqs: [],
  },
  {
    slug: "apple-oauth",
    name: "Apple",
    category: "auth",
    short: "Sign in with Apple for portal users + iOS Calendar subscription.",
    long: "Sign in with Apple for portal access — supports private-relay email so vendors and artists don't expose their actual address. iOS Calendar subscribes the same ICS feed as Google.",
    capabilities: ["Sign in with Apple with private-relay email support", "iOS Calendar subscription via ICS"],
    technicalAnchor: "OAuth via Supabase Auth providers",
    modules: ["portals", "schedule"],
    faqs: [],
  },
  {
    slug: "microsoft-oauth",
    name: "Microsoft",
    category: "auth",
    short: "Microsoft sign-in + Outlook Calendar ICS feed for enterprise customers.",
    long: "Sign in with Microsoft (Entra ID / Azure AD) for enterprise customers. Outlook Calendar subscribes the same per-persona ICS feed. SAML SSO + SCIM provisioning on the Festival tier.",
    capabilities: ["Microsoft Entra ID OAuth", "Outlook Calendar ICS subscription", "SAML SSO + SCIM (Festival)"],
    technicalAnchor: "OAuth via Supabase Auth providers; SCIM at /api/v1/scim",
    modules: ["portals", "schedule"],
    faqs: [],
  },
  {
    slug: "sentry",
    name: "Sentry",
    category: "observability",
    short: "Error tracking + performance monitoring across console, portal, field.",
    long: "Sentry captures errors and performance traces across all three shells. Per-org PII scrubbing strips credentials, tokens, and sensitive payloads before any event leaves the request boundary.",
    capabilities: [
      "Error tracking with per-org scoping",
      "Performance tracing (Web Vitals + server response)",
      "PII scrubbing at the SDK boundary",
      "Release-tagged events with source maps",
    ],
    technicalAnchor: "@sentry/nextjs configured with src/lib/sentry-scrub.ts BeforeSend hook",
    modules: ["compliance", "console"],
    faqs: [],
  },
  {
    slug: "mapbox",
    name: "Mapbox",
    category: "geo",
    short: "Geo-tagged daily logs, incident maps, driver-run dispatch maps.",
    long: "Mapbox renders the geo surfaces — incident maps showing where field reports came from, dispatch maps for driver runs, daily-log maps showing manpower distribution. EXIF geo-data on photos plots on the project map.",
    capabilities: [
      "Incident + daily-log geo plotting",
      "Driver-run dispatch maps",
      "EXIF-aware photo geo plotting",
      "Per-org token isolation",
    ],
    technicalAnchor: "Per-org Mapbox token; rendered in Compvss field views + Atlvs reporting surfaces",
    modules: ["safety", "logistics", "photos"],
    faqs: [],
  },
  {
    slug: "ics-calendar",
    name: "ICS Calendar Feeds",
    category: "calendar",
    short: "Standards-based calendar subscriptions for crew, talent, vendors, drivers.",
    long: "Per-persona ICS subscription URLs work in any calendar client — Google, Apple, Outlook, Fastmail, Proton. The scope respects the portal RLS: a vendor sees their delivery windows, a crew member sees their calls, an artist sees their set times.",
    capabilities: [
      "Per-persona scoped ICS feeds",
      "Standards-based (RFC 5545); works in any client",
      "Token-revocable share URLs",
      "Per-event description with portal deep-link",
    ],
    technicalAnchor: "/api/v1/calendar/feed/[token].ics — token-scoped, signed, revocable",
    modules: ["schedule", "portals"],
    faqs: [],
  },
  {
    slug: "webhooks",
    name: "Outbound Webhooks",
    category: "infra",
    short: "Signed HTTP webhooks for every domain event — wire ATLVS into Slack, Zapier, your CRM.",
    long: "Every domain event — proposal accepted, PO approved, incident filed, payment received, advancing deliverable resolved — fires a signed HTTP webhook. HMAC-SHA256 signature on every payload. Endpoint configuration in the console settings.",
    capabilities: [
      "Domain events for every major lifecycle transition",
      "HMAC-SHA256 signature verification",
      "Per-endpoint retry with exponential backoff",
      "Failed-delivery dead-letter queue with replay",
      "Per-org rate limits",
    ],
    technicalAnchor: "src/app/api/v1/webhooks/* (inbound) + src/lib/notify-resolver.ts (outbound dispatch)",
    modules: ["compliance"],
    faqs: [
      {
        q: "How do I verify a webhook signature?",
        a: "Compute HMAC-SHA256 of the raw request body with your endpoint secret and compare to the X-ATLVS-Signature header. Reject mismatches. Sample code in the API docs.",
      },
      {
        q: "What's the retry policy?",
        a: "Exponential backoff over 24 hours: immediate, 15s, 1m, 5m, 30m, 2h, 6h, 24h. After 24h the event lands in your dead-letter queue with a replay button.",
      },
    ],
  },
];

export const INTEGRATIONS_BY_SLUG = Object.fromEntries(INTEGRATIONS.map((i) => [i.slug, i]));

export const INTEGRATION_CATEGORIES: Array<{ slug: Integration["category"]; label: string }> = [
  { slug: "payments", label: "Payments" },
  { slug: "ai", label: "AI" },
  { slug: "infra", label: "Infrastructure" },
  { slug: "comms", label: "Communications" },
  { slug: "auth", label: "Authentication" },
  { slug: "calendar", label: "Calendar" },
  { slug: "geo", label: "Geo" },
  { slug: "observability", label: "Observability" },
];
