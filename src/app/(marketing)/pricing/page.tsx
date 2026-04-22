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
  title: "Pricing — Access, Core, Professional, Enterprise",
  description:
    "Transparent pricing for Second Star Technologies. Start free for life on the Access tier. Scale to Core ($49/mo), Professional ($199/mo), or Enterprise. Every tier includes data walled off per organization and full integrations.",
  path: "/pricing",
  keywords: ["production software pricing", "event management software cost", "Second Star Technologies pricing", "ATLVS pricing", "GVTEWAY pricing", "COMPVSS pricing", "stakeholder portal pricing"],
  ogImageEyebrow: "Pricing",
  ogImageTitle: "Start free. Scale when you need to.",
});

const TIERS = [
  {
    tier: "Access",
    price: "$0",
    per: "forever",
    description: "For freelancers and single-show teams.",
    features: [
      "Basic projects + tasks",
      "Guest + artist portals",
      "Up to 3 users",
      "Up to 100 tickets / event",
      "Community support",
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    tier: "Core",
    price: "$49",
    per: "month per org",
    description: "For small production teams shipping their first season.",
    features: [
      "Everything in Access",
      "Invoicing + expenses + budgets",
      "Advancing deliverables",
      "Up to 10 users",
      "Up to 2,000 tickets / event",
      "Email support",
    ],
    cta: "Start 14-day trial",
    href: "/signup",
  },
  {
    tier: "Professional",
    price: "$199",
    per: "month per org",
    description: "For production orgs running multiple shows a month.",
    features: [
      "Everything in Core",
      "Full procurement with direct vendor payouts",
      "AI assistant grounded in your data",
      "Interactive proposals",
      "Event guides CMS",
      "Unlimited users",
      "Priority support and onboarding",
    ],
    cta: "Start 14-day trial",
    href: "/signup",
    highlight: true,
  },
  {
    tier: "Enterprise",
    price: "Custom",
    per: "",
    description: "For agencies, touring companies, festivals.",
    features: [
      "Everything in Professional",
      "SSO (SAML) and SCIM provisioning",
      "Deep-reasoning AI model",
      "Custom roles and access policies",
      "SOC 2 attestation package and signed DPA",
      "Dedicated CSM and 99.9% uptime SLA",
      "Custom integrations",
    ],
    cta: "Talk to sales",
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
      { feature: "SSO (SAML)", access: false, core: false, pro: false, ent: true },
      { feature: "SCIM provisioning", access: false, core: false, pro: false, ent: true },
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
    q: "Do I have to pay per user?",
    a: "No. We charge per org, not per seat. Professional is unlimited users for $199/month. Your team getting bigger never becomes a surprise line item.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. Access is free forever — basic projects, guest and artist portals, up to 3 users, up to 100 tickets per event. No credit card required.",
  },
  {
    q: "How does the 14-day trial work?",
    a: "Core and Professional include a 14-day free trial of every feature in the tier. No credit card up front. If you don't upgrade by day 14, you drop back to the free Access tier — your data stays.",
  },
  {
    q: "Can I switch plans later?",
    a: "Anytime. Upgrades are instant. Downgrades take effect at the end of the billing period. Nothing is ever deleted — features above your tier just become read-only.",
  },
  {
    q: "What about nonprofits and festivals?",
    a: "Yes — 30% off Core and Professional for registered nonprofits and community arts festivals. Email hello@flyingbluewhale.app with your 501(c)(3) or equivalent.",
  },
  {
    q: "Do you charge per ticket scanned?",
    a: "No. Scans are included. Some competitors charge per-scan fees that spike on festival weekends. We think that's hostile pricing. Scan as many tickets as your event requires.",
  },
  {
    q: "What does Enterprise add over Professional?",
    a: "SSO (SAML), SCIM provisioning, the deep-reasoning AI model, custom roles and access policies, a formal SOC 2 attestation package, a signed DPA, a dedicated customer success manager, a 99.9% uptime SLA, and custom integrations.",
  },
  {
    q: "How does this price out vs. Asana, Monday, or Notion plus point tools?",
    a: "Stacking Asana, a portal product, an AI add-on, a ticketing platform, and finance glue typically runs $500–$2000/month for a 10-person team. Professional is $199/month unlimited users and covers all of it natively. See /compare for detailed breakdowns.",
  },
  {
    q: "Can I self-host?",
    a: "Self-host is available on Enterprise with a source-available license. It's not our recommended deployment — our managed infrastructure handles security, storage, and uptime. Contact sales if you need on-prem.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export everything — CSV or JSON — anytime from the console. After cancellation your data is retained for 30 days (re-subscribe and it's back) and then purged. Signed logs of the purge are available on request.",
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
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Pricing</div>
        <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Start Free. Scale When You Need to. Per Org, Not Per Seat.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Every tier includes data walled off per organization, integrations, and an immutable audit log. Upgrade
          anytime. No per-seat fees. No per-scan fees. No charge for your team getting bigger.
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Feature Comparison</h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
          Everything you get at each tier. If a feature you need is on Enterprise, <a className="text-[var(--org-primary)] underline underline-offset-2" href="/contact">ask us</a> — we&apos;ll usually make it work on Professional.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 pr-4 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-center font-semibold">Access</th>
                <th className="py-3 pr-4 text-center font-semibold">Core</th>
                <th className="py-3 pr-4 text-center font-semibold">Professional</th>
                <th className="py-3 pr-4 text-center font-semibold">Enterprise</th>
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
        title="Ship the next show on Second Star Technologies"
        subtitle="Start free in under two minutes. No credit card. No forced sales call."
      />
    </div>
  );
}
