import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { PUBLISHED_CUSTOMER_STORIES, IN_PROGRESS_CUSTOMER_STORIES } from "@/lib/marketing/customers";
import { INDUSTRIES } from "@/lib/marketing/industries";

export const metadata: Metadata = buildMetadata({
  title: "Customers — Production Teams Running On ATLVS",
  description:
    "Real production teams running on ATLVS — festivals, touring, fabrication, immersive, brand activations, broadcast. Case studies landing through Q4.",
  path: "/customers",
  keywords: [
    "ATLVS customer stories",
    "production software case studies",
    "event platform customers",
    "festival software customers",
  ],
  ogImageEyebrow: "Customers",
  ogImageTitle: "Production Teams Running On ATLVS.",
});

export default function CustomersHub() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Customers", href: "/customers" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Customers</div>
        <h1 className="hed-2xl mt-3">
          Production Teams Running On ATLVS.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          Six launch-partner case studies are landing through Q4. Anonymized teasers + hard metrics below; the full
          stories drop on the published date. For an under-NDA preview tailored to your event shape, book a brief.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.secondary.href}>Book a brief</Button>
          <Button href={CANONICAL_CTAS.primary.href} variant="secondary">
            {CANONICAL_CTAS.primary.label}
          </Button>
        </div>
      </section>

      {PUBLISHED_CUSTOMER_STORIES.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-lg">Published.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PUBLISHED_CUSTOMER_STORIES.map((s) => (
              <Link key={s.slug} href={`/customers/${s.slug}`} className="surface hover-lift p-5">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                  {INDUSTRIES[s.industry]?.name ?? s.industry}
                </div>
                <h3 className="mt-2 text-base font-semibold">{s.displayName}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.teaser}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="hed-lg">Landing Soon.</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {IN_PROGRESS_CUSTOMER_STORIES.length} stories in production
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Anonymized for NDA. Hard metrics already captured; the full narrative + permission-cleared logo + PDF publish
          on the date below.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-2">
          {IN_PROGRESS_CUSTOMER_STORIES.map((s) => (
            <article key={s.slug} className="surface p-6">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                  {INDUSTRIES[s.industry]?.name ?? s.industry}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                  <Clock size={10} aria-hidden="true" />
                  {s.expectedPublish}
                </div>
              </div>
              <h3 className="mt-2 text-base font-semibold">{s.displayName}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.teaser}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--border-color)] pt-4">
                {s.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase">{m.label}</dt>
                    <dd className="mt-1 font-mono text-base font-semibold">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <CTASection
        title="Want To Be Profiled?"
        subtitle="Send a one-paragraph note about your upcoming event window and we'll talk about a partnership."
        primaryLabel="Book a brief"
        primaryHref={CANONICAL_CTAS.secondary.href}
        secondaryLabel={CANONICAL_CTAS.primary.label}
        secondaryHref={CANONICAL_CTAS.primary.href}
      />
    </div>
  );
}
