"use client";

import { useEffect, useRef } from "react";

/**
 * Accessibility plumbing for the COMPVSS kit's hand-rolled overlays
 * (bottom sheets + popover menus). The kit's visual design is bespoke
 * (`.sheet`/`.sheet-panel`/`.ps-menu pop` CSS), so we keep the markup and
 * layer the dialog/menu semantics on manually rather than wrapping Radix
 * (which would re-skin the surfaces). This gives WCAG 2.1 keyboard + AT
 * parity with the desktop Radix primitives:
 *
 *   - ESC closes
 *   - focus is moved into the panel on open (initial focus)
 *   - Tab / Shift+Tab are trapped inside the panel (modal variant)
 *   - focus is restored to the trigger on close
 *
 * Pass `modal: false` for lightweight popovers (menus) where we want ESC +
 * focus-restore + outside semantics but NOT a hard Tab trap.
 */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useDismissable<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
  opts: { modal?: boolean } = {},
) {
  const modal = opts.modal !== false;
  const ref = useRef<T | null>(null);
  // Latest onClose without re-binding the keydown listener every render
  // (callers commonly pass an inline arrow). Synced in an effect so we never
  // write the ref during render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the panel (first focusable, else the panel itself).
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (!modal || e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === firstEl || !node.contains(active)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Restore focus to the trigger if it's still in the document.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open, modal]);

  return ref;
}
