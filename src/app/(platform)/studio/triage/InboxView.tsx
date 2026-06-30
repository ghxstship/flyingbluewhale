"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InboxItem } from "@/lib/db/inbox";
import { markNotificationReadAction } from "./actions";

type Labels = {
  open: string;
  dismiss: string;
  overdue: string;
  hint: string;
  empty: string;
};

/**
 * InboxView — keyboard-driven triage queue (v7.7). j/↓ and k/↑ move the
 * selection; Enter/o opens the selected item; x dismisses it (marks a
 * notification read; tasks just leave the queue locally). Token-only; the list
 * is a focusable listbox with aria-activedescendant for screen-reader tracking.
 */
export function InboxView({ items: initial, labels }: { items: InboxItem[]; labels: Labels }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState(0);
  const [, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setSel((s) => Math.min(s, Math.max(0, items.length - 1)));
  }, [items.length]);

  const open = (item: InboxItem | undefined) => {
    if (item?.href) router.push(item.href);
  };

  const dismiss = (item: InboxItem | undefined) => {
    if (!item) return;
    setItems((prev) => prev.filter((i) => i.itemId !== item.itemId));
    if (item.source === "notification") {
      startTransition(() => {
        void markNotificationReadAction(item.itemId);
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, items.length - 1));
    } else if (k === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" || k === "o") {
      e.preventDefault();
      open(items[sel]);
    } else if (k === "x") {
      e.preventDefault();
      dismiss(items[sel]);
    }
  };

  if (items.length === 0) {
    return <p style={{ color: "var(--p-text-2)", fontSize: 14 }}>{labels.empty}</p>;
  }

  return (
    <div>
      <p style={{ color: "var(--p-text-3)", fontSize: 12, marginBottom: "var(--p-2)" }}>{labels.hint}</p>
      <ul
        ref={listRef}
        role="listbox"
        aria-label="Inbox"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-activedescendant={items[sel] ? `inbox-${items[sel].itemId}` : undefined}
        style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--p-2)", outline: "none" }}
      >
        {items.map((item, i) => (
          <li
            key={item.itemId}
            id={`inbox-${item.itemId}`}
            role="option"
            aria-selected={i === sel}
            onMouseEnter={() => setSel(i)}
            onClick={() => open(item)}
            className="surface"
            style={{
              padding: "var(--p-3)",
              borderRadius: "var(--p-r-md, 10px)",
              border: `1px solid ${i === sel ? "var(--p-accent)" : "var(--p-border)"}`,
              cursor: item.href ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: "var(--p-3)",
            }}
          >
            <span className="ps-badge" style={{ flex: "0 0 auto", textTransform: "capitalize" }}>
              {item.kind.replace(/_/g, " ")}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </div>
              {item.subtitle && (
                <div style={{ fontSize: 12, color: "var(--p-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.subtitle}
                </div>
              )}
            </div>
            {item.slaOverdue && (
              <span className="ps-badge" style={{ flex: "0 0 auto", color: "var(--p-danger-text)", fontWeight: 600 }}>
                {labels.overdue}
              </span>
            )}
            <time
              suppressHydrationWarning
              dateTime={item.at}
              style={{ flex: "0 0 auto", fontSize: 12, color: "var(--p-text-3)", fontVariantNumeric: "tabular-nums" }}
            >
              {new Date(item.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </time>
            <button
              type="button"
              className="ps-btn ps-btn--tertiary ps-btn--sm"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(item);
              }}
              aria-label={`${labels.dismiss}: ${item.title}`}
            >
              {labels.dismiss}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
