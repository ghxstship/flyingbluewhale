// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Layers, Rocket, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, organizationSchema } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.about.meta.title"),
    description: t("marketing.pages.about.meta.description"),
    path: "/about",
    keywords: [
      "ATLVS Technologies about",
      "ATLVS",
      "GVTEWAY",
      "COMPVSS",
      "event production platform",
      "production software company",
    ],
    ogImageEyebrow: t("marketing.pages.about.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.about.meta.ogImageTitle"),
  });
}

const PRINCIPLES = [
  {
    icon: Layers,
    titleKey: "marketing.pages.about.principles.threeApps.title",
    bodyKey: "marketing.pages.about.principles.threeApps.body",
  },
  {
    icon: ShieldCheck,
    titleKey: "marketing.pages.about.principles.rls.title",
    bodyKey: "marketing.pages.about.principles.rls.body",
  },
  {
    icon: Rocket,
    titleKey: "marketing.pages.about.principles.tested.title",
    bodyKey: "marketing.pages.about.principles.tested.body",
  },
  {
    icon: Compass,
    titleKey: "marketing.pages.about.principles.perOrg.title",
    bodyKey: "marketing.pages.about.principles.perOrg.body",
  },
];

const MILESTONES = [
  {
    date: "2026 Q2",
    titleKey: "marketing.pages.about.milestones.procoreParity.title",
    bodyKey: "marketing.pages.about.milestones.procoreParity.body",
  },
  {
    date: "2026 Q1",
    titleKey: "marketing.pages.about.milestones.threeApps.title",
    bodyKey: "marketing.pages.about.milestones.threeApps.body",
  },
  {
    date: "2025 Q4",
    titleKey: "marketing.pages.about.milestones.kbyg.title",
    bodyKey: "marketing.pages.about.milestones.kbyg.body",
  },
  {
    date: "2025 Q3",
    titleKey: "marketing.pages.about.milestones.proposals.title",
    bodyKey: "marketing.pages.about.milestones.proposals.body",
  },
  {
    date: "2025 Q2",
    titleKey: "marketing.pages.about.milestones.stripeConnect.title",
    bodyKey: "marketing.pages.about.milestones.stripeConnect.body",
  },
  {
    date: "2025 Q1",
    titleKey: "marketing.pages.about.milestones.firstProduction.title",
    bodyKey: "marketing.pages.about.milestones.firstProduction.body",
  },
];

export default async function AboutPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.about.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.about.breadcrumbs.about"), href: "/about" },
  ];

  return (
    <div>
      <JsonLd data={[organizationSchema()]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-accent)] uppercase">
          {t("marketing.pages.about.hero.eyebrow")}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          {t("marketing.pages.about.hero.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.about.hero.lead")}</p>
        <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">{t("marketing.pages.about.hero.subLead")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("marketing.pages.about.principles.heading")}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, titleKey, bodyKey }) => (
            <div key={titleKey} className="surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                  <Icon size={18} />
                </div>
                <div className="text-sm font-semibold">{t(titleKey)}</div>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("marketing.pages.about.milestones.heading")}
        </h2>
        <ul className="mt-8 space-y-6">
          {MILESTONES.map((m) => (
            <li key={m.date} className="surface grid gap-2 p-6 md:grid-cols-[140px_1fr] md:items-start md:gap-6">
              <div className="font-mono text-xs text-[var(--text-muted)]">{m.date}</div>
              <div>
                <div className="text-sm font-semibold">{t(m.titleKey)}</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{t(m.bodyKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-10">
          <h2 className="text-3xl font-semibold tracking-tight">{t("marketing.pages.about.studio.heading")}</h2>
          <p className="mt-4 max-w-2xl text-sm text-[var(--text-secondary)]">
            {t("marketing.pages.about.studio.body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/careers">
              {t("marketing.pages.about.studio.joinLink")}
            </Link>
            <span className="text-[var(--text-muted)]">·</span>
            <Link className="underline underline-offset-4" href="/contact">
              {t("marketing.pages.about.studio.talkLink")}
            </Link>
            <span className="text-[var(--text-muted)]">·</span>
            <a
              className="underline underline-offset-4"
              href="https://github.com/ghxstship"
              target="_blank"
              rel="noreferrer"
            >
              {t("marketing.pages.about.studio.githubLink")}
            </a>
          </div>
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.about.cta.title")}
        subtitle={t("marketing.pages.about.cta.subtitle")}
        primaryLabel={t("marketing.pages.about.cta.primaryLabel")}
        primaryHref="/signup"
        secondaryLabel={t("marketing.pages.about.cta.secondaryLabel")}
        secondaryHref="/contact"
      />
    </div>
  );
}
