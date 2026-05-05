import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatFeeRange } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Crew Gigs — Production Job Board",
  description: "Paid production crew gigs from operators in the LYTEHAUS network.",
  path: "/marketplace/gigs",
});

type Row = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  role_taxonomy: string[];
  region: string | null;
  city: string | null;
  country: string | null;
  employment_type: string;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  posting_type: string;
  union_required: string[];
  travel_paid: boolean;
  lodging_provided: boolean;
  applicant_count: number;
  expires_at: string | null;
  org_name: string;
  org_slug: string;
};

export default async function Page() {
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { data } = await supabase
      .from("public_job_board")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Crew Gigs" }]} />
      <header>
        <p className="eyebrow">Marketplace · Crew Gigs</p>
        <h1 className="hed-2xl">CREW GIGS</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} live gig{rows.length === 1 ? "" : "s"} · single shows, tour legs, recurring
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="surface p-6 text-sm text-[var(--text-secondary)]">No live gigs at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <MarketplaceCard
              key={r.id}
              href={`/marketplace/gigs/${r.public_slug}`}
              title={r.title}
              subtitle={r.org_name}
              tags={r.role_taxonomy}
              meta={[
                [r.city, r.region, r.country].filter(Boolean).join(", ") || null,
                formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency) + "/day",
                r.posting_type,
                r.travel_paid ? "Travel paid" : null,
                r.lodging_provided ? "Lodging provided" : null,
              ]}
              badge={r.union_required.length > 0 ? r.union_required[0] : null}
            />
          ))}
        </div>
      )}
    </main>
  );
}
