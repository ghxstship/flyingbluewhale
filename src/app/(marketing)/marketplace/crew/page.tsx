import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatFeeRange } from "@/lib/marketplace";
import { DEFAULT_CURRENCY } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Crew Directory — Vetted Production Crew",
  description: "Vetted crew profiles — roles, gear, unions, day rates, availability.",
  path: "/marketplace/crew",
});

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
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Crew" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Marketplace · Crew</div>
        <h1 className="hed-2xl mt-4">Crew Directory</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {rows.length} vetted profile{rows.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">No published crew yet.</div>
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
                  formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, DEFAULT_CURRENCY) + "/day",
                  r.unions.join(", ") || null,
                  r.travel_radius_km ? `${r.travel_radius_km} km radius` : null,
                  r.availability_open ? "Available now" : null,
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
