// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import type { Metadata } from "next";
import {
  BookOpen,
  GraduationCap,
  Award,
  FolderOpen,
  Package,
  Signpost,
  ShieldCheck,
  HardHat,
  CheckCircle2,
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

// LEG3ND accent (Production Orange) comes from the theme: the wrapper sets
// `data-theme="atlvs-product" data-platform="legend"`, so `--p-accent*` resolve
// to the LEG3ND ramp for this subtree — no inline hexes.
const K = "marketing.pages.solutions.legend";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t(`${K}.meta.title`),
    description: t(`${K}.meta.description`),
    path: "/solutions/legend",
    keywords: [
      "LEG3ND",
      "production knowledge base",
      "event LMS",
      "safety certifications",
      "compliance engine",
      "ISO 7010 signage library",
    ],
    ogImageEyebrow: t(`${K}.meta.ogImageEyebrow`),
    ogImageTitle: t(`${K}.meta.ogImageTitle`),
  });
}

export default async function LegendPage() {
  const { t } = await getRequestT();

  const crumbs = [
    { label: t(`${K}.crumbs.home`), href: "/" },
    { label: t(`${K}.crumbs.solutions`), href: "/solutions" },
    { label: "LEG3ND", href: "/solutions/legend" },
  ];

  const pillars = [
    { icon: BookOpen, key: "standard" },
    { icon: GraduationCap, key: "courses" },
    { icon: Award, key: "certifications" },
    { icon: FolderOpen, key: "resources" },
    { icon: Package, key: "catalog" },
    { icon: Signpost, key: "signage" },
    { icon: ShieldCheck, key: "xmce" },
    { icon: HardHat, key: "safety" },
  ] as const;

  const protocolItems = ["standard", "courses", "certifications", "catalog", "signage", "xmce"] as const;

  return (
    <div data-theme="atlvs-product" data-platform="legend">
      <JsonLd
        data={[
          productSchema({
            name: "LEG3ND",
            description: t(`${K}.jsonLd.description`),
            url: urlFor("marketing", "/solutions/legend"),
            price: "0",
          }),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-accent">
          <Wordmark word="LEG3ND" style={{ color: "var(--p-accent-text)" }} />
        </div>
        <h1 className="hed-3xl mt-3">{t(`${K}.hero.title`)}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{t(`${K}.hero.body`)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/signup">{t(`${K}.hero.ctaPrimary`)}</Button>
          <Button href="/contact" variant="secondary">
            {t(`${K}.hero.ctaSecondary`)}
          </Button>
        </div>
      </section>

      {/* The eight pillars */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t(`${K}.pillars.title`)}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">{t(`${K}.pillars.body`)}</p>
        <div className="mt-8">
          <FeatureGrid
            cols={3}
            features={pillars.map((p) => ({
              icon: p.icon,
              title: t(`${K}.pillars.${p.key}.title`),
              body: t(`${K}.pillars.${p.key}.body`),
            }))}
          />
        </div>
      </section>

      {/* XPMS 2.0 protocol callout */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-10 p-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="eyebrow eyebrow-accent">
              {t(`${K}.protocol.eyebrow`)}
            </div>
            <h3 className="hed-xl mt-3">{t(`${K}.protocol.title`)}</h3>
            <p className="mt-4 text-sm text-[var(--p-text-2)]">{t(`${K}.protocol.body`)}</p>
          </div>
          <ul className="space-y-3 text-sm">
            {protocolItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-[var(--p-accent)]" />
                <span>{t(`${K}.protocol.items.${item}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FAQSection
        title={t(`${K}.faq.title`)}
        faqs={[
          { q: t(`${K}.faq.q1.q`), a: t(`${K}.faq.q1.a`) },
          { q: t(`${K}.faq.q2.q`), a: t(`${K}.faq.q2.a`) },
          { q: t(`${K}.faq.q3.q`), a: t(`${K}.faq.q3.a`) },
          { q: t(`${K}.faq.q4.q`), a: t(`${K}.faq.q4.a`) },
        ]}
      />

      <CTASection
        title={t(`${K}.cta.title`)}
        subtitle={t(`${K}.cta.subtitle`)}
        primaryLabel={t(`${K}.cta.primaryLabel`)}
        primaryHref="/signup"
        secondaryLabel={t(`${K}.cta.secondaryLabel`)}
        secondaryHref="/contact"
      />
    </div>
  );
}
