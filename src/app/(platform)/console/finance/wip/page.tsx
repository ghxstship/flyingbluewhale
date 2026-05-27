import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { generateOrgWipSnapshots } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  snapshot_date: string;
  contract_amount: number;
  approved_change_orders: number;
  revised_contract_amount: number;
  costs_to_date: number;
  estimated_cost_to_complete: number;
  estimated_at_completion: number;
  percent_complete: number;
  earned_revenue: number;
  billed_to_date: number;
  over_under_billed: number;
  bonded: boolean;
  project: { name: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="WIP" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  // Fetch the latest snapshot per project (uniqueness guard is (project_id,
  // snapshot_date), so distinct on project_id sorted by date desc gives latest).
  const { data } = await supabase
    .from("wip_snapshots")
    .select(
      "id, snapshot_date, contract_amount, approved_change_orders, revised_contract_amount, costs_to_date, estimated_cost_to_complete, estimated_at_completion, percent_complete, earned_revenue, billed_to_date, over_under_billed, bonded, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("snapshot_date", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as Row[];

  const overBilled = rows
    .filter((r) => Number(r.over_under_billed) > 0)
    .reduce((s, r) => s + Number(r.over_under_billed), 0);
  const underBilled = rows
    .filter((r) => Number(r.over_under_billed) < 0)
    .reduce((s, r) => s + Math.abs(Number(r.over_under_billed)), 0);
  const totalContract = rows.reduce((s, r) => s + Number(r.revised_contract_amount), 0);

  function fmtMoney(n: number): string {
    return fmt.money(Math.round(n * 100));
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="WIP"
        subtitle="Work-in-progress snapshots. One row per project per snapshot date. Required for surety / bonding review."
        action={
          <div className="flex items-center gap-2">
            <form action={generateOrgWipSnapshots}>
              <button
                type="submit"
                className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
              >
                Generate snapshots
              </button>
            </form>
            <a
              href="/api/v1/wip/snapshot-pdf"
              target="_blank"
              rel="noopener"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Download Latest WIP PDF
            </a>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Aggregate Contract" value={fmtMoney(totalContract)} accent />
          <MetricCard label="Over-billed (latest)" value={fmtMoney(overBilled)} />
          <MetricCard label="Under-billed (latest)" value={fmtMoney(underBilled)} />
        </div>
        <DataTable<Row>
          rows={rows}
          emptyLabel="No WIP snapshots yet"
          emptyDescription="WIP snapshots are generated monthly per project. Engineering pass forthcoming — schema, RLS, and admin view are live."
          emptyAction={
            <Button href="/console/finance/wip/new" size="sm">
              + Snapshot
            </Button>
          }
          columns={[
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "date",
              header: "Snapshot",
              render: (r) =>
                fmt.dateParts(r.snapshot_date + "T00:00:00", { year: "numeric", month: "short", day: "numeric" }),
              accessor: (r) => r.snapshot_date,
              className: "font-mono text-xs",
            },
            {
              key: "contract",
              header: "Contract (incl. CO)",
              render: (r) => fmtMoney(Number(r.revised_contract_amount)),
              accessor: (r) => Number(r.revised_contract_amount),
              className: "font-mono text-xs text-right",
            },
            {
              key: "pct",
              header: "% Comp",
              render: (r) => `${Number(r.percent_complete).toFixed(1)}%`,
              accessor: (r) => Number(r.percent_complete),
              className: "font-mono text-xs text-right",
            },
            {
              key: "earned",
              header: "Earned",
              render: (r) => fmtMoney(Number(r.earned_revenue)),
              accessor: (r) => Number(r.earned_revenue),
              className: "font-mono text-xs text-right",
            },
            {
              key: "billed",
              header: "Billed",
              render: (r) => fmtMoney(Number(r.billed_to_date)),
              accessor: (r) => Number(r.billed_to_date),
              className: "font-mono text-xs text-right",
            },
            {
              key: "ou",
              header: "Over / Under",
              render: (r) => {
                const v = Number(r.over_under_billed);
                if (v === 0) return "—";
                return (
                  <span className={v > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-info)]"}>
                    {v > 0 ? "Over " : "Under "}
                    {fmtMoney(Math.abs(v))}
                  </span>
                );
              },
              accessor: (r) => Number(r.over_under_billed),
              className: "font-mono text-xs text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
