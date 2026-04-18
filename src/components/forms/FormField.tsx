"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
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
  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={`text-xs font-medium text-[var(--text-secondary)] ${hideLabel ? "sr-only" : ""}`}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-[var(--color-error)]">*</span>
        )}
      </label>
      {description && (
        <div className="text-xs text-[var(--text-muted)]">{description}</div>
      )}
      <FormFieldContext.Provider value={{ id, errorId, hintId, describedBy, hasError: !!error, required }}>
        {children}
      </FormFieldContext.Provider>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className="text-xs text-[var(--text-muted)]">{hint}</span>
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

export function TextInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "aria-invalid" | "aria-describedby">) {
  const ctx = useFieldCtx();
  return (
    <input
      id={ctx.id}
      aria-invalid={ctx.hasError || undefined}
      aria-describedby={ctx.describedBy}
      aria-required={ctx.required || undefined}
      required={ctx.required}
      className={`input-base focus-ring ${ctx.hasError ? "border-[var(--color-error)]" : ""}`}
      {...props}
    />
  );
}

export function TextArea(props: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "aria-invalid" | "aria-describedby">) {
  const ctx = useFieldCtx();
  return (
    <textarea
      id={ctx.id}
      aria-invalid={ctx.hasError || undefined}
      aria-describedby={ctx.describedBy}
      aria-required={ctx.required || undefined}
      required={ctx.required}
      className={`input-base focus-ring ${ctx.hasError ? "border-[var(--color-error)]" : ""}`}
      {...props}
    />
  );
}

export function NativeSelect(props: Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "aria-invalid" | "aria-describedby">) {
  const ctx = useFieldCtx();
  return (
    <select
      id={ctx.id}
      aria-invalid={ctx.hasError || undefined}
      aria-describedby={ctx.describedBy}
      aria-required={ctx.required || undefined}
      required={ctx.required}
      className={`input-base focus-ring ${ctx.hasError ? "border-[var(--color-error)]" : ""}`}
      {...props}
    />
  );
}
