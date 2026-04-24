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
  title: "The Itinerary — Every Port of Call",
  description:
    "Horizon to homecoming. ATLVS — the bridge. GVTEWAY — twelve ports of call. COMPVSS — the open deck. AI, finance, procurement, charter-grade security. One manifest, three rooms.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "The Itinerary",
  ogImageTitle: "Every Port. Every Act.",
});

const CATEGORIES = [
  { key: "console", title: "The bridge", desc: "Nine rooms, 60+ modules, one sidebar. ATLVS charts the voyage." },
  { key: "portals", title: "The ports of call", desc: "Twelve personas, twelve lanes. GVTEWAY is every guest&apos;s way aboard." },
  { key: "mobile", title: "The open deck", desc: "Gate scan, shift, medic, alerts, driver, guard. COMPVSS sails the night." },
  { key: "ai", title: "AI runner", desc: "Drafts riders, RFPs, call sheets, recaps — grounded in your manifest." },
  { key: "finance", title: "Finance", desc: "Invoices, expenses, budgets, time, mileage, advances, live vendor payouts, P&L." },
  { key: "procurement", title: "Procurement", desc: "Reqs, POs, vendor COIs, W-9s — one chart cabinet, quietly archived." },
  { key: "production", title: "Production", desc: "Equipment, rentals, fabrication, dispatch, logistics. The road case." },
  { key: "compliance", title: "Charter-grade security", desc: "Immutable audit log, retention rules, signed DPA on the Private Charter." },
];

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow="The Itinerary"
        title="Every Port. Every Act."
        subtitle="From horizon to homecoming. One manifest, three rooms, written for the cultural tastemakers charting the next crossing."
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
