"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { registerShortcut } from "@/lib/hooks/useHotkeys";

// Static toolbar descriptors — kept at module scope so the render-time
// `tools.map` doesn't close over the editor ref (React-compiler safe; the ref
// is read only inside the `exec` event handler).
const TOOLS: { label: string; title: string; command: string; value?: string; style?: CSSProperties }[] = [
  { label: "B", title: "Bold", command: "bold", style: { fontWeight: 800 } },
  { label: "I", title: "Italic", command: "italic", style: { fontStyle: "italic" } },
  { label: "U", title: "Underline", command: "underline", style: { textDecoration: "underline" } },
  { label: "H2", title: "Heading", command: "formatBlock", value: "<h2>" },
  { label: "• List", title: "Bulleted list", command: "insertUnorderedList" },
  { label: "1. List", title: "Numbered list", command: "insertOrderedList" },
];

/** Commands whose on/off state `document.queryCommandState` reports. */
const STATEFUL_COMMANDS = new Set(["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"]);

/**
 * RichTextEditor — a dependency-free contentEditable surface with a small
 * formatting toolbar (Bold / Italic / Underline / H2 / UL / OL via the legacy
 * document.execCommand API). Fires onChange with the editor's innerHTML on
 * every input. Ported from the ATLVS kit (kits/core/components/input/RichTextEditor.d.ts).
 *
 * A11y (F-09): the editable surface carries `role="textbox"` +
 * `aria-multiline` + an accessible name; toolbar buttons reflect the current
 * selection's format via `aria-pressed` (recomputed on selectionchange
 * through `document.queryCommandState`). Note the SEEDING CONTRACT: the
 * `defaultValue` HTML is injected verbatim — callers must only pass
 * trusted/own-authored HTML (form drafts round-tripped from this editor),
 * never third-party input.
 */
export function RichTextEditor({
  defaultValue = "",
  placeholder = "Write…",
  onChange,
  minHeight = 180,
  className = "",
  style,
  label = "Rich text editor",
}: {
  defaultValue?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  /** Minimum editor body height, px. */
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name for the editable region. */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  // Cheatsheet entries — the browser natively handles these inside
  // contentEditable; register while an editor is on screen so `?` lists them.
  useEffect(() => {
    const unregister = [
      registerShortcut("mod+b", "Bold (in editor)", "Editor"),
      registerShortcut("mod+i", "Italic (in editor)", "Editor"),
      registerShortcut("mod+u", "Underline (in editor)", "Editor"),
    ];
    return () => unregister.forEach((fn) => fn());
  }, []);

  // Recompute aria-pressed state whenever the selection moves inside the editor.
  useEffect(() => {
    const sync = () => {
      const el = ref.current;
      if (!el) return;
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
      const next: Record<string, boolean> = {};
      for (const cmd of STATEFUL_COMMANDS) {
        try {
          next[cmd] = document.queryCommandState(cmd);
        } catch {
          next[cmd] = false;
        }
      }
      try {
        const block = document.queryCommandValue("formatBlock");
        next.formatBlock = typeof block === "string" && block.toLowerCase() === "h2";
      } catch {
        next.formatBlock = false;
      }
      setActive((prev) => {
        for (const k of Object.keys(next)) if (prev[k] !== next[k]) return next;
        return prev;
      });
    };
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, []);

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current && onChange) onChange(ref.current.innerHTML);
    // Reflect the new state immediately (selectionchange may not fire).
    if (STATEFUL_COMMANDS.has(command) || command === "formatBlock") {
      try {
        setActive((prev) => ({
          ...prev,
          [command]:
            command === "formatBlock"
              ? String(document.queryCommandValue("formatBlock")).toLowerCase() === "h2"
              : document.queryCommandState(command),
        }));
      } catch {
        // queryCommandState unsupported — leave state as-is.
      }
    }
  };

  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--p-border)",
        borderRadius: "var(--p-r, 8px)",
        overflow: "hidden",
        background: "var(--p-surface)",
        ...style,
      }}
    >
      <div
        role="toolbar"
        aria-label="Formatting"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          padding: 6,
          borderBottom: "1px solid var(--p-border)",
          background: "var(--p-surface-2)",
        }}
      >
        {TOOLS.map((t) => {
          const pressed = Boolean(active[t.command]);
          return (
            <button
              key={t.title}
              type="button"
              title={t.title}
              aria-label={t.title}
              aria-pressed={pressed}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(t.command, t.value)}
              style={{
                minWidth: 30,
                height: 28,
                paddingInline: 8,
                border: "1px solid var(--p-border)",
                borderRadius: "var(--p-r-sm, 6px)",
                background: pressed ? "var(--p-surface-3, var(--p-surface-2))" : "var(--p-surface)",
                color: pressed ? "var(--p-text-1)" : "var(--p-text-2)",
                cursor: "pointer",
                font: "inherit",
                fontSize: 13,
                lineHeight: 1,
                ...t.style,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder={placeholder}
        onInput={() => onChange?.(ref.current?.innerHTML ?? "")}
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        style={{
          minHeight,
          padding: "12px 14px",
          outline: "none",
          color: "var(--p-text-1)",
          lineHeight: 1.55,
          fontSize: 14,
        }}
      />
    </div>
  );
}
