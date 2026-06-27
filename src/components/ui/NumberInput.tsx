"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Minus, Plus } from "lucide-react";

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"> {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. */
  defaultValue?: number;
  /** Fired with the clamped numeric value (or null when the field is empty). */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  hideLabel?: boolean;
  inputId?: string;
  disabled?: boolean;
}

function clampVal(n: number, min?: number, max?: number): number {
  let out = n;
  if (typeof min === "number") out = Math.max(min, out);
  if (typeof max === "number") out = Math.min(max, out);
  return out;
}

/**
 * NumberInput — numeric field with −/+ stepper buttons. Clamps to
 * [min, max] on commit, steps with ArrowUp/ArrowDown and the buttons.
 * Controlled via `value`, uncontrolled via `defaultValue`. Styled with
 * `.ps-input`; focus ring via `--p-focus`.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    min,
    max,
    step = 1,
    label,
    hideLabel,
    inputId,
    disabled = false,
    className = "",
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = inputId ?? `${reactId}-number`;
  const controlled = valueProp !== undefined;
  const [internal, setInternal] = useState<number | null>(
    defaultValue ?? (valueProp ?? null),
  );
  const value = controlled ? (valueProp as number) : internal;

  const commit = (next: number | null) => {
    const clamped = next === null ? null : clampVal(next, min, max);
    if (!controlled) setInternal(clamped);
    onValueChange?.(clamped);
  };

  const stepBy = (dir: 1 | -1) => {
    const base = typeof value === "number" && !Number.isNaN(value) ? value : (min ?? 0);
    commit(base + dir * step);
  };

  const atMin = typeof min === "number" && typeof value === "number" && value <= min;
  const atMax = typeof max === "number" && typeof value === "number" && value >= max;

  const stepperBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text-1)] transition-colors hover:bg-[var(--p-surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--p-focus)] disabled:opacity-50 disabled:pointer-events-none";

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={`text-xs font-medium text-[var(--p-text-2)] ${hideLabel ? "sr-only" : ""}`}>
          {label}
        </label>
      )}
      <div className="flex items-stretch">
        <button
          type="button"
          aria-label="Decrease"
          disabled={disabled || atMin}
          onClick={() => stepBy(-1)}
          className={`${stepperBtn} rounded-s-[var(--p-r-md,0.375rem)]`}
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <input
          ref={ref}
          id={id}
          type="number"
          inputMode="decimal"
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          value={value === null ? "" : value}
          onChange={(e) => {
            const raw = e.target.value;
            commit(raw === "" ? null : Number(raw));
          }}
          onBlur={(e) => {
            // Re-clamp on blur so a typed out-of-range value snaps in.
            const raw = e.target.value;
            if (raw !== "") commit(Number(raw));
            rest.onBlur?.(e);
          }}
          className={`ps-input focus-ring w-full rounded-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
          {...rest}
        />
        <button
          type="button"
          aria-label="Increase"
          disabled={disabled || atMax}
          onClick={() => stepBy(1)}
          className={`${stepperBtn} rounded-e-[var(--p-r-md,0.375rem)]`}
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
