"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CoordinateMatrix } from "@/components/ui/CoordinateMatrix";
import { XPMS_CLASSES, XPMS_ATOM_PHASES } from "@/lib/xpms";

/**
 * §9 Coordinate Lens — the 10 classes (longitude) × 8 phases (latitude) heat
 * grid, fed real per-(class,phase) rollups. The metric switch toggles between
 * pre-computed rollups client-side (no round-trip); `hrefBase` makes cells
 * drill into the microproject workspace. Class columns are tinted by the
 * class's brand accent. Token-only colors.
 */
export type MatrixCell = { classCode: number; phase: string; value: number };
export type MatrixMetric = { id: string; label: string };

const CLASS_ACCENT: Record<string, string> = Object.fromEntries(XPMS_CLASSES.map((c) => [String(c.code), c.accent]));

const fmtInt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));
const fmtMoney = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;

export function PositionMatrix({
  data,
  metrics,
  hrefBase,
}: {
  /** metric id → cells. */
  data: Record<string, MatrixCell[]>;
  metrics: MatrixMetric[];
  /** When set, a cell navigates to `${hrefBase}/${classCode}/${phase}`. */
  hrefBase?: string;
}): React.ReactElement {
  const router = useRouter();
  const [metric, setMetric] = React.useState(metrics[0]?.id ?? "open");

  const longitude = XPMS_CLASSES.map((c) => ({
    id: String(c.code),
    label: c.name,
    short: c.name.slice(0, 3),
    act: String(c.code),
  }));
  const latitude = XPMS_ATOM_PHASES.map((p) => ({ id: p.id, label: p.label, short: String(p.num) }));

  const cells = (data[metric] ?? []).map((c) => ({
    x: String(c.classCode),
    y: c.phase,
    value: c.value,
    label: `${XPMS_CLASSES.find((k) => k.code === c.classCode)?.name ?? c.classCode} × ${
      XPMS_ATOM_PHASES.find((p) => p.id === c.phase)?.label ?? c.phase
    }`,
  }));

  const format =
    metric === "value" ? fmtMoney : metric === "utilization" ? (v: number) => `${Math.round(v)}%` : fmtInt;

  return (
    <div className="space-y-3">
      {metrics.length > 1 && (
        <div role="group" aria-label="Matrix metric" className="inline-flex gap-1 rounded-[var(--p-r,8px)] bg-[var(--p-surface-2)] p-1">
          {metrics.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={metric === m.id}
              onClick={() => setMetric(m.id)}
              className="rounded-[var(--p-r-sm,6px)] px-3 py-1 text-xs font-medium"
              style={{
                background: metric === m.id ? "var(--p-surface)" : "transparent",
                color: metric === m.id ? "var(--p-text-1)" : "var(--p-text-2)",
                boxShadow: metric === m.id ? "var(--p-elev-xs)" : "none",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
      <CoordinateMatrix
        longitude={longitude}
        latitude={latitude}
        cells={cells}
        actColors={CLASS_ACCENT}
        format={format}
        cornerLabel="Phase ↓ / Class →"
        onCellClick={
          hrefBase
            ? (cell) => router.push(`${hrefBase}/${cell.x}/${cell.y}`)
            : undefined
        }
      />
    </div>
  );
}
