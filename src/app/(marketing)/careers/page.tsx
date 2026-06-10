// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Globe2, Heart, Layers, Rocket, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema, SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.careers.metadata.title"),
    description: t("marketing.pages.careers.metadata.description"),
    path: "/careers",
    keywords: [
      "ATLVS careers",
      "event production platform jobs",
      "event tech startup careers",
      "remote engineering jobs",
      "design jobs production",
    ],
    ogImageEyebrow: t("marketing.pages.careers.metadata.ogEyebrow"),
    ogImageTitle: t("marketing.pages.careers.metadata.ogTitle"),
  });
}

const VALUE_ICONS = [Layers, Compass, Heart, Sparkles, Globe2, Rocket] as const;
const VALUE_KEYS = ["crew", "tested", "pricing", "brandFirst", "distributed", "equity"] as const;

type Role = {
  title: string;
  team: string;
  location: string;
  type: "Full-time" | "Contract";
  body: string;
};

// Open roles get added here as the studio hires. Empty array renders the
// "no current openings" state, which is honest — better than ghost listings.
const ROLES: Role[] = [];

const FAQ_KEYS = ["hiring", "visas", "remote", "interview", "notHire"] as const;

export default async function CareersPage() {
  const { t } = await getRequestT();
  const trail = [
    { label: t("marketing.pages.careers.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.careers.breadcrumbs.careers"), href: "/careers" },
  ];
  // VALUE_ICONS and VALUE_KEYS are parallel 6-element tuples.
  const values = VALUE_KEYS.map((key, i) => ({
    icon: VALUE_ICONS[i]!,
    title: t(`marketing.pages.careers.values.${key}.title`),
    body: t(`marketing.pages.careers.values.${key}.body`),
  }));
  const faq = FAQ_KEYS.map((key) => ({
    q: t(`marketing.pages.careers.faq.${key}.q`),
    a: t(`marketing.pages.careers.faq.${key}.a`),
  }));

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.label,
              item: `${SITE.baseUrl}${t.href}`,
            })),
          },
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumbs items={trail} />
        <div className="mt-6 max-w-3xl">
          <div className="eyebrow eyebrow-brand">{t("marketing.pages.careers.hero.eyebrow")}</div>
          <h1 className="hed-2xl mt-4">{t("marketing.pages.careers.hero.title")}</h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--p-text-2)] sm:text-lg">
            {t("marketing.pages.careers.hero.body")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.careers.values.heading")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--p-accent)]/10 text-[var(--p-accent)]">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--p-text-2)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between">
          <h2 className="hed-xl">{t("marketing.pages.careers.roles.heading")}</h2>
          <span className="text-xs text-[var(--p-text-2)]">{t("marketing.pages.careers.roles.updatedNote")}</span>
        </div>

        {ROLES.length === 0 ? (
          <div className="surface mt-8 p-10 text-center">
            <div className="eyebrow">{t("marketing.pages.careers.roles.empty.eyebrow")}</div>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--p-text-2)]">
              {t("marketing.pages.careers.roles.empty.body")}
            </p>
            <div className="mt-5">
              <Link href="/contact" className="ps-btn">
                {t("marketing.pages.careers.roles.empty.cta")}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-8 grid gap-3">
            {ROLES.map((r) => (
              <li key={r.title} className="surface p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow">
                      {r.team} · {r.location} · {r.type}
                    </div>
                    <h3 className="hed-lg mt-3">{r.title}</h3>
                    <p className="mt-2 text-sm text-[var(--p-text-2)]">{r.body}</p>
                  </div>
                  <Link href="/contact" className="ps-btn ps-btn--ghost ps-btn--sm shrink-0">
                    {t("marketing.pages.careers.roles.applyCta")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FAQSection title={t("marketing.pages.careers.faq.heading")} faqs={faq} />

      <CTASection
        title={t("marketing.pages.careers.cta.title")}
        subtitle={t("marketing.pages.careers.cta.subtitle")}
        primaryLabel={t("marketing.pages.careers.cta.primaryLabel")}
        primaryHref="/contact"
        secondaryLabel={t("marketing.pages.careers.cta.secondaryLabel")}
        secondaryHref="/about"
      />
    </>
  );
}
