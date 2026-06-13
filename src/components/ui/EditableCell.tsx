"use client";

import { useState, useRef, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * EditableCell (P3.a) — click-to-edit inline text with optimistic commit and
 * a one-step undo toast (mirrors the delete-undo pattern in DeleteForm).
 *
 * This is the reusable, zero-blast-radius building block for inline editing:
 * it composes onto any detail surface or bespoke table without touching the
 * shared DataTableInteractive (whose opaque pre-rendered cell model makes a
 * safe in-place retrofit a separately-scoped change). Pair with
 * `useEditHistory` for multi-step Cmd+Z/Cmd+Shift+Z stacks on richer screens.
 *
 * Commit contract: `onCommit(next)` persists the value and returns
 * `{ error }` on failure (kept in edit mode) or void/null on success (shows
 * the Undo toast and refreshes the route).
 */
export function EditableCell({
  value,
  onCommit,
  placeholder = "—",
  ariaLabel,
  className = "",
  maxLength = 500,
}: {
  value: string;
  onCommit: (next: string) => Promise<{ error?: string } | void | null>;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  maxLength?: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function begin() {
    setDraft(value);
    setEditing(true);
  }

  function commit(next: string, opts?: { silent?: boolean }) {
    const trimmed = next.trim();
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await onCommit(trimmed);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return; // stay in edit mode so the user can retry
      }
      setEditing(false);
      if (!opts?.silent) {
        const prev = value;
        toast("Updated", {
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                const undoRes = await onCommit(prev);
                if (undoRes && "error" in undoRes && undoRes.error) toast.error(undoRes.error);
                else router.refresh();
              });
            },
          },
        });
      }
      router.refresh();
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
      setDraft(value);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        disabled={pending}
        maxLength={maxLength}
        aria-label={ariaLabel ?? "Edit value"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        className={`ps-input w-full ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={begin}
      aria-label={ariaLabel ? `${ariaLabel}: ${value || placeholder}. Click to edit.` : "Click to edit"}
      className={`-mx-1 cursor-text rounded px-1 text-left hover:bg-[var(--p-surface)] ${
        value ? "text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"
      } ${className}`}
    >
      {value || placeholder}
    </button>
  );
}
