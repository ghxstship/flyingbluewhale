"use client";

import * as React from "react";

/**
 * Labeled meter / gauge — a static scalar reading within a known range
 * (`role="meter"`), distinct from <ProgressBar> (task progress).
 *
 * Linear bar by default; `variant="radial"` draws an SVG arc gauge. Tones map
 * to the semantic tokens plus the product accent; the fill color is driven by
 * an inline `--meter-fill` custom property so no raw hex ever ships.
 */

export type MeterTone = "success" | "warning" | "danger" | "info" | "accent";
export type MeterVariant = "linear" | "radial";

const TONE_VAR: Record<MeterTone, string> = {
  success: "var(--p-success)",
  warning: "var(--p-warning)",
  danger: "var(--p-danger)",
  info: "var(--p-info)",
  accent: "var(--p-accent)",
};

export interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  tone?: MeterTone;
  variant?: MeterVariant;
  /** Visible text label above the bar / centered in the radial. */
  label?: string;
  /** Show the numeric value (formatted via `format` or raw). Default true. */
  showValue?: boolean;
  /** Custom value formatter, e.g. (v) => `${v}%`. */
  format?: (value: number) => string;
  /** Accessible name when no visible `label` is provided. */
  "aria-label"?: string;
  className?: string;
}

export function Meter({
  value,
  min = 0,
  max = 100,
  tone = "accent",
  variant = "linear",
  label,
  showValue = true,
  format,
  "aria-label": ariaLabel,
  className = "",
}: MeterProps) {
  const span = max - min || 1;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = ((clamped - min) / span) * 100;
  const fill = TONE_VAR[tone];
  const display = format ? format(clamped) : String(clamped);
  const a11y: React.AriaAttributes & { role: "meter" } = {
    role: "meter",
    "aria-valuenow": clamped,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-label": label ? undefined : (ariaLabel ?? "Meter"),
    "aria-valuetext": display,
  };

  if (variant === "radial") {
    const size = 96;
    const stroke = 10;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        <div {...a11y} className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--p-surface-2)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={fill}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              style={{ transition: "stroke-dasharray var(--motion-normal) var(--ease-out)" }}
            />
          </svg>
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-[var(--p-text-1)]">
              {display}
            </div>
          )}
        </div>
        {label && <span className="text-xs text-[var(--p-text-2)]">{label}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && <span className="text-[var(--p-text-2)]">{label}</span>}
          {showValue && <span className="font-mono tabular-nums text-[var(--p-text-1)]">{display}</span>}
        </div>
      )}
      <div {...a11y} className="h-2 w-full overflow-hidden rounded-full bg-[var(--p-surface-2)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: fill,
            transition: "width var(--motion-normal) var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}
