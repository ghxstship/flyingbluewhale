"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "prefix"> {
  label?: string;
  error?: string;
  inputId?: string;
  hint?: string;
  /** When true, label visually hidden but still announced. */
  hideLabel?: boolean;
  required?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  asyncValidating?: boolean;
  showCount?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    inputId,
    hint,
    hideLabel,
    required,
    prefix,
    suffix,
    clearable,
    onClear,
    asyncValidating,
    showCount,
    className = "",
    maxLength,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = inputId ?? `${reactId}-input`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const [localValue, setLocalValue] = useState<string>(
    typeof rest.value === "string" ? rest.value : typeof rest.defaultValue === "string" ? rest.defaultValue : "",
  );

  // Reflect controlled value
  const controlled = typeof rest.value === "string";
  const currentValue = controlled ? (rest.value as string) : localValue;

  const describedBy = [
    error ? errorId : null,
    !error && hint ? hintId : null,
    showCount && maxLength ? countId : null,
    rest["aria-describedby"],
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const hasPrefix = !!prefix;
  const trailing = asyncValidating ? (
    <Loader2 size={12} className="text-[var(--text-muted)] motion-safe:animate-spin" aria-hidden="true" />
  ) : clearable && currentValue ? (
    <button
      type="button"
      aria-label="Clear"
      onClick={() => {
        if (!controlled) setLocalValue("");
        onClear?.();
      }}
      className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    >
      <X size={12} aria-hidden="true" />
    </button>
  ) : suffix ? (
    <span className="pointer-events-none text-[var(--text-muted)]">{suffix}</span>
  ) : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className={`text-xs font-medium text-[var(--text-secondary)] ${hideLabel ? "sr-only" : ""}`}
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-[var(--color-error)]">*</span>
          )}
        </label>
      )}
      <div className="relative flex items-center">
        {hasPrefix && (
          <span className="pointer-events-none absolute start-2.5 text-[var(--text-muted)]">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`input-base focus-ring w-full ${hasPrefix ? "ps-7" : ""} ${trailing ? "pe-7" : ""} ${error ? "border-[var(--color-error)]" : ""} ${className}`}
          onChange={(e) => {
            if (!controlled) setLocalValue(e.target.value);
            rest.onChange?.(e);
          }}
          {...rest}
        />
        {trailing && <span className="absolute end-2.5 inline-flex items-center">{trailing}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {error && (
            <span id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
              {error}
            </span>
          )}
          {!error && hint && (
            <span id={hintId} className="text-xs text-[var(--text-muted)]">{hint}</span>
          )}
        </div>
        {showCount && maxLength && (
          <span
            id={countId}
            className={`shrink-0 font-mono text-[10px] ${
              currentValue.length >= maxLength ? "text-[var(--color-error)]" : "text-[var(--text-muted)]"
            }`}
          >
            {currentValue.length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
});
