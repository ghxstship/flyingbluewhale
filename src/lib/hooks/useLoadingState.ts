"use client";

import { useCallback, useState } from "react";

/**
 * useLoadingState — coordinated `aria-busy` for any async surface.
 *
 *   const loading = useLoadingState();
 *   <div aria-busy={loading.busy}>…</div>
 *   await loading.run(() => fetch(...));   // toggles busy around the call
 *
 * Tracks named in-flight ops so multiple async calls don't race the
 * busy state to false too early. Operators' UIs feel "settled" only
 * when *all* in-flight ops finish.
 */
export function useLoadingState() {
  const [pending, setPending] = useState<Set<string>>(new Set());

  const start = useCallback((id: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  const finish = useCallback((id: string) => {
    setPending((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, id = "default"): Promise<T> => {
      start(id);
      try {
        return await fn();
      } finally {
        finish(id);
      }
    },
    [start, finish],
  );

  return {
    busy: pending.size > 0,
    isPending: (id: string) => pending.has(id),
    run,
    start,
    finish,
  };
}
