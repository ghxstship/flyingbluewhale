"use client";

import * as React from "react";

/**
 * FormField — wraps any form control with consistent label + hint + error
 * + count layout. Use over hand-rolling each `<div className="flex flex-col
 * gap-1.5">` block.
 *
 * When `children` is a single clonable element (the common case — a raw
 * `<input>` / `<select>` / `<textarea>`), the control is cloned with:
 *   - `id` (generated via `useId`, or the child's own `id` if it has one)
 *     so the label's `htmlFor` actually associates,
 *   - `aria-describedby` pointing at the rendered error/hint text,
 *   - `aria-invalid` when `error` is set.
 *
 * When `children` is anything else (fragments, multiple nodes, plain
 * strings), the children render untouched and the label renders without
 * `htmlFor` — same as the pre-wiring behavior.
 *
 *   <FormField label="Domain" hint="example.com" required>
 *     <input name="domain" className="ps-input" />
 *   </FormField>
 */
export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reactId = React.useId();
  const errorId = `${reactId}-error`;
  const hintId = `${reactId}-hint`;

  // Only clone when there's exactly one valid element child; everything
  // else (fragments, arrays, strings) renders as-is without wiring.
  const child =
    React.Children.count(children) === 1 && React.isValidElement(children)
      ? (children as React.ReactElement<{ id?: string; "aria-describedby"?: string }>)
      : null;
  const fieldId = child ? (child.props.id ?? `${reactId}-field`) : undefined;
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null, child?.props["aria-describedby"]]
      .filter(Boolean)
      .join(" ") || undefined;
  const control = child
    ? React.cloneElement(child, {
        id: fieldId,
        "aria-describedby": describedBy,
        ...(error ? { "aria-invalid": true } : null),
      })
    : children;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-[var(--p-text-2)]">
          {label}
          {required && (
            <span aria-hidden className="ms-0.5 text-[var(--p-danger)]">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-[var(--p-danger)]">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className="text-xs text-[var(--p-text-2)]">
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
