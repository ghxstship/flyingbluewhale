import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   SectionHeading — Canonical section heading with accent bar
   Replaces inline cyan-bar + heading pattern from
   deliverable detail, check-in dashboard, and portal pages.
   ═══════════════════════════════════════════════════════ */

interface SectionHeadingProps {
  children: ReactNode;
  /** Accent bar color. Defaults to cyan. */
  accentColor?: string;
  /** Right-side actions/info */
  trailing?: ReactNode;
  className?: string;
}

export function SectionHeading({
  children,
  accentColor = 'var(--color-cyan)',
  trailing,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${className}`}>
      <div
        className="w-[3px] h-6 rounded"
        style={{ background: accentColor }}
      />
      <h2 className="text-heading text-sm text-text-primary flex-1">
        {children}
      </h2>
      {trailing && (
        <div className="text-label text-text-disabled">{trailing}</div>
      )}
    </div>
  );
}
