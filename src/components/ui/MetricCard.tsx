import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  delta,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  delta?: { value: string; positive?: boolean };
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        {icon}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-[var(--org-primary)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
      {delta && (
        <div
          className={`mt-1 text-xs font-medium ${
            delta.positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
          }`}
        >
          {delta.positive ? "↑" : "↓"} {delta.value}
        </div>
      )}
    </div>
  );
}
