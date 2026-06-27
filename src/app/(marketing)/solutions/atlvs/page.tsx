// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Command,
  Database,
  FileSignature,
  DollarSign,
  ClipboardList,
  Users,
  Brain,
  ShieldCheck,
} from "lucide-react";
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
    title: t("marketing.pages.solutions.atlvs.meta.title"),
    description: t("marketing.pages.solutions.atlvs.meta.description"),
    path: "/solutions/atlvs",
    keywords: [
      "ATLVS",
      "production operations workspace",
      "event production dashboard",
      "internal production platform",
    ],
    ogImageEyebrow: "ATLVS",
    ogImageTitle: t("marketing.pages.solutions.atlvs.meta.ogImageTitle"),
  });
}

export default async function ATLVSPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.solutions.atlvs.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.solutions.atlvs.breadcrumbs.solutions"), href: "/solutions" },
    { label: t("marketing.pages.solutions.atlvs.breadcrumbs.atlvs"), href: "/solutions/atlvs" },
  ];

  return (
    <div data-platform="atlvs">
      <JsonLd
        data={[
          productSchema({
            name: t("marketing.pages.solutions.atlvs.schema.name"),
            description: t("marketing.pages.solutions.atlvs.schema.description"),
            url: urlFor("marketing", "/solutions/atlvs"),
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">
          <Wordmark word="ATLVS" style={{ color: "var(--p-accent-text)" }} />
        </div>
        <h1 className="kinetic-display mt-3 text-5xl sm:text-6xl">{t("marketing.pages.solutions.atlvs.hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t("marketing.pages.solutions.atlvs.hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">{t("marketing.pages.solutions.atlvs.hero.ctaPrimary")}</Button>
          <Button href="/contact" variant="secondary">
            {t("marketing.pages.solutions.atlvs.hero.ctaSecondary")}
          </Button>
          <Link href="/pricing" className="ps-btn ps-btn--ghost">
            {t("marketing.pages.solutions.atlvs.hero.ctaPricing")}
          </Link>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="eyebrow">
          {t("marketing.pages.solutions.atlvs.modules.eyebrow")}
        </div>
        <h2 className="hed-xl mt-3">
          {t("marketing.pages.solutions.atlvs.modules.title")}
        </h2>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={[
              {
                icon: Command,
                title: t("marketing.pages.solutions.atlvs.modules.work.title"),
                body: t("marketing.pages.solutions.atlvs.modules.work.body"),
              },
              {
                icon: FileSignature,
                title: t("marketing.pages.solutions.atlvs.modules.sales.title"),
                body: t("marketing.pages.solutions.atlvs.modules.sales.body"),
              },
              {
                icon: DollarSign,
                title: t("marketing.pages.solutions.atlvs.modules.finance.title"),
                body: t("marketing.pages.solutions.atlvs.modules.finance.body"),
              },
              {
                icon: ClipboardList,
                title: t("marketing.pages.solutions.atlvs.modules.procurement.title"),
                body: t("marketing.pages.solutions.atlvs.modules.procurement.body"),
              },
              {
                icon: Database,
                title: t("marketing.pages.solutions.atlvs.modules.production.title"),
                body: t("marketing.pages.solutions.atlvs.modules.production.body"),
              },
              {
                icon: Users,
                title: t("marketing.pages.solutions.atlvs.modules.people.title"),
                body: t("marketing.pages.solutions.atlvs.modules.people.body"),
              },
              {
                icon: ClipboardList,
                title: t("marketing.pages.solutions.atlvs.modules.construction.title"),
                body: t("marketing.pages.solutions.atlvs.modules.construction.body"),
              },
              {
                icon: ShieldCheck,
                title: t("marketing.pages.solutions.atlvs.modules.safety.title"),
                body: t("marketing.pages.solutions.atlvs.modules.safety.body"),
              },
              {
                icon: Brain,
                title: t("marketing.pages.solutions.atlvs.modules.ai.title"),
                body: t("marketing.pages.solutions.atlvs.modules.ai.body"),
              },
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow eyebrow-accent">
              {t("marketing.pages.solutions.atlvs.architecture.eyebrow")}
            </div>
            <h2 className="hed-xl mt-3">
              {t("marketing.pages.solutions.atlvs.architecture.title")}
            </h2>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.atlvs.architecture.body1")}
            </p>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.solutions.atlvs.architecture.body2")}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              t("marketing.pages.solutions.atlvs.architecture.bullets.rls"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.roleAware"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.auditLog"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.aiGrounded"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.stripeConnect"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.signedWebhooks"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.selfExpiring"),
              t("marketing.pages.solutions.atlvs.architecture.bullets.sla"),
            ].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--p-accent)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Persona tiles */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.solutions.atlvs.personas.title")}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            {
              role: t("marketing.pages.solutions.atlvs.personas.owner.role"),
              body: t("marketing.pages.solutions.atlvs.personas.owner.body"),
            },
            {
              role: t("marketing.pages.solutions.atlvs.personas.controller.role"),
              body: t("marketing.pages.solutions.atlvs.personas.controller.body"),
            },
            {
              role: t("marketing.pages.solutions.atlvs.personas.projectManager.role"),
              body: t("marketing.pages.solutions.atlvs.personas.projectManager.body"),
            },
          ].map((p) => (
            <div key={p.role} className="surface p-5">
              <div className="text-sm font-semibold">{p.role}</div>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection
        title={t("marketing.pages.solutions.atlvs.faq.title")}
        faqs={[
          {
            q: t("marketing.pages.solutions.atlvs.faq.what.q"),
            a: t("marketing.pages.solutions.atlvs.faq.what.a"),
          },
          {
            q: t("marketing.pages.solutions.atlvs.faq.roleAware.q"),
            a: t("marketing.pages.solutions.atlvs.faq.roleAware.a"),
          },
          {
            q: t("marketing.pages.solutions.atlvs.faq.brand.q"),
            a: t("marketing.pages.solutions.atlvs.faq.brand.a"),
          },
          {
            q: t("marketing.pages.solutions.atlvs.faq.ai.q"),
            a: t("marketing.pages.solutions.atlvs.faq.ai.a"),
          },
        ]}
      />

      <CTASection
        title={t("marketing.pages.solutions.atlvs.cta.title")}
        subtitle={t("marketing.pages.solutions.atlvs.cta.subtitle")}
        primaryLabel={t("marketing.pages.solutions.atlvs.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.solutions.atlvs.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </div>
  );
}
