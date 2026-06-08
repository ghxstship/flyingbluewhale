import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Horizon = "thirty_day" | "ninety_day" | "one_year" | "five_year";

type Row = {
  id: string;
  name: string;
  horizon: Horizon;
  baseline_at: string;
  created_at: string;
  line_count: number;
  gap_count: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  const HORIZON_LABEL: Record<Horizon, string> = {
    thirty_day: t("console.workforce.forecast.horizon.thirty_day", undefined, "30-Day"),
    ninety_day: t("console.workforce.forecast.horizon.ninety_day", undefined, "90-Day"),
    one_year: t("console.workforce.forecast.horizon.one_year", undefined, "1-Year"),
    five_year: t("console.workforce.forecast.horizon.five_year", undefined, "5-Year"),
  };
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.forecast.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.forecast.title", undefined, "Resource Forecast")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.forecast.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data: hdrs } = await supabase
    .from("resource_forecasts")
    .select("id, name, horizon, baseline_at, created_at")
    .eq("org_id", session.orgId)
    .order("baseline_at", { ascending: false })
    .limit(100);

  const headers = (hdrs ?? []) as unknown as Omit<Row, "line_count" | "gap_count">[];
  const ids = headers.map((h) => h.id);

  const counts: Record<string, { lines: number; gaps: number }> = {};
  if (ids.length > 0) {
    const { data: lines } = await supabase
      .from("resource_forecast_lines")
      .select("resource_forecast_id, surplus_units")
      .in("resource_forecast_id", ids);
    for (const l of (lines ?? []) as { resource_forecast_id: string; surplus_units: number }[]) {
      const r = counts[l.resource_forecast_id] ?? { lines: 0, gaps: 0 };
      r.lines += 1;
      if (Number(l.surplus_units) < 0) r.gaps += 1;
      counts[l.resource_forecast_id] = r;
    }
  }

  const rows: Row[] = headers.map((h) => ({
    ...h,
    line_count: counts[h.id]?.lines ?? 0,
    gap_count: counts[h.id]?.gaps ?? 0,
  }));

  const totalGaps = rows.reduce((s, r) => s + r.gap_count, 0);

  // Labor% panel — load the next 7 days of shift_sales_targets (with computed
  // labor_pct from the v_daily_labor_vs_sales view). Uses LooseSupabase since
  // shift_sales_targets isn't in the generated typed client yet.
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: salesRows } = await supabase
    .from("v_daily_labor_vs_sales")
    .select("shift_date, schedule_name, projected_revenue_cents, labor_cost_cents, labor_pct, currency")
    .eq("org_id", session.orgId)
    .gte("shift_date", today)
    .lte("shift_date", sevenDaysOut)
    .order("shift_date");
  const laborRows = (salesRows ?? []) as {
    shift_date: string;
    schedule_name: string | null;
    projected_revenue_cents: number;
    labor_cost_cents: number;
    labor_pct: number | null;
    currency: string;
  }[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.forecast.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.forecast.title", undefined, "Resource Forecast")}
        subtitle={t(
          "console.workforce.forecast.subtitle",
          {
            forecastCount: rows.length,
            forecastSuffix: rows.length === 1 ? "" : "s",
            gapCount: totalGaps,
            gapSuffix: totalGaps === 1 ? "" : "s",
          },
          `${rows.length} forecast${rows.length === 1 ? "" : "s"} on file · ${totalGaps} resource gap${totalGaps === 1 ? "" : "s"} flagged across all horizons`,
        )}
        action={
          <Button href="/console/workforce/forecast/new" size="sm">
            {t("console.workforce.forecast.newForecast", undefined, "+ New Forecast")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {/* Labor% vs Projected Sales — Connecteam Mar 2026 parity */}
        {laborRows.length > 0 && (
          <section className="surface p-5">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {t("console.workforce.forecast.laborPct.title", undefined, "Labor % vs Projected Revenue — Next 7 Days")}
            </h2>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.workforce.forecast.laborPct.date", undefined, "Date")}</th>
                    <th>{t("console.workforce.forecast.laborPct.schedule", undefined, "Schedule")}</th>
                    <th className="text-right">{t("console.workforce.forecast.laborPct.projected", undefined, "Projected Revenue")}</th>
                    <th className="text-right">{t("console.workforce.forecast.laborPct.laborCost", undefined, "Labor Cost")}</th>
                    <th className="text-right">{t("console.workforce.forecast.laborPct.laborPct", undefined, "Labor %")}</th>
                  </tr>
                </thead>
                <tbody>
                  {laborRows.map((r, i) => {
                    const pct = r.labor_pct ?? null;
                    const pctColor =
                      pct === null
                        ? ""
                        : pct > 40
                          ? "text-[var(--c-error)]"
                          : pct > 30
                            ? "text-[var(--c-warning)]"
                            : "text-[var(--c-success)]";
                    return (
                      <tr key={i}>
                        <td className="font-mono text-xs">{r.shift_date}</td>
                        <td>{r.schedule_name ?? "—"}</td>
                        <td className="text-right font-mono text-xs">
                          {fmt.money(r.projected_revenue_cents, r.currency)}
                        </td>
                        <td className="text-right font-mono text-xs">
                          {fmt.money(r.labor_cost_cents, r.currency)}
                        </td>
                        <td className={`text-right font-mono text-xs font-semibold ${pctColor}`}>
                          {pct != null ? `${pct}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.workforce.forecast.laborPct.hint",
                undefined,
                "Green < 30 % · Yellow 30–40 % · Red > 40 %. Set targets via Settings → Shift Sales Targets.",
              )}
            </p>
          </section>
        )}

        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.forecast.metrics.forecasts", undefined, "Forecasts")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.workforce.forecast.metrics.resourceGaps", undefined, "Resource Gaps")}
            value={fmt.number(totalGaps)}
          />
          <MetricCard
            label={t("console.workforce.forecast.metrics.horizonsCovered", undefined, "Horizons Covered")}
            value={fmt.number(new Set(rows.map((r) => r.horizon)).size)}
          />
        </div>
        <div className="text-[10px] text-[var(--p-text-2)]">
          {t(
            "console.workforce.forecast.description",
            undefined,
            "Cross-project capacity vs demand at 30-day / 90-day / 1-year / 5-year horizons (Bridgit Bench equivalent). Negative surplus = staffing or equipment gap. contributing_projects[] surfaces what is driving demand.",
          )}
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/forecast/${r.id}`}
          emptyLabel={t("console.workforce.forecast.emptyLabel", undefined, "No resource forecasts yet")}
          emptyDescription={t(
            "console.workforce.forecast.emptyDescription",
            undefined,
            "A forecast is a cross-project capacity-vs-demand rollup per resource_kind per period.",
          )}
          emptyAction={
            <Button href="/console/workforce/forecast/new" size="sm">
              {t("console.workforce.forecast.newForecast", undefined, "+ New Forecast")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.workforce.forecast.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "horizon",
              header: t("console.workforce.forecast.columns.horizon", undefined, "Horizon"),
              render: (r) => <Badge variant="info">{HORIZON_LABEL[r.horizon]}</Badge>,
              accessor: (r) => r.horizon,
              filterable: true,
              groupable: true,
            },
            {
              key: "baseline",
              header: t("console.workforce.forecast.columns.baseline", undefined, "Baseline"),
              render: (r) =>
                fmt.dateParts(r.baseline_at + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.baseline_at,
              className: "font-mono text-xs",
            },
            {
              key: "lines",
              header: t("console.workforce.forecast.columns.lines", undefined, "Lines"),
              render: (r) => fmt.number(r.line_count),
              accessor: (r) => r.line_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "gaps",
              header: t("console.workforce.forecast.columns.gaps", undefined, "Gaps"),
              render: (r) =>
                r.gap_count > 0 ? (
                  <Badge variant="error">{fmt.number(r.gap_count)}</Badge>
                ) : (
                  <span className="text-[var(--p-text-2)]">{fmt.number(r.gap_count)}</span>
                ),
              accessor: (r) => r.gap_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "created",
              header: t("console.workforce.forecast.columns.created", undefined, "Created"),
              render: (r) => fmt.dateParts(r.created_at, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.created_at,
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
