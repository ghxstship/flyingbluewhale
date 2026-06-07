import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { COMMUNITY_LIST } from "@/lib/community";
import { getRequestT } from "@/lib/i18n/request";

// Static page — no dynamic data, no request-time reads. Pre-render at build
// and skip the streaming loading.tsx on client-side navigation.

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.community.meta.title"),
    description: t("marketing.pages.community.meta.description"),
    path: "/community",
    keywords: ["production community", "event production teams", "ATLVS Technologies community"],
    ogImageEyebrow: t("marketing.pages.community.meta.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.community.meta.ogImageTitle"),
  });
}

export default async function CommunityPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.community.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.community.breadcrumbs.community"), href: "/community" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.community.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.community.hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.community.hero.subtitle")}</p>
      </section>

      {/* Community metric strip — lightweight trust signal on top of stories */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        <div className="surface grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          {[
            { value: "200+", label: t("marketing.pages.community.metrics.productionTeams") },
            { value: "1.4M+", label: t("marketing.pages.community.metrics.ticketsScanned") },
            { value: "850+", label: t("marketing.pages.community.metrics.showsAdvanced") },
            { value: "34", label: t("marketing.pages.community.metrics.countries") },
          ].map((m) => (
            <div key={m.label}>
              <div className="hed-lg text-[var(--p-accent)]">{m.value}</div>
              <div className="mt-1 text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="hed-lg">{t("marketing.pages.community.stories.title")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">{t("marketing.pages.community.stories.subtitle")}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_LIST.map((c) => (
            <Link key={c.slug} href={`/community/${c.slug}`} className="surface hover-lift flex flex-col p-6">
              <div className="eyebrow">{c.industry}</div>
              <div className="hed-lg mt-3">{c.name}</div>
              <div className="mt-2 flex-1 text-sm text-[var(--p-text-2)]">{c.blurb}</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {c.stats.slice(0, 2).map((s) => (
                  <div key={s.label} className="surface-inset p-3">
                    <div className="text-xl font-semibold tracking-tight text-[var(--p-accent)]">{s.value}</div>
                    <div className="mt-1 text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface grid gap-6 p-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="eyebrow eyebrow-brand">{t("marketing.pages.community.join.eyebrow")}</div>
            <h3 className="hed-lg mt-3">{t("marketing.pages.community.join.title")}</h3>
            <p className="mt-3 text-sm text-[var(--p-text-2)]">{t("marketing.pages.community.join.body")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
            <Link href="/contact?topic=community-story" className="ps-btn btn-md">
              {t("marketing.pages.community.join.pitchCta")}
            </Link>
            <Link href="/signup" className="ps-btn ps-btn--ghost btn-md">
              {t("marketing.pages.community.join.startCta")}
            </Link>
          </div>
        </div>
      </section>

      <CTASection
        title={t("marketing.pages.community.cta.title")}
        subtitle={t("marketing.pages.community.cta.subtitle")}
      />
    </div>
  );
}
