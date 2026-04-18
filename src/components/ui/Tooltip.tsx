"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className = "", sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`z-50 max-w-xs rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-xs text-[var(--background)] shadow-lg data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out ${className}`}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

/** Convenience: wrap any element with a tooltip via a single component. */
export function Hint({
  label,
  children,
  side = "top",
  delayDuration = 350,
  kbd,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  /** Optional keyboard shortcut inline with the label. */
  kbd?: string;
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          {kbd && (
            <kbd className="rounded bg-[var(--background)]/20 px-1 py-0.5 font-mono text-[10px]">
              {kbd}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
