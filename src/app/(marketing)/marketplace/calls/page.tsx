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
  title: "Open Calls — Casting & Production Submissions",
  description: "Casting calls and open RFPs for live production, talent, and creative.",
  path: "/marketplace/calls",
});

type Row = {
  id: string;
  public_slug: string;
  kind: string;
  title: string;
  description: string | null;
  genre_tags: string[];
  trade_categories: string[];
  region: string | null;
  venue_type: string | null;
  performance_date: string | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  submission_count: number;
  org_name: string;
};

export default async function Page() {
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { data } = await supabase
      .from("public_open_calls")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Open Calls" }]} />
      <header>
        <p className="eyebrow">Marketplace · Open Calls</p>
        <h1 className="hed-2xl">OPEN CALLS</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} active call{rows.length === 1 ? "" : "s"}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="surface p-6 text-sm text-[var(--text-secondary)]">No active calls at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <MarketplaceCard
              key={r.id}
              href={`/marketplace/calls/${r.public_slug}`}
              title={r.title}
              subtitle={r.org_name}
              tags={[...r.genre_tags, ...r.trade_categories]}
              badge={r.kind.replace("_", " ")}
              meta={[
                r.region,
                r.venue_type,
                r.performance_date ? `Show ${new Date(r.performance_date).toLocaleDateString()}` : null,
                r.deadline_at ? `Closes ${new Date(r.deadline_at).toLocaleDateString()}` : null,
                formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
              ]}
            />
          ))}
        </div>
      )}
    </main>
  );
}
