"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
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
} from "recharts";
import { ChartShell } from "@/components/charts/ChartShell";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";

// CN-12 — semantic theme tokens, not hex: Scope 1 (direct combustion) reads
// as danger, Scope 2 (purchased energy) as warning, Scope 3 (value chain)
// as success — and all three track light/dark via CSS vars.
const SCOPE_COLORS: Record<string, string> = {
  "Scope 1": "var(--p-danger)",
  "Scope 2": "var(--p-warning)",
  "Scope 3": "var(--p-success)",
};

export function CarbonCharts({
  byMonth,
  byScope,
  target,
}: {
  byMonth: { month: string; actual: number }[];
  byScope: { scope: string; value: number }[];
  target: number;
}) {
  const t = useT();
  const series = byMonth.map((m) => ({ ...m, target }));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartShell
        title={t("console.sustainability.carbon.charts.monthly.title", undefined, "Monthly Emissions vs Target")}
        description={t(
          "console.sustainability.carbon.charts.monthly.description",
          undefined,
          "kg CO₂e — actual area + target line",
        )}
        empty={byMonth.length === 0}
        emptyLabel={t("console.sustainability.carbon.charts.monthly.empty", undefined, "No measurements yet.")}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series}>
            <defs>
              <linearGradient id="actual-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--p-success)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--p-success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--p-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--p-text-2)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--p-text-2)" }} tickFormatter={fmtAxis} />
            <Tooltip content={<DarkTooltip suffix=" kg CO₂e" />} cursor={{ fill: "var(--p-surface-2)" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area
              dataKey="actual"
              name={t("console.sustainability.carbon.charts.monthly.actual", undefined, "Actual")}
              type="monotone"
              stroke="var(--p-success)"
              fill="url(#actual-fill)"
              strokeWidth={2}
            />
            <Line
              dataKey="target"
              name={t("console.sustainability.carbon.charts.monthly.target", undefined, "Target — 5% Reduction")}
              type="monotone"
              stroke="var(--p-text-2)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title={t("console.sustainability.carbon.charts.scope.title", undefined, "Emissions by Scope")}
        description={t(
          "console.sustainability.carbon.charts.scope.description",
          undefined,
          "GHG Protocol Scope 1 / 2 / 3",
        )}
        empty={byScope.length === 0}
        emptyLabel={t("console.sustainability.carbon.charts.scope.empty", undefined, "No scope data yet.")}
      >
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byScope}
              dataKey="value"
              nameKey="scope"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              stroke="var(--p-bg)"
              strokeWidth={2}
            >
              {byScope.map((s, i) => (
                <Cell key={i} fill={SCOPE_COLORS[s.scope] ?? "var(--p-accent)"} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip suffix=" kg" />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}

function fmtAxis(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function DarkTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  suffix?: string;
}) {
  const fmt = useFormatters();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2.5 py-1.5 text-[10px]">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          <span className="text-[var(--p-text-2)]">{p.name}:</span>
          <span className="font-mono">{fmt.number(Number(p.value ?? 0)) + suffix}</span>
        </div>
      ))}
    </div>
  );
}
