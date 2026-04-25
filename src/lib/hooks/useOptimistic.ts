"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "./useToast";

export type UndoEntry = {
  id: string;
  label: string;
  undo: () => Promise<void> | void;
  expiresAt: number;
};

/**
 * useUndoStack — pushes destructive actions onto a transient stack and
 * surfaces an Undo affordance via toast. Stripe / Linear / Notion all
 * surface undo on every destructive bulk action; this is the primitive.
 *
 * Pair with `useOptimisticAction` to get the full pattern.
 */
export function useUndoStack(defaultDuration = 6000) {
  const toast = useToast();

  return useCallback(
    (entry: { label: string; undo: UndoEntry["undo"]; duration?: number }) => {
      toast.message(entry.label, {
        duration: entry.duration ?? defaultDuration,
        action: {
          label: "Undo",
          onClick: () => {
            void entry.undo();
          },
        },
      });
    },
    [toast, defaultDuration],
  );
}

/**
 * useOptimisticAction — runs `apply` locally first, then `commit` against
 * the server; rolls back via `rollback` on failure and surfaces an error
 * toast. Returns a `[state, mutate]` tuple.
 *
 *   const [items, archiveItem] = useOptimisticAction({
 *     state: rows,
 *     apply: (id) => rows.filter(r => r.id !== id),
 *     commit: (id) => fetch(`/api/v1/items/${id}/archive`, { method: "POST" }),
 *     rollback: (id, prev) => prev,
 *   });
 */
export function useOptimisticAction<S, A>(opts: {
  state: S;
  apply: (input: A, prev: S) => S;
  commit: (input: A) => Promise<unknown>;
  rollback?: (input: A, prev: S, e: Error) => S;
  errorMessage?: (input: A, e: Error) => string;
}): [S, (input: A) => Promise<void>] {
  const [local, setLocal] = useState(opts.state);
  const toast = useToast();

  // Stay in sync with parent re-renders. Effect-based sync runs after the
  // commit so we never read/write refs during render (React rules of refs).
  useEffect(() => {
    setLocal(opts.state);
  }, [opts.state]);

  const mutate = useCallback(
    async (input: A) => {
      const before = local;
      const next = opts.apply(input, before);
      setLocal(next);
      try {
        await opts.commit(input);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        const reverted = opts.rollback ? opts.rollback(input, before, err) : before;
        setLocal(reverted);
        toast.error(opts.errorMessage ? opts.errorMessage(input, err) : err.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [local, opts.apply, opts.commit, opts.rollback, opts.errorMessage, toast],
  );

  return [local, mutate];
}
