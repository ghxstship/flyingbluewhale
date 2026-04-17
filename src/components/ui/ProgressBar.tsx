/* ═══════════════════════════════════════════════════════
   ProgressBar — Canonical progress/utilization bar
   Replaces inline utilization bars in inventory,
   check-in dashboard, and fulfillment pages.
   ═══════════════════════════════════════════════════════ */

interface ProgressBarProps {
  /** Value from 0-100 */
  value: number;
  /** Width in pixels or CSS value. Defaults to '100%'. */
  width?: number | string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom color thresholds; defaults to cyan→yellow→red */
  thresholds?: { warn: number; critical: number };
  className?: string;
}

export function ProgressBar({
  value,
  width = '100%',
  showLabel = false,
  thresholds = { warn: 70, critical: 90 },
  className = '',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped > thresholds.critical
      ? '#EF4444'
      : clamped > thresholds.warn
        ? '#EAB308'
        : '#00E5FF';

  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="bg-surface-raised rounded h-1.5"
        style={{ width: widthStyle }}
      >
        <div
          className="rounded h-1.5 transition-all duration-300"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-mono text-text-disabled text-[0.5625rem]">
          {clamped}%
        </span>
      )}
    </div>
  );
}
