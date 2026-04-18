import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  icon,
  illustration,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-3 p-10 text-center">
      {illustration ? (
        <div aria-hidden="true" className="mb-2 opacity-80">
          {illustration}
        </div>
      ) : (
        <div aria-hidden="true" className="text-[var(--text-muted)]">
          {icon ?? <Inbox size={32} />}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      {description && <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
