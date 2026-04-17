import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   KanbanBoard — Canonical kanban column layout
   Extracted from fulfillment page. Reusable for any
   status-based column workflow.
   ═══════════════════════════════════════════════════════ */

export interface KanbanColumn<T> {
  key: string;
  label: string;
  color: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  /** Render function for each card */
  renderCard: (item: T) => ReactNode;
  /** Key extractor for each item */
  itemKey: (item: T) => string;
  /** Minimum width per column */
  columnMinWidth?: number;
  className?: string;
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  itemKey,
  columnMinWidth = 180,
  className = '',
}: KanbanBoardProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div
        className="flex gap-4"
        style={{ minWidth: columns.length * (columnMinWidth + 16) }}
      >
        {columns.map((col) => (
          <div key={col.key} className="flex-1" style={{ minWidth: columnMinWidth }}>
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: col.color }}
              />
              <span className="text-label text-text-tertiary">{col.label}</span>
              <span className="text-mono text-[0.5625rem] text-text-disabled">
                {col.items.length}
              </span>
            </div>

            {/* Column Items */}
            <div className="flex flex-col gap-2">
              {col.items.length === 0 ? (
                <div className="card p-4 text-center border-dashed">
                  <p className="text-text-disabled text-xs">Empty</p>
                </div>
              ) : (
                col.items.map((item) => (
                  <div key={itemKey(item)}>
                    {renderCard(item)}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
