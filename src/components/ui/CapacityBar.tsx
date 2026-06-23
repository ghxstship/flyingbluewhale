import type { CSSProperties, ReactNode } from "react";

/**
 * CapacityBar — a load-vs-capacity bullet (§9.3). Renders a track sized to
 * capacity with a fill for load; >100% utilization glows danger (overallocated),
 * 80–100% warns. Token-only colors, tabular figures. Pure render.
 */
export function CapacityBar({
  load,
  capacity,
  label,
  unit = "h",
  className = "",
  style,
}: {
  /** Allocated load (same unit as capacity). */
  load: number;
  /** Available capacity. */
  capacity: number;
  label?: ReactNode;
  unit?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const util = capacity > 0 ? load / capacity : load > 0 ? Infinity : 0;
  const pct = Math.max(0, Math.min(1, util)) * 100;
  const over = util > 1;
  const tone = over ? "var(--p-danger)" : util >= 0.8 ? "var(--p-warning)" : "var(--p-success)";
  const utilPct = Number.isFinite(util) ? Math.round(util * 100) : 100;

  return (
    <div className={className} style={style}>
      {(label || true) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
          {label ? <span style={{ color: "var(--p-text-2)" }}>{label}</span> : <span />}
          <span
            style={{
              fontFamily: "var(--p-mono-data, var(--p-mono))",
              fontVariantNumeric: "tabular-nums",
              color: over ? "var(--p-danger-text)" : "var(--p-text-2)",
              fontWeight: over ? 700 : 500,
            }}
          >
            {Math.round(load)}/{Math.round(capacity)} {unit} · {utilPct}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={utilPct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 8,
          borderRadius: "var(--p-r-pill, 999px)",
          background: "var(--p-surface-2)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: tone,
            borderRadius: "inherit",
            transition: "width var(--motion-normal, 200ms) var(--ease-standard, ease)",
          }}
        />
      </div>
    </div>
  );
}
