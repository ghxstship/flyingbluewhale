"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { useFieldError } from "@/components/FormShell";

type CommonProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  hideLabel?: boolean;
  description?: ReactNode;
};

/**
 * <FormField> auto-wires:
 *   - Label association via htmlFor + useId()
 *   - aria-invalid + aria-describedby on the input
 *   - Per-field error from useFieldError()
 *   - Required asterisk visual indicator
 */
export function FormField({
  name,
  label,
  hint,
  required,
  hideLabel,
  description,
  children,
}: CommonProps & { children?: ReactNode }) {
  const id = useId();
  const error = useFieldError(name);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-xs font-medium text-[var(--p-text-2)] ${hideLabel ? "sr-only" : ""}`}>
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-[var(--p-danger)]">
            *
          </span>
        )}
      </label>
      {description && <div className="text-xs text-[var(--p-text-2)]">{description}</div>}
      <FormFieldContext.Provider value={{ id, errorId, hintId, describedBy, hasError: !!error, required }}>
        {children}
      </FormFieldContext.Provider>
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

import { createContext, useContext } from "react";

type FieldCtx = {
  id: string;
  errorId: string;
  hintId: string;
  describedBy?: string;
  hasError: boolean;
  required?: boolean;
};
const FormFieldContext = createContext<FieldCtx | null>(null);

function useFieldCtx(): FieldCtx {
  const ctx = useContext(FormFieldContext);
  if (!ctx) {
    throw new Error("FormField subcomponents must be wrapped in <FormField>.");
  }
  return ctx;
}

export function TextInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "aria-invalid" | "aria-describedby">,
) {
  const ctx = useFieldCtx();
  return (
    <input
      id={ctx.id}
      aria-invalid={ctx.hasError || undefined}
      aria-describedby={ctx.describedBy}
      aria-required={ctx.required || undefined}
      required={ctx.required}
      className={`ps-input focus-ring ${ctx.hasError ? "border-[var(--p-danger)]" : ""}`}
      {...props}
    />
  );
}

export function TextArea(
  props: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "aria-invalid" | "aria-describedby">,
) {
  const ctx = useFieldCtx();
  return (
    <textarea
      id={ctx.id}
      aria-invalid={ctx.hasError || undefined}
      aria-describedby={ctx.describedBy}
      aria-required={ctx.required || undefined}
      required={ctx.required}
      className={`ps-input focus-ring ${ctx.hasError ? "border-[var(--p-danger)]" : ""}`}
      {...props}
    />
  );
}

export function NativeSelect(
  props: Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "aria-invalid" | "aria-describedby">,
) {
  const ctx = useFieldCtx();
  return (
    <select
      id={ctx.id}
      aria-invalid={ctx.hasError || undefined}
      aria-describedby={ctx.describedBy}
      aria-required={ctx.required || undefined}
      required={ctx.required}
      className={`ps-input focus-ring ${ctx.hasError ? "border-[var(--p-danger)]" : ""}`}
      {...props}
    />
  );
}

// ── Standalone mode (absorbed from ui/FormField, W5 F-03 2026-07-22) ─────────
//
// forms/FormField is the canon (it closes the FormShell error loop via
// useFieldError). UnboundFormField is the standalone variant for controls that
// live OUTSIDE a FormShell: it takes `error` as an explicit prop and wires the
// a11y contract by cloning its single child. `@/components/ui/FormField`
// re-exports it under the old name so the historical importers keep compiling.

import * as React from "react";

/**
 * UnboundFormField — wraps any form control with consistent label + hint +
 * error layout, without requiring a FormShell.
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
 *   <UnboundFormField label="Domain" hint="example.com" required>
 *     <input name="domain" className="ps-input" />
 *   </UnboundFormField>
 */
export function UnboundFormField({
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
  children: ReactNode;
  className?: string;
}) {
  const reactId = useId();
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
 * `md+`. Operators with a wider screen get the dense layout; mobile users
 * still get a stack.
 */
export function FormGrid({
  cols = 2,
  className = "",
  children,
}: {
  cols?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  const colClass = cols === 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  return <div className={`grid grid-cols-1 gap-4 ${colClass} ${className}`}>{children}</div>;
}
