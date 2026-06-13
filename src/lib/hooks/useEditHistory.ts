"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useEditHistory (P3.a) — a generic undo/redo stack for inline-edit surfaces.
 *
 * Each recorded edit carries its own `undo`/`redo` thunks (which typically
 * call a server action), so the hook is agnostic to what's being edited.
 * Recording a new edit clears the redo stack (standard linear-history model).
 *
 *   const history = useEditHistory();
 *   await commit(next);
 *   history.record({ undo: () => commit(prev), redo: () => commit(next), label: "rename" });
 *
 * `bindKeys` (default true) wires Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z globally
 * while mounted.
 */
export type EditEntry = {
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
  label?: string;
};

export function useEditHistory(opts: { bindKeys?: boolean } = {}) {
  const { bindKeys = true } = opts;
  const [past, setPast] = useState<EditEntry[]>([]);
  const [future, setFuture] = useState<EditEntry[]>([]);

  const record = useCallback((entry: EditEntry) => {
    setPast((p) => [...p, entry]);
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    let entry: EditEntry | undefined;
    setPast((p) => {
      entry = p[p.length - 1];
      return p.slice(0, -1);
    });
    if (entry) {
      await entry.undo();
      setFuture((f) => [entry as EditEntry, ...f]);
    }
  }, []);

  const redo = useCallback(async () => {
    let entry: EditEntry | undefined;
    setFuture((f) => {
      entry = f[0];
      return f.slice(1);
    });
    if (entry) {
      await entry.redo();
      setPast((p) => [...p, entry as EditEntry]);
    }
  }, []);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  useEffect(() => {
    if (!bindKeys) return;
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      // Don't hijack undo inside an active text field.
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      if (e.shiftKey) void redo();
      else void undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bindKeys, undo, redo]);

  return { record, undo, redo, clear, canUndo: past.length > 0, canRedo: future.length > 0 };
}
