import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { TEAMS } from "@/lib/marketing/teams";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.teams.meta.title"),
    description: t("marketing.pages.teams.meta.description"),
    path: "/teams",
    keywords: [
      "production software by role",
      "tour manager software",
      "production manager software",
      "stage manager software",
      "festival director software",
      "EHS lead software",
      "TD software event production",
    ],
    ogImageEyebrow: t("marketing.pages.teams.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.teams.meta.ogImageTitle"),
  });
}

export default async function TeamsHub() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.teams.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.teams.breadcrumbs.builtFor"), href: "/teams" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.teams.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.teams.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.teams.hero.body")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {TEAMS.map((team) => (
            <Link key={team.slug} href={`/teams/${team.slug}`} className="surface hover-lift p-6">
              <div className="eyebrow eyebrow-brand">{team.hero.eyebrow}</div>
              <h3 className="hed-lg mt-3">{team.role}</h3>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{team.blurb}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                {t("marketing.pages.teams.cards.cta")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection title={t("marketing.pages.teams.cta.title")} subtitle={t("marketing.pages.teams.cta.subtitle")} />
    </div>
  );
}
