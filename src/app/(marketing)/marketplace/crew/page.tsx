import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.marketplace.crew.metadata.title"),
    description: t("marketing.pages.marketplace.crew.metadata.description"),
    path: "/marketplace/crew",
  });
}

type Row = {
  id: string;
  public_handle: string;
  name: string;
  tagline: string | null;
  roles: string[];
  unions: string[];
  certifications: string[];
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  travel_radius_km: number | null;
  availability_open: boolean;
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
};

export default async function Page() {
  const { t } = await getRequestT();
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_crew_directory")
      .select("*")
      .order("availability_open", { ascending: false })
      .order("rating_count", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace.crew.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace.crew.breadcrumbs.crew") },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.marketplace.crew.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.marketplace.crew.hero.title")}</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {rows.length}{" "}
          {rows.length === 1
            ? t("marketing.pages.marketplace.crew.hero.profileCountSingular")
            : t("marketing.pages.marketplace.crew.hero.profileCountPlural")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">
            {t("marketing.pages.marketplace.crew.empty.message")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/crew/${r.public_handle}`}
                title={r.name}
                subtitle={r.tagline ?? undefined}
                tags={r.roles}
                meta={[
                  formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, "USD") +
                    t("marketing.pages.marketplace.crew.card.perDaySuffix"),
                  r.unions.join(", ") || null,
                  r.travel_radius_km
                    ? t("marketing.pages.marketplace.crew.card.travelRadius", { km: String(r.travel_radius_km) })
                    : null,
                  r.availability_open ? t("marketing.pages.marketplace.crew.card.availableNow") : null,
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
