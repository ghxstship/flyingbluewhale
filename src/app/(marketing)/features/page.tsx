import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Features — Console, Portals, Mobile, AI, Finance, Procurement",
  description:
    "Everything flyingbluewhale ships: the internal console, role-scoped stakeholder portals, offline-first mobile PWA, streaming AI assistant, finance + procurement modules, and compliance tooling.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "Features",
  ogImageTitle: "Everything in flyingbluewhale",
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
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Features</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Everything in flyingbluewhale</h1>
      <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
        Built on Next.js 16 (App Router), Supabase (Postgres + RLS), Stripe Connect, and Anthropic Claude.
      </p>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/features/${c.key}`} className="surface hover-lift p-5">
            <div className="text-sm font-semibold">{c.title}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
