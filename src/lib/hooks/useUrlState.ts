"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Sync a piece of state to a URL search param.
 * - Reads initial value from the current URL
 * - `replace: true` (default) updates URL without pushing history
 * - `serializer` optional (JSON-encode arrays/objects)
 *
 * Usage:
 *   const [sort, setSort] = useUrlState("sort", "name");
 *   const [filters, setFilters] = useUrlState("f", [], { serializer: "json" });
 */
export function useUrlState<T extends string | number | boolean | string[] | Record<string, unknown>>(
  key: string,
  initialValue: T,
  opts: { replace?: boolean; serializer?: "json" } = {},
): [T, (v: T | ((prev: T) => T)) => void] {
  const router = useRouter();
  const pathname = usePathname();
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

  // Keep URL in sync when value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const serialized = useJson ? JSON.stringify(value) : String(value);
    if (value == null || value === "" || serialized === String(initialValue)) {
      params.delete(key);
    } else {
      params.set(key, serialized);
    }
    const next = params.toString();
    const target = next ? `${pathname}?${next}` : pathname;
    if (replace) router.replace(target, { scroll: false });
    else router.push(target, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setValue = useCallback((v: T | ((prev: T) => T)) => {
    setLocal((prev) => (typeof v === "function" ? (v as (p: T) => T)(prev) : v));
  }, []);

  return [value, setValue];
}
