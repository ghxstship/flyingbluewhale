import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Agency Directory — Booking Agencies",
  description: "Verified booking agencies on the LYTEHAUS network.",
  path: "/marketplace/agencies",
});

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

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Agencies" }]} />
      <header>
        <p className="eyebrow">Marketplace · Agencies</p>
        <h1 className="hed-2xl">AGENCY DIRECTORY</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} agenc{rows.length === 1 ? "y" : "ies"}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="surface p-6 text-sm text-[var(--text-secondary)]">No published agencies yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <MarketplaceCard
              key={r.id}
              href={`/marketplace/agencies/${r.public_handle}`}
              title={r.display_name}
              subtitle={r.bio ? r.bio.slice(0, 80) : undefined}
              meta={[
                `${r.artist_count} artist${r.artist_count === 1 ? "" : "s"}`,
                `${(r.default_commission_bps / 100).toFixed(2)}% default commission`,
                r.website_url,
              ]}
              verified={r.is_verified}
            />
          ))}
        </div>
      )}
    </main>
  );
}
