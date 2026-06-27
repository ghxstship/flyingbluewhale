// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import type { Metadata } from "next";
import { CheckCircle2, QrCode, Clock, Wifi, Camera, AlertTriangle, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";
import { Wordmark } from "@/components/brand/Wordmark";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.solutions.compvss.meta.title"),
    description: t("marketing.pages.solutions.compvss.meta.description"),
    path: "/solutions/compvss",
    keywords: [
      "COMPVSS",
      "event ticket scan PWA",
      "offline ticket scanning",
      "production mobile app",
      "crew mobile app",
      "event check-in software",
    ],
    ogImageEyebrow: "COMPVSS",
    ogImageTitle: t("marketing.pages.solutions.compvss.meta.ogImageTitle"),
  });
}

export default async function CompvssPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.solutions.compvss.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.solutions.compvss.breadcrumbs.solutions"), href: "/solutions" },
    { label: t("marketing.pages.solutions.compvss.breadcrumbs.compvss"), href: "/solutions/compvss" },
  ];

  return (
    <div data-theme="atlvs-product" data-platform="compvss">
      <JsonLd
        data={[
          productSchema({
            name: t("marketing.pages.solutions.compvss.schema.name"),
            description: t("marketing.pages.solutions.compvss.schema.description"),
            url: urlFor("marketing", "/solutions/compvss"),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">
          <Wordmark word="COMPVSS" style={{ color: "var(--p-accent-text)" }} />
        </div>
        <h1 className="kinetic-display mt-3 text-5xl sm:text-6xl">
          {t("marketing.pages.solutions.compvss.hero.titleLine1")}
          <br />
          {t("marketing.pages.solutions.compvss.hero.titleLine2")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t("marketing.pages.solutions.compvss.hero.body")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">{t("marketing.pages.solutions.compvss.hero.primaryCta")}</Button>
          <Button href="/contact" variant="secondary">
            {t("marketing.pages.solutions.compvss.hero.secondaryCta")}
          </Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">
          {t("marketing.pages.solutions.compvss.modules.heading")}
        </h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Home,
                title: t("marketing.pages.solutions.compvss.modules.today.title"),
                body: t("marketing.pages.solutions.compvss.modules.today.body"),
              },
              {
                icon: QrCode,
                title: t("marketing.pages.solutions.compvss.modules.gateScan.title"),
                body: t("marketing.pages.solutions.compvss.modules.gateScan.body"),
              },
              {
                icon: BookOpen,
                title: t("marketing.pages.solutions.compvss.modules.doorPass.title"),
                body: t("marketing.pages.solutions.compvss.modules.doorPass.body"),
              },
              {
                icon: Clock,
                title: t("marketing.pages.solutions.compvss.modules.shift.title"),
                body: t("marketing.pages.solutions.compvss.modules.shift.body"),
              },
              {
                icon: Camera,
                title: t("marketing.pages.solutions.compvss.modules.warehouse.title"),
                body: t("marketing.pages.solutions.compvss.modules.warehouse.body"),
              },
              {
                icon: AlertTriangle,
                title: t("marketing.pages.solutions.compvss.modules.incident.title"),
                body: t("marketing.pages.solutions.compvss.modules.incident.body"),
              },
            ]}
          />
        </div>
      </section>

      {/* Offline-first */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow eyebrow-accent flex items-center gap-2">
              <Wifi size={14} /> {t("marketing.pages.solutions.compvss.offlineFirst.eyebrow")}
            </div>
            <h2 className="hed-xl mt-3">
              {t("marketing.pages.solutions.compvss.offlineFirst.heading")}
            </h2>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.compvss.offlineFirst.body1")}
            </p>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.compvss.offlineFirst.body2")}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.install"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.queue"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.tested"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.scanStates"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.geoVerified"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.permissions"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.tabBar"),
              t("marketing.pages.solutions.compvss.offlineFirst.bullets.contrast"),
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--p-accent)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection
        title={t("marketing.pages.solutions.compvss.faq.title")}
        faqs={[
          {
            q: t("marketing.pages.solutions.compvss.faq.native.q"),
            a: t("marketing.pages.solutions.compvss.faq.native.a"),
          },
          {
            q: t("marketing.pages.solutions.compvss.faq.noSignal.q"),
            a: t("marketing.pages.solutions.compvss.faq.noSignal.a"),
          },
          {
            q: t("marketing.pages.solutions.compvss.faq.gateSpeed.q"),
            a: t("marketing.pages.solutions.compvss.faq.gateSpeed.a"),
          },
          {
            q: t("marketing.pages.solutions.compvss.faq.offlineCheckin.q"),
            a: t("marketing.pages.solutions.compvss.faq.offlineCheckin.a"),
          },
          {
            q: t("marketing.pages.solutions.compvss.faq.camera.q"),
            a: t("marketing.pages.solutions.compvss.faq.camera.a"),
          },
        ]}
      />

      <CTASection
        title={t("marketing.pages.solutions.compvss.cta.title")}
        subtitle={t("marketing.pages.solutions.compvss.cta.subtitle")}
        primaryLabel={t("marketing.pages.solutions.compvss.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.solutions.compvss.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </div>
  );
}
