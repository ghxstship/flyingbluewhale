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
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border-color)] bg-[var(--surface)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] data-[state=checked]:border-[var(--org-primary)] data-[state=checked]:bg-[var(--org-primary)] data-[state=checked]:text-[var(--org-on-primary,white)] data-[state=indeterminate]:border-[var(--org-primary)] data-[state=indeterminate]:bg-[var(--org-primary)] data-[state=indeterminate]:text-[var(--org-on-primary,white)] disabled:opacity-50 ${className}`}
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
