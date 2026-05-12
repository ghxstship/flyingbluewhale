import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatFeeRange } from "@/lib/marketplace";
import { formatNumber } from "@/lib/i18n/format";

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

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Talent" }]} />
      <header>
        <p className="eyebrow">Marketplace · Talent</p>
        <h1 className="hed-2xl">TALENT DIRECTORY</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} act{rows.length === 1 ? "" : "s"}
        </p>
      </header>

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
                r.monthly_listeners ? `${formatNumber(r.monthly_listeners)} mo listeners` : null,
              ]}
              rating={{ avg: r.rating_avg, count: r.rating_count }}
              verified={r.is_verified}
            />
          ))}
        </div>
      )}
    </main>
  );
}
