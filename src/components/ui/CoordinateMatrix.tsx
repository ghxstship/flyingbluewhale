"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * CoordinateMatrix — a heat-shaded grid plotting a value at each
 * longitude × latitude cell, with each cell color-mixed from the surface
 * toward the accent by value/max. Cells are buttons. Plus `Coordinate`, the
 * small "Class × Phase" chip for a RecordHeader. Ported from the ATLVS kit
 * (kits/core/components/data/CoordinateMatrix.d.ts).
 */
export type CoordinateAxis = { id: string; label: ReactNode; short?: ReactNode; act?: string };
export type CoordinateCell = { x: string; y: string; value: number; label?: ReactNode };

export function CoordinateMatrix({
  longitude,
  latitude,
  cells,
  metric,
  max,
  format,
  accent = "var(--p-accent)",
  actColors,
  colAxisLabel,
  rowAxisLabel,
  cornerLabel,
  onCellClick,
  className = "",
  style,
}: {
  /** Columns. */
  longitude: CoordinateAxis[];
  /** Rows. */
  latitude: CoordinateAxis[];
  cells: CoordinateCell[];
  metric?: ReactNode;
  /** Fix the heat-scale max; auto from cells otherwise. */
  max?: number;
  format?: (value: number) => ReactNode;
  /** The hot end of the heat scale. */
  accent?: string;
  /** Optional per-act color tokens, keyed by axis `act`. */
  actColors?: Record<string, string>;
  colAxisLabel?: ReactNode;
  rowAxisLabel?: ReactNode;
  cornerLabel?: ReactNode;
  onCellClick?: (cell: CoordinateCell & { lon: CoordinateAxis; lat: CoordinateAxis }) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const peak = max ?? Math.max(1, ...cells.map((c) => c.value));
  const fmt = format ?? ((v: number) => v);
  const cellAt = (x: string, y: string) => cells.find((c) => c.x === x && c.y === y);

  return (
    <div className={className} style={{ overflowX: "auto", ...style }}>
      {(metric || colAxisLabel) && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          {metric && <span style={{ color: "var(--p-text-1)", fontWeight: 700 }}>{metric}</span>}
          {colAxisLabel && (
            <span style={{ fontFamily: "var(--p-mono)", fontSize: 11, color: "var(--p-text-3)" }}>{colAxisLabel}</span>
          )}
        </div>
      )}
      <table style={{ borderCollapse: "separate", borderSpacing: 4, width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "start",
                fontFamily: "var(--p-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--p-text-3)",
                padding: "0 6px",
                whiteSpace: "nowrap",
              }}
            >
              {cornerLabel ?? rowAxisLabel ?? ""}
            </th>
            {longitude.map((lon) => (
              <th
                key={lon.id}
                title={typeof lon.label === "string" ? lon.label : undefined}
                style={{
                  fontFamily: "var(--p-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: lon.act && actColors?.[lon.act] ? actColors[lon.act] : "var(--p-text-2)",
                  padding: "0 4px 4px",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {lon.short ?? lon.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {latitude.map((lat) => (
            <tr key={lat.id}>
              <th
                scope="row"
                title={typeof lat.label === "string" ? lat.label : undefined}
                style={{
                  textAlign: "start",
                  fontFamily: "var(--p-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: lat.act && actColors?.[lat.act] ? actColors[lat.act] : "var(--p-text-2)",
                  padding: "0 6px",
                  whiteSpace: "nowrap",
                }}
              >
                {lat.short ?? lat.label}
              </th>
              {longitude.map((lon) => {
                const cell = cellAt(lon.id, lat.id);
                const value = cell?.value ?? 0;
                const intensity = peak ? Math.max(0, Math.min(1, value / peak)) : 0;
                const pct = Math.round(intensity * 100);
                const filled = cell != null;
                return (
                  <td key={lon.id} style={{ padding: 0 }}>
                    <button
                      type="button"
                      disabled={!filled || !onCellClick}
                      onClick={() => cell && onCellClick?.({ ...cell, lon, lat })}
                      title={cell?.label != null && typeof cell.label === "string" ? cell.label : undefined}
                      style={{
                        width: "100%",
                        minWidth: 44,
                        height: 40,
                        border: "1px solid var(--p-border)",
                        borderRadius: "var(--p-r-sm, 6px)",
                        background: filled
                          ? `color-mix(in srgb, ${accent} ${pct}%, var(--p-surface))`
                          : "var(--p-surface-2)",
                        color: intensity > 0.55 ? "var(--p-accent-cta-contrast)" : "var(--p-text-1)",
                        cursor: filled && onCellClick ? "pointer" : "default",
                        font: "inherit",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--p-mono-data, var(--p-mono))",
                      }}
                    >
                      {filled ? fmt(value) : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rowAxisLabel && !cornerLabel && (
        <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, color: "var(--p-text-3)", marginTop: 6 }}>{rowAxisLabel}</div>
      )}
    </div>
  );
}

/**
 * Coordinate — a compact "Class × Phase" chip pairing a longitude and latitude
 * value, for a RecordHeader. Pure render.
 */
export function Coordinate({
  longitude,
  latitude,
  lonColor = "var(--p-accent)",
  act,
  actColor,
  className = "",
  style,
}: {
  longitude: ReactNode;
  latitude: ReactNode;
  lonColor?: string;
  act?: ReactNode;
  actColor?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        border: "1px solid var(--p-border)",
        borderRadius: "var(--p-r-sm, 6px)",
        background: "var(--p-surface)",
        fontFamily: "var(--p-mono)",
        fontSize: 12,
        ...style,
      }}
    >
      <span style={{ color: lonColor, fontWeight: 700 }}>{longitude}</span>
      <span aria-hidden style={{ color: "var(--p-text-3)" }}>
        ×
      </span>
      <span style={{ color: "var(--p-text-1)", fontWeight: 600 }}>{latitude}</span>
      {act != null && (
        <span style={{ color: actColor ?? "var(--p-text-2)", marginInlineStart: 4, fontWeight: 600 }}>{act}</span>
      )}
    </span>
  );
}
