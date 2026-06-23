"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

/**
 * Accordion — disclosure list for FAQ / nested reference content. Ported from
 * the ATLVS kit (kits/core/components/overlay/Accordion.d.ts). Dependency-free,
 * keyboard-accessible (each header is a real <button>, aria-expanded wired).
 */
export type AccordionItemData = { title: ReactNode; content: ReactNode };

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = "",
  style,
}: {
  items: AccordionItemData[];
  /** Allow more than one panel open at once. */
  allowMultiple?: boolean;
  /** Indices open on mount. */
  defaultOpen?: number[];
  className?: string;
  style?: CSSProperties;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpen));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div
      className={className}
      style={{ border: "1px solid var(--p-border)", borderRadius: "var(--p-r, 8px)", overflow: "hidden", ...style }}
    >
      {items.map((item, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid var(--p-border)" }}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "start",
                font: "inherit",
                fontWeight: 600,
                color: "var(--p-text-1)",
              }}
            >
              <span>{item.title}</span>
              <span
                aria-hidden
                data-rtl-flip
                style={{
                  transition: "transform var(--motion-fast) var(--ease-standard)",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  color: "var(--p-text-3)",
                  flexShrink: 0,
                }}
              >
                ›
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 16px 16px", color: "var(--p-text-2)", lineHeight: 1.55 }}>{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
