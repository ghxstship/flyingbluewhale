// Static page — pre-render at build, no streaming Suspense on client nav.
export const dynamic = "force-static";

import type { Metadata } from "next";
import { Check, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, faqSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "Passage — Four Cabins, One Manifest",
  description:
    "Four ways to board. Day Pass is free forever. Festival Pass is $49/mo. Voyager is $199/mo. Private Charter is custom. No per-seat tax. No per-scan tax.",
  path: "/pricing",
  keywords: ["production software pricing", "event management software cost", "Second Star Technologies pricing", "ATLVS pricing", "GVTEWAY pricing", "COMPVSS pricing", "stakeholder portal pricing"],
  ogImageEyebrow: "Passage",
  ogImageTitle: "Four cabins. One manifest.",
});

const TIERS = [
  {
    tier: "Day Pass",
    price: "$0",
    per: "forever",
    description: "Freelancers + single-night crossings. The manifest is open.",
    features: [
      "Basic projects + tasks",
      "Guest + artist ports",
      "Up to 3 pass holders",
      "Up to 100 boarding passes / voyage",
      "Community room",
    ],
    cta: "Book passage",
    href: "/signup",
  },
  {
    tier: "Festival Pass",
    price: "$49",
    per: "month per org",
    description: "Small studios charting their first season.",
    features: [
      "Everything on Day Pass",
      "Invoicing + expenses + budgets",
      "Live advancing deliverables",
      "Up to 10 pass holders",
      "Up to 2,000 boarding passes / voyage",
      "Email support",
    ],
    cta: "14-night soundcheck",
    href: "/signup",
  },
  {
    tier: "Voyager",
    price: "$199",
    per: "month per org",
    description: "Studios running multiple crossings a month. Taste-makers start here.",
    features: [
      "Everything on Festival Pass",
      "Full procurement + live vendor payouts",
      "AI runner grounded in your manifest",
      "Proposals signed in place",
      "Boarding-pass (KBYG) CMS",
      "Unlimited pass holders",
      "Priority concierge + onboarding",
    ],
    cta: "14-night soundcheck",
    href: "/signup",
    highlight: true,
  },
  {
    tier: "Private Charter",
    price: "Custom",
    per: "",
    description: "Agencies, touring companies, festivals, OCOG-scale crossings.",
    features: [
      "Everything on Voyager",
      "Deep-reasoning AI co-pilot",
      "Custom roles + access policies",
      "SOC 2 attestation pack + signed DPA",
      "Dedicated CSM + 99.9% uptime SLA",
      "Custom integrations (we build with you)",
    ],
    cta: "Call the studio",
    href: "/contact",
  },
];

const COMPARISON: Array<{ category: string; rows: Array<{ feature: string; access: boolean | string; core: boolean | string; pro: boolean | string; ent: boolean | string }> }> = [
  {
    category: "Core",
    rows: [
      { feature: "Data walled off per organization", access: true, core: true, pro: true, ent: true },
      { feature: "Users per org", access: "3", core: "10", pro: "Unlimited", ent: "Unlimited" },
      { feature: "Projects per org", access: "1", core: "5", pro: "Unlimited", ent: "Unlimited" },
      { feature: "Integrations and webhooks", access: true, core: true, pro: true, ent: true },
    ],
  },
  {
    category: "ATLVS console",
    rows: [
      { feature: "Overview and Projects", access: true, core: true, pro: true, ent: true },
      { feature: "Finance (invoices, budgets, expenses)", access: false, core: true, pro: true, ent: true },
      { feature: "Procurement (POs, vendors)", access: false, core: false, pro: true, ent: true },
      { feature: "Production (equipment, rentals)", access: false, core: true, pro: true, ent: true },
      { feature: "People and credentials", access: false, core: true, pro: true, ent: true },
      { feature: "Advancing (16 deliverable types)", access: false, core: true, pro: true, ent: true },
      { feature: "CMS and event guides", access: false, core: false, pro: true, ent: true },
    ],
  },
  {
    category: "GVTEWAY portals",
    rows: [
      { feature: "Guest portal", access: true, core: true, pro: true, ent: true },
      { feature: "Artist portal", access: true, core: true, pro: true, ent: true },
      { feature: "Vendor portal", access: false, core: true, pro: true, ent: true },
      { feature: "Client portal and proposals", access: false, core: false, pro: true, ent: true },
      { feature: "Sponsor portal", access: false, core: false, pro: true, ent: true },
      { feature: "Crew portal", access: false, core: true, pro: true, ent: true },
      { feature: "White-label branding", access: false, core: false, pro: true, ent: true },
    ],
  },
  {
    category: "COMPVSS mobile",
    rows: [
      { feature: "Offline ticket scan", access: true, core: true, pro: true, ent: true },
      { feature: "Geo-verified clock in/out", access: false, core: true, pro: true, ent: true },
      { feature: "Inventory scan", access: false, core: true, pro: true, ent: true },
      { feature: "Incident reporting", access: false, core: true, pro: true, ent: true },
    ],
  },
  {
    category: "AI",
    rows: [
      { feature: "AI assistant grounded in your data", access: false, core: false, pro: true, ent: true },
      { feature: "Deep-reasoning model", access: false, core: false, pro: false, ent: true },
      { feature: "Drafting templates", access: false, core: false, pro: true, ent: true },
      { feature: "Monthly AI budget", access: "—", core: "—", pro: "Included", ent: "Custom" },
    ],
  },
  {
    category: "Integrations",
    rows: [
      { feature: "Card and ACH invoice payments", access: false, core: true, pro: true, ent: true },
      { feature: "Direct vendor payouts", access: false, core: false, pro: true, ent: true },
      { feature: "Signed webhooks", access: true, core: true, pro: true, ent: true },
    ],
  },
  {
    category: "Security & compliance",
    rows: [
      { feature: "Immutable audit log", access: true, core: true, pro: true, ent: true },
      { feature: "Auto-expiring file share links", access: true, core: true, pro: true, ent: true },
      { feature: "Rate-limited endpoints", access: true, core: true, pro: true, ent: true },
      { feature: "Edge security (strict content and origin rules)", access: true, core: true, pro: true, ent: true },
      { feature: "SOC 2 attestation package", access: false, core: false, pro: false, ent: true },
      { feature: "Data residency selection", access: false, core: false, pro: false, ent: true },
    ],
  },
  {
    category: "Support",
    rows: [
      { feature: "Community", access: true, core: true, pro: true, ent: true },
      { feature: "Email support", access: false, core: true, pro: true, ent: true },
      { feature: "Priority plus onboarding", access: false, core: false, pro: true, ent: true },
      { feature: "Dedicated CSM", access: false, core: false, pro: false, ent: true },
      { feature: "99.9% uptime SLA", access: false, core: false, pro: false, ent: true },
    ],
  },
];

const FAQS = [
  {
    q: "Is passage priced per seat?",
    a: "Per org, flat. Voyager is unlimited pass holders for $199/month. The studio getting bigger never becomes a surprise line item.",
  },
  {
    q: "Is there really a free passage?",
    a: "Day Pass is free, forever. Basic projects, guest + artist ports, three pass holders, up to 100 boarding passes per voyage. No card required. The manifest is open.",
  },
  {
    q: "How does the 14-night soundcheck work?",
    a: "Festival Pass and Voyager unlock every feature in the cabin for fourteen nights. No card up front. Don&apos;t upgrade by night 14? You drop back to Day Pass — your manifest stays right where you left it.",
  },
  {
    q: "Can I change cabins later?",
    a: "Anytime. Upgrades hit instantly. Downgrades kick in at the end of the billing period. Nothing gets deleted — features above your cabin go read-only until you come back.",
  },
  {
    q: "Nonprofits and community programs?",
    a: "Thirty percent off Festival Pass and Voyager for registered nonprofits and community-arts programs. Email hello@flyingbluewhale.app with your 501(c)(3) or equivalent. We like the good crossings.",
  },
  {
    q: "Do you tax per scan?",
    a: "No. Scans are included. Scan till the sun comes up, every weekend of the season.",
  },
  {
    q: "What does Private Charter unlock over Voyager?",
    a: "Deep-reasoning AI co-pilot, custom roles and access policies, SOC-2 attestation pack, signed DPA, dedicated CSM, 99.9% uptime SLA, custom integrations we build with you. Admiral&apos;s-table standard.",
  },
  {
    q: "Can I self-host?",
    a: "Self-host ships on the Private Charter with a source-available license. Our managed infrastructure is the recommended route — it handles security, storage, and uptime. Call the studio if you need on-prem.",
  },
  {
    q: "What if I cancel? Does my manifest survive?",
    a: "Export everything — CSV or JSON — anytime, from the chart room. After cancel, your data lives thirty days (re-subscribe and you&apos;re back) and then purges. Signed logs of the purge on request. You own the manifest.",
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-[var(--org-primary)]" />;
  if (value === false) return <X size={14} className="text-[var(--text-muted)] opacity-50" />;
  if (value === "—") return <Minus size={14} className="text-[var(--text-muted)]" />;
  return <span className="text-xs text-[var(--text-secondary)]">{value}</span>;
}

export default function PricingPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <div>
      <JsonLd data={[faqSchema(FAQS)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Passage · the manifest opens</div>
        <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Four Cabins. Per Org, Not Per Seat.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Every tier: manifest walled off, integrations open, audit log immutable. Upgrade the night the voyage outgrows the cabin. Nothing extra for the studio getting bigger.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-4">
          {TIERS.map((t) => (
            <div key={t.tier} className={`surface-raised flex flex-col p-6 ${t.highlight ? "ring-2 ring-[var(--org-primary)]" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t.tier}</div>
                {t.highlight && <Badge variant="brand">Most popular</Badge>}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-semibold tracking-tight">{t.price}</span>
                {t.per && <span className="text-sm text-[var(--text-muted)]"> / {t.per}</span>}
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{t.description}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-[var(--text-secondary)]">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 text-[var(--org-primary)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button href={t.href} variant={t.highlight ? "primary" : "secondary"} className="w-full">
                  {t.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The Full Itinerary</h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
          Every port at every cabin. If the port you need is on Private Charter, <a className="text-[var(--org-primary)] underline underline-offset-2" href="/contact">call the studio</a> — we usually make it work on Voyager.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 pr-4 font-semibold">Port of call</th>
                <th className="py-3 pr-4 text-center font-semibold">Day Pass</th>
                <th className="py-3 pr-4 text-center font-semibold">Festival Pass</th>
                <th className="py-3 pr-4 text-center font-semibold">Voyager</th>
                <th className="py-3 pr-4 text-center font-semibold">Private Charter</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((cat) => (
                <>
                  <tr key={cat.category} className="bg-[var(--surface-inset)]">
                    <td colSpan={5} className="py-2 pl-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.rows.map((r) => (
                    <tr key={cat.category + r.feature} className="border-b border-[var(--border)]">
                      <td className="py-3 pr-4 text-sm">{r.feature}</td>
                      <td className="py-3 pr-4 text-center"><Cell value={r.access} /></td>
                      <td className="py-3 pr-4 text-center"><Cell value={r.core} /></td>
                      <td className="py-3 pr-4 text-center"><Cell value={r.pro} /></td>
                      <td className="py-3 pr-4 text-center"><Cell value={r.ent} /></td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FAQSection title="Pricing FAQ" faqs={FAQS} />

      <CTASection
        title="The Manifest Is Open."
        subtitle="Two-minute soundcheck to book passage. No card. No forced call. The Day Pass is yours, forever."
      />
    </div>
  );
}
