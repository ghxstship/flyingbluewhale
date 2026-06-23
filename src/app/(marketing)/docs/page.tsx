// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.docs.meta.title"),
    description: t("marketing.pages.docs.meta.description"),
    path: "/docs",
    keywords: [
      "ATLVS Technologies docs",
      "ATLVS docs",
      "GVTEWAY docs",
      "COMPVSS docs",
      "API reference",
      "architecture",
      "auth model",
    ],
    ogImageEyebrow: t("marketing.pages.docs.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.docs.meta.ogTitle"),
  });
}

const SECTIONS = [
  {
    titleKey: "marketing.pages.docs.sections.architecture.title",
    descKey: "marketing.pages.docs.sections.architecture.desc",
    href: "/features",
  },
  {
    titleKey: "marketing.pages.docs.sections.api.title",
    descKey: "marketing.pages.docs.sections.api.desc",
    // Unauthenticated visitors land on signup; auth flow returns them to
    // Settings → API inside ATLVS once they're in. Avoids surfacing the
    // internal /studio/* route path in the marketing site.
    href: "/signup?next=/settings/api",
  },
  {
    titleKey: "marketing.pages.docs.sections.guidesCms.title",
    descKey: "marketing.pages.docs.sections.guidesCms.desc",
    href: "/features",
  },
  {
    titleKey: "marketing.pages.docs.sections.authModel.title",
    descKey: "marketing.pages.docs.sections.authModel.desc",
    href: "/features",
  },
];

export default async function DocsLanding() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="eyebrow eyebrow-brand">{t("marketing.pages.docs.eyebrow")}</div>
      <h1 className="hed-xl mt-4">{t("marketing.pages.docs.hero.title")}</h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.titleKey} href={s.href} className="surface hover-lift p-5">
            <div className="text-sm font-semibold">{t(s.titleKey)}</div>
            <div className="mt-1 text-xs text-[var(--p-text-2)]">{t(s.descKey)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
