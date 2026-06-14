import type { BurndownPoint } from "@/lib/sprints";

/**
 * Burndown chart — pure SVG, server-renderable. Plots actual remaining
 * points (solid) against the ideal linear burndown (dashed) from the
 * sprint's committed total down to zero. All color via --p-* tokens; the
 * viewBox keeps it resolution-independent so px literals are avoided.
 */
const VB_W = 320;
const VB_H = 160;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 22;

export function BurndownChart({
  series,
  committed,
}: {
  series: BurndownPoint[];
  committed: number;
}) {
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;
  const maxY = Math.max(committed, ...series.map((p) => p.remaining), 1);
  const n = series.length;

  const x = (i: number) => PAD_L + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - (v / maxY) * plotH;

  const actualPath = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.remaining).toFixed(1)}`).join(" ");
  const idealStart = `${PAD_L.toFixed(1)} ${y(committed).toFixed(1)}`;
  const idealEnd = `${(PAD_L + plotW).toFixed(1)} ${y(0).toFixed(1)}`;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label="Sprint burndown chart"
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* axes */}
      <line
        x1={PAD_L}
        y1={PAD_T}
        x2={PAD_L}
        y2={PAD_T + plotH}
        stroke="var(--p-border)"
        strokeWidth="1"
      />
      <line
        x1={PAD_L}
        y1={PAD_T + plotH}
        x2={PAD_L + plotW}
        y2={PAD_T + plotH}
        stroke="var(--p-border)"
        strokeWidth="1"
      />
      {/* y labels */}
      <text x={PAD_L - 4} y={y(maxY) + 3} textAnchor="end" fontSize="8" fill="var(--p-text-2)">
        {maxY}
      </text>
      <text x={PAD_L - 4} y={y(0) + 3} textAnchor="end" fontSize="8" fill="var(--p-text-2)">
        0
      </text>
      {/* ideal burndown */}
      <path
        d={`M ${idealStart} L ${idealEnd}`}
        fill="none"
        stroke="var(--p-text-2)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      {/* actual remaining */}
      <path d={actualPath} fill="none" stroke="var(--p-accent)" strokeWidth="2" strokeLinejoin="round" />
      {series.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.remaining)} r="2.5" fill="var(--p-accent)" />
      ))}
    </svg>
  );
}
