"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className = "", ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--p-border)] bg-[var(--p-surface)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--p-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--p-bg)] disabled:opacity-50 data-[state=checked]:border-[var(--p-accent)] data-[state=checked]:bg-[var(--p-accent)] data-[state=checked]:text-[var(--p-accent-contrast,white)] data-[state=indeterminate]:border-[var(--p-accent)] data-[state=indeterminate]:bg-[var(--p-accent)] data-[state=indeterminate]:text-[var(--p-accent-contrast,white)] ${className}`}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? (
          <Minus size={10} strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check size={10} strokeWidth={3} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

/**
 * <LabeledCheckbox> — pair a checkbox with a label for forms. Handles
 * the click-through label pattern and optional description.
 */
export function LabeledCheckbox({
  label,
  description,
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof Checkbox> & { label: string; description?: string; id?: string }) {
  const uid = React.useId();
  const inputId = id ?? uid;
  const descId = description ? `${inputId}-desc` : undefined;
  return (
    <div className="flex items-start gap-2">
      <Checkbox id={inputId} aria-describedby={descId} {...props} />
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--p-text-1)]">
          {label}
        </label>
        {description && (
          <div id={descId} className="text-xs text-[var(--p-text-2)]">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
