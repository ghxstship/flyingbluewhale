"use client";

/**
 * <ChartView> — config-driven recharts renderer.
 *
 * One component handles bar/column/line/area/pie/donut/scatter/bubble/
 * composed/heatmap. Replaces hand-rolled chart blobs (`ReportsCharts`,
 * `CarbonCharts`) with a typed config + a row array. SmartSuite Chart
 * View parity (recommendation #6 in `docs/research/smartsuite-parity/
 * 02-views-and-dashboards.md`).
 *
 * Marked "use client" because recharts depends on browser APIs
 * (ResizeObserver) inside ResponsiveContainer.
 */

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartShell } from "@/components/charts/ChartShell";
import {
  DEFAULT_TONE_ROTATION,
  type ChartAxis,
  type ChartSeries,
  type ChartViewConfig,
  type Tone,
} from "@/lib/views/chart-config";
import { pivotForChart } from "@/lib/views/chart-aggregate";
import { formatValue } from "@/lib/views/format-value";
import { HeatmapGrid, type HeatmapCell } from "./HeatmapGrid";

export type ChartViewProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  config: ChartViewConfig;
  rows: T[];
  /** Container height. Default 320. */
  height?: number;
  className?: string;
  /** Click on a data point. */
  onClick?: (point: T) => void;
  /** Loading override (forwarded to ChartShell). */
  loading?: boolean;
  /** Error override (forwarded to ChartShell). */
  error?: Error | string | null;
};

/**
 * Tone → CSS var. `accent` rebinds to `--p-accent` so the active
 * brand overlay (ATLVS / GVTEWAY / COMPVSS) drives accent color
 * automatically — no hardcoded hex anywhere in chart output.
 */
const TONE_VAR: Record<Tone, string> = {
  accent: "var(--p-accent)",
  info: "var(--p-info)",
  success: "var(--p-success)",
  warn: "var(--p-warning)",
  error: "var(--p-danger)",
  neutral: "var(--p-text-2)",
};

function toneFor(series: ChartSeries, index: number): string {
  const tone = series.tone ?? DEFAULT_TONE_ROTATION[index % DEFAULT_TONE_ROTATION.length] ?? "neutral";
  return TONE_VAR[tone];
}

/**
 * Recharts hands us click events with shape `{ activePayload?: [{ payload }] }`,
 * but its `MouseHandlerDataParam` TS type doesn't expose that field. We
 * read it defensively at runtime and coerce.
 */
function handleChartClick(event: unknown, onClick: (point: Record<string, unknown>) => void): void {
  if (!event || typeof event !== "object") return;
  const payload = (event as { activePayload?: Array<{ payload?: unknown }> }).activePayload?.[0]?.payload;
  if (payload && typeof payload === "object") {
    onClick(payload as Record<string, unknown>);
  }
}

export function ChartView<T extends Record<string, unknown>>({
  config,
  rows,
  height = 320,
  className,
  onClick,
  loading,
  error,
}: ChartViewProps<T>): React.ReactElement {
  const data = React.useMemo(() => pivotForChart(rows, config), [rows, config]);
  const isEmpty = !loading && !error && data.length === 0;

  // Adapter to widen the user's typed onClick to the unknown-row signature
  // recharts hands us back from event payloads.
  const onClickWide = onClick ? (point: Record<string, unknown>) => onClick(point as T) : undefined;

  // Heatmap takes a different render path — it doesn't use recharts.
  if (config.type === "heatmap") {
    return (
      <ChartShell
        title={config.title}
        description={config.description}
        loading={loading}
        error={error ?? null}
        empty={isEmpty}
        height={height}
        className={className}
      >
        <HeatmapView config={config} rows={data} onCellClick={onClickWide} />
        {!isEmpty && <SrOnlyDataSummary config={config} data={data} />}
      </ChartShell>
    );
  }

  return (
    <ChartShell
      title={config.title}
      description={config.description}
      loading={loading}
      error={error ?? null}
      empty={isEmpty}
      height={height}
      className={className}
    >
      {isEmpty ? (
        <EmptyState size="compact" title="No data" description="This chart populates as records are added." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            {renderChart({ config, data, onClick: onClickWide })}
          </ResponsiveContainer>
          <SrOnlyDataSummary config={config} data={data} />
        </>
      )}
    </ChartShell>
  );
}

/**
 * AX-6 — text alternative for the rendered chart. A visually-hidden table
 * mirroring the pivoted rows so screen-reader users get the same data the
 * SVG encodes. Complements recharts' `accessibilityLayer` (keyboard focus +
 * aria on the SVG itself), which can't expose the full series matrix.
 */
function SrOnlyDataSummary({
  config,
  data,
}: {
  config: ChartViewConfig;
  data: Array<Record<string, unknown>>;
}): React.ReactElement {
  const xLabel = config.x.label ?? config.x.field;
  const yField = config.type === "heatmap" ? (config.yField ?? null) : null;
  return (
    <table className="sr-only">
      <caption>{config.title ?? "Chart data"}</caption>
      <thead>
        <tr>
          <th scope="col">{xLabel}</th>
          {yField && <th scope="col">{yField}</th>}
          {config.series.map((s) => (
            <th key={s.field} scope="col">
              {s.label ?? s.field}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <th scope="row">{formatValue(row[config.x.field], config.x.format ?? "auto", config.x.currency)}</th>
            {yField && <td>{String(row[yField] ?? "")}</td>}
            {config.series.map((s) => (
              <td key={s.field}>{formatValue(row[s.field], config.y?.format ?? "auto", config.y?.currency)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Renderers
// ──────────────────────────────────────────────────────────────────────

type RenderArgs = {
  config: ChartViewConfig;
  data: Array<Record<string, unknown>>;
  onClick?: (point: Record<string, unknown>) => void;
};

function renderChart({ config, data, onClick }: RenderArgs): React.ReactElement {
  const showGrid = config.grid ?? true;
  const showLegend = config.legend ?? true;
  const showTooltip = config.tooltip ?? true;

  const commonAxes = (
    <>
      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--p-border)" />}
      {showTooltip && <ChartTooltip xAxis={config.x} yAxis={config.y} series={config.series} />}
      {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
    </>
  );

  const xAxisEl = (
    <XAxis
      dataKey={config.x.field}
      tick={{ fontSize: 10, fill: "var(--p-text-2)" }}
      tickFormatter={(v) => formatValue(v, config.x.format ?? "auto", config.x.currency)}
    />
  );
  const yAxisEl = (
    <YAxis
      tick={{ fontSize: 10, fill: "var(--p-text-2)" }}
      tickFormatter={(v) =>
        formatValue(v, (config.y?.format ?? config.series[0]?.field) ? "auto" : "auto", config.y?.currency)
      }
    />
  );

  switch (config.type) {
    case "bar":
    case "column": {
      const horizontal = config.type === "bar";
      return (
        <BarChart
          accessibilityLayer
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          onClick={onClick ? (e: unknown) => handleChartClick(e, onClick) : undefined}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--p-border)" />}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "var(--p-text-2)" }}
                tickFormatter={(v) => formatValue(v, config.y?.format ?? "auto", config.y?.currency)}
              />
              <YAxis type="category" dataKey={config.x.field} tick={{ fontSize: 10, fill: "var(--p-text-2)" }} />
            </>
          ) : (
            <>
              {xAxisEl}
              {yAxisEl}
            </>
          )}
          {showTooltip && <ChartTooltip xAxis={config.x} yAxis={config.y} series={config.series} />}
          {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {config.series.map((s, i) => (
            <Bar
              key={s.field}
              dataKey={s.field}
              name={s.label ?? s.field}
              fill={toneFor(s, i)}
              stackId={config.stacked ? "stack" : undefined}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
    }
    case "line": {
      return (
        <LineChart
          accessibilityLayer
          data={data}
          onClick={onClick ? (e: unknown) => handleChartClick(e, onClick) : undefined}
        >
          {xAxisEl}
          {yAxisEl}
          {commonAxes}
          {config.series.map((s, i) => (
            <Line
              key={s.field}
              type="monotone"
              dataKey={s.field}
              name={s.label ?? s.field}
              stroke={toneFor(s, i)}
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          ))}
        </LineChart>
      );
    }
    case "area": {
      return (
        <AreaChart
          accessibilityLayer
          data={data}
          onClick={onClick ? (e: unknown) => handleChartClick(e, onClick) : undefined}
        >
          <defs>
            {config.series.map((s, i) => {
              const color = toneFor(s, i);
              return (
                <linearGradient
                  key={`gradient-${s.field}`}
                  id={`chartview-area-${s.field}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {xAxisEl}
          {yAxisEl}
          {commonAxes}
          {config.series.map((s, i) => (
            <Area
              key={s.field}
              type="monotone"
              dataKey={s.field}
              name={s.label ?? s.field}
              stroke={toneFor(s, i)}
              fill={`url(#chartview-area-${s.field})`}
              strokeWidth={2}
              stackId={config.stacked ? "stack" : undefined}
            />
          ))}
        </AreaChart>
      );
    }
    case "pie":
    case "donut": {
      const isDonut = config.type === "donut";
      const valueField = config.series[0]?.field ?? "value";
      return (
        <PieChart accessibilityLayer>
          <Pie
            data={data}
            dataKey={valueField}
            nameKey={config.x.field}
            outerRadius="80%"
            innerRadius={isDonut ? "55%" : 0}
            paddingAngle={isDonut ? 2 : 0}
            stroke="var(--p-bg)"
            strokeWidth={2}
            onClick={onClick ? (slice) => onClick(slice as unknown as Record<string, unknown>) : undefined}
          >
            {data.map((_, i) => {
              const tone = DEFAULT_TONE_ROTATION[i % DEFAULT_TONE_ROTATION.length] ?? "neutral";
              return <Cell key={i} fill={TONE_VAR[tone]} />;
            })}
          </Pie>
          {showTooltip && <ChartTooltip xAxis={config.x} yAxis={config.y} series={config.series} />}
          {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
        </PieChart>
      );
    }
    case "scatter":
    case "bubble": {
      const isBubble = config.type === "bubble";
      const zField = config.series[0]?.zField;
      return (
        <ScatterChart accessibilityLayer onClick={onClick ? (e: unknown) => handleChartClick(e, onClick) : undefined}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--p-border)" />}
          <XAxis
            dataKey={config.x.field}
            type="number"
            tick={{ fontSize: 10, fill: "var(--p-text-2)" }}
            tickFormatter={(v) => formatValue(v, config.x.format ?? "auto", config.x.currency)}
            name={config.x.label ?? config.x.field}
          />
          <YAxis
            dataKey={config.series[0]?.field}
            type="number"
            tick={{ fontSize: 10, fill: "var(--p-text-2)" }}
            tickFormatter={(v) => formatValue(v, config.y?.format ?? "auto", config.y?.currency)}
            name={config.y?.label ?? config.series[0]?.field}
          />
          {isBubble && zField && <ZAxis dataKey={zField} range={[40, 400]} name={zField} />}
          {showTooltip && (
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<TooltipContent xAxis={config.x} yAxis={config.y} series={config.series} />}
            />
          )}
          {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {config.series.map((s, i) => (
            <Scatter key={s.field} name={s.label ?? s.field} data={data} fill={toneFor(s, i)} />
          ))}
        </ScatterChart>
      );
    }
    case "composed": {
      return (
        <ComposedChart
          accessibilityLayer
          data={data}
          onClick={onClick ? (e: unknown) => handleChartClick(e, onClick) : undefined}
        >
          {xAxisEl}
          {yAxisEl}
          {commonAxes}
          {config.series.map((s, i) => {
            const color = toneFor(s, i);
            const t = s.type ?? "bar";
            if (t === "line") {
              return (
                <Line
                  key={s.field}
                  type="monotone"
                  dataKey={s.field}
                  name={s.label ?? s.field}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              );
            }
            return (
              <Bar
                key={s.field}
                dataKey={s.field}
                name={s.label ?? s.field}
                fill={color}
                stackId={config.stacked ? "stack" : undefined}
                radius={[4, 4, 0, 0]}
              />
            );
          })}
        </ComposedChart>
      );
    }
    default: {
      // Should not reach — heatmap is handled in <ChartView>.
      return <BarChart data={data} />;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Heatmap adapter — projects rows into HeatmapGrid cells
// ──────────────────────────────────────────────────────────────────────

function HeatmapView({
  config,
  rows,
  onCellClick,
}: {
  config: ChartViewConfig;
  rows: Array<Record<string, unknown>>;
  onCellClick?: (point: Record<string, unknown>) => void;
}): React.ReactElement {
  const xField = config.x.field;
  const yField = config.yField ?? "y";
  const valueField = config.series[0]?.field ?? "value";

  const cells: HeatmapCell[] = [];
  const xSet = new Set<string>();
  const ySet = new Set<string>();
  for (const r of rows) {
    const x = String(r[xField] ?? "");
    const y = String(r[yField] ?? "");
    const valRaw = r[valueField];
    const value = typeof valRaw === "number" && Number.isFinite(valRaw) ? valRaw : Number(valRaw) || 0;
    cells.push({ x, y, value });
    xSet.add(x);
    ySet.add(y);
  }

  const xLabels = Array.from(xSet);
  const yLabels = Array.from(ySet);

  return (
    <HeatmapGrid
      cells={cells}
      xLabels={xLabels}
      yLabels={yLabels}
      colorScale={config.colorScale ?? "sequential"}
      onCellClick={
        onCellClick
          ? (cell) => {
              // Find the matching row by (x,y) and forward.
              const matched = rows.find(
                (r) => String(r[xField] ?? "") === cell.x && String(r[yField] ?? "") === cell.y,
              );
              onCellClick(matched ?? (cell as unknown as Record<string, unknown>));
            }
          : undefined
      }
    />
  );
}

// ──────────────────────────────────────────────────────────────────────
// Tooltip — formatted, shared across recharts wrappers
// ──────────────────────────────────────────────────────────────────────

function ChartTooltip({
  xAxis,
  yAxis,
  series,
}: {
  xAxis: ChartAxis;
  yAxis?: ChartAxis;
  series: ChartSeries[];
}): React.ReactElement {
  return (
    <Tooltip
      cursor={{ fill: "var(--p-surface-2)" }}
      content={<TooltipContent xAxis={xAxis} yAxis={yAxis} series={series} />}
    />
  );
}

type TooltipContentProps = {
  active?: boolean;
  label?: unknown;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  xAxis: ChartAxis;
  yAxis?: ChartAxis;
  series: ChartSeries[];
};

function TooltipContent({
  active,
  label,
  payload,
  xAxis,
  yAxis,
  series,
}: TooltipContentProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2.5 py-1.5 text-[11px] shadow-sm">
      {label !== undefined && label !== null && (
        <div className="mb-1 font-medium text-[var(--p-text-1)]">
          {formatValue(label, xAxis.format ?? "auto", xAxis.currency)}
        </div>
      )}
      {payload.map((p, i) => {
        const seriesDef = series.find((s) => (s.label ?? s.field) === p.name || s.field === p.dataKey);
        const fmt = yAxis?.format ?? "auto";
        const currency = yAxis?.currency ?? (seriesDef ? "USD" : undefined);
        return (
          <div key={i} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
            <span className="text-[var(--p-text-2)]">{p.name}:</span>
            <span className="font-mono text-[var(--p-text-1)]">
              {typeof p.value === "number" ? formatValue(p.value, fmt, currency) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Value formatting — lives in src/lib/views/format-value.ts (F-19) so the
// views barrel can export it without statically pulling this recharts-backed
// module. Re-exported here for direct importers.
// ──────────────────────────────────────────────────────────────────────

export { formatValue } from "@/lib/views/format-value";
