import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.marketplace.rfqs.meta.title"),
    description: t("marketing.pages.marketplace.rfqs.meta.description"),
    path: "/marketplace/rfqs",
  });
}

type Row = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  trade_categories: string[];
  region: string | null;
  budget_band: string | null;
  due_at: string | null;
  org_name: string;
  org_slug: string;
  requires_prequalification: boolean;
  requires_insurance: boolean;
};

export default async function Page() {
  const { t } = await getRequestT();
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_rfq_marketplace")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace.rfqs.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace.rfqs.breadcrumbs.openRfqs") },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.marketplace.rfqs.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.marketplace.rfqs.hero.title")}</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {rows.length}{" "}
          {rows.length === 1
            ? t("marketing.pages.marketplace.rfqs.hero.countSingular")
            : t("marketing.pages.marketplace.rfqs.hero.countPlural")}{" "}
          · {t("marketing.pages.marketplace.rfqs.hero.requirements")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.marketplace.rfqs.empty.message")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/rfqs/${r.public_slug}`}
                title={r.title}
                subtitle={r.org_name}
                tags={r.trade_categories}
                meta={[
                  r.region,
                  r.budget_band,
                  r.due_at
                    ? `${t("marketing.pages.marketplace.rfqs.card.dueLabel")} ${new Date(r.due_at).toLocaleDateString()}`
                    : null,
                  r.requires_prequalification ? t("marketing.pages.marketplace.rfqs.card.prequalRequired") : null,
                ]}
                badge={r.requires_insurance ? t("marketing.pages.marketplace.rfqs.card.coiRequired") : null}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
