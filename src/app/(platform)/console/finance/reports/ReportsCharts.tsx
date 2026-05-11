"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { ChartShell } from "@/components/charts/ChartShell";
import { ChartView } from "@/components/views/ChartView";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ChartViewConfig } from "@/lib/views/chart-config";

type MonthPoint = { month: string; revenue: number; expenses: number; margin: number };
type AgingRow = { bucket: string; count: number; amount: number };
type CategoryRow = { name: string; value: number };

// Phase 3.4 — config-driven cumulative revenue chart. Replaces the
// hand-rolled AreaChart that used a custom linearGradient + DarkTooltip.
// Tone "accent" binds to --org-primary so the brand overlay drives color.
const CUMULATIVE_REVENUE_CHART: ChartViewConfig = {
  type: "area",
  title: "Cumulative Revenue",
  description: "Trailing 12 months",
  x: { field: "month" },
  y: { field: "cumulative", format: "currency", currency: "USD" },
  series: [{ field: "cumulative", label: "Cumulative", tone: "accent" }],
  legend: false,
};

// Multi-hue categorical palette for the pie chart — these are data-encoded
// distinct categories, not status. Tokenized colors (org-primary + status
// quartet) are interleaved with neutral fallbacks chosen for hue separation
// so the chart legend stays distinguishable in any theme.
const PIE_COLORS = [
  "var(--org-primary)",
  "var(--color-success)",
  "#a855f7", // purple — no semantic token; data-encoded distinct hue
  "var(--color-warning)",
  "#06b6d4", // teal
  "var(--color-error)",
  "#84cc16", // lime
  "#ec4899", // pink
];

export function ReportsCharts({
  monthly,
  aging,
  categories,
}: {
  monthly: MonthPoint[];
  aging: AgingRow[];
  categories: CategoryRow[];
}) {
  const empty =
    monthly.every((m) => m.revenue === 0 && m.expenses === 0) &&
    aging.every((a) => a.count === 0) &&
    categories.length === 0;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartShell
        title="Revenue, expenses, margin"
        description="Last 12 months"
        empty={monthly.every((m) => m.revenue === 0 && m.expenses === 0)}
      >
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={fmtAxis} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-inset)" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="revenue" name="Revenue" fill="var(--org-primary)" />
            <Bar dataKey="expenses" name="Expenses" fill="var(--color-error)" />
            <Line
              dataKey="margin"
              name="Margin"
              type="monotone"
              stroke="var(--color-success)"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="AR aging"
        description="Outstanding $ by overdue bucket"
        empty={aging.every((a) => a.amount === 0)}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={aging.map((a) => ({ bucket: a.bucket, amount: a.amount / 100 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={fmtAxis} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-inset)" }} />
            <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
              {aging.map((a) => (
                <Cell
                  key={a.bucket}
                  fill={
                    a.bucket === "Current"
                      ? "var(--color-success)"
                      : a.bucket === "1–30"
                        ? "var(--org-primary)"
                        : a.bucket === "31–60"
                          ? "var(--color-warning)"
                          : "var(--color-error)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      {/* Phase 3.4 demo — replaced bespoke AreaChart with <ChartView>.
          Same visual output (org-primary gradient, monotone area), but
          driven by ChartViewConfig + the shared currency tooltip. */}
      <ChartView<{ month: string; cumulative: number }>
        config={CUMULATIVE_REVENUE_CHART}
        rows={accumulate(monthly)}
        height={220}
      />

      <ChartShell
        title="Top Expense Categories"
        description="Trailing total by category"
        empty={categories.length === 0}
      >
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              innerRadius={45}
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {categories.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      {empty && (
        <p className="col-span-full text-xs text-[var(--text-muted)]">
          No financial data yet. Charts populate as invoices are paid and expenses are filed.
        </p>
      )}
    </div>
  );
}

function accumulate(rows: MonthPoint[]) {
  let acc = 0;
  return rows.map((r) => {
    acc += r.revenue;
    return { month: r.month, cumulative: acc };
  });
}

function fmtAxis(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  const { bcp47, currency } = useLocale();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-[10px]">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-mono">{typeof p.value === "number" ? fmtTooltip(p.value, bcp47, currency) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function fmtTooltip(v: number, locale?: string, currency = "USD"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}
