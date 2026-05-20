import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { getRequestFormatters } from "@/lib/i18n/request";

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
  const fmt = await getRequestFormatters();

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Open RFQs" }]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">Marketplace · Open RFQs</div>
        <h1 className="hed-2xl mt-4">Open RFQs</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {rows.length} live RFQ{rows.length === 1 ? "" : "s"} · vendor prequalification + COI required
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
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
                  r.due_at ? `Due ${fmt.date(r.due_at)}` : null,
                  r.requires_prequalification ? "Prequal required" : null,
                ]}
                badge={r.requires_insurance ? "COI required" : null}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
