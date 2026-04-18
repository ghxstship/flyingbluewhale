"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className = "", align = "center", sideOffset = 4, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={`z-50 w-72 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-4 shadow-lg outline-none data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out ${className}`}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
