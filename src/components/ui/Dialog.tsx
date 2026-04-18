"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * Accessible dialog primitive.
 * - Focus trap, ESC to close, scroll lock, ARIA labels — all from Radix.
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
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out ${className}`}
      {...props}
    />
  );
});

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full";
    hideCloseButton?: boolean;
  }
>(function DialogContent({ children, className = "", size = "md", hideCloseButton, ...props }, ref) {
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
        className={`fixed left-1/2 top-1/2 z-50 w-full ${sizes[size]} -translate-x-1/2 -translate-y-1/2 surface-raised p-6 shadow-2xl outline-none data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out ${className}`}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)]"
            aria-label="Close dialog"
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
    <DialogPrimitive.Description className={`mt-1 text-sm text-[var(--text-secondary)] ${className}`}>
      {children}
    </DialogPrimitive.Description>
  );
}

export function DialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-6 flex items-center justify-end gap-2 ${className}`}>{children}</div>;
}
