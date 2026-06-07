// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import { Sparkles, Wrench, ShieldCheck, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.changelog.metadata.title"),
    description: t("marketing.pages.changelog.metadata.description"),
    path: "/changelog",
    keywords: [
      "ATLVS Technologies changelog",
      "ATLVS changelog",
      "GVTEWAY changelog",
      "COMPVSS changelog",
      "release notes",
      "product updates",
    ],
    ogImageEyebrow: t("marketing.pages.changelog.metadata.ogEyebrow"),
    ogImageTitle: t("marketing.pages.changelog.metadata.ogTitle"),
  });
}

import { CHANGELOG_ENTRIES, type ChangelogKind } from "@/lib/changelog";

type EntryKind = ChangelogKind;

export default async function ChangelogPage() {
  const { t } = await getRequestT();

  const KINDS: Record<EntryKind, { label: string; className: string; icon: typeof Sparkles }> = {
    feature: {
      label: t("marketing.pages.changelog.kinds.feature"),
      className: "bg-[var(--p-accent)]/10 text-[var(--p-accent)]",
      icon: Sparkles,
    },
    improvement: {
      label: t("marketing.pages.changelog.kinds.improvement"),
      className: "bg-[var(--p-accent)]/10 text-[var(--p-accent)]",
      icon: Wrench,
    },
    security: {
      label: t("marketing.pages.changelog.kinds.security"),
      className: "bg-[color-mix(in_srgb,var(--p-success)_10%,transparent)] text-[var(--p-success)]",
      icon: ShieldCheck,
    },
    performance: {
      label: t("marketing.pages.changelog.kinds.performance"),
      className: "bg-[color-mix(in_srgb,var(--p-warning)_10%,transparent)] text-[var(--p-warning)]",
      icon: Zap,
    },
  };

  const ENTRIES = CHANGELOG_ENTRIES;

  const crumbs = [
    { label: t("marketing.pages.changelog.crumbs.home"), href: "/" },
    { label: t("marketing.pages.changelog.crumbs.changelog"), href: "/changelog" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-10">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.changelog.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.changelog.hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t("marketing.pages.changelog.hero.bodyBefore")}{" "}
          <a className="underline" href="/changelog.rss">
            /changelog.rss
          </a>
          {t("marketing.pages.changelog.hero.bodyAfter")}
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ul className="space-y-6">
          {ENTRIES.map((e) => {
            const kind = KINDS[e.kind];
            const Icon = kind.icon;
            return (
              <li key={e.version} className="surface p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${kind.className}`}
                  >
                    <Icon size={10} /> {kind.label}
                  </span>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">
                    {e.date} · {e.version}
                  </div>
                </div>
                <div className="hed-lg mt-3 tracking-tight">{e.title}</div>
                <p className="mt-2 text-sm text-[var(--p-text-2)]">{e.body}</p>
                <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-[var(--p-text-2)]">
                  {e.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <CTASection
        title={t("marketing.pages.changelog.cta.title")}
        subtitle={t("marketing.pages.changelog.cta.subtitle")}
      />
    </div>
  );
}
