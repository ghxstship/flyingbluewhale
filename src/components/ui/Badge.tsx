import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   Badge — Canonical pill/tag primitive
   Replaces all inline <span> pill patterns across the platform.
   ═══════════════════════════════════════════════════════ */

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'cyan' | 'purple' | 'muted';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:  'bg-surface-raised text-text-secondary',
  success:  'bg-[rgba(34,197,94,0.12)] text-[#22C55E]',
  warning:  'bg-[rgba(234,179,8,0.12)] text-[#EAB308]',
  error:    'bg-[rgba(239,68,68,0.12)] text-[#EF4444]',
  info:     'bg-[rgba(59,130,246,0.12)] text-[#3B82F6]',
  cyan:     'bg-cyan-subtle text-cyan',
  purple:   'bg-[rgba(168,85,247,0.12)] text-[#A855F7]',
  muted:    'bg-[rgba(156,163,175,0.12)] text-[#9CA3AF]',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`badge ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
