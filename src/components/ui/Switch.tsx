"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className = "", ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={`inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] data-[state=checked]:border-[var(--org-primary)] data-[state=checked]:bg-[var(--org-primary)] disabled:opacity-50 ${className}`}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-[var(--background)] shadow transition-transform data-[state=checked]:translate-x-[1.125rem]" />
    </SwitchPrimitive.Root>
  );
});

export function LabeledSwitch({
  label,
  description,
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof Switch> & { label: string; description?: string; id?: string }) {
  const uid = React.useId();
  const inputId = id ?? uid;
  const descId = description ? `${inputId}-desc` : undefined;
  return (
    <div className="flex items-start justify-between gap-4">
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
      <Switch id={inputId} aria-describedby={descId} {...props} />
    </div>
  );
}
