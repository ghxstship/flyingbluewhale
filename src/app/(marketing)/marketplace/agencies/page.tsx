import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Agency Directory — Booking Agencies",
  description: "Verified booking agencies on the ATLVS network.",
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
    <>
      <Breadcrumbs
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Agencies" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Marketplace · Agencies</div>
        <h1 className="hed-2xl mt-4">Agency Directory</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {rows.length} agenc{rows.length === 1 ? "y" : "ies"}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">No published agencies yet.</div>
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
      </section>
    </>
  );
}
