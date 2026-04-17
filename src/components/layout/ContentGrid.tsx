import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   ContentGrid — Canonical responsive grid layout
   Replaces inline stat-grid and card-grid patterns.
   ═══════════════════════════════════════════════════════ */

interface ContentGridProps {
  /** Number of columns at each breakpoint */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: string;
  children: ReactNode;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export function ContentGrid({
  columns = { sm: 1, md: 2, lg: 4 },
  gap = '1rem',
  children,
  className = '',
}: ContentGridProps) {
  const smCols = GRID_COLS[columns.sm ?? 1] ?? 'grid-cols-1';
  const mdCols = columns.md ? `md:${GRID_COLS[columns.md]}` : '';
  const lgCols = columns.lg ? `lg:${GRID_COLS[columns.lg]}` : '';

  return (
    <div
      className={`grid ${smCols} ${mdCols} ${lgCols} ${className}`}
      style={{ gap }}
    >
      {children}
    </div>
  );
}
