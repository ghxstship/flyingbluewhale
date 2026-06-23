"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor, type TLEditorSnapshot } from "tldraw";
import "tldraw/tldraw.css";

import { Button } from "@/components/ui/Button";
import { saveWhiteboardSnapshotAction, type State } from "../actions";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * tldraw canvas island (F5). Loaded via next/dynamic ssr:false from
 * whiteboard-loader so the browser-only tldraw bundle never reaches SSR or
 * other console bundles.
 *
 * Persistence is single-user: we capture the whole store snapshot on a
 * debounced cadence (and on explicit Save) and POST it through the
 * `saveWhiteboardSnapshotAction` server action. No realtime multiplayer
 * presence — that is out of scope.
 */
export function WhiteboardCanvas({
  id,
  initialSnapshot,
  canEdit,
}: {
  id: string;
  initialSnapshot: TLEditorSnapshot | null;
  canEdit: boolean;
}) {
  const editorRef = useRef<Editor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const persist = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setStatus("saving");
    const snapshot = getSnapshot(editor.store);
    const fd = new FormData();
    fd.set("snapshot", JSON.stringify(snapshot));
    const result: State = await saveWhiteboardSnapshotAction(id, null, fd);
    setStatus(result?.ok ? "saved" : "error");
  }, [id]);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      if (initialSnapshot) {
        loadSnapshot(editor.store, initialSnapshot);
      }
      if (!canEdit) {
        editor.updateInstanceState({ isReadonly: true });
        return;
      }
      // Debounced autosave: any document-scope store change schedules a save.
      const unlisten = editor.store.listen(
        () => {
          setStatus("dirty");
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            void persist();
          }, 1500);
        },
        { source: "user", scope: "document" },
      );
      return unlisten;
    },
    [initialSnapshot, canEdit, persist],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const statusLabel =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "All changes saved"
        : status === "dirty"
          ? "Unsaved changes"
          : status === "error"
            ? "Save failed"
            : "";

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--p-text-2)]" aria-live="polite">
            {statusLabel}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={status === "saving"}
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              void persist();
            }}
          >
            Save now
          </Button>
        </div>
      )}
      <div className="surface relative h-[70vh] w-full overflow-hidden">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}
