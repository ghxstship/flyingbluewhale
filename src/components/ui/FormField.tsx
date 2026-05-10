"use client";

import * as React from "react";

/**
 * FormField — wraps any form control with consistent label + hint + error
 * + count layout. Use over hand-rolling each `<div className="flex flex-col
 * gap-1.5">` block.
 *
 * Pass `inputId` to wire `htmlFor` on the label and to derive an
 * `errorId` (`{inputId}-error`) that callers can reference via
 * `aria-describedby` on their control.
 *
 *   <FormField label="Domain" hint="example.com" required inputId="domain-field">
 *     <input id="domain-field" aria-describedby="domain-field-error" ... />
 *   </FormField>
 */
export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className = "",
  inputId,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** ID of the associated form control — wires `htmlFor` on the label and
   *  derives `{inputId}-error` / `{inputId}-hint` IDs for `aria-describedby`. */
  inputId?: string;
}) {
  const errorId = inputId ? `${inputId}-error` : undefined;
  const hintId = inputId ? `${inputId}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
          {required && (
            <span aria-hidden className="ms-0.5 text-[var(--color-error)]">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className="text-xs text-[var(--text-muted)]">
          {hint}
        </span>
      )}
    </div>
  );
}

/**
 * FormGrid — auto-collapses to one column on narrow viewports, two on
 * `md+`. Operators with a wider screen get the dense layout Linear/Vercel
 * use; mobile users still get a stack.
 */
export function FormGrid({
  cols = 2,
  className = "",
  children,
}: {
  cols?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  const colClass = cols === 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  return <div className={`grid grid-cols-1 gap-4 ${colClass} ${className}`}>{children}</div>;
}
