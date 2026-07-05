"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Sheet — side-mounted dialog (a.k.a. drawer).
 * Built on Radix Dialog for consistent focus trap + scroll lock. Use for:
 * - Mobile modal variants (side="bottom")
 * - Desktop side panels for create/edit (side="right")
 * - Config panels (side="left")
 *
 * Kit W0 contract: stacking + scrim read the --p-z-* ladder and
 * --overlay-backdrop (kit-layers.css); left/right sheets automatically render
 * as bottom sheets below 720px (`responsive={false}` opts out); and
 * `onBeforeClose` vetoes scrim/Esc/✕ dismissal for dirty-form guards.
 */

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function SheetOverlay({ className = "", ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={`data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-[var(--p-z-overlay)] bg-[var(--overlay-backdrop)] backdrop-blur-sm ${className}`}
      {...props}
    />
  );
});

type Side = "top" | "right" | "bottom" | "left";

/** Reactive media query — SSR-safe (false on the server, resolves on mount). */
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return; // jsdom / non-browser
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// v7.0 — sheets round their inner edge at --p-r-xl (the edge facing the content).
const sideClasses: Record<Side, string> = {
  top: "inset-x-0 top-0 rounded-b-[var(--p-r-xl)] border-b data-[state=open]:animate-slide-down-from-top data-[state=closed]:animate-slide-up-to-top",
  right:
    "inset-y-0 end-0 h-full w-3/4 rounded-s-[var(--p-r-xl)] border-s sm:max-w-sm data-[state=open]:animate-slide-in-from-right data-[state=closed]:animate-slide-out-to-right",
  bottom:
    "inset-x-0 bottom-0 rounded-t-[var(--p-r-xl)] border-t data-[state=open]:animate-slide-up-from-bottom data-[state=closed]:animate-slide-down-to-bottom",
  left: "inset-y-0 start-0 h-full w-3/4 rounded-e-[var(--p-r-xl)] border-e sm:max-w-sm data-[state=open]:animate-slide-in-from-left data-[state=closed]:animate-slide-out-to-left",
};

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: Side;
    /** Below 720px, left/right sheets render as bottom sheets (kit W0 —
     *  what COMPVSS needs on real devices). Pass false to keep the side. */
    responsive?: boolean;
    /** Kit W0 dirty-state guard — runs before any dismissal (scrim click,
     *  Esc, ✕). Return false to veto the close and keep the sheet open. */
    onBeforeClose?: () => boolean | void;
  }
>(function SheetContent(
  { className = "", side = "right", responsive = true, onBeforeClose, children, ...props },
  ref,
) {
  const t = useT();
  const narrow = useMediaQuery("(max-width: 719px)");
  const effSide: Side = responsive && narrow && (side === "left" || side === "right") ? "bottom" : side;
  const guard = (e: { preventDefault: () => void }) => {
    if (onBeforeClose && onBeforeClose() === false) e.preventDefault();
  };
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`fixed z-[var(--p-z-modal)] overflow-y-auto border-[var(--p-border)] bg-[var(--p-surface)] p-6 outline-none ${sideClasses[effSide]} ${effSide === "bottom" ? "max-h-[90vh]" : ""} ${className}`}
        {...props}
        onEscapeKeyDown={(e) => {
          guard(e);
          props.onEscapeKeyDown?.(e);
        }}
        onPointerDownOutside={(e) => {
          guard(e);
          props.onPointerDownOutside?.(e);
        }}
        onInteractOutside={(e) => {
          guard(e);
          props.onInteractOutside?.(e);
        }}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={t("common.close", undefined, "Close")}
          onClick={guard}
          className="focus-ring absolute end-4 top-4 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

export function SheetHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function SheetTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Title className={`text-lg font-semibold tracking-tight ${className}`}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function SheetDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Description className={`mt-1 text-sm text-[var(--p-text-2)] ${className}`}>
      {children}
    </DialogPrimitive.Description>
  );
}

export function SheetFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mt-6 flex items-center justify-end gap-2 border-t border-[var(--p-border)] pt-4 ${className}`}>
      {children}
    </div>
  );
}
