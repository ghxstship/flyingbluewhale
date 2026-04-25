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

const SCOPE_COLORS: Record<string, string> = {
  "Scope 1": "#ef4444",
  "Scope 2": "#f59e0b",
  "Scope 3": "#22c55e",
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
  const series = byMonth.map((m) => ({ ...m, target }));
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartShell
        title="Monthly emissions vs target"
        description="kg CO₂e — actual area + target line"
        empty={byMonth.length === 0}
        emptyLabel="No measurements yet."
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series}>
            <defs>
              <linearGradient id="actual-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={fmtAxis} />
            <Tooltip content={<DarkTooltip suffix=" kg CO₂e" />} cursor={{ fill: "var(--surface-inset)" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area
              dataKey="actual"
              name="Actual"
              type="monotone"
              stroke="#22c55e"
              fill="url(#actual-fill)"
              strokeWidth={2}
            />
            <Line
              dataKey="target"
              name="Target (5% reduction)"
              type="monotone"
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Emissions by scope"
        description="GHG Protocol Scope 1 / 2 / 3"
        empty={byScope.length === 0}
        emptyLabel="No scope data yet."
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
              stroke="var(--background)"
              strokeWidth={2}
            >
              {byScope.map((s, i) => (
                <Cell
                  key={i}
                  fill={SCOPE_COLORS[s.scope] ?? "var(--org-primary)"}
                />
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
          <span className="font-mono">{Number(p.value ?? 0).toLocaleString() + suffix}</span>
        </div>
      ))}
    </div>
  );
}
