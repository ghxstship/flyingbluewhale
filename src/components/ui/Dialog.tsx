"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Accessible dialog primitive.
 * - Focus trap, ESC to close, scroll lock, ARIA labels — all from Radix.
 * - Radix's dismissable-layer stack peels the topmost layer per Esc press and
 *   ref-counts body scroll lock — the kit W0 overlay-manager contract.
 * - Stacking + scrim come from the --p-z-* ladder and --overlay-backdrop
 *   (src/app/theme/kit-layers.css) — never literal z values or rgba scrims.
 * - `onBeforeClose` (kit W0): return false to veto scrim-click / Esc / ✕
 *   dismissal — the dirty-form guard hook.
 * - Content caps at 88vh; wrap long content in <DialogBody> to get an inner
 *   scroll region with DialogFooter pinned below it.
 * - Custom transitions via data-state attributes.
 * - Honors prefers-reduced-motion.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className = "", ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={`data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-[var(--p-z-overlay)] bg-[var(--overlay-backdrop)] backdrop-blur-sm ${className}`}
      {...props}
    />
  );
});

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full";
    hideCloseButton?: boolean;
    /** Kit W0 dirty-state guard — runs before any dismissal (scrim click,
     *  Esc, ✕). Return false to veto the close and keep the dialog open. */
    onBeforeClose?: () => boolean | void;
  }
>(function DialogContent(
  { children, className = "", size = "md", hideCloseButton, onBeforeClose, ...props },
  ref,
) {
  const t = useT();
  const guard = (e: { preventDefault: () => void }) => {
    if (onBeforeClose && onBeforeClose() === false) e.preventDefault();
  };
  const sizes: Record<NonNullable<typeof size>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw]",
  };
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`surface-raised fixed top-1/2 left-1/2 z-[var(--p-z-modal)] flex max-h-[88vh] w-full flex-col ${sizes[size]} rounded-[var(--p-r-xl)] data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 outline-none ${className}`}
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
        {!hideCloseButton && (
          <DialogPrimitive.Close
            onClick={guard}
            className="focus-ring absolute end-4 top-4 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100"
            aria-label={t("ui.dialog.close", undefined, "Close dialog")}
          >
            <X size={16} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Title className={`text-lg font-semibold tracking-tight ${className}`}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Description className={`mt-1 text-sm text-[var(--p-text-2)] ${className}`}>
      {children}
    </DialogPrimitive.Description>
  );
}

/** Kit W0 footer slot — inner scroll region so DialogFooter stays pinned while
 *  long content scrolls (content itself caps at 88vh). Opt-in: dialogs without
 *  a DialogBody scroll as a whole, as before. */
export function DialogBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-0 flex-1 overflow-y-auto ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 flex flex-none items-center justify-end gap-2 ${className}`}>{children}</div>;
}
