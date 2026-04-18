"use client";

import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label?: string;
  error?: string;
  inputId?: string;
  hint?: string;
  /** When true, label visually hidden but still announced. */
  hideLabel?: boolean;
  required?: boolean;
}

export function Input({
  label,
  error,
  inputId,
  hint,
  hideLabel,
  required,
  className = "",
  ...rest
}: InputProps) {
  const reactId = useId();
  const id = inputId ?? `${reactId}-input`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [
    error ? errorId : null,
    !error && hint ? hintId : null,
    rest["aria-describedby"],
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className={`text-xs font-medium text-[var(--text-secondary)] ${hideLabel ? "sr-only" : ""}`}
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-[var(--color-error)]">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={`input-base focus-ring ${error ? "border-[var(--color-error)]" : ""} ${className}`}
        {...rest}
      />
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
