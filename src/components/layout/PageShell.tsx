import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   PageShell — Canonical page wrapper
   Replaces per-page:
     <div className="min-h-screen" style={{background: 'var(--color-bg)'}}>
       <div style={{padding: '2rem'}}><div style={{maxWidth: '72rem', margin: '0 auto'}}>
   ═══════════════════════════════════════════════════════ */

interface PageShellProps {
  children: ReactNode;
  /** Max width of content area. Defaults to '72rem'. */
  maxWidth?: string;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Disable inner content padding (for pages that manage their own layout) */
  noPadding?: boolean;
}

export function PageShell({
  children,
  maxWidth = '72rem',
  className = '',
  noPadding = false,
}: PageShellProps) {
  return (
    <div className={`page-shell ${className}`}>
      {noPadding ? (
        children
      ) : (
        <div className="page-content" style={{ maxWidth }}>
          {children}
        </div>
      )}
    </div>
  );
}
