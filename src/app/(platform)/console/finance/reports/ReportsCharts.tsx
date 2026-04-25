"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
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

type MonthPoint = { month: string; revenue: number; expenses: number; margin: number };
type AgingRow = { bucket: string; count: number; amount: number };
type CategoryRow = { name: string; value: number };

const PIE_COLORS = [
  "var(--org-primary)",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
  "#ec4899",
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
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
            <Line
              dataKey="margin"
              name="Margin"
              type="monotone"
              stroke="#22c55e"
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
              {aging.map((a, i) => (
                <Cell
                  key={a.bucket}
                  fill={
                    a.bucket === "Current"
                      ? "#22c55e"
                      : a.bucket === "1–30"
                        ? "var(--org-primary)"
                        : a.bucket === "31–60"
                          ? "#f59e0b"
                          : "#ef4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Cumulative revenue"
        description="Trailing 12 months"
        empty={monthly.every((m) => m.revenue === 0)}
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={accumulate(monthly)}>
            <defs>
              <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--org-primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--org-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={fmtAxis} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "var(--surface-inset)" }} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="var(--org-primary)"
              fill="url(#rev-fill)"
              strokeWidth={2}
              name="Cumulative"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Top expense categories"
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
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-[10px] shadow-lg">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
            aria-hidden
          />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-mono">{typeof p.value === "number" ? fmtTooltip(p.value) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function fmtTooltip(v: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
