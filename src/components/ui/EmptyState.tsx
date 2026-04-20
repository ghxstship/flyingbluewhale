import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * <EmptyState> — canonical blank slate across every shell.
 *
 * `size="default"` is the full-page zero state (Attio / Linear / Stripe
 * treatment): icon + title + description + actions, generous padding.
 *
 * `size="compact"` is the inline variant for section-level empties
 * (e.g. "no proposals yet" inside a detail tab) — keeps visual
 * consistency without dominating the card it lives in.
 */
export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  icon,
  illustration,
  size = "default",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
  size?: "default" | "compact";
}) {
  if (size === "compact") {
    return (
      <div className="flex flex-col items-center justify-center gap-1 p-5 text-center">
        <h3 className="text-sm font-medium text-[var(--foreground)]">{title}</h3>
        {description && <p className="max-w-sm text-xs text-[var(--text-muted)]">{description}</p>}
        {(action || secondaryAction) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    );
  }
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
