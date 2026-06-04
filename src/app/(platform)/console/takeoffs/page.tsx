import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  unit: string;
  total_quantity: number;
  calibration_in_per_ft: number | null;
  created_at: string;
  project: { name: string | null } | null;
  site_plan: { id: string; code: string; title: string } | null;
  cost_code: { code: string; name: string } | null;
  item_count: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.takeoffs.eyebrow", undefined, "Creative")}
          title={t("console.takeoffs.title", undefined, "Takeoffs")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.takeoffs.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data: hdr } = await supabase
    .from("takeoffs")
    .select(
      "id, name, unit, total_quantity, calibration_in_per_ft, created_at, project:project_id(name), site_plan:site_plan_id(id, code, title), cost_code:cost_code_id(code, name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);

  const headers = (hdr ?? []) as unknown as Omit<Row, "item_count">[];

  // Item counts per takeoff.
  const ids = headers.map((h) => h.id);
  const counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: items } = await supabase.from("takeoff_items").select("takeoff_id").in("takeoff_id", ids);
    for (const i of (items ?? []) as { takeoff_id: string }[]) {
      counts[i.takeoff_id] = (counts[i.takeoff_id] ?? 0) + 1;
    }
  }
  const rows: Row[] = headers.map((h) => ({ ...h, item_count: counts[h.id] ?? 0 }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.takeoffs.eyebrow", undefined, "Creative")}
        title={t("console.takeoffs.title", undefined, "Takeoffs")}
        subtitle={t(
          "console.takeoffs.subtitle",
          {
            takeoffs: rows.length,
            takeoffsLabel: rows.length === 1 ? "takeoff" : "takeoffs",
            measurements: rows.reduce((s, r) => s + r.item_count, 0),
            measurementsLabel: rows.length === 1 ? "measurement" : "measurements",
          },
          `${rows.length} takeoff${rows.length === 1 ? "" : "s"} · ${rows.reduce((s, r) => s + r.item_count, 0)} measurement${rows.length === 1 ? "" : "s"} on file`,
        )}
        action={
          <Button href="/console/takeoffs/new" size="sm">
            {t("console.takeoffs.newTakeoff", undefined, "+ New Takeoff")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.takeoffs.metric.takeoffs", undefined, "Takeoffs")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.takeoffs.metric.measurements", undefined, "Measurements")}
            value={fmt.number(rows.reduce((s, r) => s + r.item_count, 0))}
          />
          <MetricCard
            label={t("console.takeoffs.metric.drawingsCalibrated", undefined, "Drawings Calibrated")}
            value={fmt.number(rows.filter((r) => r.calibration_in_per_ft).length)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/takeoffs/${r.id}`}
          emptyLabel={t("console.takeoffs.emptyLabel", undefined, "No takeoffs yet")}
          emptyDescription={t(
            "console.takeoffs.emptyDescription",
            undefined,
            "Quantity takeoffs measure drawings: count points, polyline length, polygon area, volume. Items roll up into the parent takeoff total.",
          )}
          emptyAction={
            <Button href="/console/takeoffs/new" size="sm">
              {t("console.takeoffs.newTakeoff", undefined, "+ New Takeoff")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.takeoffs.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.takeoffs.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "sheet",
              header: t("console.takeoffs.col.sheet", undefined, "Sheet"),
              render: (r) => (r.site_plan ? `${r.site_plan.code} · ${r.site_plan.title}` : "—"),
              accessor: (r) => r.site_plan?.code ?? null,
              className: "font-mono text-xs",
            },
            {
              key: "cost_code",
              header: t("console.takeoffs.col.costCode", undefined, "Cost Code"),
              render: (r) => (r.cost_code ? `${r.cost_code.code} ${r.cost_code.name}` : "—"),
              accessor: (r) => r.cost_code?.code ?? null,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "items",
              header: t("console.takeoffs.col.items", undefined, "Items"),
              render: (r) => fmt.number(r.item_count),
              accessor: (r) => r.item_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "qty",
              header: t("console.takeoffs.col.quantity", undefined, "Quantity"),
              render: (r) => `${Number(r.total_quantity).toFixed(2)} ${r.unit}`,
              accessor: (r) => Number(r.total_quantity),
              className: "font-mono text-xs text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
