/**
 * Programmatic /features/{module}/{industry} farm.
 *
 * Every {module × industry} combination resolves to a contextualized page
 * that pulls the canonical feature config from `MODULES` and the industry
 * framing from `INDUSTRIES` — emitting ~160 indexable pages (20 modules ×
 * 8 industries) from a single template.
 *
 * Each page is distinct enough to clear thin-content filters: the hero is
 * cross-contextualized, the use-case block reframes feature highlights
 * with industry vocabulary, and FAQs merge both source lists. Hand-written
 * overrides can land in `INDUSTRY_MODULE_OVERRIDES` for the highest-traffic
 * combinations.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, softwareApplicationSchema, breadcrumbSchema, faqSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { MODULES, type ModuleConfig } from "@/lib/marketing/modules";
import { INDUSTRIES, type IndustryConfig } from "@/lib/marketing/industries";

type Params = { module: string; industry: string };

export function generateStaticParams(): Params[] {
  const params: Params[] = [];
  for (const moduleSlug of Object.keys(MODULES)) {
    for (const industrySlug of Object.keys(INDUSTRIES)) {
      params.push({ module: moduleSlug, industry: industrySlug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { module, industry } = await params;
  const mod = MODULES[module];
  const ind = INDUSTRIES[industry];
  if (!mod || !ind) {
    return buildMetadata({
      title: "Feature × Industry",
      description: SITE.description,
      path: `/features/${module}/${industry}`,
    });
  }
  return buildMetadata({
    title: `${mod.name} for ${ind.name} — ${mod.title}`,
    description: `${mod.blurb} Built for ${ind.name.toLowerCase()} teams running ${ind.tagline.toLowerCase()}.`,
    path: `/features/${mod.slug}/${industry}`,
    keywords: [
      ...(mod.keywords ?? []),
      `${ind.name.toLowerCase()} ${mod.name.toLowerCase()}`,
      `${mod.name.toLowerCase()} for ${ind.name.toLowerCase()}`,
    ],
    ogImageEyebrow: `${mod.name} · ${ind.name}`,
    ogImageTitle: `${mod.name} for ${ind.name}`,
  });
}

function buildUseCases(mod: ModuleConfig, ind: IndustryConfig): string[] {
  const top = mod.highlights.slice(0, 4);
  return top.map(
    (h) => `${h.title} — ${h.body} On ${ind.name.toLowerCase()} jobs, this shows up as ${ind.tagline.toLowerCase()}.`,
  );
}

export default async function FeatureIndustryPage({ params }: { params: Promise<Params> }) {
  const { module, industry } = await params;
  const mod = MODULES[module];
  const ind = INDUSTRIES[industry];
  if (!mod || !ind) notFound();

  const path = `/features/${mod.slug}/${industry}`;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: mod.name, href: `/features/${mod.slug}` },
    { label: ind.name, href: path },
  ];

  // Merge FAQ pools — top 2 module-specific + top 3 industry-specific —
  // and emit FAQPage schema across the combined set. Combination keeps
  // each generated page above ~5 Q&As without re-asking the same things.
  const faqs = [...mod.faqs.slice(0, 2), ...ind.faqs.slice(0, 3)];

  // Sibling links — same industry, other modules. PageRank-distributes
  // across the entire feature × industry farm.
  const siblingModules = Object.values(MODULES)
    .filter((m) => m.slug !== mod.slug)
    .slice(0, 11);

  // Sibling links — same module, other industries. Cross-pollinates the
  // other direction of the farm.
  const siblingIndustries = Object.entries(INDUSTRIES)
    .filter(([slug]) => slug !== industry)
    .slice(0, 7);

  const useCases = buildUseCases(mod, ind);

  return (
    <div>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: `ATLVS Technologies — ${mod.name} for ${ind.name}`,
            description: `${mod.blurb} Built for ${ind.name.toLowerCase()} teams.`,
            url: `${SITE.baseUrl}${path}`,
          }),
          breadcrumbSchema(crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          {mod.name} · {ind.name}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          {mod.name} for {ind.name}.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          {mod.blurb} {ind.hero.body}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
          How It Shows Up
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          What {ind.name} Teams Run On {mod.name}.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {useCases.map((uc) => (
            <div key={uc} className="surface p-6">
              <p className="text-sm text-[var(--text-secondary)]">{uc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                Industry Outcomes
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">What Changes For {ind.name} Operators.</h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{ind.description}</p>
            </div>
            <ul className="space-y-3 text-sm">
              {ind.outcomes.slice(0, 6).map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <span className="status-dot status-dot-success mt-2" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">The {mod.name} Feature Set.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          The same primitives that ship in our {mod.name} module — applied to {ind.name.toLowerCase()} workflows.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mod.highlights.map((h) => (
            <div key={h.title} className="surface p-5">
              <div className="text-sm font-semibold">{h.title}</div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        title={`Run ${mod.name} On ${ind.name} Production.`}
        subtitle="Open the console free for small teams. Per-org pricing the rest of the way up."
      />

      <FAQSection title={`${mod.name} for ${ind.name} · FAQ`} faqs={faqs} />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Other Modules For {ind.name}.</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          One database. Every module reads from the same record.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {siblingModules.map((sib) => (
            <Link
              key={sib.slug}
              href={`/features/${sib.slug}/${industry}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{sib.name}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--text-muted)]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">{mod.name} For Other Industries.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {siblingIndustries.map(([slug, sib]) => (
            <Link
              key={slug}
              href={`/features/${mod.slug}/${slug}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{sib.name}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--text-muted)]" />
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title="The Console Is Open."
        subtitle="Free, forever, for small teams. Per-org pricing the rest of the way up."
      />
    </div>
  );
}
