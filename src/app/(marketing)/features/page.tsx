// ISR — regenerate static HTML every 5 min.
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
  title: "Features — Every Module. Native.",
  description:
    "Forty-seven modules across three apps that share one database. Console, portal, field. AI, finance, procurement, audit. One source.",
  path: "/features",
  keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
  ogImageEyebrow: "Features",
  ogImageTitle: "Every Module. Native.",
});

const CATEGORIES = [
  { key: "console", title: "The console", desc: "ATLVS — 47 modules, 9 domains, one sidebar." },
  {
    key: "portals",
    title: "The portal",
    desc: "GVTEWAY — twelve personas, each their lane.",
  },
  {
    key: "mobile",
    title: "The field",
    desc: "COMPVSS — offline-first PWA. Gate, shift, incident, medic.",
  },
  {
    key: "procore-parity",
    title: "Construction",
    desc: "RFIs, submittals, daily logs, punch list, inspections, change orders, payment apps.",
  },
  {
    key: "advancing",
    title: "Advancing",
    desc: "Riders, hospitality, stage plots, travel — 16 typed deliverables.",
  },
  {
    key: "proposals",
    title: "Proposals",
    desc: "23 block types, e-sig in place, revocable share links, version history.",
  },
  {
    key: "finance",
    title: "Finance",
    desc: "Invoices, expenses, budgets, time, mileage, advances, Stripe Connect payouts, P&L.",
  },
  {
    key: "procurement",
    title: "Procurement",
    desc: "RFQs, POs, vendor scorecards, COIs, W-9s, work order broadcasts.",
  },
  {
    key: "production",
    title: "Production",
    desc: "Equipment, rentals, fabrication, dispatch, logistics, site plans.",
  },
  {
    key: "safety",
    title: "Safety",
    desc: "Incidents, OSHA, medical, crisis, BC/DR, cyber-IR, safeguarding, environmental.",
  },
  {
    key: "guides",
    title: "Event guides (KBYG)",
    desc: "One project, six personas, 17 section types — schedule, SOPs, PPE, radio, evac.",
  },
  {
    key: "ai",
    title: "AI assistant",
    desc: "Drafts riders, RFPs, call sheets, recaps. Grounded in your workspace, never the public web.",
  },
  {
    key: "knowledge",
    title: "Knowledge base",
    desc: "Tagged articles, public-form intake, vendor training rolls up to compliance.",
  },
  {
    key: "forms",
    title: "Forms",
    desc: "Schema-driven. Public submission. Honeypot anti-spam.",
  },
  {
    key: "ticketing",
    title: "Ticketing + scan",
    desc: "Sub-100ms QR + barcode. Offline-queued. Replays in order.",
  },
  {
    key: "compliance",
    title: "Audit + compliance",
    desc: "Immutable audit log, signed webhooks, self-expiring shares, SOC-2 posture.",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow="Features"
        title="Every Module. Native."
        subtitle="Forty-seven modules across three apps. Same database, same auth, same audit log. No integration tax."
      />
      <MarketingSection aria-label="Feature Categories">
        <MarketingGrid cols={4}>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/features/${c.key}`}
              className="surface hover-lift rounded-lg p-5 focus-visible:ring-2 focus-visible:ring-[var(--accent-solid,var(--org-primary))] focus-visible:ring-offset-2"
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
