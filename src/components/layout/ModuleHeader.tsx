import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   ModuleHeader — Canonical module page header
   Replaces 14+ inline <header style={{borderBottom...}}>
   patterns with title, subtitle, and action slot.
   ═══════════════════════════════════════════════════════ */

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-side action buttons */
  children?: ReactNode;
  /** Back link for detail pages */
  backHref?: string;
  backLabel?: string;
  /** Max width of inner container. Defaults to '72rem'. */
  maxWidth?: string;
}

export function ModuleHeader({
  title,
  subtitle,
  children,
  backHref,
  backLabel,
  maxWidth = '72rem',
}: ModuleHeaderProps) {
  return (
    <header className="module-header">
      <div className="module-header-inner" style={{ maxWidth }}>
        <div>
          {backHref && (
            <a
              href={backHref}
              className="text-cyan text-xs tracking-wider uppercase mb-2 inline-block hover:text-cyan-bright transition-colors"
            >
              &larr; {backLabel ?? 'Back'}
            </a>
          )}
          <h1 className="text-heading text-xl text-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-[0.8125rem] text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">{children}</div>
        )}
      </div>
    </header>
  );
}
