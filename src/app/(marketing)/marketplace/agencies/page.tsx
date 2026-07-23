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
    title: t("marketing.marketplace.agencies.meta.title", undefined, "Agency Directory: Booking Agencies"),
    description: t(
      "marketing.marketplace.agencies.meta.description",
      undefined,
      "Verified booking agencies on the ATLVS network.",
    ),
    path: "/marketplace/agencies",
  });
}

type Row = {
  id: string;
  public_handle: string;
  display_name: string;
  bio: string | null;
  logo_url: string | null;
  website_url: string | null;
  default_commission_bps: number;
  is_verified: boolean;
  artist_count: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_agency_directory")
      .select("*")
      .order("verified_at", { ascending: false, nullsFirst: false })
      .order("artist_count", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }
  const count = rows.length;
  const summary =
    count === 1
      ? t("marketing.marketplace.agencies.count.one", { count }, "{count} agency")
      : t("marketing.marketplace.agencies.count.many", { count }, "{count} agencies");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.marketplace.crumbsLabel", undefined, "Marketplace"), href: "/marketplace" },
          { label: t("marketing.marketplace.agencies.crumbsLabel", undefined, "Agencies") },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.marketplace.agencies.eyebrow", undefined, "Marketplace · Agencies")}
        </div>
        <h1 className="hed-2xl mt-4">{t("marketing.marketplace.agencies.title", undefined, "Agency Directory")}</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">{summary}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("marketing.marketplace.agencies.empty", undefined, "No published agencies yet.")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/agencies/${r.public_handle}`}
                title={r.display_name}
                subtitle={r.bio ? r.bio.slice(0, 80) : undefined}
                meta={[
                  r.artist_count === 1
                    ? t("marketing.marketplace.agencies.artistCount.one", { count: r.artist_count }, "{count} artist")
                    : t(
                        "marketing.marketplace.agencies.artistCount.many",
                        { count: r.artist_count },
                        "{count} artists",
                      ),
                  t(
                    "marketing.marketplace.agencies.commission",
                    { pct: (r.default_commission_bps / 100).toFixed(2) },
                    "{pct}% default commission",
                  ),
                  r.website_url,
                ]}
                verified={r.is_verified}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
