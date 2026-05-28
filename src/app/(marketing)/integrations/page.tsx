import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { INTEGRATIONS, INTEGRATION_CATEGORIES, type Integration } from "@/lib/marketing/integrations";

export const metadata: Metadata = buildMetadata({
  title: "Integrations — Stripe, Anthropic, Supabase, Twilio, Resend, Calendar, OAuth, Webhooks",
  description:
    "The integrations wired in code today — payments, AI, infrastructure, comms, auth, calendar, geo, observability. No coming-soon list; every entry is in production.",
  path: "/integrations",
  keywords: [
    "event production integrations",
    "Stripe Connect event payouts",
    "Anthropic Claude integration",
    "Supabase event platform",
    "production webhooks API",
  ],
  ogImageEyebrow: "Integrations",
  ogImageTitle: "Wired In Code, Not On A Slide.",
});

export default function IntegrationsIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Integrations", href: "/integrations" },
  ];

  const byCategory = new Map<Integration["category"], Integration[]>();
  for (const i of INTEGRATIONS) {
    const list = byCategory.get(i.category) ?? [];
    list.push(i);
    byCategory.set(i.category, list);
  }

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Integrations</div>
        <h1 className="hed-3xl mt-4">Wired In Code, Not On A Slide.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          The integrations below ship live in production. No coming-soon list, no aspirational entries. Each page links
          to the technical anchor in the codebase so you can audit before you switch.
        </p>
      </section>

      {INTEGRATION_CATEGORIES.filter((cat) => byCategory.has(cat.slug)).map((cat) => (
        <section key={cat.slug} className="mx-auto max-w-6xl px-6 py-8">
          <div className="eyebrow eyebrow-brand">{cat.label}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {(byCategory.get(cat.slug) ?? []).map((i) => (
              <Link key={i.slug} href={`/integrations/${i.slug}`} className="surface hover-lift p-5">
                <div className="text-sm font-semibold">{i.name}</div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">{i.short}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--org-primary)]">
                  How it's wired <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="surface flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow eyebrow-brand">Partner Program</div>
            <h3 className="mt-2 text-lg font-semibold">Build your own integration.</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Open API surface (REST + GraphQL). Verified Partner + Certified tiers. No revenue share, no gatekeeping.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/integrations/partners"
              className="rounded-md border border-[var(--border-color)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-raised)]"
            >
              Partner directory
            </Link>
            <Link href="/integrations/submit" className="btn btn-primary text-sm press-scale">
              Submit a proposal
            </Link>
          </div>
        </div>
      </section>

      <CTASection title="ATLVS Is Open." subtitle="Free for small teams. All integrations included on every tier." />
    </div>
  );
}
