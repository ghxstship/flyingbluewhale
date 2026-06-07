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
    title: t("marketing.pages.marketplace.vendors.meta.title"),
    description: t("marketing.pages.marketplace.vendors.meta.description"),
    path: "/marketplace/vendors",
  });
}

type Row = {
  id: string;
  public_handle: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  trade_categories: string[];
  regions: string[];
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
  year_founded: number | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_vendor_directory")
      .select("*")
      // View exposes is_verified (boolean), not verified_at — ordering
      // by a non-existent column 400s and silently empties the page.
      .order("is_verified", { ascending: false })
      .order("rating_count", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace.vendors.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace.vendors.breadcrumbs.vendors") },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.marketplace.vendors.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.marketplace.vendors.hero.title")}</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {rows.length === 1
            ? t("marketing.pages.marketplace.vendors.hero.countOne", { count: String(rows.length) })
            : t("marketing.pages.marketplace.vendors.hero.countOther", { count: String(rows.length) })}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.marketplace.vendors.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/vendors/${r.public_handle}`}
                title={r.name}
                subtitle={r.tagline ?? undefined}
                tags={r.trade_categories}
                meta={[
                  r.regions.join(", ") || null,
                  r.year_founded
                    ? t("marketing.pages.marketplace.vendors.card.established", { year: String(r.year_founded) })
                    : null,
                ]}
                rating={{ avg: r.rating_avg, count: r.rating_count }}
                verified={r.is_verified}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
