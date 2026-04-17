import React from 'react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   FilterPills Component
   Row of selectable chips for inline list filtering.
   ═══════════════════════════════════════════════════════ */

export interface FilterOption {
  value?: string;
  key?: string;
  label: string;
  count?: number;
}

export interface FilterPillsProps {
  items: FilterOption[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  allLabel?: string;
}

export default function FilterPills({
  items,
  activeKey,
  onChange,
  className,
  allLabel = 'All',
}: FilterPillsProps) {
  const renderPill = (val: string, label: string, count?: number) => {
    const active = activeKey === val;
    return (
      <button
        key={val}
        onClick={() => onChange(val)}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors border',
          active
            ? 'bg-foreground text-background border-transparent shadow-sm'
            : 'bg-surface text-text-secondary border-border hover:bg-bg-elevated hover:text-foreground'
        )}
      >
        {label}
        {count !== undefined && (
          <span
            className={cn(
              'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[0.65rem] font-semibold tracking-wider leading-none',
              active ? 'bg-background/20' : 'bg-bg-secondary text-text-muted'
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {renderPill('all', allLabel)}
      {items.map((opt) => renderPill(opt.value || opt.key || '', opt.label, opt.count))}
    </div>
  );
}
