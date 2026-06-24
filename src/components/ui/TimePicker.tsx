"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface TimePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  /** Controlled value as "HH:mm" (24h, the native time-input wire format). */
  value?: string;
  /** Uncontrolled initial value as "HH:mm". */
  defaultValue?: string;
  /** Fired with the "HH:mm" string (or "" when cleared). */
  onChange?: (value: string) => void;
  /** Display clock convention. 24h forces a 24-hour control where supported;
   *  12h lets the platform render an AM/PM control. The wire value stays
   *  "HH:mm" 24h either way. Default 24. */
  hour12?: boolean;
  /** Minute granularity in seconds (e.g. 300 = 5-minute steps). */
  step?: number;
  label?: string;
  hideLabel?: boolean;
  inputId?: string;
}

/**
 * TimePicker — a typed wrapper over the native <input type="time"> styled
 * with `.ps-input`. The native control already gives keyboard entry,
 * spinner, and platform clock UI for free; this wrapper adds the standard
 * label + token styling + a clean "HH:mm" onChange signature. `hour12`
 * sets the `lang` hint that drives 12h vs 24h rendering where the platform
 * honors it; the emitted value is always 24h "HH:mm".
 */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
  {
    value,
    defaultValue,
    onChange,
    hour12 = false,
    step,
    label,
    hideLabel,
    inputId,
    className = "",
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = inputId ?? `${reactId}-time`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={`text-xs font-medium text-[var(--p-text-2)] ${hideLabel ? "sr-only" : ""}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type="time"
        // The `lang` attribute is the cross-browser lever for 12h vs 24h
        // rendering: en-US → AM/PM, en-GB → 24h. The stored value is 24h
        // regardless, so callers always get a normalized "HH:mm".
        lang={hour12 ? "en-US" : "en-GB"}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        className={`ps-input focus-ring w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${className}`}
        {...rest}
      />
    </div>
  );
});
