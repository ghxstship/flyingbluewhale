import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Alert Component
   Used for inline notifications, errors, and success messages
   ═══════════════════════════════════════════════════════ */

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'success' | 'warning' | 'info';
  title?: string;
  icon?: boolean;
  onClose?: () => void;
}

const matchIcon = {
  default: Info,
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

export default function Alert({
  className,
  variant = 'default',
  title,
  children,
  icon = true,
  onClose,
  ...props
}: AlertProps) {
  const Icon = matchIcon[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:text-foreground [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11',
        variant === 'default' && 'bg-background text-foreground',
        variant === 'error' && 'border-destructive/50 text-destructive bg-destructive/10 dark:border-destructive [&>svg]:text-destructive',
        variant === 'success' && 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10 dark:border-emerald-500 [&>svg]:text-emerald-600',
        variant === 'warning' && 'border-amber-500/50 text-amber-600 bg-amber-500/10 dark:border-amber-500 [&>svg]:text-amber-600',
        variant === 'info' && 'border-blue-500/50 text-blue-600 bg-blue-500/10 dark:border-blue-500 [&>svg]:text-blue-600',
        className
      )}
      {...props}
    >
      {icon && <Icon className="h-4 w-4" />}
      
      {title && (
        <h5 className="mb-1 font-medium leading-none tracking-tight">
          {title}
        </h5>
      )}
      
      <div className="text-sm [&_p]:leading-relaxed opacity-90">
        {children}
      </div>

      {onClose && (
        <button
          className="absolute top-4 right-4 text-inherit opacity-70 hover:opacity-100 transition-opacity"
          onClick={onClose}
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
