// Static page — pre-render at build, no streaming Suspense on client nav.
export const dynamic = "force-static";

import type { Metadata } from "next";
import { Sparkles, Wrench, ShieldCheck, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "Changelog — what shipped on Second Star Technologies",
  description:
    "Release notes for Second Star Technologies. Every shipping change, with context. Feature launches, reliability, security, and performance.",
  path: "/changelog",
  keywords: ["Second Star Technologies changelog", "ATLVS changelog", "GVTEWAY changelog", "COMPVSS changelog", "release notes", "product updates"],
  ogImageEyebrow: "Changelog",
  ogImageTitle: "What shipped.",
});

type EntryKind = "feature" | "improvement" | "security" | "performance";

const KINDS: Record<EntryKind, { label: string; className: string; icon: typeof Sparkles }> = {
  feature: { label: "Feature", className: "bg-[var(--org-primary)]/10 text-[var(--org-primary)]", icon: Sparkles },
  improvement: { label: "Improvement", className: "bg-[var(--accent)]/10 text-[var(--accent)]", icon: Wrench },
  security: { label: "Security", className: "bg-emerald-500/10 text-emerald-600", icon: ShieldCheck },
  performance: { label: "Performance", className: "bg-amber-500/10 text-amber-600", icon: Zap },
};

const ENTRIES: Array<{ date: string; version: string; title: string; kind: EntryKind; body: string; items: string[] }> = [
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

export default function ChangelogPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Changelog", href: "/changelog" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Changelog</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">What Shipped.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Every release since v0.6, with enough context to understand why we shipped it. Subscribe via RSS at{" "}
          <a className="underline" href="/changelog.rss">/changelog.rss</a>.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ul className="space-y-6">
          {ENTRIES.map((e) => {
            const kind = KINDS[e.kind];
            const Icon = kind.icon;
            return (
              <li key={e.version} className="surface-raised p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${kind.className}`}>
                    <Icon size={10} /> {kind.label}
                  </span>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{e.date} · {e.version}</div>
                </div>
                <div className="mt-2 text-xl font-semibold tracking-tight">{e.title}</div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{e.body}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                  {e.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <CTASection title="Try what's new" subtitle="Every change ships to free and trial accounts immediately." />
    </div>
  );
}
