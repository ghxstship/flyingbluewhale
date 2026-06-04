// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { POST_LIST } from "@/lib/blog";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.blog.meta.title"),
    description: t("marketing.pages.blog.meta.description"),
    path: "/blog",
    keywords: ["production blog", "event production software blog", "ATLVS Technologies blog"],
    ogImageEyebrow: t("marketing.pages.blog.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.blog.meta.ogTitle"),
  });
}

export default async function BlogIndex() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.blog.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.blog.breadcrumbs.blog"), href: "/blog" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-10">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.blog.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.blog.hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">{t("marketing.pages.blog.hero.subtitle")}</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ul className="space-y-4">
          {POST_LIST.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="surface hover-lift block p-6">
                <div className="font-mono text-xs text-[var(--text-muted)]">
                  {p.date} · {p.readingTime}
                </div>
                <div className="hed-lg mt-3 tracking-tight">{p.title}</div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">{p.blurb}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.keywords.slice(0, 4).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-[var(--surface-inset)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
