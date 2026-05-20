import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Talent Directory — Artist EPKs",
  description: "Discover and book talent for festivals, brand activations, private events.",
  path: "/marketplace/talent",
});

type Row = {
  id: string;
  public_handle: string;
  act_name: string;
  tagline: string | null;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  monthly_listeners: number | null;
  follower_count: number | null;
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
};

export default async function Page() {
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_talent_directory")
      .select("*")
      .order("verified_at", { ascending: false, nullsFirst: false })
      .order("rating_count", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }
  const fmt = await getRequestFormatters();

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Talent" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Marketplace · Talent</div>
        <h1 className="hed-2xl mt-4">Talent Directory</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {rows.length} act{rows.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">No published talent yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/talent/${r.public_handle}`}
                title={r.act_name}
                subtitle={r.tagline ?? undefined}
                tags={r.genre_tags}
                meta={[
                  formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
                  r.travel_radius_km ? `${r.travel_radius_km} km radius` : null,
                  r.monthly_listeners ? `${fmt.number(r.monthly_listeners)} mo listeners` : null,
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
