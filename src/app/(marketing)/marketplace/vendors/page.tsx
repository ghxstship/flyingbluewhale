import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
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
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { data } = await supabase
      .from("public_vendor_directory")
      .select("*")
      .order("verified_at", { ascending: false, nullsFirst: false })
      .order("rating_count", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Vendors" }]} />
      <header>
        <p className="eyebrow">Marketplace · Vendors</p>
        <h1 className="hed-2xl">VENDOR DIRECTORY</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} vetted vendor{rows.length === 1 ? "" : "s"}
        </p>
      </header>

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
    </main>
  );
}
