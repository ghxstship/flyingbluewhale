"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

/**
 * `<RowActions>` — Attio / Airtable-style kebab menu for list rows.
 *
 * The anti-pattern we're killing is "table rows that only respond to
 * left-click → detail page". Bulk-action workflows and destructive
 * actions need a surface that doesn't fight the row navigation.
 *
 * Usage:
 *   <RowActions
 *     label="Actions for project {name}"
 *     items={[
 *       { label: "Rename", onSelect: () => … },
 *       { label: "Duplicate", onSelect: () => … },
 *       { separator: true },
 *       { label: "Delete", onSelect: () => …, destructive: true },
 *     ]}
 *   />
 *
 * Keyboard: arrow keys navigate; enter activates; esc closes. Click
 * outside also closes (Radix default).
 */

export type RowActionItem =
  | {
      label: string;
      onSelect: () => void;
      shortcut?: string;
      destructive?: boolean;
      disabled?: boolean;
      separator?: false;
    }
  | { separator: true };

export function RowActions({
  label,
  items,
  align = "end",
  onOpenChange,
}: {
  /** aria-label on the trigger button. Required for a11y. */
  label: string;
  items: RowActionItem[];
  align?: "start" | "center" | "end";
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DropdownMenu.Root onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-1"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={14} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className="surface-raised elevation-2 z-50 min-w-[10rem] rounded-lg border border-[var(--border-color)] p-1 text-sm"
        >
          {items.map((it, i) => {
            if ("separator" in it && it.separator) {
              return <DropdownMenu.Separator key={`sep-${i}`} className="my-1 h-px bg-[var(--border-color)]" />;
            }
            return (
              <DropdownMenu.Item
                key={`${it.label}-${i}`}
                disabled={it.disabled}
                onSelect={() => {
                  // Defer so the menu closes before the handler fires — keeps
                  // any spawned dialog from fighting the menu's focus trap.
                  queueMicrotask(it.onSelect);
                }}
                className={[
                  "flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-1.5 outline-none",
                  "hover:bg-[var(--bg-secondary)] focus-visible:bg-[var(--bg-secondary)]",
                  it.destructive ? "text-[color:var(--color-error)]" : "",
                  it.disabled ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <span>{it.label}</span>
                {it.shortcut ? (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{it.shortcut}</span>
                ) : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
