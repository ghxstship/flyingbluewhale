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
import { TEAMS } from "@/lib/marketing/teams";
import { localizeTeam } from "@/lib/marketing/teams.i18n";
import { MODULES } from "@/lib/marketing/modules";
import { localizeIndustry } from "@/lib/marketing/industries.i18n";
import { getRequestT } from "@/lib/i18n/request";

export function generateStaticParams() {
  return TEAMS.map((cfg) => ({ role: cfg.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const { t } = await getRequestT();
  const cfg = localizeTeam(role, t);
  if (!cfg) {
    return buildMetadata({
      title: t("marketing.teams.detail.fallbackTitle", undefined, "Teams"),
      description: SITE.description,
      path: `/teams/${role}`,
    });
  }
  return buildMetadata({
    title: t("marketing.teams.detail.meta.title", { role: cfg.role, hero: cfg.hero.title }, "{role} — {hero}"),
    description: cfg.blurb,
    path: `/teams/${cfg.slug}`,
    keywords: [
      `${cfg.role.toLowerCase()} software`,
      `software for ${cfg.role.toLowerCase()}`,
      `${cfg.role.toLowerCase()} platform`,
      `production software for ${cfg.role.toLowerCase()}`,
    ],
    ogImageEyebrow: cfg.hero.eyebrow,
    ogImageTitle: cfg.role,
  });
}

export default async function TeamRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const { t } = await getRequestT();
  const cfg = localizeTeam(role, t);
  if (!cfg) notFound();

  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.teams.crumbsLabel", undefined, "Built For"), href: "/teams" },
    { label: cfg.role, href: `/teams/${cfg.slug}` },
  ];

  const sibling = TEAMS.filter((o) => o.slug !== cfg.slug).map((o) => localizeTeam(o.slug, t) ?? o);

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(cfg.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{cfg.hero.eyebrow}</div>
        <h1 className="hed-2xl mt-4">{cfg.hero.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{cfg.hero.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">
          {t("marketing.teams.detail.workflows", { role: cfg.role }, "What {role} Run Day-To-Day.")}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cfg.workflows.map((w) => (
            <div key={w.title} className="surface p-6">
              <div className="text-sm font-semibold">{w.title}</div>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {cfg.painPoints.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="surface p-8 md:p-10">
            <div className="eyebrow eyebrow-brand">{t("marketing.teams.detail.familiar", undefined, "Familiar?")}</div>
            <h2 className="hed-lg mt-3">
              {t("marketing.teams.detail.painHeading", undefined, "The Pain You're Working Around.")}
            </h2>
            <ul className="mt-6 space-y-3 text-sm">
              {cfg.painPoints.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="ps-dot ps-dot ps-dot--danger mt-2" />
                  <span className="text-[var(--p-text-2)]">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.teams.detail.modulesYouLive", undefined, "Modules You Live In.")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {cfg.modules
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

      {cfg.industries.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="hed-lg">
            {t("marketing.teams.detail.industriesYouWork", undefined, "Industries You Work In.")}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {cfg.industries
              .map((s) => ({ slug: s, info: localizeIndustry(s, t) }))
              .filter((x): x is { slug: string; info: NonNullable<ReturnType<typeof localizeIndustry>> } =>
                Boolean(x.info),
              )
              .map((x) => (
                <Link
                  key={x.slug}
                  href={`/solutions/${x.slug}`}
                  className="surface hover-lift group flex items-center justify-between p-4 text-sm"
                >
                  <span className="font-medium">{x.info.name}</span>
                  <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      {cfg.faqs.length > 0 ? (
        <FAQSection title={t("marketing.teams.detail.faqTitle", { role: cfg.role }, "{role} · FAQ")} faqs={cfg.faqs} />
      ) : null}

      <CTASection
        title={t("marketing.teams.detail.cta.runTitle", { role: cfg.role }, "Run {role}' Workflow On ATLVS.")}
        subtitle={t(
          "marketing.teams.detail.cta.runSubtitle",
          undefined,
          "Free for small teams. Per-org pricing the rest of the way up.",
        )}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.teams.detail.otherRoles", undefined, "Other Roles.")}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sibling.map((s) => (
            <Link
              key={s.slug}
              href={`/teams/${s.slug}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{s.role}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--p-text-2)]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
