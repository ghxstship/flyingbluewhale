import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema, definedTermSchema, SITE } from "@/lib/seo";
import { GLOSSARY, GLOSSARY_BY_SLUG } from "@/lib/marketing/glossary";
import { MODULES } from "@/lib/marketing/modules";

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = GLOSSARY_BY_SLUG[slug];
  if (!t) return buildMetadata({ title: "Glossary", description: SITE.description, path: `/glossary/${slug}` });
  return buildMetadata({
    title: `${t.term} — Definition`,
    description: t.short,
    path: `/glossary/${t.slug}`,
    keywords: [
      t.term.toLowerCase(),
      `what is ${t.term.toLowerCase()}`,
      `${t.term.toLowerCase()} definition`,
      ...(t.aka ?? []),
    ],
    ogImageEyebrow: "Glossary",
    ogImageTitle: t.term,
  });
}

export default async function GlossaryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = GLOSSARY_BY_SLUG[slug];
  if (!t) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Glossary", href: "/glossary" },
    { label: t.term, href: `/glossary/${t.slug}` },
  ];

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          definedTermSchema({
            name: t.term,
            description: t.long,
            url: `${SITE.baseUrl}/glossary/${t.slug}`,
            inDefinedTermSet: `${SITE.baseUrl}/glossary`,
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <article className="mx-auto max-w-3xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Glossary · {t.category.replace(/-/g, " ")}</div>
        <h1 className="hed-2xl mt-4">{t.term}</h1>
        {t.aka && t.aka.length > 0 ? (
          <p className="mt-3 text-sm text-[var(--p-text-2)]">Also: {t.aka.join(", ")}</p>
        ) : null}
        <p className="mt-6 text-lg leading-relaxed text-[var(--p-text-2)]">{t.long}</p>
      </article>

      {t.modules && t.modules.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 py-8">
          <div className="surface p-6">
            <div className="eyebrow eyebrow-brand">How ATLVS Handles This</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {t.modules
                .map((m) => MODULES[m])
                .filter((m): m is NonNullable<typeof m> => Boolean(m))
                .map((m) => (
                  <Link
                    key={m.slug}
                    href={`/features/${m.slug}`}
                    className="rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
                  >
                    {m.name} →
                  </Link>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {t.related.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 py-8">
          <h2 className="eyebrow">Related terms</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {t.related
              .map((r) => GLOSSARY_BY_SLUG[r])
              .filter((r): r is NonNullable<typeof r> => Boolean(r))
              .map((r) => (
                <Link
                  key={r.slug}
                  href={`/glossary/${r.slug}`}
                  className="surface hover-lift flex items-center justify-between p-3 text-sm"
                >
                  <span>{r.term}</span>
                  <ArrowRight size={12} className="cta-nudge text-[var(--p-text-2)]" />
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free forever for small teams. Per-org pricing the rest of the way up."
      />
    </div>
  );
}
