"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  /** Re-run the fetcher. Triggers a new loading state. */
  refetch: () => Promise<void>;
  /** Bypass loading state (e.g. mutate after action) without showing skeleton. */
  setData: (next: T | ((prev: T | undefined) => T)) => void;
};

/**
 * Canonical async-data hook. One place for loading/error/retry.
 *
 * Use over ad-hoc `useEffect + setState` for: option loaders, async list
 * panes, deferred detail panes, anything where the data layer can fail
 * and the UI should reflect it.
 *
 *   const { data, loading, error, refetch } = useAsyncData(() =>
 *     fetch("/api/v1/foo").then(r => r.json()), [orgId]);
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): AsyncState<T> {
  const [data, setDataRaw] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const cancelledRef = useRef(false);
  const runIdRef = useRef(0);

  const run = async () => {
    cancelledRef.current = false;
    const runId = ++runIdRef.current;
    setLoading(true);
    setError(undefined);
    try {
      const next = await fetcher();
      if (cancelledRef.current || runIdRef.current !== runId) return;
      setDataRaw(next);
    } catch (e) {
      if (cancelledRef.current || runIdRef.current !== runId) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (!cancelledRef.current && runIdRef.current === runId) setLoading(false);
    }
  };

  useEffect(() => {
    void run();
    return () => {
      cancelledRef.current = true;
    };
    // Caller-provided deps drive re-fetching; intentional dynamic dep list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((next: T | ((prev: T | undefined) => T)) => {
    setDataRaw((prev) =>
      typeof next === "function" ? (next as (prev: T | undefined) => T)(prev) : next,
    );
  }, []);

  return { data, loading, error, refetch: run, setData };
}
