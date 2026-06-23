import type { CSSProperties, ReactNode } from "react";

/**
 * DonutChart — a proportional ring with an optional legend + center label,
 * colored from the `--chart-*` ramp. Dependency-free SVG, matching the
 * BarChart/LineChart conventions. Ported from the ATLVS kit
 * (kits/core/components/data/LineChart.d.ts → DonutChart).
 */
export type DonutDatum = { label: ReactNode; value: number };

export function DonutChart({
  data = [],
  size = 160,
  thickness = 22,
  centerLabel,
  centerSub,
  valueFormat,
  className = "",
  style,
}: {
  data?: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: ReactNode;
  centerSub?: ReactNode;
  valueFormat?: (v: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const total = data.reduce((n, d) => n + Math.max(0, d.value), 0) || 1;
  const fmt = valueFormat ?? ((v: number) => v);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  // Cumulative dash offset per segment, precomputed so the render map stays
  // pure (no closure-variable mutation during render — React-compiler safe).
  const offsets: number[] = [];
  data.reduce((acc, d) => {
    offsets.push(acc);
    return acc + (Math.max(0, d.value) / total) * circumference;
  }, 0);

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 16, ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = Math.max(0, d.value) / total;
          const dash = frac * circumference;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={`var(--chart-${(i % 8) + 1})`}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-(offsets[i] ?? 0)}
              transform={`rotate(-90 ${cx} ${cx})`}
              strokeLinecap="butt"
            >
              <title>{`${typeof d.label === "string" ? d.label : `#${i + 1}`}: ${fmt(d.value)} (${Math.round(frac * 100)}%)`}</title>
            </circle>
          );
        })}
        {(centerLabel != null || centerSub != null) && (
          <>
            <text x={cx} y={cx - 2} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--p-font)", fontWeight: 800, fontSize: size * 0.18, fill: "var(--p-text-1)" }}>
              {centerLabel}
            </text>
            {centerSub != null && (
              <text x={cx} y={cx + size * 0.13} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--p-mono)", fontSize: size * 0.07, letterSpacing: "0.08em", textTransform: "uppercase", fill: "var(--p-text-3)" }}>
                {centerSub}
              </text>
            )}
          </>
        )}
      </svg>
      {data.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {data.map((d, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--p-text-2)" }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: `var(--chart-${(i % 8) + 1})`, flexShrink: 0 }} />
              <span style={{ color: "var(--p-text-1)" }}>{d.label}</span>
              <span style={{ marginInlineStart: "auto", fontFamily: "var(--p-mono-data, var(--p-mono))", color: "var(--p-text-3)" }}>{fmt(d.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
