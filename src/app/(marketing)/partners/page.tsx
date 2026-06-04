import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, CANONICAL_CTAS } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.partners.metadata.title"),
    description: t("marketing.pages.partners.metadata.description"),
    path: "/partners",
    keywords: [
      "ATLVS partners",
      "ATLVS implementation partners",
      "production software consultants",
      "ATLVS Technologies partner program",
    ],
    ogImageEyebrow: t("marketing.pages.partners.metadata.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.partners.metadata.ogImageTitle"),
  });
}

export default async function PartnersPage() {
  const { t } = await getRequestT();

  const TRACKS = [
    {
      key: "implementation",
      name: t("marketing.pages.partners.tracks.implementation.name"),
      body: t("marketing.pages.partners.tracks.implementation.body"),
      forWho: t("marketing.pages.partners.tracks.implementation.forWho"),
    },
    {
      key: "build",
      name: t("marketing.pages.partners.tracks.build.name"),
      body: t("marketing.pages.partners.tracks.build.body"),
      forWho: t("marketing.pages.partners.tracks.build.forWho"),
    },
    {
      key: "solution",
      name: t("marketing.pages.partners.tracks.solution.name"),
      body: t("marketing.pages.partners.tracks.solution.body"),
      forWho: t("marketing.pages.partners.tracks.solution.forWho"),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.partners.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.partners.breadcrumbs.partners"), href: "/partners" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.partners.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.partners.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.partners.hero.body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/contact">{t("marketing.pages.partners.hero.primaryCta")}</Button>
          <Button href={CANONICAL_CTAS.primary.href} variant="secondary">
            {CANONICAL_CTAS.primary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.partners.tracks.heading")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TRACKS.map((track) => (
            <div key={track.key} className="surface p-6">
              <div className="eyebrow eyebrow-brand">{track.forWho}</div>
              <h3 className="mt-2 text-base font-semibold">{track.name}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{track.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface relative overflow-hidden p-8 md:p-10">
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, var(--org-primary), var(--org-accent))" }}
          />
          <div className="eyebrow eyebrow-brand">{t("marketing.pages.partners.directory.eyebrow")}</div>
          <h2 className="hed-lg mt-3">{t("marketing.pages.partners.directory.title")}</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            {t("marketing.pages.partners.directory.body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              {t("marketing.pages.partners.directory.cta")}
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.partners.cta.title")}
        subtitle={t("marketing.pages.partners.cta.subtitle")}
        primaryLabel={t("marketing.pages.partners.cta.primaryLabel")}
        primaryHref={CANONICAL_CTAS.secondary.href}
        secondaryLabel={CANONICAL_CTAS.primary.label}
        secondaryHref={CANONICAL_CTAS.primary.href}
      />
    </div>
  );
}
