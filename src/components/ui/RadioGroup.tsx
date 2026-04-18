"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className = "", ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={`grid gap-2 ${className}`} {...props} />;
});

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className = "", ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] data-[state=checked]:border-[var(--org-primary)] data-[state=checked]:text-[var(--org-primary)] disabled:opacity-50 ${className}`}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle size={8} className="fill-current" aria-hidden="true" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

export function LabeledRadioItem({
  value,
  label,
  description,
  id,
}: {
  value: string;
  label: string;
  description?: string;
  id?: string;
}) {
  const uid = React.useId();
  const inputId = id ?? uid;
  const descId = description ? `${inputId}-desc` : undefined;
  return (
    <div className="flex items-start gap-2">
      <RadioGroupItem value={value} id={inputId} aria-describedby={descId} />
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {description && (
          <div id={descId} className="text-xs text-[var(--text-muted)]">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
