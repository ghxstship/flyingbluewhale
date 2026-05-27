import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toTitle } from "@/lib/format";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Entity = {
  id: string;
  legal_name: string;
  short_code: string;
  base_currency: string;
  jurisdiction: string | null;
  tax_id: string | null;
  consolidation_method: "full" | "equity" | "proportional" | "none";
  ownership_pct: number;
  consolidation_state: "active" | "pending" | "dormant" | "divested";
  effective_from: string;
  effective_to: string | null;
  parent_entity_id: string | null;
  parent: { legal_name: string; short_code: string } | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const { id } = await params;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data } = await supabase
    .from("org_entities")
    .select(
      "id, legal_name, short_code, base_currency, jurisdiction, tax_id, consolidation_method, ownership_pct, consolidation_state, effective_from, effective_to, parent_entity_id, parent:parent_entity_id(legal_name, short_code)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const e = data as unknown as Entity | null;
  if (!e) notFound();

  const { data: invoiceRollup } = await supabase
    .from("v_consolidated_ar")
    .select("base_amount_cents, consolidated_amount_cents, invoice_status")
    .eq("entity_id", e.id);

  type Row = {
    base_amount_cents: number | null;
    consolidated_amount_cents: number | null;
    invoice_status: string;
  };
  const rows = (invoiceRollup ?? []) as unknown as Row[];

  const baseTotal = rows.reduce((s, r) => s + Number(r.base_amount_cents ?? 0), 0);
  const consolidatedTotal = rows.reduce((s, r) => s + Number(r.consolidated_amount_cents ?? 0), 0);
  const paid = rows
    .filter((r) => r.invoice_status === "paid")
    .reduce((s, r) => s + Number(r.consolidated_amount_cents ?? 0), 0);
  const outstanding = rows
    .filter((r) => r.invoice_status !== "paid" && r.invoice_status !== "void")
    .reduce((s, r) => s + Number(r.consolidated_amount_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Finance · Entity"
        title={e.legal_name}
        subtitle={`${e.short_code} · ${e.base_currency}${e.jurisdiction ? ` · ${e.jurisdiction}` : ""}`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label="State"
            value={toTitle(e.consolidation_state)}
            accent={e.consolidation_state === "active"}
          />
          <MetricCard label="Method" value={toTitle(e.consolidation_method)} />
          <MetricCard label="Ownership" value={`${Number(e.ownership_pct).toFixed(2)}%`} />
          <MetricCard label="Invoices" value={rows.length} />
        </div>
        <div className="metric-grid-4">
          <MetricCard label={`Base (${e.base_currency})`} value={formatMoney(baseTotal, e.base_currency)} accent />
          <MetricCard label="Consolidated" value={formatMoney(consolidatedTotal, e.base_currency)} />
          <MetricCard label="Outstanding" value={formatMoney(outstanding, e.base_currency)} />
          <MetricCard label="Paid" value={formatMoney(paid, e.base_currency)} />
        </div>

        <div className="surface p-5">
          <div className="mb-3 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            Hierarchy
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Parent entity</div>
              <div className="text-sm font-medium">
                {e.parent ? (
                  `${e.parent.legal_name} (${e.parent.short_code})`
                ) : (
                  <Badge variant="muted">Top-level</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Effective window</div>
              <div className="font-mono text-sm">
                {e.effective_from}
                {e.effective_to ? ` → ${e.effective_to}` : " → present"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Tax ID</div>
              <div className="font-mono text-sm">{e.tax_id ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Base currency</div>
              <div className="font-mono text-sm">{e.base_currency}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
