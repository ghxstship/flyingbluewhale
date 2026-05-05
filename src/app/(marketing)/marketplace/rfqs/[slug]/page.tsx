import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";

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
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase.from("public_rfq_marketplace").select("*").eq("public_slug", slug).maybeSingle();
  if (!data) return notFound();
  const r = data as Rfq;

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Open RFQs", href: "/marketplace/rfqs" },
          { label: r.title },
        ]}
      />
      <header className="space-y-2">
        <p className="eyebrow">RFQ · {r.org_name}</p>
        <h1 className="hed-2xl">{r.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
          {r.region && <Badge variant="muted">{r.region}</Badge>}
          {r.budget_band && <Badge variant="muted">{r.budget_band}</Badge>}
          {r.due_at && <Badge variant="warning">Due {new Date(r.due_at).toLocaleDateString()}</Badge>}
        </div>
      </header>

      <section className="surface p-5">
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Scope</h2>
        <div className="text-sm whitespace-pre-wrap">{r.description ?? "—"}</div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Trades</h2>
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
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Compliance Gates</h2>
          <ul className="space-y-1 text-sm">
            <li>{r.requires_prequalification ? "✓" : "—"} Prequalification</li>
            <li>{r.requires_insurance ? "✓" : "—"} Insurance (COI)</li>
            <li>{r.requires_w9 ? "✓" : "—"} W-9 / W-8</li>
            <li>{r.nda_required ? "✓" : "—"} NDA acceptance</li>
          </ul>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button href={`/login?redirect=/marketplace/rfqs/${r.public_slug}`}>Bid on This RFQ</Button>
        <Button href="/signup" variant="ghost">
          Need an account?
        </Button>
      </div>
    </main>
  );
}
