// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import {
  MarketingHero,
  MarketingSection,
  MarketingGrid,
  MarketingPageShell,
} from "@/components/marketing/MarketingPrimitives";

export const metadata: Metadata = buildMetadata({
  title: "Features — Console, Portals, Mobile, AI, Finance, Procurement",
  description:
    "Everything the Second Star Technologies platform ships: the internal console (ATLVS), role-scoped stakeholder portals (GVTEWAY), offline-first mobile PWA (COMPVSS), streaming AI assistant, finance + procurement modules, and compliance tooling.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "Features",
  ogImageTitle: "Everything in the Second Star Technologies platform",
});

const CATEGORIES = [
  { key: "console", title: "Platform console", desc: "Projects, finance, procurement, production, people, AI — one sidebar." },
  { key: "portals", title: "Stakeholder portals", desc: "Slug-scoped workspaces for artists, vendors, clients, sponsors, guests, crew." },
  { key: "mobile", title: "Mobile PWA", desc: "Offline ticket scan, geo-verified clock, inventory scan, incident reports." },
  { key: "ai", title: "AI tooling", desc: "Streaming assistant, drafting, automations, and managed agents." },
  { key: "finance", title: "Finance", desc: "Invoices, expenses, budgets, time, mileage, advances, payouts, live P&L." },
  { key: "procurement", title: "Procurement", desc: "Requisitions, POs, vendor COIs, W-9s, Stripe Connect payouts." },
  { key: "production", title: "Production", desc: "Equipment, rentals, fabrication, dispatch, logistics." },
  { key: "compliance", title: "Compliance", desc: "Per-org RLS, audit log, retention, SSO/SCIM on enterprise." },
];

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow="Features"
        title="Everything in ATLVS, GVTEWAY, and COMPVSS"
        subtitle="Built on Next.js 16 (App Router), Supabase (Postgres + RLS), Stripe Connect, and Anthropic Claude."
      />
      <MarketingSection aria-label="Feature categories">
        <MarketingGrid cols={4}>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/features/${c.key}`}
              className="surface hover-lift p-5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-solid,var(--org-primary))] rounded-lg"
            >
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{c.desc}</div>
            </Link>
          ))}
        </MarketingGrid>
      </MarketingSection>
    </MarketingPageShell>
  );
}
