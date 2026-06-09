import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

type ForecastRow = {
  id: string;
  forecast_date: string;
  role_tag: string | null;
  expected_hours: number;
  expected_cost_cents: number;
  actual_hours: number | null;
  actual_cost_cents: number | null;
  notes: string | null;
  project_name: string | null;
};

function pctVariance(expected: number, actual: number | null): number | null {
  if (actual == null || expected === 0) return null;
  return Math.round(((actual - expected) / expected) * 100);
}

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.labor.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.labor.title", undefined, "Labor Demand")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Rolling 90-day window
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const until = new Date();
  until.setDate(until.getDate() + 60);

  const { data: rawRows } = await supabase
    .from("workforce_demand_forecasts")
    .select("id, forecast_date, role_tag, expected_hours, expected_cost_cents, actual_hours, actual_cost_cents, notes, project_id")
    .eq("org_id", session.orgId)
    .gte("forecast_date", since.toISOString().slice(0, 10))
    .lte("forecast_date", until.toISOString().slice(0, 10))
    .order("forecast_date", { ascending: true })
    .limit(500);

  const rows: ForecastRow[] = ((rawRows ?? []) as ForecastRow[]).map((r) => ({
    ...r,
    project_name: null, // hydrated below
  }));

  // Aggregate metrics
  const totalExpectedHours = rows.reduce((s, r) => s + Number(r.expected_hours), 0);
  const totalActualHours = rows.filter((r) => r.actual_hours != null).reduce((s, r) => s + Number(r.actual_hours), 0);
  const totalExpectedCost = rows.reduce((s, r) => s + Number(r.expected_cost_cents), 0);
  const variance = pctVariance(totalExpectedHours, totalActualHours || null);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.labor.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.labor.title", undefined, "Labor Demand")}
        subtitle={t(
          "console.workforce.labor.subtitle",
          { count: rows.length },
          `${rows.length} forecast rows · rolling 90-day window`,
        )}
        action={
          <Button href="/console/workforce/labor/new" size="sm">
            {t("console.workforce.labor.new", undefined, "+ Add Forecast")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.workforce.labor.metrics.expectedHours", undefined, "Expected Hours")}
            value={fmt.number(Math.round(totalExpectedHours))}
            accent
          />
          <MetricCard
            label={t("console.workforce.labor.metrics.actualHours", undefined, "Actual Hours")}
            value={fmt.number(Math.round(totalActualHours))}
          />
          <MetricCard
            label={t("console.workforce.labor.metrics.variance", undefined, "Variance")}
            value={variance != null ? `${variance > 0 ? "+" : ""}${variance}%` : "—"}
          />
          <MetricCard
            label={t("console.workforce.labor.metrics.laborBudget", undefined, "Labor Budget")}
            value={fmt.currency(totalExpectedCost / 100)}
          />
        </div>

        <div className="text-[10px] text-[var(--p-text-2)]">
          {t(
            "console.workforce.labor.description",
            undefined,
            "Projected vs actual labor hours and cost per date and role. Populate expected_hours via your scheduling data; update actual_hours after each shift closes. Negative variance = under-schedule; positive = overage.",
          )}
        </div>

        <DataTable<ForecastRow>
          rows={rows}
          emptyLabel={t("console.workforce.labor.emptyLabel", undefined, "No forecast rows yet")}
          emptyDescription={t(
            "console.workforce.labor.emptyDescription",
            undefined,
            "Add forecasts for upcoming event dates to track projected vs actual labor costs.",
          )}
          emptyAction={
            <Button href="/console/workforce/labor/new" size="sm">
              {t("console.workforce.labor.new", undefined, "+ Add Forecast")}
            </Button>
          }
          columns={[
            {
              key: "date",
              header: t("console.workforce.labor.columns.date", undefined, "Date"),
              render: (r) =>
                fmt.dateParts(r.forecast_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.forecast_date,
              className: "font-mono text-xs",
            },
            {
              key: "role",
              header: t("console.workforce.labor.columns.role", undefined, "Role"),
              render: (r) =>
                r.role_tag ? (
                  <Badge variant="muted">{r.role_tag}</Badge>
                ) : (
                  <span className="text-[var(--p-text-2)]">All</span>
                ),
              accessor: (r) => r.role_tag ?? "",
              filterable: true,
              groupable: true,
            },
            {
              key: "exp_hours",
              header: t("console.workforce.labor.columns.expHours", undefined, "Exp. h"),
              render: (r) => fmt.number(Number(r.expected_hours)),
              accessor: (r) => r.expected_hours,
              className: "font-mono text-xs text-right",
            },
            {
              key: "act_hours",
              header: t("console.workforce.labor.columns.actHours", undefined, "Act. h"),
              render: (r) => (r.actual_hours != null ? fmt.number(Number(r.actual_hours)) : <span className="text-[var(--p-text-2)]">—</span>),
              accessor: (r) => r.actual_hours ?? null,
              className: "font-mono text-xs text-right",
            },
            {
              key: "variance",
              header: t("console.workforce.labor.columns.variance", undefined, "Δ%"),
              render: (r) => {
                const v = pctVariance(Number(r.expected_hours), r.actual_hours);
                if (v == null) return <span className="text-[var(--p-text-2)]">—</span>;
                return (
                  <Badge variant={v > 10 ? "error" : v < -10 ? "warning" : "success"}>
                    {v > 0 ? "+" : ""}{v}%
                  </Badge>
                );
              },
              accessor: (r) => pctVariance(Number(r.expected_hours), r.actual_hours) ?? 0,
              className: "font-mono text-xs text-right",
            },
            {
              key: "cost",
              header: t("console.workforce.labor.columns.cost", undefined, "Budget"),
              render: (r) => fmt.currency(Number(r.expected_cost_cents) / 100),
              accessor: (r) => r.expected_cost_cents,
              className: "font-mono text-xs text-right",
            },
            {
              key: "notes",
              header: t("console.workforce.labor.columns.notes", undefined, "Notes"),
              render: (r) => <span className="text-[var(--p-text-2)]">{r.notes ?? ""}</span>,
              accessor: (r) => r.notes ?? "",
            },
          ]}
        />
      </div>
    </>
  );
}
