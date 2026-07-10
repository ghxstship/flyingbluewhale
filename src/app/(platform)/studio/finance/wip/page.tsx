import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { generateOrgWipSnapshots } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  snapshot_date: string;
  project_id: string | null;
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

export default async function Page({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { t } = await getRequestT();
  const { scope } = await searchParams;
  const tourScope = scope === "tour";
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.wip.eyebrow", undefined, "Finance")}
          title={t("console.finance.wip.title", undefined, "WIP")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.wip.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
      "id, snapshot_date, project_id, contract_amount, approved_change_orders, revised_contract_amount, costs_to_date, estimated_cost_to_complete, estimated_at_completion, percent_complete, earned_revenue, billed_to_date, over_under_billed, bonded, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("snapshot_date", { ascending: false })
    .limit(500);

  let rows = (data ?? []) as unknown as Row[];

  // Tour Settlement lens — money consolidates in Finance, so a tour's per-show
  // P&L is a FILTERED view of WIP, never a parallel table. Restrict to the
  // projects a tour-scoped booking promoted into (talent_offers.project_id where
  // tour_id is set) — the "confirmed hold promotes into the advancing project"
  // link (kit 26). No tour dates → an honest empty lens, not fabricated rows.
  if (tourScope) {
    const { data: tourOffers } = await supabase
      .from("talent_offers")
      .select("project_id")
      .eq("org_id", session.orgId)
      .not("tour_id", "is", null)
      .not("project_id", "is", null);
    const tourProjectIds = new Set(
      ((tourOffers ?? []) as Array<{ project_id: string | null }>).map((o) => o.project_id).filter(Boolean),
    );
    rows = rows.filter((r) => tourProjectIds.has((r as unknown as { project_id?: string }).project_id ?? ""));
  }

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
        eyebrow={t("console.finance.wip.eyebrow", undefined, "Finance")}
        title={
          tourScope
            ? t("console.finance.wip.tourTitle", undefined, "Tour Settlement")
            : t("console.finance.wip.title", undefined, "WIP")
        }
        subtitle={
          tourScope
            ? t(
                "console.finance.wip.tourSubtitle",
                undefined,
                "Per-show P&L across the run · every routed date that promoted into an advancing project.",
              )
            : t(
                "console.finance.wip.subtitle",
                undefined,
                "Work-in-progress snapshots. One row per project per snapshot date. Required for surety / bonding review.",
              )
        }
        action={
          <div className="flex items-center gap-2">
            <form action={generateOrgWipSnapshots}>
              <button
                type="submit"
                className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
              >
                {t("console.finance.wip.generateSnapshots", undefined, "Generate snapshots")}
              </button>
            </form>
            <a
              href="/api/v1/wip/snapshot-pdf"
              target="_blank"
              rel="noopener"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.finance.wip.downloadLatestPdf", undefined, "Download Latest WIP PDF")}
            </a>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.finance.wip.metric.aggregateContract", undefined, "Aggregate Contract")}
            value={fmtMoney(totalContract)}
            accent
          />
          <MetricCard
            label={t("console.finance.wip.metric.overBilledLatest", undefined, "Over-billed — Latest")}
            value={fmtMoney(overBilled)}
          />
          <MetricCard
            label={t("console.finance.wip.metric.underBilledLatest", undefined, "Under-billed — Latest")}
            value={fmtMoney(underBilled)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.finance.wip.emptyLabel", undefined, "No WIP snapshots yet")}
          emptyDescription={t(
            "console.finance.wip.emptyDescription",
            undefined,
            "WIP snapshots are generated monthly per project. Engineering pass forthcoming — schema, RLS, and admin view are live.",
          )}
          emptyAction={
            <Button href="/studio/finance/wip/new" size="sm">
              {t("console.finance.wip.addSnapshot", undefined, "+ Snapshot")}
            </Button>
          }
          columns={[
            {
              key: "project",
              header: t("console.finance.wip.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "date",
              header: t("console.finance.wip.col.snapshot", undefined, "Snapshot"),
              render: (r) =>
                fmt.dateParts(r.snapshot_date + "T00:00:00", { year: "numeric", month: "short", day: "numeric" }),
              accessor: (r) => r.snapshot_date,
              className: "font-mono text-xs",
            },
            {
              key: "contract",
              header: t("console.finance.wip.col.contract", undefined, "Contract — Incl. CO"),
              render: (r) => fmtMoney(Number(r.revised_contract_amount)),
              accessor: (r) => Number(r.revised_contract_amount),
              className: "font-mono text-xs text-right",
            },
            {
              key: "pct",
              header: t("console.finance.wip.col.pctComp", undefined, "% Comp"),
              render: (r) => `${Number(r.percent_complete).toFixed(1)}%`,
              accessor: (r) => Number(r.percent_complete),
              className: "font-mono text-xs text-right",
            },
            {
              key: "earned",
              header: t("console.finance.wip.col.earned", undefined, "Earned"),
              render: (r) => fmtMoney(Number(r.earned_revenue)),
              accessor: (r) => Number(r.earned_revenue),
              className: "font-mono text-xs text-right",
            },
            {
              key: "billed",
              header: t("console.finance.wip.col.billed", undefined, "Billed"),
              render: (r) => fmtMoney(Number(r.billed_to_date)),
              accessor: (r) => Number(r.billed_to_date),
              className: "font-mono text-xs text-right",
            },
            {
              key: "ou",
              header: t("console.finance.wip.col.overUnder", undefined, "Over / Under"),
              render: (r) => {
                const v = Number(r.over_under_billed);
                if (v === 0) return "—";
                return (
                  <span className={v > 0 ? "text-[var(--p-warning)]" : "text-[var(--p-info)]"}>
                    {v > 0
                      ? t("console.finance.wip.overPrefix", undefined, "Over ")
                      : t("console.finance.wip.underPrefix", undefined, "Under ")}
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
