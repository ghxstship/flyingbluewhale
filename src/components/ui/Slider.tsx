"use client";

import * as React from "react";

export interface SliderProps {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. */
  defaultValue?: number;
  /** Fired on every value change (drag, keyboard, click). */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Accessible name for the slider thumb (falls back to "Slider"). */
  label?: string;
  /** Optional id for the underlying element (label association). */
  id?: string;
  className?: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function quantize(n: number, min: number, step: number): number {
  // Snap to the nearest step boundary measured from `min`.
  const steps = Math.round((n - min) / step);
  return min + steps * step;
}

/**
 * Slider — a single-thumb range slider built on a native pointer/keyboard
 * model (no native <input type="range"> so the filled track is fully
 * token-styled). Controlled via `value` or uncontrolled via `defaultValue`.
 * Filled track + thumb read `--p-accent`; focus ring reads `--p-focus`.
 */
export function Slider({
  value: valueProp,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  id,
  className = "",
}: SliderProps) {
  const reactId = React.useId();
  const sliderId = id ?? `${reactId}-slider`;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const controlled = valueProp !== undefined;
  const [internal, setInternal] = React.useState<number>(
    () => clamp(defaultValue ?? valueProp ?? min, min, max),
  );
  const value = clamp(controlled ? (valueProp as number) : internal, min, max);

  const commit = React.useCallback(
    (next: number) => {
      const snapped = clamp(quantize(next, min, step), min, max);
      if (!controlled) setInternal(snapped);
      onValueChange?.(snapped);
    },
    [controlled, min, max, step, onValueChange],
  );

  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const valueFromClientX = React.useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return value;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + ratio * (max - min);
    },
    [min, max, value],
  );

  const pointerActive = React.useRef(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    pointerActive.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    commit(valueFromClientX(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !pointerActive.current) return;
    commit(valueFromClientX(e.clientX));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointerActive.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const bigStep = Math.max(step, (max - min) / 10);
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = value + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = value - step;
        break;
      case "PageUp":
        next = value + bigStep;
        break;
      case "PageDown":
        next = value - bigStep;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    commit(next);
  }

  return (
    <div
      ref={trackRef}
      className={`relative flex h-5 w-full touch-none items-center select-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Rail */}
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--p-surface-2)]" aria-hidden="true" />
      {/* Filled track */}
      <div
        className="absolute h-1.5 rounded-full bg-[var(--p-accent)]"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />
      {/* Thumb */}
      <div
        id={sliderId}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label ?? "Slider"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled || undefined}
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="focus-ring absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-[var(--p-accent)] bg-[var(--p-bg)] shadow transition-shadow"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
