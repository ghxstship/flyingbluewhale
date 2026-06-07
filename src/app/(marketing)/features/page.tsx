// ISR — regenerate static HTML every 5 min.
export const revalidate = 300;

import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import {
  MarketingHero,
  MarketingSection,
  MarketingGrid,
  MarketingPageShell,
} from "@/components/marketing/MarketingPrimitives";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.features.metadata.title"),
    description: t("marketing.pages.features.metadata.description"),
    path: "/features",
    keywords: ["production software features", "event management platform", "stakeholder portals", "mobile field PWA"],
    ogImageEyebrow: t("marketing.pages.features.metadata.ogEyebrow"),
    ogImageTitle: t("marketing.pages.features.metadata.ogTitle"),
  });
}

const CATEGORY_KEYS = [
  "atlvs",
  "portals",
  "mobile",
  "procore-parity",
  "advancing",
  "proposals",
  "finance",
  "procurement",
  "production",
  "safety",
  "guides",
  "ai",
  "knowledge",
  "forms",
  "ticketing",
  "compliance",
] as const;

const CATEGORY_I18N_KEYS: Record<(typeof CATEGORY_KEYS)[number], string> = {
  atlvs: "atlvs",
  portals: "portals",
  mobile: "mobile",
  "procore-parity": "procoreParity",
  advancing: "advancing",
  proposals: "proposals",
  finance: "finance",
  procurement: "procurement",
  production: "production",
  safety: "safety",
  guides: "guides",
  ai: "ai",
  knowledge: "knowledge",
  forms: "forms",
  ticketing: "ticketing",
  compliance: "compliance",
};

export default async function FeaturesPage() {
  const { t } = await getRequestT();
  return (
    <MarketingPageShell>
      <MarketingHero
        eyebrow={t("marketing.pages.features.hero.eyebrow")}
        title={t("marketing.pages.features.hero.title")}
        subtitle={t("marketing.pages.features.hero.subtitle")}
      />
      <MarketingSection aria-label={t("marketing.pages.features.categories.ariaLabel")}>
        <MarketingGrid cols={4}>
          {CATEGORY_KEYS.map((key) => {
            const i18nKey = CATEGORY_I18N_KEYS[key];
            return (
              <Link
                key={key}
                href={`/features/${key}`}
                className="surface hover-lift rounded-lg p-5 focus-visible:ring-2 focus-visible:ring-[var(--p-accent,var(--p-accent))] focus-visible:ring-offset-2"
              >
                <div className="text-sm font-semibold">
                  {t(`marketing.pages.features.categories.items.${i18nKey}.title`)}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(`marketing.pages.features.categories.items.${i18nKey}.desc`)}
                </div>
              </Link>
            );
          })}
        </MarketingGrid>
      </MarketingSection>
    </MarketingPageShell>
  );
}
