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
  title: "Tonight&apos;s Lineup — Eight Headliners, One Ticket",
  description:
    "The full bill. ATLVS for the office, GVTEWAY for every door, COMPVSS for the floor. AI, finance, procurement, compliance — one rig, one run-of-show, zero sync issues.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "Tonight&apos;s Lineup",
  ogImageTitle: "Eight headliners. One ticket.",
});

const CATEGORIES = [
  { key: "console", title: "Office console", desc: "Nine domains, 60+ modules, one sidebar. ATLVS runs the desk." },
  { key: "portals", title: "Stakeholder doors", desc: "12 personas, 12 lanes. GVTEWAY is every stakeholder&apos;s entrance." },
  { key: "mobile", title: "Floor PWA", desc: "Gate scan, shift, medic, alerts, driver, guard. COMPVSS runs the night." },
  { key: "ai", title: "AI runner", desc: "Drafts riders, RFPs, call sheets, recaps — from your manifest, not the internet." },
  { key: "finance", title: "Finance", desc: "Invoices, expenses, budgets, time, mileage, advances, live vendor payouts, P&L." },
  { key: "procurement", title: "Procurement", desc: "Reqs, POs, vendor COIs, W-9s — one file cabinet, no loose paper." },
  { key: "production", title: "Production", desc: "Equipment, rentals, fabrication, dispatch, logistics. The road case." },
  { key: "compliance", title: "Main-stage security", desc: "Immutable audit log, retention rules, signed DPA on Festival tier." },
];

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow="Tonight&apos;s Lineup"
        title="Eight Headliners. One Ticket."
        subtitle="The whole bill — from first pitch to final settlement. One rig, one run-of-show, zero sync drama."
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
