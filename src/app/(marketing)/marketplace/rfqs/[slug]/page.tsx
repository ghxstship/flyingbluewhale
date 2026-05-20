import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Rfq = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  trade_categories: string[];
  region: string | null;
  budget_band: string | null;
  due_at: string | null;
  requires_prequalification: boolean;
  requires_insurance: boolean;
  requires_w9: boolean;
  nda_required: boolean;
  org_name: string;
  org_slug: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_rfq_marketplace").select("*").eq("public_slug", slug).maybeSingle();
  if (!data) return notFound();
  const r = data as Rfq;
  const fmt = await getRequestFormatters();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Open RFQs", href: "/marketplace/rfqs" },
          { label: r.title },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">RFQ · {r.org_name}</div>
        <h1 className="hed-2xl mt-4">{r.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
          {r.region && <Badge variant="muted">{r.region}</Badge>}
          {r.budget_band && <Badge variant="muted">{r.budget_band}</Badge>}
          {r.due_at && <Badge variant="warning">Due {fmt.date(r.due_at)}</Badge>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        <div className="surface p-5">
          <h2 className="hed-md mb-3">Scope</h2>
          <div className="text-sm whitespace-pre-wrap">{r.description ?? "—"}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">Trades</h2>
            <div className="flex flex-wrap gap-1.5">
              {r.trade_categories.length === 0 ? (
                <span className="text-sm text-[var(--text-secondary)]">—</span>
              ) : (
                r.trade_categories.map((t) => (
                  <Badge key={t} variant="muted">
                    {t}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">Compliance Gates</h2>
            <ul className="space-y-1 text-sm">
              <li>{r.requires_prequalification ? "✓" : "—"} Prequalification</li>
              <li>{r.requires_insurance ? "✓" : "—"} Insurance (COI)</li>
              <li>{r.requires_w9 ? "✓" : "—"} W-9 / W-8</li>
              <li>{r.nda_required ? "✓" : "—"} NDA acceptance</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/login?redirect=/marketplace/rfqs/${r.public_slug}`}>Bid on This RFQ</Button>
          <Button href="/signup" variant="ghost">
            Need an account?
          </Button>
        </div>
      </section>
    </>
  );
}
