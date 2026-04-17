import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   AlertBanner — Canonical alert/warning banner
   Replaces low-stock-alerts + urgent-schedule patterns.
   ═══════════════════════════════════════════════════════ */

export type AlertVariant = 'warning' | 'error' | 'info' | 'success';

const VARIANT_STYLES: Record<AlertVariant, { border: string; bg: string; accent: string }> = {
  warning: {
    border: 'border-[rgba(234,179,8,0.2)]',
    bg: 'bg-[rgba(234,179,8,0.05)]',
    accent: 'text-[#EAB308]',
  },
  error: {
    border: 'border-[rgba(239,68,68,0.2)]',
    bg: 'bg-[rgba(239,68,68,0.05)]',
    accent: 'text-[#EF4444]',
  },
  info: {
    border: 'border-[rgba(59,130,246,0.2)]',
    bg: 'bg-[rgba(59,130,246,0.05)]',
    accent: 'text-[#3B82F6]',
  },
  success: {
    border: 'border-[rgba(34,197,94,0.2)]',
    bg: 'bg-[rgba(34,197,94,0.05)]',
    accent: 'text-[#22C55E]',
  },
};

interface AlertBannerProps {
  variant?: AlertVariant;
  title: string;
  children?: ReactNode;
  className?: string;
}

export function AlertBanner({
  variant = 'error',
  title,
  children,
  className = '',
}: AlertBannerProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`rounded-xl p-4 mb-6 border ${styles.border} ${styles.bg} ${className}`}
    >
      <div className={`text-label ${styles.accent} mb-2`}>
        {title}
      </div>
      {children && (
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
