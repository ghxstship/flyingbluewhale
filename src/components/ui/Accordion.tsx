"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className = "", ...props }, ref) {
  return <AccordionPrimitive.Item ref={ref} className={`border-b border-[var(--p-border)] ${className}`} {...props} />;
});

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className = "", children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={`group flex flex-1 items-center justify-between gap-2 py-3 text-sm font-medium text-[var(--p-text-1)] transition-colors outline-none hover:text-[var(--p-text-1)] focus-visible:ring-2 focus-visible:ring-[var(--p-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--p-bg)] [&[data-state=open]>svg]:rotate-180 ${className}`}
        {...props}
      >
        {children}
        <ChevronDown
          size={14}
          className="shrink-0 text-[var(--p-text-2)] transition-transform duration-[var(--motion-normal)] ease-[var(--ease-hover)]"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className = "", children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={`data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm text-[var(--p-text-2)] ${className}`}
      {...props}
    >
      <div className="pb-3">{children}</div>
    </AccordionPrimitive.Content>
  );
});
