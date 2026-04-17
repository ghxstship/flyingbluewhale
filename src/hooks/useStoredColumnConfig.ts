'use client';

import { useState, useCallback } from 'react';

/** useStoredColumnConfig — manages column visibility and row height */
interface ColumnDef {
  key: string;
  label: string;
  visible?: boolean;
}

export function useStoredColumnConfig({
  baseColumns,
  activeView,
  onUpdateView,
}: {
  baseColumns: { key: string; label: string }[];
  activeView?: any;
  onUpdateView?: (id: string, updates: any) => void;
}) {
  const [columns, setColumns] = useState<ColumnDef[]>(
    baseColumns.map((c) => ({ ...c, visible: true }))
  );
  const [rowHeight, setRowHeight] = useState<'compact' | 'normal' | 'comfortable'>('normal');

  const isVisible = useCallback(
    (key: string) => columns.find((c) => c.key === key)?.visible !== false,
    [columns]
  );

  return { columns, isVisible, rowHeight, setColumns, setRowHeight };
}

export default useStoredColumnConfig;
