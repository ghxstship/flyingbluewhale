"use client";

import * as React from "react";

/**
 * <HeatmapGrid> — minimal SVG heatmap.
 *
 * recharts ships every chart type we use except heatmaps, so we render
 * a small SVG grid here. Sequential scale ramps a single tone token
 * (default `--p-info`) by alpha; diverging scale uses success →
 * neutral → error so signed values read at a glance (e.g. variance vs.
 * budget). The cell tint uses CSS `color-mix` so themes / brand
 * overlays influence the color without us hardcoding hex.
 */

export type HeatmapCell = {
  x: string;
  y: string;
  value: number;
};

export type HeatmapGridProps = {
  cells: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: "sequential" | "diverging";
  /** Pixel size of each cell. Default 28. */
  cellSize?: number;
  /** Label width reserved for y-axis labels. Default 80. */
  yLabelWidth?: number;
  /** Label height reserved for x-axis labels. Default 24. */
  xLabelHeight?: number;
  /** Optional click handler. */
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
};

export function HeatmapGrid({
  cells,
  xLabels,
  yLabels,
  colorScale = "sequential",
  cellSize = 28,
  yLabelWidth = 80,
  xLabelHeight = 24,
  onCellClick,
  className,
}: HeatmapGridProps): React.ReactElement {
  const xIndex = React.useMemo(() => indexOf(xLabels), [xLabels]);
  const yIndex = React.useMemo(() => indexOf(yLabels), [yLabels]);

  const { min, max, absMax } = React.useMemo(() => {
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const c of cells) {
      if (c.value < lo) lo = c.value;
      if (c.value > hi) hi = c.value;
    }
    if (!Number.isFinite(lo)) lo = 0;
    if (!Number.isFinite(hi)) hi = 0;
    return { min: lo, max: hi, absMax: Math.max(Math.abs(lo), Math.abs(hi)) };
  }, [cells]);

  const width = yLabelWidth + xLabels.length * cellSize;
  const height = xLabelHeight + yLabels.length * cellSize;
  const [hover, setHover] = React.useState<HeatmapCell | null>(null);

  return (
    <div className={`relative ${className ?? ""}`} style={{ width, maxWidth: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        role="img"
        aria-label="Heatmap"
        style={{ width: "100%", height: "auto" }}
      >
        {/* X axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={`xlabel-${label}`}
            x={yLabelWidth + i * cellSize + cellSize / 2}
            y={xLabelHeight - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--p-text-2)"
          >
            {label}
          </text>
        ))}
        {/* Y axis labels */}
        {yLabels.map((label, i) => (
          <text
            key={`ylabel-${label}`}
            x={yLabelWidth - 6}
            y={xLabelHeight + i * cellSize + cellSize / 2 + 3}
            textAnchor="end"
            fontSize={10}
            fill="var(--p-text-2)"
          >
            {label}
          </text>
        ))}
        {/* Cells */}
        {cells.map((cell) => {
          const cx = xIndex.get(cell.x);
          const cy = yIndex.get(cell.y);
          if (cx === undefined || cy === undefined) return null;
          const x = yLabelWidth + cx * cellSize;
          const y = xLabelHeight + cy * cellSize;
          const fill = cellFill(cell.value, { min, max, absMax, colorScale });
          return (
            <rect
              key={`${cell.x}|${cell.y}`}
              x={x}
              y={y}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={fill}
              stroke="var(--p-border)"
              strokeWidth={0.5}
              style={onCellClick ? { cursor: "pointer" } : undefined}
              onMouseEnter={() => setHover(cell)}
              onMouseLeave={() => setHover((h) => (h === cell ? null : h))}
              onClick={onCellClick ? () => onCellClick(cell) : undefined}
            >
              <title>{`${cell.x} · ${cell.y}: ${cell.value}`}</title>
            </rect>
          );
        })}
      </svg>
      {hover && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute end-2 top-2 rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2 py-1 text-[10px] text-[var(--p-text-2)]"
        >
          <span className="font-medium text-[var(--p-text-1)]">
            {hover.x} · {hover.y}
          </span>
          <span className="ms-2 font-mono">{formatNum(hover.value)}</span>
        </div>
      )}
    </div>
  );
}

function indexOf(labels: string[]): Map<string, number> {
  const m = new Map<string, number>();
  labels.forEach((l, i) => m.set(l, i));
  return m;
}

function cellFill(
  value: number,
  ctx: { min: number; max: number; absMax: number; colorScale: "sequential" | "diverging" },
): string {
  if (ctx.colorScale === "diverging") {
    if (ctx.absMax === 0) return "color-mix(in srgb, var(--p-text-2) 8%, transparent)";
    const t = Math.max(-1, Math.min(1, value / ctx.absMax));
    if (t >= 0) {
      const pct = Math.round(t * 80) + 8; // 8% → 88%
      return `color-mix(in srgb, var(--p-success) ${pct}%, transparent)`;
    }
    const pct = Math.round(-t * 80) + 8;
    return `color-mix(in srgb, var(--p-danger) ${pct}%, transparent)`;
  }
  // sequential
  const range = ctx.max - ctx.min;
  const t = range === 0 ? 0.5 : (value - ctx.min) / range;
  const pct = Math.round(t * 80) + 8;
  return `color-mix(in srgb, var(--p-info) ${pct}%, transparent)`;
}

function formatNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}
