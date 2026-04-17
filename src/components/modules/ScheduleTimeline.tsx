import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   ScheduleTimeline — Canonical date-grouped timeline
   Extracted from schedules page. Groups items by date
   with per-item render customization.
   ═══════════════════════════════════════════════════════ */

export interface TimelineGroup<T> {
  label: string;
  items: T[];
}

interface ScheduleTimelineProps<T> {
  groups: TimelineGroup<T>[];
  renderItem: (item: T) => ReactNode;
  itemKey: (item: T) => string;
  emptyText?: string;
  emptyDescription?: string;
  className?: string;
}

export function ScheduleTimeline<T>({
  groups,
  renderItem,
  itemKey,
  emptyText = 'No schedules',
  emptyDescription,
  className = '',
}: ScheduleTimelineProps<T>) {
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (totalItems === 0) {
    return (
      <div className={`card p-16 text-center ${className}`}>
        <p className="text-sm text-text-tertiary">{emptyText}</p>
        {emptyDescription && (
          <p className="text-xs text-text-disabled mt-2">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {groups.map((group) => (
        <div key={group.label}>
          <div className="text-label text-text-tertiary mb-3 px-1">
            {group.label}
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <div key={itemKey(item)}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
