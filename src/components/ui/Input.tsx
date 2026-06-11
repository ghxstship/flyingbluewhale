"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import { useFieldError } from "@/components/FormShell";
import { Spinner } from "./Spinner";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "prefix"> {
  label?: string;
  /** Explicit error message. When omitted and the input sits inside a
   *  <FormShell> whose action returned `fieldErrors`, the error for this
   *  input's `name` is picked up from context automatically (FE-1). */
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
  /** When true, render the label as a floating label that animates on focus
   *  / value-present (Linear/Stripe pattern). Saves vertical space in dense
   *  forms. The label is still associated for accessibility. */
  floating?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error: errorProp,
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
    floating,
    className = "",
    maxLength,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = inputId ?? `${reactId}-input`;
  // FE-1 — fall back to FormShell's per-field error context when no explicit
  // `error` prop is passed. useFieldError reads a context that is null
  // outside <FormShell> (or when the action returned no fieldErrors), so
  // this is a no-op everywhere else. Explicit `error` always wins so callers
  // that already plumb errors through props don't double-source.
  const contextError = useFieldError(typeof rest.name === "string" ? rest.name : "");
  const error = errorProp ?? contextError;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const [localValue, setLocalValue] = useState<string>(
    typeof rest.value === "string" ? rest.value : typeof rest.defaultValue === "string" ? rest.defaultValue : "",
  );

  // Reflect controlled value
  const controlled = typeof rest.value === "string";
  const currentValue = controlled ? (rest.value as string) : localValue;

  const describedBy =
    [
      error ? errorId : null,
      !error && hint ? hintId : null,
      showCount && maxLength ? countId : null,
      rest["aria-describedby"],
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const hasPrefix = !!prefix;
  const trailing = asyncValidating ? (
    <Spinner size="sm" className="text-[var(--p-text-2)]" />
  ) : clearable && currentValue ? (
    <button
      type="button"
      aria-label="Clear"
      onClick={() => {
        if (!controlled) setLocalValue("");
        onClear?.();
      }}
      className="rounded p-0.5 text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
    >
      <X size={12} aria-hidden="true" />
    </button>
  ) : suffix ? (
    <span className="pointer-events-none text-[var(--p-text-2)]">{suffix}</span>
  ) : null;

  if (floating && label) {
    // Floating-label variant. Label sits inside the input box and animates
    // up when the field is focused or has a value. Uses :placeholder-shown
    // (no JS state) so SSR + hydration match.
    return (
      <div className="flex flex-col gap-1.5">
        <div className="group relative flex items-center">
          {hasPrefix && (
            <span className="pointer-events-none absolute start-2.5 z-10 text-[var(--p-text-2)]">{prefix}</span>
          )}
          <input
            ref={ref}
            id={id}
            required={required}
            maxLength={maxLength}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={`ps-input focus-ring peer w-full pt-5 pb-1.5 ${hasPrefix ? "ps-7" : ""} ${trailing ? "pe-7" : ""} ${error ? "border-[var(--p-danger)]" : ""} ${className}`}
            onChange={(e) => {
              if (!controlled) setLocalValue(e.target.value);
              rest.onChange?.(e);
            }}
            {...rest}
          />
          <label
            htmlFor={id}
            className={`pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-xs text-[var(--p-text-2)] transition-[top,transform,font-size,color] duration-[var(--motion-fast)] ease-[var(--ease-out)] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:text-[var(--p-text-2)] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] ${hasPrefix ? "start-7" : ""}`}
          >
            {label}
            {required && (
              <span aria-hidden="true" className="ms-0.5 text-[var(--p-danger)]">
                *
              </span>
            )}
          </label>
          {trailing && <span className="absolute end-2.5 inline-flex items-center">{trailing}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
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
          {showCount && maxLength && (
            <span
              id={countId}
              className={`shrink-0 font-mono text-[10px] ${
                currentValue.length >= maxLength ? "text-[var(--p-danger)]" : "text-[var(--p-text-2)]"
              }`}
            >
              {currentValue.length} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={`text-xs font-medium text-[var(--p-text-2)] ${hideLabel ? "sr-only" : ""}`}>
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-[var(--p-danger)]">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative flex items-center">
        {hasPrefix && <span className="pointer-events-none absolute start-2.5 text-[var(--p-text-2)]">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          required={required}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`ps-input focus-ring w-full ${hasPrefix ? "ps-7" : ""} ${trailing ? "pe-7" : ""} ${error ? "border-[var(--p-danger)]" : ""} ${className}`}
          onChange={(e) => {
            if (!controlled) setLocalValue(e.target.value);
            rest.onChange?.(e);
          }}
          {...rest}
        />
        {trailing && <span className="absolute end-2.5 inline-flex items-center">{trailing}</span>}
      </div>
      {/* Footer is opt-in: only renders when there's actual content. An always-on
          empty <div> here would inherit the parent flex-col gap-1.5, pushing the
          input 6px lower than sibling hand-rolled <select>s and breaking
          alignment across grid forms. */}
      {(error || hint || (showCount && maxLength)) && (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
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
          {showCount && maxLength && (
            <span
              id={countId}
              className={`shrink-0 font-mono text-[10px] ${
                currentValue.length >= maxLength ? "text-[var(--p-danger)]" : "text-[var(--p-text-2)]"
              }`}
            >
              {currentValue.length} / {maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
