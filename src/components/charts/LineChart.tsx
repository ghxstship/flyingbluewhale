import type { CSSProperties, ReactNode } from "react";

/**
 * LineChart / AreaChart — a minimal single/multi-series line chart on an SVG,
 * colored from the `--chart-*` ramp (src/app/theme: --chart-1…8). A cosmetic
 * dashboard primitive matching BarChart's conventions — for rich/interactive
 * viz use recharts inside <ChartShell>. `data` is `[{label, value}]`, or
 * `[{label, values:[…]}]` for grouped series. Fills its container width.
 *
 * Ported from the ATLVS kit (kits/core/components/data/LineChart.d.ts).
 */
export type LineDatum = { label: ReactNode; value?: number; values?: number[] };

export function LineChart({
  data = [],
  height = 200,
  max,
  area = false,
  valueFormat,
  className = "",
  style,
}: {
  data?: LineDatum[];
  height?: number;
  /** Fix the value-axis max; auto otherwise. */
  max?: number;
  /** Fill the area under each series. */
  area?: boolean;
  valueFormat?: (v: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const rows = data.map((d) => ({ label: d.label, values: d.values ?? [d.value ?? 0] }));
  const seriesCount = rows.reduce((n, r) => Math.max(n, r.values.length), 1);
  const peak = max ?? Math.max(1, ...rows.flatMap((r) => r.values));
  const fmt = valueFormat ?? ((v: number) => v);
  const plotH = height - 22;
  const stepX = rows.length > 1 ? 100 / (rows.length - 1) : 0;
  const yOf = (v: number) => height - 18 - (v / peak) * plotH;

  const series = Array.from({ length: seriesCount }, (_, s) =>
    rows.map((r, i) => ({ x: i * stepX, y: yOf(r.values[s] ?? 0), v: r.values[s] ?? 0, label: r.label })),
  );

  return (
    <div className={className} style={{ width: "100%", ...style }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="img"
        aria-label="Line chart"
        style={{ display: "block", overflow: "visible" }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1="0"
            x2="100"
            y1={height - 18 - tick * plotH}
            y2={height - 18 - tick * plotH}
            stroke="var(--chart-grid)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {series.map((pts, s) => {
          const color = `var(--chart-${(s % 8) + 1})`;
          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
          const fill = `${line} L${pts[pts.length - 1]?.x.toFixed(2) ?? 0},${height - 18} L0,${height - 18} Z`;
          return (
            <g key={s}>
              {area && <path d={fill} fill={color} fillOpacity={0.14} stroke="none" />}
              <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="1.6" fill={color} vectorEffect="non-scaling-stroke">
                  <title>{`${typeof p.label === "string" ? p.label : `#${i + 1}`}: ${fmt(p.v)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", marginTop: 6 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              width: `${rows.length ? 100 / rows.length : 100}%`,
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

/** LineChart with the area fill enabled by default. */
export function AreaChart(props: Omit<Parameters<typeof LineChart>[0], "area">) {
  return <LineChart {...props} area />;
}
