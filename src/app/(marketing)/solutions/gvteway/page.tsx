// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Mic2, Truck, Users, Award, Ticket, HardHat, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, productSchema } from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.solutions.gvteway.meta.title"),
    description: t("marketing.pages.solutions.gvteway.meta.description"),
    path: "/solutions/gvteway",
    keywords: [
      "GVTEWAY",
      "stakeholder portal",
      "artist portal",
      "vendor portal",
      "client portal",
      "event portal software",
    ],
    ogImageEyebrow: "GVTEWAY",
    ogImageTitle: t("marketing.pages.solutions.gvteway.meta.ogImageTitle"),
  });
}

export default async function GvtewayPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.solutions.gvteway.crumbs.home"), href: "/" },
    { label: t("marketing.pages.solutions.gvteway.crumbs.solutions"), href: "/solutions" },
    { label: "GVTEWAY", href: "/solutions/gvteway" },
  ];

  return (
    <div data-platform="gvteway">
      <JsonLd
        data={[
          productSchema({
            name: t("marketing.pages.solutions.gvteway.jsonLd.name"),
            description: t("marketing.pages.solutions.gvteway.jsonLd.description"),
            url: urlFor("marketing", "/solutions/gvteway"),
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">GVTEWAY</div>
        <h1 className="kinetic-display mt-3 text-5xl sm:text-6xl">
          {t("marketing.pages.solutions.gvteway.hero.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t("marketing.pages.solutions.gvteway.hero.body")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">{t("marketing.pages.solutions.gvteway.hero.ctaPrimary")}</Button>
          <Button href="/contact" variant="secondary">
            {t("marketing.pages.solutions.gvteway.hero.ctaSecondary")}
          </Button>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("marketing.pages.solutions.gvteway.personas.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t("marketing.pages.solutions.gvteway.personas.body")}
        </p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Mic2,
                title: t("marketing.pages.solutions.gvteway.personas.artist.title"),
                body: t("marketing.pages.solutions.gvteway.personas.artist.body"),
              },
              {
                icon: Truck,
                title: t("marketing.pages.solutions.gvteway.personas.vendor.title"),
                body: t("marketing.pages.solutions.gvteway.personas.vendor.body"),
              },
              {
                icon: Users,
                title: t("marketing.pages.solutions.gvteway.personas.client.title"),
                body: t("marketing.pages.solutions.gvteway.personas.client.body"),
              },
              {
                icon: Award,
                title: t("marketing.pages.solutions.gvteway.personas.sponsor.title"),
                body: t("marketing.pages.solutions.gvteway.personas.sponsor.body"),
              },
              {
                icon: Ticket,
                title: t("marketing.pages.solutions.gvteway.personas.guest.title"),
                body: t("marketing.pages.solutions.gvteway.personas.guest.body"),
              },
              {
                icon: HardHat,
                title: t("marketing.pages.solutions.gvteway.personas.crew.title"),
                body: t("marketing.pages.solutions.gvteway.personas.crew.body"),
              },
              {
                icon: Users,
                title: t("marketing.pages.solutions.gvteway.personas.delegation.title"),
                body: t("marketing.pages.solutions.gvteway.personas.delegation.body"),
              },
              {
                icon: BookOpen,
                title: t("marketing.pages.solutions.gvteway.personas.media.title"),
                body: t("marketing.pages.solutions.gvteway.personas.media.body"),
              },
              {
                icon: Award,
                title: t("marketing.pages.solutions.gvteway.personas.vip.title"),
                body: t("marketing.pages.solutions.gvteway.personas.vip.body"),
              },
              {
                icon: HardHat,
                title: t("marketing.pages.solutions.gvteway.personas.volunteer.title"),
                body: t("marketing.pages.solutions.gvteway.personas.volunteer.body"),
              },
              {
                icon: Mic2,
                title: t("marketing.pages.solutions.gvteway.personas.athlete.title"),
                body: t("marketing.pages.solutions.gvteway.personas.athlete.body"),
              },
              {
                icon: Share2,
                title: t("marketing.pages.solutions.gvteway.personas.privacy.title"),
                body: t("marketing.pages.solutions.gvteway.personas.privacy.body"),
              },
            ]}
          />
        </div>
      </section>

      {/* Signature features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="surface p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[var(--p-accent-text)] uppercase">
              <Share2 size={14} /> {t("marketing.pages.solutions.gvteway.features.proposals.eyebrow")}
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              {t("marketing.pages.solutions.gvteway.features.proposals.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.gvteway.features.proposals.body")}
            </p>
            <Link
              href="/features/proposals"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--p-accent-text)]"
            >
              {t("marketing.pages.solutions.gvteway.features.proposals.link")}
            </Link>
          </div>
          <div className="surface p-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[var(--p-accent-text)] uppercase">
              <BookOpen size={14} /> {t("marketing.pages.solutions.gvteway.features.kbyg.eyebrow")}
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              {t("marketing.pages.solutions.gvteway.features.kbyg.title")}
            </h3>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.gvteway.features.kbyg.body")}
            </p>
            <Link
              href="/features/guides"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--p-accent-text)]"
            >
              {t("marketing.pages.solutions.gvteway.features.kbyg.link")}
            </Link>
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--p-accent-text)] uppercase">
              {t("marketing.pages.solutions.gvteway.security.eyebrow")}
            </div>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              {t("marketing.pages.solutions.gvteway.security.title")}
            </h3>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.gvteway.security.body")}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              t("marketing.pages.solutions.gvteway.security.items.perProjectPortals"),
              t("marketing.pages.solutions.gvteway.security.items.perPersonaNav"),
              t("marketing.pages.solutions.gvteway.security.items.signedLinks"),
              t("marketing.pages.solutions.gvteway.security.items.fileDownloads"),
              t("marketing.pages.solutions.gvteway.security.items.everyViewLogged"),
              t("marketing.pages.solutions.gvteway.security.items.eSign"),
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
        title={t("marketing.pages.solutions.gvteway.faq.title")}
        faqs={[
          {
            q: t("marketing.pages.solutions.gvteway.faq.q1.q"),
            a: t("marketing.pages.solutions.gvteway.faq.q1.a"),
          },
          {
            q: t("marketing.pages.solutions.gvteway.faq.q2.q"),
            a: t("marketing.pages.solutions.gvteway.faq.q2.a"),
          },
          {
            q: t("marketing.pages.solutions.gvteway.faq.q3.q"),
            a: t("marketing.pages.solutions.gvteway.faq.q3.a"),
          },
          {
            q: t("marketing.pages.solutions.gvteway.faq.q4.q"),
            a: t("marketing.pages.solutions.gvteway.faq.q4.a"),
          },
          {
            q: t("marketing.pages.solutions.gvteway.faq.q5.q"),
            a: t("marketing.pages.solutions.gvteway.faq.q5.a"),
          },
        ]}
      />

      <CTASection
        title={t("marketing.pages.solutions.gvteway.cta.title")}
        subtitle={t("marketing.pages.solutions.gvteway.cta.subtitle")}
        primaryLabel={t("marketing.pages.solutions.gvteway.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.solutions.gvteway.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </div>
  );
}
