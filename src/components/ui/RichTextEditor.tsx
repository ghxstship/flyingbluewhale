"use client";

import { useRef, type CSSProperties } from "react";

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

/**
 * RichTextEditor — a dependency-free contentEditable surface with a small
 * formatting toolbar (Bold / Italic / Underline / H2 / UL / OL via the legacy
 * document.execCommand API). Fires onChange with the editor's innerHTML on
 * every input. Ported from the ATLVS kit (kits/core/components/input/RichTextEditor.d.ts).
 */
export function RichTextEditor({
  defaultValue = "",
  placeholder = "Write…",
  onChange,
  minHeight = 180,
  className = "",
  style,
}: {
  defaultValue?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  /** Minimum editor body height, px. */
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, value);
    if (ref.current && onChange) onChange(ref.current.innerHTML);
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
        {TOOLS.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(t.command, t.value)}
            style={{
              minWidth: 30,
              height: 28,
              paddingInline: 8,
              border: "1px solid var(--p-border)",
              borderRadius: "var(--p-r-sm, 6px)",
              background: "var(--p-surface)",
              color: "var(--p-text-2)",
              cursor: "pointer",
              font: "inherit",
              fontSize: 13,
              lineHeight: 1,
              ...t.style,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
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
