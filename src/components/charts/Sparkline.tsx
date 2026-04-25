"use client";

/**
 * Sparkline — inline trend visualization. Lift-out from MetricCard so
 * any KPI / row / cell can carry a tiny trend line. Stays SVG (no
 * recharts overhead) so it renders in tables at scale.
 */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "var(--org-primary)",
  fillOpacity = 0.12,
  className = "",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / span) * height,
  }));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const fill = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <path d={fill} fill={color} fillOpacity={fillOpacity} />
      <path
        d={path}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
