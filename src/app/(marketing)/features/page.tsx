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
  title: "The Rig — Everything the Room Needs",
  description:
    "ATLVS — the office. GVTEWAY — every door. COMPVSS — the floor. AI, finance, procurement, compliance. One manifest, three rooms. Written for producers.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "The Rig",
  ogImageTitle: "Everything the Room Needs.",
});

const CATEGORIES = [
  { key: "console", title: "The office", desc: "Nine rooms, 60+ modules, one sidebar. ATLVS runs the desk." },
  { key: "portals", title: "The doors", desc: "Twelve personas, twelve lanes. GVTEWAY is every guest&apos;s entrance." },
  { key: "mobile", title: "The floor", desc: "Gate scan, shift, medic, alerts, driver, guard. COMPVSS runs the night." },
  { key: "ai", title: "AI runner", desc: "Drafts riders, RFPs, call sheets, recaps — grounded in your manifest." },
  { key: "finance", title: "Finance", desc: "Invoices, expenses, budgets, time, mileage, advances, live vendor payouts, P&L." },
  { key: "procurement", title: "Procurement", desc: "Reqs, POs, vendor COIs, W-9s — one file cabinet, quiet as the back bar." },
  { key: "production", title: "Production", desc: "Equipment, rentals, fabrication, dispatch, logistics. The road case." },
  { key: "compliance", title: "Tour-grade security", desc: "Immutable audit log, retention rules, signed DPA on the Festival tier." },
];

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow="The Rig"
        title="Everything the Room Needs."
        subtitle="First pitch to final settlement. One manifest, three rooms, written for the producers who ship the nights."
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
