"use client";

import * as React from "react";

export interface RadioOption {
  value: string;
  label: string;
  /** Optional secondary line under the label. */
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible group label. */
  label?: string;
  /** Stable name (hidden form fields are not emitted, but used for ids). */
  name?: string;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/**
 * RadioGroup — standalone accessible radio group with a roving tabindex
 * (one tab stop; arrows move + select within the group, per WAI-ARIA).
 * `role="radiogroup"` on the container, `role="radio"` on each option.
 * Selection dot + ring read `--p-accent` / `--p-focus`.
 */
export function RadioGroup({
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  label,
  name,
  disabled = false,
  orientation = "vertical",
  className = "",
}: RadioGroupProps) {
  const reactId = React.useId();
  const groupName = name ?? `${reactId}-radiogroup`;
  const controlled = valueProp !== undefined;
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue);
  const value = controlled ? valueProp : internal;
  const refs = React.useRef<Array<HTMLDivElement | null>>([]);

  const enabledIndexes = options.map((o, i) => (o.disabled || disabled ? -1 : i)).filter((i) => i >= 0);

  const select = (v: string) => {
    if (!controlled) setInternal(v);
    onValueChange?.(v);
  };

  // The single tab stop: the selected option, else the first enabled one.
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabbableIndex =
    selectedIndex >= 0 && !options[selectedIndex]?.disabled && !disabled
      ? selectedIndex
      : (enabledIndexes[0] ?? -1);

  const moveTo = (current: number, dir: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const pos = enabledIndexes.indexOf(current);
    const nextPos =
      pos === -1 ? 0 : (pos + dir + enabledIndexes.length) % enabledIndexes.length;
    const nextIndex = enabledIndexes[nextPos];
    if (nextIndex === undefined) return;
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    refs.current[nextIndex]?.focus();
    select(nextOption.value);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        moveTo(index, 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        moveTo(index, -1);
        break;
      case " ":
      case "Enter": {
        e.preventDefault();
        const opt = options[index];
        if (opt && !opt.disabled && !disabled) select(opt.value);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`flex gap-2 ${orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col"} ${className}`}
    >
      {options.map((opt, i) => {
        const checked = opt.value === value;
        const isDisabled = disabled || opt.disabled;
        const descId = opt.description ? `${groupName}-${i}-desc` : undefined;
        return (
          <div
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={checked}
            aria-disabled={isDisabled || undefined}
            aria-describedby={descId}
            aria-label={opt.label}
            tabIndex={isDisabled ? -1 : i === tabbableIndex ? 0 : -1}
            onClick={() => !isDisabled && select(opt.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`focus-ring flex items-start gap-2.5 rounded-[var(--p-r-md,0.375rem)] border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2.5 transition-colors ${
              isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[var(--p-surface-2)]"
            } ${checked ? "border-[var(--p-accent)]" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                checked ? "border-[var(--p-accent)]" : "border-[var(--p-border)]"
              }`}
            >
              {checked && <span className="h-2 w-2 rounded-full bg-[var(--p-accent)]" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-[var(--p-text-1)]">{opt.label}</span>
              {opt.description && (
                <span id={descId} className="block text-xs text-[var(--p-text-2)]">
                  {opt.description}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
