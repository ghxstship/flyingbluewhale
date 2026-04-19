import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { CUSTOMER_LIST } from "@/lib/customers";

export const metadata: Metadata = buildMetadata({
  title: "Customers — teams running on flyingbluewhale",
  description:
    "Case studies from festivals, touring agencies, and corporate event shops running their production operations on flyingbluewhale. Real numbers, real workflows.",
  path: "/customers",
  keywords: ["production software case studies", "event production customers", "flyingbluewhale customers"],
  ogImageEyebrow: "Customers",
  ogImageTitle: "Teams running on flyingbluewhale.",
});

export default function CustomersPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Customers", href: "/customers" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Customers</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Teams Running on Flyingbluewhale.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Real production orgs, real numbers, real workflows. Every case study covers what they were running before,
          what they changed, and what measurably improved.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CUSTOMER_LIST.map((c) => (
            <Link key={c.slug} href={`/customers/${c.slug}`} className="surface-raised hover-lift flex flex-col p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{c.industry}</div>
              <div className="mt-3 text-lg font-semibold">{c.name}</div>
              <div className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">{c.blurb}</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {c.stats.slice(0, 2).map((s) => (
                  <div key={s.label} className="surface-inset p-3">
                    <div className="text-xl font-semibold tracking-tight text-[var(--org-primary)]">{s.value}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{s.label}</div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="Be the next case study" subtitle="Start free. Let's ship your next show together." />
    </div>
  );
}
