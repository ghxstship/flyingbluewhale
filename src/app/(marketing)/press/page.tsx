import Link from "next/link";
import type { Metadata } from "next";
import { Download, Mail } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, SITE, CANONICAL_CTAS } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.press.meta.title"),
    description: t("marketing.pages.press.meta.description"),
    path: "/press",
    keywords: ["ATLVS press kit", "ATLVS Technologies brand", "ATLVS media kit", "press contact"],
    ogImageEyebrow: t("marketing.pages.press.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.press.meta.ogTitle"),
  });
}

export default async function PressPage() {
  const { t } = await getRequestT();

  const FACTS = [
    {
      label: t("marketing.pages.press.facts.legalName.label"),
      value: t("marketing.pages.press.facts.legalName.value"),
    },
    { label: t("marketing.pages.press.facts.brand.label"), value: t("marketing.pages.press.facts.brand.value") },
    { label: t("marketing.pages.press.facts.parent.label"), value: t("marketing.pages.press.facts.parent.value") },
    { label: t("marketing.pages.press.facts.founded.label"), value: t("marketing.pages.press.facts.founded.value") },
    { label: t("marketing.pages.press.facts.apexDomain.label"), value: SITE.domain },
    {
      label: t("marketing.pages.press.facts.categories.label"),
      value: t("marketing.pages.press.facts.categories.value"),
    },
    {
      label: t("marketing.pages.press.facts.subProducts.label"),
      value: t("marketing.pages.press.facts.subProducts.value"),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.press.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.press.breadcrumbs.press"), href: "/press" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.press.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.press.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.press.hero.body")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-lg">{t("marketing.pages.press.facts.heading")}</h2>
        <div className="surface mt-6 overflow-hidden">
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-1 gap-2 p-5 sm:grid-cols-[160px_1fr] ${i < FACTS.length - 1 ? "border-b border-[var(--border-color)]" : ""}`}
            >
              <div className="eyebrow">{f.label}</div>
              <div className="text-sm">{f.value}</div>
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
          <div className="eyebrow eyebrow-brand">{t("marketing.pages.press.kit.eyebrow")}</div>
          <h2 className="hed-lg mt-3">{t("marketing.pages.press.kit.title")}</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">{t("marketing.pages.press.kit.body")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              <Download size={14} className="mr-1.5" aria-hidden="true" />
              {t("marketing.pages.press.kit.cta")}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8">
          <div className="eyebrow">{t("marketing.pages.press.contact.eyebrow")}</div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Mail size={14} aria-hidden="true" className="text-[var(--text-muted)]" />
            <Link href="mailto:press@atlvs.pro" className="font-medium text-[var(--org-primary)]">
              press@atlvs.pro
            </Link>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">{t("marketing.pages.press.contact.body")}</p>
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.press.cta.title")}
        subtitle={t("marketing.pages.press.cta.subtitle")}
        primaryLabel={CANONICAL_CTAS.primary.label}
        primaryHref={CANONICAL_CTAS.primary.href}
        secondaryLabel={CANONICAL_CTAS.secondary.label}
        secondaryHref={CANONICAL_CTAS.secondary.href}
      />
    </div>
  );
}
