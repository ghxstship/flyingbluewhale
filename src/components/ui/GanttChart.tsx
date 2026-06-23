"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * GanttChart — horizontal bars per row across a time axis, with a vertical
 * "today" line and a day/week/month zoom toggle. start/end/today are epoch-ms
 * timestamps. Bars are colored from a tone token or the `--chart-*` ramp by
 * index. Render-only — drag-to-assign is out of scope. Ported from the ATLVS
 * kit (kits/core/components/data/GanttChart.d.ts).
 *
 * Distinct from views/GanttView, which aliases TimelineView.
 */
export type GanttZoom = "day" | "week" | "month";

export type GanttRow = {
  id: string;
  label: ReactNode;
  /** Epoch ms. */
  start: number;
  /** Epoch ms. */
  end: number;
  lane?: string;
  /** A CSS color token, e.g. "var(--chart-3)". Defaults by index. */
  tone?: string;
};

const ZOOMS: GanttZoom[] = ["day", "week", "month"];

export function GanttChart({
  rows = [],
  zoom = "week",
  onChangeZoom,
  today,
  className = "",
  style,
}: {
  rows?: GanttRow[];
  zoom?: GanttZoom;
  onChangeZoom?: (z: GanttZoom) => void;
  /** Epoch ms for the "today" marker. */
  today?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const starts = rows.map((r) => r.start);
  const ends = rows.map((r) => r.end);
  const min = rows.length ? Math.min(...starts) : 0;
  const max = rows.length ? Math.max(...ends) : 1;
  const span = Math.max(1, max - min);
  const pct = (t: number) => ((t - min) / span) * 100;

  const ROW_H = 34;
  const LABEL_W = 160;

  return (
    <div className={className} style={style}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <div
          role="group"
          aria-label="Zoom"
          style={{
            display: "inline-flex",
            border: "1px solid var(--p-border)",
            borderRadius: "var(--p-r-sm, 6px)",
            overflow: "hidden",
            background: "var(--p-surface-2)",
          }}
        >
          {ZOOMS.map((z) => {
            const active = z === zoom;
            return (
              <button
                key={z}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeZoom?.(z)}
                style={{
                  paddingInline: 12,
                  height: 28,
                  border: "none",
                  background: active ? "var(--p-accent)" : "transparent",
                  color: active ? "var(--p-accent-cta-contrast)" : "var(--p-text-2)",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  textTransform: "capitalize",
                }}
              >
                {z}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          border: "1px solid var(--p-border)",
          borderRadius: "var(--p-r, 8px)",
          overflow: "hidden",
          background: "var(--p-surface)",
        }}
      >
        {/* Today line, positioned over the plot area only. */}
        {today != null && today >= min && today <= max && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              insetInlineStart: `calc(${LABEL_W}px + ${pct(today)} * (100% - ${LABEL_W}px) / 100)`,
              width: 0,
              borderInlineStart: "2px dashed var(--p-danger)",
              zIndex: 2,
            }}
          />
        )}

        {rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--p-text-3)", fontSize: 13 }}>No rows.</div>
        ) : (
          rows.map((r, i) => {
            const left = pct(r.start);
            const width = Math.max(1, pct(r.end) - left);
            const color = r.tone ?? `var(--chart-${(i % 8) + 1})`;
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: ROW_H,
                  borderTop: i === 0 ? "none" : "1px solid var(--p-border)",
                }}
              >
                <div
                  style={{
                    width: LABEL_W,
                    flexShrink: 0,
                    paddingInline: 12,
                    color: "var(--p-text-1)",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    borderInlineEnd: "1px solid var(--p-border)",
                  }}
                >
                  {r.label}
                </div>
                <div style={{ position: "relative", flex: 1, height: "100%" }}>
                  <div
                    title={r.lane}
                    style={{
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      insetInlineStart: `${left}%`,
                      width: `${width}%`,
                      height: 16,
                      borderRadius: "var(--p-r-sm, 6px)",
                      background: color,
                      minWidth: 4,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
