import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.marketplace.meta.title"),
    description: t("marketing.pages.marketplace.meta.description"),
    path: "/marketplace",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  const SECTIONS = [
    {
      href: "/marketplace/rfqs",
      title: t("marketing.pages.marketplace.sections.rfqs.title"),
      blurb: t("marketing.pages.marketplace.sections.rfqs.blurb"),
    },
    {
      href: "/marketplace/work-orders",
      title: t("marketing.pages.marketplace.sections.workOrders.title", undefined, "Trade Work Orders"),
      blurb: t(
        "marketing.pages.marketplace.sections.workOrders.blurb",
        undefined,
        "Open subcontractor jobs — bid on trade work posted by producers.",
      ),
    },
    {
      href: "/marketplace/gigs",
      title: t("marketing.pages.marketplace.sections.gigs.title"),
      blurb: t("marketing.pages.marketplace.sections.gigs.blurb"),
    },
    {
      href: "/marketplace/calls",
      title: t("marketing.pages.marketplace.sections.calls.title"),
      blurb: t("marketing.pages.marketplace.sections.calls.blurb"),
    },
    {
      href: "/marketplace/talent",
      title: t("marketing.pages.marketplace.sections.talent.title"),
      blurb: t("marketing.pages.marketplace.sections.talent.blurb"),
    },
    {
      href: "/marketplace/crew",
      title: t("marketing.pages.marketplace.sections.crew.title"),
      blurb: t("marketing.pages.marketplace.sections.crew.blurb"),
    },
    {
      href: "/marketplace/vendors",
      title: t("marketing.pages.marketplace.sections.vendors.title"),
      blurb: t("marketing.pages.marketplace.sections.vendors.blurb"),
    },
    {
      href: "/marketplace/store",
      title: t("marketing.pages.marketplace.sections.store.title"),
      blurb: t("marketing.pages.marketplace.sections.store.blurb"),
    },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.marketplace.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.marketplace.hero.title")}</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.marketplace.hero.body")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift flex flex-col gap-2 p-5">
              <h2 className="hed-lg">{s.title}</h2>
              <p className="text-sm text-[var(--p-text-2)]">{s.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="surface p-6">
          <h2 className="hed-lg mb-2">{t("marketing.pages.marketplace.operators.title")}</h2>
          <p className="mb-3 text-sm text-[var(--p-text-2)]">{t("marketing.pages.marketplace.operators.body")}</p>
          <Button href="/signup" size="sm">
            {t("marketing.pages.marketplace.operators.cta")}
          </Button>
        </div>
      </section>
    </>
  );
}
