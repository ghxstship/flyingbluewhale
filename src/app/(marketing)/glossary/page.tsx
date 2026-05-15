import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryTerm } from "@/lib/marketing/glossary";

export const metadata: Metadata = buildMetadata({
  title: "Glossary — The Vocabulary of Live Production",
  description:
    "Definitions of the terms live-event operators use every day — advancing, ROS, KBYG, riders, credentials, OSHA logs, settlements.",
  path: "/glossary",
  keywords: [
    "event production glossary",
    "live event terminology",
    "production vocabulary",
    "what is advancing",
    "what is ROS",
    "what is KBYG",
  ],
  ogImageEyebrow: "Glossary",
  ogImageTitle: "Live Production Vocabulary.",
});

export default function GlossaryIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Glossary", href: "/glossary" },
  ];

  const byCategory = new Map<GlossaryTerm["category"], GlossaryTerm[]>();
  for (const term of GLOSSARY) {
    const list = byCategory.get(term.category) ?? [];
    list.push(term);
    byCategory.set(term.category, list);
  }

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "ATLVS Live Production Glossary",
            hasDefinedTerm: GLOSSARY.map((t) => ({
              "@type": "DefinedTerm",
              name: t.term,
              description: t.short,
              url: `/glossary/${t.slug}`,
            })),
          },
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Glossary</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          The Vocabulary Of Live Production.
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          The terms operators use to run shows — explained the way operators use them. No academic gloss. No marketing
          redirect. Just the words and what they mean on the gig.
        </p>
      </section>

      {GLOSSARY_CATEGORIES.filter((cat) => byCategory.has(cat.slug)).map((cat) => (
        <section key={cat.slug} className="mx-auto max-w-6xl px-6 py-8">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">{cat.label}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {(byCategory.get(cat.slug) ?? []).map((t) => (
              <Link key={t.slug} href={`/glossary/${t.slug}`} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{t.term}</div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.short}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <CTASection
        title="ATLVS Is Open."
        subtitle="Free, forever, for small teams. Per-org pricing the rest of the way up."
      />
    </div>
  );
}
