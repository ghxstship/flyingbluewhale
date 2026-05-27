import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toTitle } from "@/lib/format";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

/**
 * Cross-entity consolidation dashboard.
 *
 * Reads v_consolidated_ar (Round 74 view) — already applies ownership_pct
 * for proportional consolidation and zeros unconsolidated entities. The
 * page reduces by entity_id and renders one card per legal entity, plus a
 * combined "group rollup" tile that sums into the org's default currency.
 */

type ConsolidatedRow = {
  entity_id: string | null;
  entity_legal_name: string | null;
  entity_short_code: string | null;
  consolidation_method: "full" | "equity" | "proportional" | "none" | null;
  ownership_pct: number | null;
  base_currency: string | null;
  base_amount_cents: number | null;
  consolidated_amount_cents: number | null;
  amount_cents: number;
  currency: string;
  invoice_status: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Consolidation" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const [{ data: org }, { data: invoiceData }] = await Promise.all([
    supabase.from("orgs").select("default_currency").eq("id", session.orgId).maybeSingle(),
    supabase
      .from("v_consolidated_ar")
      .select(
        "entity_id, entity_legal_name, entity_short_code, consolidation_method, ownership_pct, base_currency, base_amount_cents, consolidated_amount_cents, amount_cents, currency, invoice_status",
      )
      .eq("org_id", session.orgId),
  ]);

  const orgCurrency = (org as { default_currency: string } | null)?.default_currency ?? "USD";
  const rows = (invoiceData ?? []) as unknown as ConsolidatedRow[];

  // Group by entity_id (null = unassigned)
  type Bucket = {
    entity_id: string | null;
    legal_name: string | null;
    short_code: string | null;
    method: ConsolidatedRow["consolidation_method"];
    ownership_pct: number | null;
    base_currency: string | null;
    base_total: number;
    consolidated_total: number;
    invoice_count: number;
    paid_total: number;
    outstanding_total: number;
  };
  const buckets = new Map<string, Bucket>();
  for (const r of rows) {
    const key = r.entity_id ?? "__unassigned__";
    let b = buckets.get(key);
    if (!b) {
      b = {
        entity_id: r.entity_id,
        legal_name: r.entity_legal_name,
        short_code: r.entity_short_code,
        method: r.consolidation_method,
        ownership_pct: r.ownership_pct,
        base_currency: r.base_currency,
        base_total: 0,
        consolidated_total: 0,
        invoice_count: 0,
        paid_total: 0,
        outstanding_total: 0,
      };
      buckets.set(key, b);
    }
    const base = Number(r.base_amount_cents ?? r.amount_cents);
    const cons = Number(r.consolidated_amount_cents ?? base);
    b.base_total += base;
    b.consolidated_total += cons;
    b.invoice_count += 1;
    if (r.invoice_status === "paid") b.paid_total += cons;
    else if (r.invoice_status !== "void") b.outstanding_total += cons;
  }
  const bucketList = [...buckets.values()].sort((a, b) => b.consolidated_total - a.consolidated_total);

  // Group rollup — sum all consolidated_total across entities.
  // Note: this is naive currency-blind aggregation; v_consolidated_ar
  // already normalized each row to its entity base currency.
  const groupConsolidated = bucketList.reduce((s, b) => s + b.consolidated_total, 0);
  const groupOutstanding = bucketList.reduce((s, b) => s + b.outstanding_total, 0);
  const groupPaid = bucketList.reduce((s, b) => s + b.paid_total, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Consolidation"
        subtitle={`${bucketList.length} Entit${bucketList.length === 1 ? "y" : "ies"} · Group rollup in entity base currencies`}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-4">
          <MetricCard label="Entities" value={bucketList.length} accent />
          <MetricCard label="Group consolidated" value={formatMoney(groupConsolidated, orgCurrency)} />
          <MetricCard label="Group outstanding" value={formatMoney(groupOutstanding, orgCurrency)} />
          <MetricCard label="Group paid" value={formatMoney(groupPaid, orgCurrency)} />
        </div>

        <div className="surface p-5 text-xs text-[var(--text-secondary)]">
          <p>
            <strong className="text-[var(--text-primary)]">How consolidation works:</strong> the view{" "}
            <code className="font-mono">v_consolidated_ar</code> applies each entity&apos;s ownership % for proportional
            consolidation, zeros out entities flagged <code className="font-mono">consolidation_method = none</code>,
            and passes through <code className="font-mono">base_amount_cents</code> for full/equity. FX rates are
            snapshotted at invoice insert (see <code className="font-mono">fx_rate_to_base</code> on{" "}
            <code className="font-mono">invoices</code>). Refresh the daily rate store via{" "}
            <code className="font-mono">POST /api/v1/integrations/fx/refresh</code>.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {bucketList.map((b) => (
            <Link
              key={b.entity_id ?? "__unassigned__"}
              href={b.entity_id ? `/console/finance/entities/${b.entity_id}` : "/console/finance/entities"}
              className="surface hover-lift p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs tracking-wider text-[var(--text-secondary)] uppercase">
                    {b.short_code ?? "Unassigned"}
                  </div>
                  <div className="mt-0.5 text-base font-semibold">{b.legal_name ?? "Unassigned invoices"}</div>
                </div>
                {b.method ? <Badge variant="info">{toTitle(b.method)}</Badge> : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[var(--text-secondary)]">Base</div>
                  <div className="font-mono text-sm">{formatMoney(b.base_total, b.base_currency ?? orgCurrency)}</div>
                </div>
                <div>
                  <div className="text-[var(--text-secondary)]">Consolidated</div>
                  <div className="font-mono text-sm">
                    {formatMoney(b.consolidated_total, b.base_currency ?? orgCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-secondary)]">Ownership</div>
                  <div className="font-mono text-sm">
                    {b.ownership_pct != null ? `${Number(b.ownership_pct).toFixed(2)}%` : "—"}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{b.invoice_count} invoices</span>
                <span className="font-mono">
                  <span className="text-amber-600">
                    {formatMoney(b.outstanding_total, b.base_currency ?? orgCurrency)}
                  </span>
                  {" · "}
                  <span className="text-emerald-600">{formatMoney(b.paid_total, b.base_currency ?? orgCurrency)}</span>
                </span>
              </div>
            </Link>
          ))}
          {bucketList.length === 0 ? (
            <EmptyState
              title="No entities yet"
              description="Create a legal entity to start consolidating financials."
              action={
                <Link href="/console/finance/entities/new" className="btn btn-primary text-xs">
                  Create Entity
                </Link>
              }
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
