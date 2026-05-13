import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { TEMPLATES, TEMPLATES_BY_SLUG } from "@/lib/marketing/templates";
import { MODULES } from "@/lib/marketing/modules";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TEMPLATES_BY_SLUG[slug];
  if (!t) return buildMetadata({ title: "Template", description: SITE.description, path: `/templates/${slug}` });
  return buildMetadata({
    title: `${t.title} — Production Template`,
    description: t.short,
    path: `/templates/${t.slug}`,
    keywords: [t.title.toLowerCase(), `${t.title.toLowerCase()} template`],
    ogImageEyebrow: "Template",
    ogImageTitle: t.title,
  });
}

export default async function TemplateDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TEMPLATES_BY_SLUG[slug];
  if (!t) notFound();

  const module = MODULES[t.module];
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Templates", href: "/templates" },
    { label: t.title, href: `/templates/${t.slug}` },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          Template · {t.category}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">{t.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{t.long}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`${CANONICAL_CTAS.primary.href}?template=${t.slug}`}>Open This Template</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight">What's In It.</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {t.whatsInIt.map((line) => (
            <li key={line} className="surface p-4 text-sm">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-6">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">Best For</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.bestFor.map((p) => (
              <span
                key={p}
                className="rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] px-3 py-1.5 text-xs font-medium"
              >
                {p}
              </span>
            ))}
          </div>
          {module ? (
            <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-sm">
              <span className="text-[var(--text-muted)]">Lives in: </span>
              <Link href={`/features/${module.slug}`} className="font-medium text-[var(--org-primary)]">
                {module.name} →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <CTASection
        title="The Console Is Open."
        subtitle="Open this template — and the other 47 modules — free for small teams."
      />
    </div>
  );
}
