"use client";

import * as React from "react";
import { X } from "lucide-react";

/**
 * BulkActionBar — a sticky toolbar that appears when one or more rows are
 * selected. Shows a count label, a row of actions (each optionally toned),
 * and a clear-selection control. Pure presentation: the caller owns the
 * selection set and supplies handlers. Token-only colors; the bar is a
 * `role="toolbar"` and the focus ring reads `--p-focus`.
 */
export type BulkActionTone = "default" | "danger";

export type BulkAction = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  tone?: BulkActionTone;
  disabled?: boolean;
};

export type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  /** e.g. (n) => `${n} selected` — overrides the default count label. */
  label?: (count: number) => string;
  clearLabel?: string;
  className?: string;
  "aria-label"?: string;
};

const ACTION_BASE =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const TONE_CLASS: Record<BulkActionTone, string> = {
  default: "text-[var(--p-text-1)] hover:bg-[var(--p-surface-2)]",
  danger: "text-[var(--p-danger)] hover:bg-[var(--p-surface-2)]",
};

export function BulkActionBar({
  selectedCount,
  actions,
  onClear,
  label,
  clearLabel = "Clear selection",
  className = "",
  "aria-label": ariaLabel = "Bulk actions",
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  const countText = label ? label(selectedCount) : `${selectedCount} selected`;

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={`sticky bottom-4 z-30 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 shadow-[var(--p-elev-3)] ${className}`}
    >
      <span className="text-sm font-semibold text-[var(--p-text-1)]" aria-live="polite">
        {countText}
      </span>

      <span className="mx-1 h-5 w-px bg-[var(--p-border)]" aria-hidden="true" />

      {actions.map((a, i) => (
        <button
          key={`${a.label}-${i}`}
          type="button"
          onClick={a.onClick}
          disabled={a.disabled}
          className={`${ACTION_BASE} ${TONE_CLASS[a.tone ?? "default"]}`}
        >
          {a.icon ? (
            <span className="inline-flex items-center" aria-hidden="true">
              {a.icon}
            </span>
          ) : null}
          {a.label}
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        aria-label={clearLabel}
        className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--p-text-2)] transition-colors hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)] focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
