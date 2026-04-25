"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FieldState<T> = {
  value: T;
  error: string | undefined;
  isPending: boolean;
  isValid: boolean;
  isTouched: boolean;
};

/**
 * useFieldState — single-field form state with async-validation support.
 *
 * Pairs with FormField for the canonical "this field is being checked,
 * succeeded, failed" trio. Each `validate` call is debounced; only the
 * latest result is committed (out-of-order responses are dropped).
 *
 *   const f = useFieldState({
 *     value: "",
 *     validate: async (v) => v.length >= 3 ? null : "Min 3 chars",
 *   });
 *   <Input value={f.value} onChange={(e) => f.set(e.target.value)}
 *          error={f.error} asyncValidating={f.isPending} />
 */
export function useFieldState<T>(opts: {
  value: T;
  validate?: (value: T) => Promise<string | null> | string | null;
  debounceMs?: number;
}): FieldState<T> & {
  set: (next: T) => void;
  reset: (next?: T) => void;
} {
  const [value, setValue] = useState<T>(opts.value);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, setPending] = useState(false);
  const [isTouched, setTouched] = useState(false);
  const runIdRef = useRef(0);

  const debounce = opts.debounceMs ?? 300;

  useEffect(() => {
    if (!opts.validate || !isTouched) return;
    const runId = ++runIdRef.current;
    setPending(true);
    const handle = setTimeout(async () => {
      try {
        const out = await opts.validate!(value);
        if (runIdRef.current !== runId) return;
        setError(out ?? undefined);
      } finally {
        if (runIdRef.current === runId) setPending(false);
      }
    }, debounce);
    return () => clearTimeout(handle);
    // intentional: validate function identity is unstable in callers; deps drive on value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isTouched, debounce]);

  const set = useCallback((next: T) => {
    setValue(next);
    setTouched(true);
  }, []);

  const reset = useCallback((next?: T) => {
    setValue(next ?? opts.value);
    setError(undefined);
    setPending(false);
    setTouched(false);
    runIdRef.current++;
  }, [opts.value]);

  return {
    value,
    error,
    isPending,
    isValid: !error && !isPending,
    isTouched,
    set,
    reset,
  };
}
