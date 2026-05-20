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
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_open_calls")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }
  const fmt = await getRequestFormatters();

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Open Calls" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Marketplace · Open Calls</div>
        <h1 className="hed-2xl mt-4">Open Calls</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {rows.length} active call{rows.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
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
                  r.performance_date ? `Show ${fmt.date(r.performance_date)}` : null,
                  r.deadline_at ? `Closes ${fmt.date(r.deadline_at)}` : null,
                  formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
                ]}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
