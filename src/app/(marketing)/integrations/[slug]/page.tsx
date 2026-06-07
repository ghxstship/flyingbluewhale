import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, faqSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { INTEGRATIONS, INTEGRATIONS_BY_SLUG } from "@/lib/marketing/integrations";
import { MODULES } from "@/lib/marketing/modules";

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = INTEGRATIONS_BY_SLUG[slug];
  if (!i) return buildMetadata({ title: "Integrations", description: SITE.description, path: `/integrations/${slug}` });
  return buildMetadata({
    title: `${i.name} Integration — ${i.short}`,
    description: i.short,
    path: `/integrations/${i.slug}`,
    keywords: [
      `${i.name.toLowerCase()} integration`,
      `${i.name.toLowerCase()} ATLVS`,
      `${i.name.toLowerCase()} event production`,
    ],
    ogImageEyebrow: "Integration",
    ogImageTitle: i.name,
  });
}

export default async function IntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = INTEGRATIONS_BY_SLUG[slug];
  if (!i) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Integrations", href: "/integrations" },
    { label: i.name, href: `/integrations/${i.slug}` },
  ];

  const sibling = INTEGRATIONS.filter((o) => o.slug !== i.slug).slice(0, 8);

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(i.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Integration · {i.category}</div>
        <h1 className="hed-2xl mt-4">{i.name}.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{i.long}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">What It Does.</h2>
        <ul className="mt-6 space-y-3 text-sm">
          {i.capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="ps-dot ps-dot ps-dot--ok mt-2" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-6">
          <div className="eyebrow">Technical Anchor</div>
          <p className="mt-3 font-mono text-xs leading-relaxed text-[var(--p-text-2)]">{i.technicalAnchor}</p>
        </div>
      </section>

      {i.modules.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-lg">Modules That Depend On It.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {i.modules
              .map((m) => MODULES[m])
              .filter((m): m is NonNullable<typeof m> => Boolean(m))
              .map((m) => (
                <Link
                  key={m.slug}
                  href={`/features/${m.slug}`}
                  className="surface hover-lift group flex items-center justify-between p-4 text-sm"
                >
                  <span className="font-medium">{m.name}</span>
                  <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      {i.faqs.length > 0 ? <FAQSection title={`${i.name} · FAQ`} faqs={i.faqs} /> : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">Other Integrations.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sibling.map((s) => (
            <Link
              key={s.slug}
              href={`/integrations/${s.slug}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{s.name}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
            </Link>
          ))}
        </div>
      </section>

      <CTASection title="ATLVS Is Open." subtitle="Free for small teams. All integrations included." />
    </div>
  );
}
