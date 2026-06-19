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
      className={`data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/40 backdrop-blur-sm ${className}`}
      {...props}
    />
  );
});

type Side = "top" | "right" | "bottom" | "left";

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
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: Side }
>(function SheetContent({ className = "", side = "right", children, ...props }, ref) {
  const t = useT();
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={`fixed z-50 overflow-y-auto border-[var(--p-border)] bg-[var(--p-surface)] p-6 outline-none ${sideClasses[side]} ${className}`}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={t("common.close", undefined, "Close")}
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
