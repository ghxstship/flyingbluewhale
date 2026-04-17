interface ProgressBarProps {
  value: number;
  width?: number | string;
  showLabel?: boolean;
  thresholds?: { warn: number; critical: number };
  className?: string;
}

export function ProgressBar({
  value,
  width = "100%",
  showLabel = false,
  thresholds = { warn: 70, critical: 90 },
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped > thresholds.critical ? "var(--color-error)" :
    clamped > thresholds.warn ? "var(--color-warning)" :
    "var(--org-primary)";

  const widthStyle = typeof width === "number" ? `${width}px` : width;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-secondary)]" style={{ width: widthStyle }}>
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && <span className="font-mono text-[0.625rem] text-[var(--text-muted)]">{clamped}%</span>}
    </div>
  );
}
