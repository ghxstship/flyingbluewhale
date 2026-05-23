import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASS_BY_CODE } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type Row = {
  // The view groups by (org_id, project_id, class_code, reason) so we
  // synthesise a stable id from those keys for DataTable.
  id: string;
  org_id: string;
  project_id: string | null;
  class_code: number;
  reason: string;
  entries: number;
  qty_delta_total: number | null;
  cost_delta_cents_total: number | null;
};

export default async function VariancePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="Variance Ledger" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_xpms_variance_summary")
    .select("org_id, project_id, class_code, reason, entries, qty_delta_total, cost_delta_cents_total")
    .eq("org_id", session.orgId);
  const raw = (data ?? []) as Omit<Row, "id">[];
  const rows: Row[] = raw.map((r) => ({
    ...r,
    id: `${r.project_id ?? "_"}:${r.class_code}:${r.reason}`,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · Variance"
        title="Variance Ledger"
        subtitle="Planned vs. actual delta, with reason codes."
      />
      <div className="page-content">
        <DataTable<Row>
          tableId="xpms.variance"
          rows={rows}
          searchable
          emptyLabel="No variance entries yet"
          emptyDescription="Variance accrues when a TPC atom diverges from its UAC origin (no-shows, substitutions, quantity deltas, spec changes, weather, …)."
          columns={[
            {
              key: "class",
              header: "Class",
              render: (r) => {
                const c = XPMS_CLASS_BY_CODE[r.class_code];
                return c ? <span style={{ color: c.accent }}>{c.name}</span> : <>{r.class_code}</>;
              },
              accessor: (r) => XPMS_CLASS_BY_CODE[r.class_code]?.name ?? String(r.class_code),
              className: "text-xs",
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "reason",
              header: "Reason",
              render: (r) => <Badge variant="muted">{r.reason}</Badge>,
              accessor: (r) => r.reason,
              sortable: true,
              filterable: true,
              groupable: true,
            },
            {
              key: "entries",
              header: "Entries",
              render: (r) => r.entries,
              accessor: (r) => r.entries,
              className: "text-right font-mono text-xs",
              sortable: true,
            },
            {
              key: "qty_delta",
              header: "Qty Δ",
              render: (r) => r.qty_delta_total ?? 0,
              accessor: (r) => Number(r.qty_delta_total ?? 0),
              className: "text-right font-mono text-xs",
              sortable: true,
            },
            {
              key: "cost_delta",
              header: "Cost Δ (cents)",
              render: (r) => r.cost_delta_cents_total ?? 0,
              accessor: (r) => Number(r.cost_delta_cents_total ?? 0),
              className: "text-right font-mono text-xs",
              sortable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
