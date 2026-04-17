'use client';

import { useState, useCallback, useMemo } from 'react';

/** useSelection — tracks selected IDs for bulk operations */
export function useSelection(allIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : [...allIds]));
  }, [allIds]);

  const deselectAll = useCallback(() => setSelectedIds([]), []);

  const isAllSelected = useMemo(() => allIds.length > 0 && selectedIds.length === allIds.length, [allIds, selectedIds]);
  const isSomeSelected = useMemo(() => selectedIds.length > 0 && selectedIds.length < allIds.length, [allIds, selectedIds]);
  const count = selectedIds.length;

  return { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count };
}

export default useSelection;
