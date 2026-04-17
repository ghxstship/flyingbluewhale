import React from 'react';
import { cn } from '@/lib/utils';
import { FileMinus } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Empty State Component
   Standard UI for lists, tables, or sections with no data.
   ═══════════════════════════════════════════════════════ */

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  message,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-surface/30',
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary text-text-muted mb-4">
        {icon || <FileMinus className="h-6 w-6" />}
      </div>
      {(title || message) && (
        <h3 className="text-lg font-medium text-heading mb-1">{title || message}</h3>
      )}
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
