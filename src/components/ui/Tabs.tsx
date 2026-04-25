"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    /** Allow the list to scroll horizontally on overflow instead of wrapping.
     *  Common in product detail pages with many tabs (Linear / Notion). */
    scrollable?: boolean;
  }
>(function TabsList({ className = "", scrollable, ...props }, ref) {
  const scroll = scrollable
    ? "overflow-x-auto whitespace-nowrap scrollbar-thin"
    : "";
  return (
    <TabsPrimitive.List
      ref={ref}
      className={`flex items-center gap-1 border-b border-[var(--border-color)] ${scroll} ${className}`}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className = "", ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={`relative -mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-[var(--text-muted)] outline-none transition-colors hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] data-[state=active]:border-[var(--org-primary)] data-[state=active]:text-[var(--text-primary)] ${className}`}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className = "", ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={`outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] ${className}`}
      {...props}
    />
  );
});

/**
 * Segmented control variant — visual alternative to tabs for 2–4 options.
 * Similar to iOS UISegmentedControl. Use via `variant="segmented"`.
 */
export const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function SegmentedControl({ className = "", ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={`inline-flex items-center gap-0.5 rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] p-0.5 ${className}`}
      {...props}
    />
  );
});

export const SegmentedControlItem = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function SegmentedControlItem({ className = "", ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={`rounded px-3 py-1 text-xs font-medium text-[var(--text-muted)] outline-none transition-colors hover:text-[var(--text-primary)] data-[state=active]:bg-[var(--surface-raised)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-sm ${className}`}
      {...props}
    />
  );
});
