"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Sync a piece of state to a URL search param.
 * - Reads initial value from the current URL
 * - `replace: true` (default) updates URL without pushing history
 * - `serializer` optional (JSON-encode arrays/objects)
 *
 * Performance (PF-2): the URL write is a *mirror* of local state, not the
 * source of truth — component state updates immediately, the URL follows.
 * In `replace` mode we sync via shallow `window.history.replaceState`
 * (no router navigation → no RSC round-trip on force-dynamic pages), and
 * rapid successive updates (e.g. per-keystroke table search) are
 * debounced: the first change in a quiet window syncs immediately
 * (sort toggles stay instant), follow-ups within ~300ms coalesce into a
 * single trailing write. Pending writes flush on unmount.
 *
 * Usage:
 *   const [sort, setSort] = useUrlState("sort", "name");
 *   const [filters, setFilters] = useUrlState("f", [], { serializer: "json" });
 */

const URL_SYNC_DEBOUNCE_MS = 300;

export function useUrlState<T extends string | number | boolean | string[] | Record<string, unknown>>(
  key: string,
  initialValue: T,
  opts: { replace?: boolean; serializer?: "json" } = {},
): [T, (v: T | ((prev: T) => T)) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replace = opts.replace ?? true;
  const useJson = opts.serializer === "json";

  const initial = useMemo(() => {
    const raw = searchParams.get(key);
    if (raw == null) return initialValue;
    if (useJson) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return initialValue;
      }
    }
    if (typeof initialValue === "number") return Number(raw) as unknown as T;
    if (typeof initialValue === "boolean") return (raw === "true") as unknown as T;
    return raw as unknown as T;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // only on mount

  const [value, setLocal] = useState<T>(initial);

  // Refs so the debounced sync + unmount flush always see the latest
  // value/serializer without re-arming effects. Updated in an effect
  // below (never during render).
  const valueRef = useRef(value);

  const syncUrl = useCallback(
    (v: T) => {
      // Read live location (not the searchParams render snapshot) so
      // multiple useUrlState hooks updating in the same tick don't
      // clobber each other's params.
      const params = new URLSearchParams(window.location.search);
      const serialized = useJson ? JSON.stringify(v) : String(v);
      if (v == null || v === "" || serialized === String(initialValue)) {
        params.delete(key);
      } else {
        params.set(key, serialized);
      }
      const next = params.toString();
      const target = next ? `${window.location.pathname}?${next}` : window.location.pathname;
      if (replace) {
        // Shallow — updates the address bar + Next's useSearchParams
        // without a router navigation, so force-dynamic pages don't
        // re-run their RSC payload per keystroke. These keys are
        // table-view state (search/sort/page), never server inputs.
        window.history.replaceState(window.history.state, "", target);
      } else {
        router.push(target, { scroll: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, replace, useJson, router],
  );
  const syncUrlRef = useRef(syncUrl);

  // Keep refs current — runs before the sync effect below (declaration
  // order), so the debounced write always serializes the latest value.
  useEffect(() => {
    valueRef.current = value;
    syncUrlRef.current = syncUrl;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncAtRef = useRef(0);
  // Remember the pathname this hook mounted on so the unmount flush
  // never writes stale params onto a *different* page mid-navigation.
  const mountPathRef = useRef<string | null>(null);

  // Keep URL in sync when value changes. Leading edge is immediate
  // (single discrete updates like a sort toggle feel instant); rapid
  // successive updates within the window coalesce into one trailing write.
  useEffect(() => {
    if (mountPathRef.current == null && typeof window !== "undefined") {
      mountPathRef.current = window.location.pathname;
    }
    const now = Date.now();
    if (timerRef.current == null && now - lastSyncAtRef.current >= URL_SYNC_DEBOUNCE_MS) {
      lastSyncAtRef.current = now;
      syncUrlRef.current(valueRef.current);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lastSyncAtRef.current = Date.now();
      syncUrlRef.current(valueRef.current);
    }, URL_SYNC_DEBOUNCE_MS);
  }, [value]);

  // Flush any pending write on unmount — but only if we're still on the
  // same page (unmount-by-navigation must not rewrite the new URL).
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (typeof window !== "undefined" && window.location.pathname === mountPathRef.current) {
          syncUrlRef.current(valueRef.current);
        }
      }
    };
  }, []);

  const setValue = useCallback((v: T | ((prev: T) => T)) => {
    setLocal((prev) => (typeof v === "function" ? (v as (p: T) => T)(prev) : v));
  }, []);

  return [value, setValue];
}
