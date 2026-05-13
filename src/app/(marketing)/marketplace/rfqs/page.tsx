import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Open RFQs — Production Marketplace",
  description: "Browse open requests for quotes from production operators in the ATLVS network.",
  path: "/marketplace/rfqs",
});

type Row = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  trade_categories: string[];
  region: string | null;
  budget_band: string | null;
  due_at: string | null;
  org_name: string;
  org_slug: string;
  requires_prequalification: boolean;
  requires_insurance: boolean;
};

export default async function Page() {
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_rfq_marketplace")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Open RFQs" }]} />
      <header>
        <p className="eyebrow">Marketplace · Open RFQs</p>
        <h1 className="hed-2xl">OPEN RFQS</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {rows.length} live RFQ{rows.length === 1 ? "" : "s"} · vendor prequalification + COI required
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="surface p-6 text-sm text-[var(--text-secondary)]">No open RFQs at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <MarketplaceCard
              key={r.id}
              href={`/marketplace/rfqs/${r.public_slug}`}
              title={r.title}
              subtitle={r.org_name}
              tags={r.trade_categories}
              meta={[
                r.region,
                r.budget_band,
                r.due_at ? `Due ${new Date(r.due_at).toLocaleDateString()}` : null,
                r.requires_prequalification ? "Prequal required" : null,
              ]}
              badge={r.requires_insurance ? "COI required" : null}
            />
          ))}
        </div>
      )}
    </main>
  );
}
