import type { CSSProperties } from "react";

/**
 * BarChart — a minimal categorical / grouped-series bar chart on an SVG,
 * colored from the `--chart-*` ramp (src/app/theme: --chart-1…8). A cosmetic
 * dashboard primitive, not a full charting lib — for rich/interactive viz use
 * recharts inside <ChartShell>. `data` is `[{label, value}]`, or
 * `[{label, values:[…]}]` for grouped series. Fills its container width.
 */
export type BarDatum = { label: string; value?: number; values?: number[] };

export function BarChart({
  data = [],
  height = 180,
  max,
  gap = 0.35,
  valueFormat,
  className = "",
  style,
}: {
  data?: BarDatum[];
  height?: number;
  /** Fixed scale ceiling; defaults to the peak value. */
  max?: number;
  /** Fraction of each column reserved as inter-bar gap (0–1). */
  gap?: number;
  valueFormat?: (v: number) => string | number;
  className?: string;
  style?: CSSProperties;
}) {
  const rows = data.map((d) => ({ label: d.label, values: d.values ?? [d.value ?? 0] }));
  const seriesCount = rows.reduce((n, r) => Math.max(n, r.values.length), 1);
  const peak = max ?? Math.max(1, ...rows.flatMap((r) => r.values));
  const fmt = valueFormat ?? ((v: number) => v);
  const colW = rows.length ? 100 / rows.length : 100;
  const barGroupW = colW * (1 - gap);
  const barW = barGroupW / seriesCount;

  return (
    <div className={className} style={{ width: "100%", ...style }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="img"
        aria-label="Bar chart"
        style={{ display: "block", overflow: "visible" }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1="0"
            x2="100"
            y1={height - tick * (height - 22)}
            y2={height - tick * (height - 22)}
            stroke="var(--chart-grid)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {rows.map((r, i) => {
          const x0 = i * colW + (colW - barGroupW) / 2;
          return r.values.map((v, s) => {
            const h = (v / peak) * (height - 22);
            return (
              <rect
                key={`${i}-${s}`}
                x={x0 + s * barW + barW * 0.08}
                y={height - 18 - h}
                width={barW * 0.84}
                height={Math.max(0, h)}
                rx="1.5"
                fill={`var(--chart-${(s % 8) + 1})`}
              >
                <title>{`${r.label}: ${fmt(v)}`}</title>
              </rect>
            );
          });
        })}
      </svg>
      <div style={{ display: "flex", marginTop: 6 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              width: `${colW}%`,
              textAlign: "center",
              fontFamily: "var(--p-mono)",
              fontSize: 10,
              color: "var(--chart-label)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}
