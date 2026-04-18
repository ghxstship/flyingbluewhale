"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

type Severity = "default" | "warn" | "critical" | "success";

interface ProgressBarProps {
  /** 0–100. Ignored when `indeterminate` is true. */
  value?: number;
  /** Show shimmer instead of a filled bar. */
  indeterminate?: boolean;
  showLabel?: boolean;
  /** Severity thresholds (0-100). */
  thresholds?: { warn: number; critical: number };
  /** Explicit severity override (bypasses thresholds). */
  severity?: Severity;
  "aria-label"?: string;
  className?: string;
}

export function ProgressBar({
  value,
  indeterminate,
  showLabel = false,
  thresholds = { warn: 70, critical: 90 },
  severity,
  "aria-label": ariaLabel,
  className = "",
}: ProgressBarProps) {
  const clamped = indeterminate ? undefined : Math.max(0, Math.min(100, value ?? 0));
  const inferredSeverity: Severity = severity
    ? severity
    : clamped == null
      ? "default"
      : clamped > thresholds.critical
        ? "critical"
        : clamped > thresholds.warn
          ? "warn"
          : "default";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ProgressPrimitive.Root
        value={clamped ?? null}
        data-severity={inferredSeverity}
        data-indeterminate={indeterminate ? "" : undefined}
        aria-label={ariaLabel ?? (showLabel ? `${clamped ?? 0}%` : "Progress")}
        className="progress-root"
      >
        <ProgressPrimitive.Indicator
          className="progress-indicator"
          style={indeterminate ? undefined : { transform: `translateX(-${100 - (clamped ?? 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && !indeterminate && (
        <span className="font-mono text-[10px] text-[var(--text-muted)]">{clamped}%</span>
      )}
    </div>
  );
}
