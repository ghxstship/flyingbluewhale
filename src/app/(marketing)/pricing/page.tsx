// Static page — pre-render at build, no streaming Suspense on client nav.

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
  title: "Pricing — Per Org. Never Per Seat.",
  description:
    "Free forever for small teams. Per-org pricing the rest of the way up. No per-seat trap. No per-scan tax.",
  path: "/pricing",
  keywords: [
    "production software pricing",
    "event management software cost",
    "ATLVS Technologies pricing",
    "ATLVS pricing",
    "GVTEWAY pricing",
    "COMPVSS pricing",
  ],
  ogImageEyebrow: "Pricing",
  ogImageTitle: "Per Org. Never Per Seat.",
});

const TIERS = [
  {
    tier: "Free",
    price: "$0",
    per: "forever",
    description: "Solo operators and side projects.",
    features: [
      "Basic projects + tasks",
      "Guest + artist portals",
      "Up to 3 users",
      "Up to 100 portal credentials per project",
      "Community support",
    ],
    cta: "Open the console",
    href: "/signup",
  },
  {
    tier: "Crew",
    price: "$49",
    per: "month per org",
    description: "Small teams shipping their first season.",
    features: [
      "Everything in Free",
      "Invoicing + expenses + budgets",
      "Advancing — 16 deliverable types",
      "Up to 10 users",
      "Up to 2,000 portal credentials per project",
      "Email support",
    ],
    cta: "14-day trial",
    href: "/signup",
  },
  {
    tier: "Production",
    price: "$199",
    per: "month per org",
    description: "Teams running multiple productions in flight.",
    features: [
      "Everything in Crew",
      "Full procurement + Stripe Connect payouts",
      "AI assistant grounded in your workspace",
      "Proposals signed in place",
      "KBYG event guides",
      "Unlimited users",
      "Priority concierge + onboarding",
    ],
    cta: "14-day trial",
    href: "/signup",
    highlight: true,
  },
  {
    tier: "Festival",
    price: "Custom",
    per: "",
    description: "Multi-org agencies, touring companies, OCOG-scale work.",
    features: [
      "Everything in Production",
      "Multi-org with SSO + custom roles",
      "SOC-2 attestation pack + signed DPA",
      "Dedicated CSM + 99.9% uptime SLA",
      "Source-available license option",
      "Custom integrations built with you",
    ],
    cta: "Talk to the studio",
    href: "/contact",
  },
];

const COMPARISON: Array<{
  category: string;
  rows: Array<{
    feature: string;
    free: boolean | string;
    crew: boolean | string;
    production: boolean | string;
    festival: boolean | string;
  }>;
}> = [
  {
    category: "Core",
    rows: [
      { feature: "Tenant walled at the database (RLS)", free: true, crew: true, production: true, festival: true },
      { feature: "Users per org", free: "3", crew: "10", production: "Unlimited", festival: "Unlimited" },
      { feature: "Projects per org", free: "1", crew: "5", production: "Unlimited", festival: "Unlimited" },
      { feature: "Webhooks + signed delivery", free: true, crew: true, production: true, festival: true },
    ],
  },
  {
    category: "ATLVS · The Console",
    rows: [
      { feature: "Projects, tasks, schedule, ROS", free: true, crew: true, production: true, festival: true },
      { feature: "RFIs · submittals · daily logs · punch", free: false, crew: true, production: true, festival: true },
      { feature: "Inspections (10 categories)", free: false, crew: true, production: true, festival: true },
      { feature: "Finance — invoices, budgets, expenses", free: false, crew: true, production: true, festival: true },
      {
        feature: "Procurement — RFQs, POs, vendor scorecards",
        free: false,
        crew: false,
        production: true,
        festival: true,
      },
      {
        feature: "Production — equipment, rentals, fab orders",
        free: false,
        crew: true,
        production: true,
        festival: true,
      },
      { feature: "People + credentials + call sheets", free: false, crew: true, production: true, festival: true },
      { feature: "Advancing — 16 deliverable types", free: false, crew: true, production: true, festival: true },
      { feature: "KBYG event guides", free: false, crew: false, production: true, festival: true },
    ],
  },
  {
    category: "GVTEWAY · The Portal",
    rows: [
      { feature: "Guest portal", free: true, crew: true, production: true, festival: true },
      { feature: "Artist portal", free: true, crew: true, production: true, festival: true },
      { feature: "Vendor portal", free: false, crew: true, production: true, festival: true },
      { feature: "Client portal + proposals", free: false, crew: false, production: true, festival: true },
      { feature: "Sponsor portal", free: false, crew: false, production: true, festival: true },
      { feature: "Crew portal", free: false, crew: true, production: true, festival: true },
      { feature: "White-label branding", free: false, crew: false, production: true, festival: true },
    ],
  },
  {
    category: "COMPVSS · The Field",
    rows: [
      { feature: "Offline gate scan", free: true, crew: true, production: true, festival: true },
      { feature: "Geo-verified shift clock-in", free: false, crew: true, production: true, festival: true },
      { feature: "Daily log + warehouse + dispatch", free: false, crew: true, production: true, festival: true },
      {
        feature: "Field intake — incidents, medical, safeguarding",
        free: false,
        crew: true,
        production: true,
        festival: true,
      },
    ],
  },
  {
    category: "AI",
    rows: [
      { feature: "Assistant grounded in your workspace", free: false, crew: false, production: true, festival: true },
      { feature: "Deep-reasoning model", free: false, crew: false, production: false, festival: true },
      {
        feature: "Drafting templates (riders, RFPs, recaps)",
        free: false,
        crew: false,
        production: true,
        festival: true,
      },
      { feature: "Monthly AI budget", free: "—", crew: "—", production: "Included", festival: "Custom" },
    ],
  },
  {
    category: "Payments",
    rows: [
      { feature: "Card + ACH invoice payments", free: false, crew: true, production: true, festival: true },
      { feature: "Stripe Connect vendor payouts", free: false, crew: false, production: true, festival: true },
      { feature: "International wire", free: false, crew: false, production: true, festival: true },
    ],
  },
  {
    category: "Security & Compliance",
    rows: [
      { feature: "Immutable audit log", free: true, crew: true, production: true, festival: true },
      { feature: "Self-expiring file shares", free: true, crew: true, production: true, festival: true },
      { feature: "Rate-limited endpoints", free: true, crew: true, production: true, festival: true },
      { feature: "Strict edge security headers", free: true, crew: true, production: true, festival: true },
      { feature: "SSO (SAML / OIDC)", free: false, crew: false, production: false, festival: true },
      { feature: "SOC-2 attestation pack", free: false, crew: false, production: false, festival: true },
      { feature: "Custom DPA", free: false, crew: false, production: false, festival: true },
      { feature: "Data residency", free: false, crew: false, production: false, festival: true },
    ],
  },
  {
    category: "Support",
    rows: [
      { feature: "Community", free: true, crew: true, production: true, festival: true },
      { feature: "Email support", free: false, crew: true, production: true, festival: true },
      { feature: "Priority + onboarding", free: false, crew: false, production: true, festival: true },
      { feature: "Dedicated CSM", free: false, crew: false, production: false, festival: true },
      { feature: "99.9% uptime SLA", free: false, crew: false, production: false, festival: true },
    ],
  },
];

const FAQS = [
  {
    q: "Is pricing per seat?",
    a: "Per org. Production is unlimited users for $199/month. Adding the crew never becomes a surprise line item.",
  },
  {
    q: "Is Free really free?",
    a: "Forever. Basic projects, guest + artist portals, three users, up to 100 portal credentials per project. No card.",
  },
  {
    q: "How does the trial work?",
    a: "Crew and Production unlock every feature in the tier for 14 days. No card up front. Don't upgrade by day 14? You drop to Free — your data stays where it is.",
  },
  {
    q: "Can I change tiers later?",
    a: "Anytime. Upgrades hit instantly. Downgrades kick in at the end of the billing period. Nothing gets deleted — features above your tier go read-only until you come back.",
  },
  {
    q: "Nonprofits and community programs?",
    a: "30% off Crew and Production for registered nonprofits and community arts programs. Email hello@atlvs.pro with your 501(c)(3) or equivalent.",
  },
  {
    q: "Is there a per-scan fee?",
    a: "No. Scan all weekend. Every weekend.",
  },
  {
    q: "What's in Festival that isn't in Production?",
    a: "Multi-org with SSO. Custom roles + access policies. SOC-2 attestation pack. Custom DPA. Dedicated CSM. 99.9% uptime SLA. Source-available license. Custom integrations we build with you.",
  },
  {
    q: "Can I self-host?",
    a: "Source-available license ships with Festival. Managed infrastructure is the recommended route — handles security, storage, and uptime.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Export everything — CSV or JSON — anytime. After cancel, your data lives 90 days read-only (re-subscribe and you're back), then purges. Signed logs of the purge on request. You own the data.",
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
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Pricing</div>
        <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Per Org. Never Per Seat.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Tenant walled at the database on every tier. Audit log immutable on every tier. The team gets bigger; the bill
          doesn&apos;t.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.tier}
              className={`surface flex flex-col p-6 ${t.highlight ? "ring-2 ring-[var(--org-primary)]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t.tier}</div>
                {t.highlight && <Badge variant="brand">Most Common</Badge>}
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Every Module, Every Tier.</h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
          The full grid. If a module you need is gated above where you are,{" "}
          <a className="text-[var(--org-primary)] underline underline-offset-2" href="/contact">
            talk to the studio
          </a>
          .
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs tracking-wider text-[var(--text-muted)] uppercase">
                <th className="py-3 pr-4 font-semibold">Module</th>
                <th className="py-3 pr-4 text-center font-semibold">Free</th>
                <th className="py-3 pr-4 text-center font-semibold">Crew</th>
                <th className="py-3 pr-4 text-center font-semibold">Production</th>
                <th className="py-3 pr-4 text-center font-semibold">Festival</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((cat) => (
                <>
                  <tr key={cat.category} className="bg-[var(--surface-inset)]">
                    <td
                      colSpan={5}
                      className="py-2 pl-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase"
                    >
                      {cat.category}
                    </td>
                  </tr>
                  {cat.rows.map((r) => (
                    <tr key={cat.category + r.feature} className="border-b border-[var(--border)]">
                      <td className="py-3 pr-4 text-sm">{r.feature}</td>
                      <td className="py-3 pr-4 text-center">
                        <Cell value={r.free} />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Cell value={r.crew} />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Cell value={r.production} />
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Cell value={r.festival} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface relative overflow-hidden p-8 md:p-10">
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
          />
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                Coming Soon
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Savings Calculator.</h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Drop in your current stack — Asana, Eventbrite, DocuSign, QuickBooks, the per-vendor PO tool — with the
                seat counts and per-event fees. The calculator returns annual savings vs. running on ATLVS, layered AI
                pricing included. Landing in Q3.
              </p>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Want an early preview tuned to your stack? Send your current line items via{" "}
                <a className="text-[var(--org-primary)] underline underline-offset-2" href="/contact">
                  contact
                </a>{" "}
                and we&apos;ll do the math for you in the meantime.
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--surface-inset)] p-6 text-center">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                Preview
              </div>
              <div className="mt-3 font-mono text-3xl font-semibold opacity-50">$ ?,???</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">annual savings vs. fragmented stack</div>
              <div className="mt-4 text-[10px] tracking-wide text-[var(--text-muted)] uppercase">
                Calculator launches Q3
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection title="Pricing FAQ" faqs={FAQS} />

      <CTASection
        title="The Console Is Open."
        subtitle="Open the console — 30 seconds, no card. Free is free, forever."
        primaryLabel="Open the console"
        primaryHref="/signup"
        secondaryLabel="Talk to the studio"
        secondaryHref="/contact"
      />
    </div>
  );
}
