import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-3 p-10 text-center">
      {icon && <div className="text-[var(--text-muted)]">{icon}</div>}
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      {description && <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action}
    </div>
  );
}
