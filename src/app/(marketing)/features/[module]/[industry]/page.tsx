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
import { localizeIndustry } from "@/lib/marketing/industries.i18n";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  const ind = localizeIndustry(industry, t);
  if (!mod || !ind) {
    return buildMetadata({
      title: t("marketing.features.industry.fallbackTitle", undefined, "Feature × Industry"),
      description: SITE.description,
      path: `/features/${module}/${industry}`,
    });
  }
  return buildMetadata({
    title: t(
      "marketing.features.industry.meta.title",
      { module: mod.name, industry: ind.name, sub: mod.title },
      "{module} for {industry} — {sub}",
    ),
    description: t(
      "marketing.features.industry.meta.description",
      { blurb: mod.blurb, industry: ind.name.toLowerCase(), tagline: ind.tagline.toLowerCase() },
      "{blurb} Built for {industry} teams running {tagline}.",
    ),
    path: `/features/${mod.slug}/${industry}`,
    keywords: [
      ...(mod.keywords ?? []),
      `${ind.name.toLowerCase()} ${mod.name.toLowerCase()}`,
      `${mod.name.toLowerCase()} for ${ind.name.toLowerCase()}`,
    ],
    ogImageEyebrow: `${mod.name} · ${ind.name}`,
    ogImageTitle: t(
      "marketing.features.industry.ogTitle",
      { module: mod.name, industry: ind.name },
      "{module} for {industry}",
    ),
  });
}

function buildUseCases(
  mod: ModuleConfig,
  ind: IndustryConfig,
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): string[] {
  const top = mod.highlights.slice(0, 4);
  return top.map((h) =>
    t(
      "marketing.features.industry.useCase",
      { title: h.title, body: h.body, industry: ind.name.toLowerCase(), tagline: ind.tagline.toLowerCase() },
      "{title} — {body} On {industry} jobs, this shows up as {tagline}.",
    ),
  );
}

export default async function FeatureIndustryPage({ params }: { params: Promise<Params> }) {
  const { module, industry } = await params;
  const mod = MODULES[module];
  const { t } = await getRequestT();
  const ind = localizeIndustry(industry, t);
  if (!mod || !ind) notFound();

  const path = `/features/${mod.slug}/${industry}`;
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.features.crumbsLabel", undefined, "Features"), href: "/features" },
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
    .slice(0, 7)
    .map(([slug, sib]) => [slug, localizeIndustry(slug, t) ?? sib] as const);

  const useCases = buildUseCases(mod, ind, t);

  return (
    <div>
      <JsonLd
        data={[
          softwareApplicationSchema({
            name: `ATLVS Technologies · ${mod.name} for ${ind.name}`,
            description: `${mod.blurb} Built for ${ind.name.toLowerCase()} teams.`,
            url: `${SITE.baseUrl}${path}`,
          }),
          breadcrumbSchema(crumbs),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {mod.name} · {ind.name}
        </div>
        <h1 className="hed-2xl mt-4">
          {mod.name} for {ind.name}.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
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
        <div className="eyebrow eyebrow-brand">
          {t("marketing.features.industry.howItShowsUp", undefined, "How It Shows Up")}
        </div>
        <h2 className="hed-xl mt-4">
          {t(
            "marketing.features.industry.teamsRunOn",
            { industry: ind.name, module: mod.name },
            "What {industry} Teams Run On {module}.",
          )}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {useCases.map((uc) => (
            <div key={uc} className="surface p-6">
              <p className="text-sm text-[var(--p-text-2)]">{uc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="eyebrow eyebrow-brand">
                {t("marketing.features.industry.industryOutcomes", undefined, "Industry Outcomes")}
              </div>
              <h2 className="hed-lg mt-3">
                {t(
                  "marketing.features.industry.whatChanges",
                  { industry: ind.name },
                  "What Changes For {industry} Operators.",
                )}
              </h2>
              <p className="mt-3 text-sm text-[var(--p-text-2)]">{ind.description}</p>
            </div>
            <ul className="space-y-3 text-sm">
              {ind.outcomes.slice(0, 6).map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <span className="ps-dot ps-dot ps-dot--ok mt-2" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">
          {t("marketing.features.industry.featureSet", { module: mod.name }, "The {module} Feature Set.")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.features.industry.featureSetSub",
            { module: mod.name, industry: ind.name.toLowerCase() },
            "The same primitives that ship in our {module} module, applied to {industry} workflows.",
          )}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mod.highlights.map((h) => (
            <div key={h.title} className="surface p-5">
              <div className="text-sm font-semibold">{h.title}</div>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CTASection
        title={t(
          "marketing.features.industry.cta.runTitle",
          { module: mod.name, industry: ind.name },
          "Run {module} On {industry} Production.",
        )}
        subtitle={t(
          "marketing.features.industry.cta.runSubtitle",
          undefined,
          "Sign up free for small teams. Per-org pricing the rest of the way up.",
        )}
      />

      <FAQSection
        title={t(
          "marketing.features.industry.faqTitle",
          { module: mod.name, industry: ind.name },
          "{module} for {industry} · FAQ",
        )}
        faqs={faqs}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">
          {t("marketing.features.industry.otherModules", { industry: ind.name }, "Other Modules For {industry}.")}
        </h2>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.features.industry.oneDatabase",
            undefined,
            "One database. Every module reads from the same record.",
          )}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {siblingModules.map((sib) => (
            <Link
              key={sib.slug}
              href={`/features/${sib.slug}/${industry}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{sib.name}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">
          {t("marketing.features.industry.otherIndustries", { module: mod.name }, "{module} For Other Industries.")}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {siblingIndustries.map(([slug, sib]) => (
            <Link
              key={slug}
              href={`/features/${mod.slug}/${slug}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{sib.name}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
            </Link>
          ))}
        </div>
      </section>

      <CTASection
        title={t("marketing.features.detail.cta.openTitle", undefined, "ATLVS Is Open.")}
        subtitle={t(
          "marketing.features.detail.cta.openSubtitle",
          undefined,
          "Free, forever, for small teams. Per-org pricing the rest of the way up.",
        )}
      />
    </div>
  );
}
