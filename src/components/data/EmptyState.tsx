import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';

/* ═══════════════════════════════════════════════════════
   EmptyState — Canonical empty-data placeholder
   Replaces 10+ inline "No data" card patterns.
   ═══════════════════════════════════════════════════════ */

interface EmptyStateProps {
  title?: string;
  description?: string;
  /** Optional CTA button */
  actionLabel?: string;
  actionHref?: string;
  /** Optional icon/emoji */
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No data',
  description,
  actionLabel,
  actionHref,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`card p-16 text-center ${className}`}>
      {icon && <div className="text-3xl mb-4">{icon}</div>}
      <p className="text-sm text-text-tertiary mb-1">{title}</p>
      {description && (
        <p className="text-xs text-text-disabled max-w-md mx-auto">{description}</p>
      )}
      {actionLabel && actionHref && (
        <div className="mt-6">
          <Button variant="secondary" size="sm" href={actionHref}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
