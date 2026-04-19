import type { Metadata } from "next";
import { Check, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/marketing/Breadcrumb";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing — Access, Core, Professional, Enterprise",
  description:
    "Transparent pricing for flyingbluewhale. Start free for life with the Access tier. Scale to Core ($49/mo), Professional ($199/mo), or Enterprise. Every tier includes RLS-backed org scoping and the REST API.",
  path: "/pricing",
  keywords: ["production software pricing", "event management software cost", "flyingbluewhale pricing", "stakeholder portal pricing"],
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
      "Full procurement + Stripe Connect",
      "AI assistant (Sonnet 4.6)",
      "Interactive proposals",
      "Event guides CMS",
      "Unlimited users",
      "Priority support + onboarding",
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
      "SSO (SAML) + SCIM provisioning",
      "Claude Opus 4.7",
      "Custom RLS policies + roles",
      "SOC-2 attestation package",
      "Dedicated CSM + 99.9% SLA",
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
      { feature: "RLS-backed multi-tenant isolation", access: true, core: true, pro: true, ent: true },
      { feature: "Users per org", access: "3", core: "10", pro: "Unlimited", ent: "Unlimited" },
      { feature: "Projects per org", access: "1", core: "5", pro: "Unlimited", ent: "Unlimited" },
      { feature: "REST API + webhooks", access: true, core: true, pro: true, ent: true },
    ],
  },
  {
    category: "ATLVS console",
    rows: [
      { feature: "Overview + Projects", access: true, core: true, pro: true, ent: true },
      { feature: "Finance (invoices, budgets, expenses)", access: false, core: true, pro: true, ent: true },
      { feature: "Procurement (POs, vendors)", access: false, core: false, pro: true, ent: true },
      { feature: "Production (equipment, rentals)", access: false, core: true, pro: true, ent: true },
      { feature: "People + credentials", access: false, core: true, pro: true, ent: true },
      { feature: "Advancing (16 deliverable types)", access: false, core: true, pro: true, ent: true },
      { feature: "CMS + event guides", access: false, core: false, pro: true, ent: true },
    ],
  },
  {
    category: "GVTEWAY portals",
    rows: [
      { feature: "Guest portal", access: true, core: true, pro: true, ent: true },
      { feature: "Artist portal", access: true, core: true, pro: true, ent: true },
      { feature: "Vendor portal", access: false, core: true, pro: true, ent: true },
      { feature: "Client portal + proposals", access: false, core: false, pro: true, ent: true },
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
      { feature: "AI assistant (Claude Sonnet 4.6)", access: false, core: false, pro: true, ent: true },
      { feature: "Claude Opus 4.7", access: false, core: false, pro: false, ent: true },
      { feature: "Drafting templates", access: false, core: false, pro: true, ent: true },
      { feature: "Token budget", access: "—", core: "—", pro: "200K / mo", ent: "Custom" },
    ],
  },
  {
    category: "Integrations",
    rows: [
      { feature: "Stripe Checkout", access: false, core: true, pro: true, ent: true },
      { feature: "Stripe Connect Express (vendor payouts)", access: false, core: false, pro: true, ent: true },
      { feature: "Webhooks (HMAC-SHA256)", access: true, core: true, pro: true, ent: true },
      { feature: "SSO (SAML)", access: false, core: false, pro: false, ent: true },
      { feature: "SCIM 2.0 provisioning", access: false, core: false, pro: false, ent: true },
    ],
  },
  {
    category: "Security & compliance",
    rows: [
      { feature: "Audit log (jsonb before/after)", access: true, core: true, pro: true, ent: true },
      { feature: "Signed-URL file delivery", access: true, core: true, pro: true, ent: true },
      { feature: "Rate-limited endpoints", access: true, core: true, pro: true, ent: true },
      { feature: "CSP + CORS + HSTS", access: true, core: true, pro: true, ent: true },
      { feature: "SOC-2 attestation package", access: false, core: false, pro: false, ent: true },
      { feature: "Data residency selection", access: false, core: false, pro: false, ent: true },
    ],
  },
  {
    category: "Support",
    rows: [
      { feature: "Community", access: true, core: true, pro: true, ent: true },
      { feature: "Email support", access: false, core: true, pro: true, ent: true },
      { feature: "Priority + onboarding", access: false, core: false, pro: true, ent: true },
      { feature: "Dedicated CSM", access: false, core: false, pro: false, ent: true },
      { feature: "99.9% uptime SLA", access: false, core: false, pro: false, ent: true },
    ],
  },
];

const FAQS = [
  {
    q: "Do I have to pay per user?",
    a: "No. flyingbluewhale charges per org, not per seat. Professional is unlimited users for $199/month. You'll never get surprised by your own team getting more productive.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. The Access tier is free forever: basic projects, guest + artist portals, up to 3 users, and up to 100 tickets per event. No credit card required.",
  },
  {
    q: "How does the 14-day trial work?",
    a: "Core and Professional come with a 14-day free trial of every feature in the tier. No credit card up front. If you don't upgrade by day 14, you drop back to the free Access tier — your data stays.",
  },
  {
    q: "Can I switch plans later?",
    a: "Any time. Upgrade is instant. Downgrade takes effect at the end of the current billing period. Nothing is ever deleted on downgrade — features above your tier just become read-only or disabled.",
  },
  {
    q: "What about nonprofits and festivals?",
    a: "We offer 30% off Core and Professional for registered nonprofits and community arts festivals. Email hello@flyingbluewhale.app with your 501(c)(3) or equivalent.",
  },
  {
    q: "Do you charge per ticket scanned?",
    a: "No. Scans are included. Some competitors charge per-scan fees that spike on festival weekends. We think that's hostile pricing. Scan as many tickets as your event requires.",
  },
  {
    q: "What does the Enterprise tier include that Professional doesn't?",
    a: "SSO (SAML), SCIM provisioning, Claude Opus 4.7, custom RLS policies for bespoke roles, a formal SOC-2 attestation package, a dedicated customer success manager, a 99.9% uptime SLA, and custom integrations. Contact sales for a quote.",
  },
  {
    q: "How is this priced compared to Asana / Monday / Notion + point tools?",
    a: "Stacking Asana + a portal product + an AI add-on + a ticketing platform + finance glue typically runs $500–$2000/month for a 10-person team. Professional is $199/month unlimited users and covers all of it natively. See /compare for detailed breakdowns.",
  },
  {
    q: "Can I self-host?",
    a: "Self-host is available on Enterprise with a source-available license. It's not our recommended deployment — our managed infrastructure handles RLS, Storage, edge runtime, and Supabase for you. Contact sales if you need on-prem.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export all your data to CSV + JSON any time from within the console. After cancellation your data is retained for 30 days (re-subscribe and it's back) and then purged. Signed logs of the purge are available on request.",
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
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(FAQS)]} />
      <Breadcrumbs crumbs={crumbs} />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Pricing</div>
        <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Start Free. Scale When You Need to. Per Org, Not Per Seat.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Every tier includes RLS-backed org scoping, Supabase-native auth, the REST API, and an audit log. Upgrade any
          time. No per-seat fees. No per-scan fees. No charge for your team getting bigger.
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
        title="Ship the next show on flyingbluewhale"
        subtitle="Start free in under two minutes. No credit card. No forced sales call."
      />
    </div>
  );
}
