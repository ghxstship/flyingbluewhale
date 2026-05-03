/**
 * Single source of truth for the public changelog. Consumed by the
 * /changelog page render and the /changelog.rss feed so additions only
 * need to land in one place.
 */

export type ChangelogKind = "feature" | "improvement" | "security" | "performance";

export type ChangelogEntry = {
  date: string; // ISO YYYY-MM-DD
  version: string;
  title: string;
  kind: ChangelogKind;
  body: string;
  items: string[];
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-04-17",
    version: "v1.4",
    title: "Marketing and SEO expansion",
    kind: "feature",
    body: "Full marketing site rebuild — per-module deep dives, comparison tables, blog, case studies, and cleaner metadata across every page.",
    items: [
      "New solution pages for ATLVS, GVTEWAY, and COMPVSS",
      "Dynamic OG images for every page",
      "Rich search result data on every page",
      "Definitive FAQs on every page",
    ],
  },
  {
    date: "2026-04-10",
    version: "v1.3",
    title: "Interactive proposals",
    kind: "feature",
    body: "Client-facing scrolling proposals with live pricing, accept in place, and revocable share links. Stop attaching PDFs.",
    items: [
      "Proposals with versioning and revocable share links",
      "Signed acceptance with IP, timestamp, and version captured",
      "Template library — festival, tour, corporate, private event",
      "Every action logged to the audit trail",
    ],
  },
  {
    date: "2026-04-03",
    version: "v1.2",
    title: "Event guides (KBYG)",
    kind: "feature",
    body: "Role-scoped KBYG, authored once in ATLVS and rendered cleanly across portal and mobile. One flow, six persona views.",
    items: [
      "One guide per project, every persona auto-scoped",
      "Seventeen standard section types — schedule, SOPs, PPE, radio channels, evacuation, and more",
      "Anon-accessible guides share by link",
      "Same component renders portal and mobile",
    ],
  },
  {
    date: "2026-03-27",
    version: "v1.1",
    title: "Advancing deliverables",
    kind: "feature",
    body: "Advancing graduated from a finance submodule into its own module with sixteen typed deliverables — tech rider, hospitality, stage plot, hotel block, and more.",
    items: [
      "Typed deliverables with comments and history",
      "File attachments delivered via auto-expiring links",
      "Artists and vendors see their deliverables in their portal",
      "Overdue dashboard surfaces what's slipping",
    ],
  },
  {
    date: "2026-03-20",
    version: "v1.0",
    title: "Three apps GA",
    kind: "feature",
    body: "General availability of the three connected apps — ATLVS for the office, GVTEWAY for stakeholders, COMPVSS for the field.",
    items: [
      "Unified backbone — every org's data walled off",
      "Role-aware access across every tier",
      "Per-app brand overlay (red, blue, yellow)",
      "AI assistant grounded in your workspace",
    ],
  },
  {
    date: "2026-03-10",
    version: "v0.9",
    title: "Direct vendor payouts",
    kind: "feature",
    body: "Vendors onboard a payout account and get paid directly — ACH, card, or international wire. Payout on approval. We never touch your money.",
    items: [
      "Vendor onboarding flow from the portal",
      "Signed webhooks for payment events",
      "Vendor portal surfaces payout status and balance",
    ],
  },
  {
    date: "2026-03-03",
    version: "v0.8",
    title: "Rate limiter and edge security",
    kind: "security",
    body: "Per-bucket rate limits on AI, scan, webhook, and auth endpoints. Strict edge security headers rolled out.",
    items: [
      "Abuse protection on AI, scan, webhook, and auth endpoints",
      "Rate-limit responses include retry-after and reset headers",
      "Strict content, origin, and framing rules at the edge",
    ],
  },
  {
    date: "2026-02-24",
    version: "v0.7",
    title: "Offline scan queue",
    kind: "performance",
    body: "The field scanner queues offline scans on the device and replays them in order when signal returns. Zero dropped scans.",
    items: [
      "Scanner, today's call sheet, and guide cached on the device",
      "Queue replays in order with backoff",
      "Sub-100ms server-side scan response",
    ],
  },
  {
    date: "2026-02-17",
    version: "v0.6",
    title: "Immutable audit log",
    kind: "security",
    body: "Every change writes a structured audit entry — actor, IP, user agent, before and after, session.",
    items: [
      "Retention configurable per tenant",
      "Exportable to JSON for compliance reviews",
      "Queryable from the compliance dashboard",
    ],
  },
];
