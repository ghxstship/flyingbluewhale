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

const HORIZON_LABEL: Record<Horizon, string> = {
  thirty_day: "30-Day",
  ninety_day: "90-Day",
  one_year: "1-Year",
  five_year: "5-Year",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Resource Forecast" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  // Rolling 90-day window for Labor vs Revenue snapshot
  const windowStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date().toISOString();

  const [{ data: hdrs }, { data: timeEntryData }, { data: invoiceData }] = await Promise.all([
    supabase
      .from("resource_forecasts")
      .select("id, name, horizon, baseline_at, created_at")
      .eq("org_id", session.orgId)
      .order("baseline_at", { ascending: false })
      .limit(100),
    // Scheduled + worked hours in the window for labor cost estimate
    supabase
      .from("time_entries")
      .select("hours, billable_rate_cents")
      .eq("org_id", session.orgId)
      .gte("entry_date", windowStart.slice(0, 10))
      .lte("entry_date", windowEnd.slice(0, 10)),
    // Invoiced revenue in the window (sent + paid)
    supabase
      .from("invoices")
      .select("subtotal_cents, status")
      .eq("org_id", session.orgId)
      .in("status", ["sent", "paid", "partial"])
      .gte("issued_at", windowStart)
      .lte("issued_at", windowEnd),
  ]);

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

  // Labor vs Revenue computation (Connecteam/Deputy parity)
  type TimeEntry = { hours: number | null; billable_rate_cents: number | null };
  type InvoiceRow = { subtotal_cents: number | null; status: string };
  const entries = (timeEntryData ?? []) as TimeEntry[];
  const invoices = (invoiceData ?? []) as InvoiceRow[];
  const totalLaborCents = entries.reduce(
    (s, e) => s + (Number(e.hours ?? 0) * Number(e.billable_rate_cents ?? 0)),
    0,
  );
  const totalRevenueCents = invoices.reduce((s, i) => s + Number(i.subtotal_cents ?? 0), 0);
  const laborPct = totalRevenueCents > 0 ? Math.round((totalLaborCents / totalRevenueCents) * 100) : null;
  const currency = "USD";

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Resource Forecast"
        subtitle={`${rows.length} forecast${rows.length === 1 ? "" : "s"} on file · ${totalGaps} resource gap${totalGaps === 1 ? "" : "s"} flagged across all horizons`}
        action={
          <Button href="/console/workforce/forecast/new" size="sm">
            + New Forecast
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Forecasts" value={fmt.number(rows.length)} accent />
          <MetricCard label="Resource Gaps" value={fmt.number(totalGaps)} />
          <MetricCard label="Horizons Covered" value={fmt.number(new Set(rows.map((r) => r.horizon)).size)} />
        </div>

        {/* Labor vs Revenue Snapshot — Connecteam/Deputy parity feature */}
        <section className="surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Labor vs Revenue · 90-Day</h2>
            <span className="text-[10px] text-[var(--text-muted)]">Rolling window · invoiced revenue vs logged labor cost</span>
          </div>
          <div className="metric-grid-3">
            <MetricCard
              label="Logged Labor Cost"
              value={
                totalLaborCents > 0
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
                      totalLaborCents / 100,
                    )
                  : "—"
              }
              accent={totalLaborCents > 0}
            />
            <MetricCard
              label="Invoiced Revenue"
              value={
                totalRevenueCents > 0
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
                      totalRevenueCents / 100,
                    )
                  : "—"
              }
            />
            <MetricCard
              label="Labor % of Revenue"
              value={laborPct !== null ? `${laborPct}%` : "—"}
            />
          </div>
          {laborPct !== null && (
            <p className="text-xs text-[var(--text-secondary)]">
              {laborPct <= 35
                ? "Labor is within healthy range (≤35% of revenue). You have headroom to absorb additional crew costs."
                : laborPct <= 50
                  ? "Labor is moderately elevated (35–50% of revenue). Monitor crew hours on upcoming projects."
                  : "Labor exceeds 50% of revenue — review billable rate cards and consider re-scoping open deliverables."}
            </p>
          )}
          {totalLaborCents === 0 && totalRevenueCents === 0 && (
            <p className="text-xs text-[var(--text-muted)]">
              No time entries or invoices found in the 90-day window. Log time on projects to populate this view.
            </p>
          )}
        </section>

        <div className="text-[10px] text-[var(--text-muted)]">
          Cross-project capacity vs demand at 30-day / 90-day / 1-year / 5-year horizons (Bridgit Bench equivalent).
          Negative surplus = staffing or equipment gap. contributing_projects[] surfaces what is driving demand.
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/forecast/${r.id}`}
          emptyLabel="No resource forecasts yet"
          emptyDescription="A forecast is a cross-project capacity-vs-demand rollup per resource_kind per period."
          emptyAction={
            <Button href="/console/workforce/forecast/new" size="sm">
              + New Forecast
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "horizon",
              header: "Horizon",
              render: (r) => <Badge variant="info">{HORIZON_LABEL[r.horizon]}</Badge>,
              accessor: (r) => r.horizon,
              filterable: true,
              groupable: true,
            },
            {
              key: "baseline",
              header: "Baseline",
              render: (r) =>
                fmt.dateParts(r.baseline_at + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.baseline_at,
              className: "font-mono text-xs",
            },
            {
              key: "lines",
              header: "Lines",
              render: (r) => fmt.number(r.line_count),
              accessor: (r) => r.line_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "gaps",
              header: "Gaps",
              render: (r) =>
                r.gap_count > 0 ? (
                  <Badge variant="error">{fmt.number(r.gap_count)}</Badge>
                ) : (
                  <span className="text-[var(--text-muted)]">{fmt.number(r.gap_count)}</span>
                ),
              accessor: (r) => r.gap_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "created",
              header: "Created",
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
