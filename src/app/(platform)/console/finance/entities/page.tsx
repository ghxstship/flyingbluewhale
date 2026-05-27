import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ConsolidationMethod = "full" | "equity" | "proportional" | "none";
type ConsolidationState = "active" | "divested" | "dormant" | "pending";

type Row = {
  id: string;
  legal_name: string;
  short_code: string;
  base_currency: string;
  jurisdiction: string | null;
  tax_id: string | null;
  consolidation_method: ConsolidationMethod;
  ownership_pct: number;
  consolidation_state: ConsolidationState;
  effective_from: string;
  effective_to: string | null;
  parent_entity_id: string | null;
  created_at: string;
};

const STATE_TONE: Record<ConsolidationState, "muted" | "info" | "warning" | "success"> = {
  active: "success",
  pending: "info",
  dormant: "muted",
  divested: "warning",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Legal Entities" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("org_entities")
    .select(
      "id, legal_name, short_code, base_currency, jurisdiction, tax_id, consolidation_method, ownership_pct, consolidation_state, effective_from, effective_to, parent_entity_id, created_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const active = rows.filter((r) => r.consolidation_state === "active").length;
  const currencies = new Set(rows.map((r) => r.base_currency)).size;

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Legal Entities"
        subtitle={`${rows.length} Entit${rows.length === 1 ? "y" : "ies"} · ${active} Active · ${currencies} Base Currenc${currencies === 1 ? "y" : "ies"}`}
        action={
          <Button href="/console/finance/entities/new" size="sm">
            + New Entity
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total" value={fmt.number(rows.length)} accent />
          <MetricCard label="Active" value={fmt.number(active)} />
          <MetricCard label="Currencies" value={fmt.number(currencies)} />
          <MetricCard label="Subsidiaries" value={fmt.number(rows.filter((r) => r.parent_entity_id).length)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/entities/${r.id}`}
          emptyLabel="No legal entities yet"
          emptyDescription="One org may operate multiple legal entities. Create one per LLC / Ltd / Pty / subsidiary; financial-impact rows (invoices, expenses, pay-apps) carry the entity_id + an FX-snapshot column for cross-currency consolidation."
          emptyAction={
            <Button href="/console/finance/entities/new" size="sm">
              + New Entity
            </Button>
          }
          columns={[
            {
              key: "legal_name",
              header: "Legal Name",
              render: (r) => <span className="font-medium">{r.legal_name}</span>,
            },
            {
              key: "short_code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{r.short_code}</span>,
            },
            {
              key: "base_currency",
              header: "Base CCY",
              render: (r) => <span className="font-mono text-xs">{r.base_currency}</span>,
            },
            { key: "jurisdiction", header: "Jurisdiction", render: (r) => r.jurisdiction ?? "—" },
            { key: "method", header: "Method", render: (r) => toTitle(r.consolidation_method) },
            { key: "ownership", header: "Ownership", render: (r) => `${Number(r.ownership_pct).toFixed(2)}%` },
            {
              key: "state",
              header: "State",
              render: (r) => (
                <Badge variant={STATE_TONE[r.consolidation_state]}>{toTitle(r.consolidation_state)}</Badge>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
