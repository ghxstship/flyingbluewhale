import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   StatCard — Canonical stat display card
   Replaces 4+ inline stat-grid patterns across
   console, inventory, catering, and check-in pages.
   ═══════════════════════════════════════════════════════ */

interface StatCardProps {
  label: string;
  value: string | number;
  /** Highlight with cyan accent */
  accent?: boolean;
  /** Optional icon/emoji */
  icon?: ReactNode;
  /** Optional sub-label (e.g., "0/0") */
  subLabel?: string;
  /** Show a progress bar under the value */
  progress?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  accent = false,
  icon,
  subLabel,
  progress,
  className = '',
}: StatCardProps) {
  return (
    <div className={`card p-5 ${className}`}>
      {(icon || subLabel) && (
        <div className="flex justify-between mb-2">
          {icon && <span className="text-base">{icon}</span>}
          {subLabel && (
            <span className="text-[0.625rem] text-text-disabled">{subLabel}</span>
          )}
        </div>
      )}
      <div className={`text-display text-3xl ${accent ? 'text-cyan' : 'text-text-primary'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-label text-text-tertiary mt-2">{label}</div>
      {progress !== undefined && (
        <div className="w-full bg-surface-raised rounded h-1 mt-3">
          <div
            className="bg-cyan rounded h-1 transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
