import type { Metadata } from "next";
import { Sparkles, Wrench, ShieldCheck, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "Changelog — what shipped on Second Star Technologies",
  description:
    "Release notes for the Second Star Technologies platform. Every shipping change, with context. Feature launches, reliability, security, and performance.",
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
    title: "Marketing + SEO expansion",
    kind: "feature",
    body: "Full marketing site rebuild with per-module deep-dives, comparison tables, blog, case studies, and structured data across every page.",
    items: [
      "New /solutions/{atlvs,gvteway,compvss} deep-dive pages",
      "Dynamic OG image route at /og with eyebrow + title params",
      "FAQPage, BreadcrumbList, Product, SoftwareApplication JSON-LD",
      "Generative Engine Optimization (GEO) — definitive FAQs on every page",
    ],
  },
  {
    date: "2026-04-10",
    version: "v1.3",
    title: "Interactive proposals",
    kind: "feature",
    body: "Client-facing scroll-activated proposals with structured pricing, accept-in-place, and revocable share links. Synthesizes patterns from F1-Miami and proposalzero.",
    items: [
      "proposals + proposal_versions + proposal_share_links tables",
      "proposal_org_id() SECURITY DEFINER helper (fixes RLS recursion)",
      "Template library (festival, tour, corporate, private)",
      "Accept/decline signs into audit_log with IP + version hash",
    ],
  },
  {
    date: "2026-04-03",
    version: "v1.2",
    title: "Boarding Pass event guides",
    kind: "feature",
    body: "Role-scoped KBYG guides managed in ATLVS CMS and rendered on portal + mobile. One authoring flow, six persona renders.",
    items: [
      "event_guides table with JSONB config",
      "17 standard section types (schedule, SOPs, PPE, radio, evacuation, etc.)",
      "event_guides_select_public RLS policy for anon-visible guides",
      "GuideView component shared by /p/[slug]/guide and /m/guide",
    ],
  },
  {
    date: "2026-03-27",
    version: "v1.1",
    title: "Advancing deliverables",
    kind: "feature",
    body: "Refactored advancing from a finance submodule into a standalone module with 16 typed deliverables (tech rider, hospitality, stage plot, hotel block, etc.).",
    items: [
      "deliverables + deliverable_comments + deliverable_history tables",
      "advancing Storage bucket with signed-URL delivery",
      "Portal exposure: artists + vendors see their deliverables",
      "Overdue dashboard surfacing what's slipping",
    ],
  },
  {
    date: "2026-03-20",
    version: "v1.0",
    title: "Three-shell GA",
    kind: "feature",
    body: "General availability of the three-shell topology — ATLVS (internal console), GVTEWAY (stakeholder portals), COMPVSS (mobile PWA).",
    items: [
      "Unified Supabase schema (33+ tables, RLS on every row)",
      "is_org_member(), has_org_role(), auth_user_email() helpers",
      "Per-shell brand overlay via data-platform (red/blue/yellow)",
      "Streaming Anthropic chat (Claude Sonnet 4.6 + Opus 4.7)",
    ],
  },
  {
    date: "2026-03-10",
    version: "v0.9",
    title: "Stripe Connect payouts",
    kind: "feature",
    body: "Vendor payouts via Stripe Connect Express. Onboarding flow, HMAC-SHA256 webhook verification, payout-on-approval.",
    items: [
      "/api/v1/stripe/connect/onboarding endpoint",
      "/api/v1/webhooks/stripe receiver with signature verification",
      "Vendor portal surfaces connect status + balance",
    ],
  },
  {
    date: "2026-03-03",
    version: "v0.8",
    title: "Rate limiter + CSP",
    kind: "security",
    body: "In-memory sliding-window rate limiter on AI, scan, webhook, and auth buckets. Strict Content Security Policy shipped in vercel.json.",
    items: [
      "middleware.ts protects /api/v1/ai/*, /api/v1/tickets/scan, /api/v1/webhooks/*, /login, /signup",
      "429 responses include retry-after and reset headers",
      "CSP + HSTS + X-Frame-Options + X-Content-Type-Options",
    ],
  },
  {
    date: "2026-02-24",
    version: "v0.7",
    title: "Offline scan queue",
    kind: "performance",
    body: "COMPVSS scanner falls back to IndexedDB queue when offline and replays in order on reconnect. Zero dropped scans.",
    items: [
      "Service worker caches scanner shell + today's data",
      "Scan queue replays ordered with exponential backoff",
      "Sub-100ms server-side scan latency at p50",
    ],
  },
  {
    date: "2026-02-17",
    version: "v0.6",
    title: "Audit log",
    kind: "security",
    body: "Every mutation writes a structured audit_log entry: actor, IP, user agent, before/after jsonb payloads, session id.",
    items: [
      "Retention configurable per tenant",
      "Exportable to JSON for compliance reviews",
      "Queryable from /console/compliance",
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

      <CTASection title="Try what's new" subtitle="Every change ships to free + trial accounts immediately." />
    </div>
  );
}
