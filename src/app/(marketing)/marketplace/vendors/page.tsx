import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Vendor Directory — Production Vendors",
  description: "Vetted production vendors with current insurance, W-9, and prequalification.",
  path: "/marketplace/vendors",
});

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
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_vendor_directory")
      .select("*")
      .order("verified_at", { ascending: false, nullsFirst: false })
      .order("rating_count", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Vendors" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Marketplace · Vendors</div>
        <h1 className="hed-2xl mt-4">Vendor Directory</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {rows.length} vetted vendor{rows.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">No published vendors yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/vendors/${r.public_handle}`}
                title={r.name}
                subtitle={r.tagline ?? undefined}
                tags={r.trade_categories}
                meta={[r.regions.join(", ") || null, r.year_founded ? `Est. ${r.year_founded}` : null]}
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
