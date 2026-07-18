import type { CSSProperties } from "react";

/**
 * ProgressRing — kit 32 D4. A compact SVG completion ring for list rows that
 * carry a percent value (e.g. `tasks.percent_complete`). Presentational and
 * server-safe: the accent arc reads the live `--p-accent` so it recolors per
 * product; the track reads `--p-border`.
 *
 * Design truth: enrichment plan D4 (runtime/app.jsx task rows) — a ring is
 * shown only when a real % exists; a bare badge otherwise.
 */
export type ProgressRingProps = {
  /** 0..100. Clamped. */
  value: number;
  size?: number;
  stroke?: number;
  /** Accessible label + hover title. Defaults to "N% complete". */
  label?: string;
  style?: CSSProperties;
};

export function ProgressRing({ value, size = 26, stroke = 3, label, style }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const lbl = label ?? `${pct}% complete`;
  const mid = size / 2;
  return (
    <span
      className="prog-ring"
      role="img"
      aria-label={lbl}
      title={lbl}
      style={{ width: size, height: size, flex: "none", display: "inline-flex", position: "relative", ...style }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--p-border)" strokeWidth={stroke} />
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke="var(--p-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </svg>
    </span>
  );
}
