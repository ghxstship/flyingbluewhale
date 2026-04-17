'use client';

import { useState, useCallback, useMemo } from 'react';

/** useSort — generic client-side sort hook */
interface SortState {
  field: string | null;
  direction: 'asc' | 'desc';
}

export function useSort<T extends Record<string, any>>(data: T[]) {
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'asc' });

  const handleSort = useCallback((field: string) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sorted = useMemo(() => {
    if (!sort.field) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.field!];
      const bVal = b[sort.field!];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  return { sorted, sort, handleSort };
}

export default useSort;
