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
    "Everything in the Second Star Technologies platform: ATLVS for the office, GVTEWAY for every outside stakeholder, COMPVSS for the field. AI, finance, procurement, compliance — one connected system.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "Features",
  ogImageTitle: "Everything in the Second Star Technologies platform",
});

const CATEGORIES = [
  { key: "console", title: "Office console", desc: "Projects, finance, procurement, production, people, AI — all in one sidebar." },
  { key: "portals", title: "Stakeholder portals", desc: "A tailored workspace for artists, vendors, clients, sponsors, guests, and crew." },
  { key: "mobile", title: "Field mobile app", desc: "Ticket scan, geo-verified clock-in, inventory, incident reports — from any phone." },
  { key: "ai", title: "AI assistant", desc: "Drafts riders, RFPs, call sheets, and recaps from your actual data." },
  { key: "finance", title: "Finance", desc: "Invoices, expenses, budgets, time, mileage, advances, vendor payouts, live P&L." },
  { key: "procurement", title: "Procurement", desc: "Requisitions, POs, vendor COIs, W-9s — all in one place." },
  { key: "production", title: "Production", desc: "Equipment, rentals, fabrication, dispatch, logistics." },
  { key: "compliance", title: "Compliance", desc: "Immutable audit log, retention, signed DPA on Enterprise." },
];

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow="Features"
        title="Everything in ATLVS, GVTEWAY, and COMPVSS"
        subtitle="Every tool a production team needs — from first pitch to final settlement. Connected, not cobbled together."
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
