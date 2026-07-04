"use client";

import * as React from "react";

export interface PinInputProps {
  /** Number of cells. Default 6. */
  length?: number;
  /** Controlled value (string of up to `length` chars). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fired on every change with the full concatenated string. */
  onChange?: (value: string) => void;
  /** Fired once all cells are filled. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  /** Restrict accepted characters. "numeric" (default) or "alphanumeric". */
  type?: "numeric" | "alphanumeric";
  /** Mask entries (one-time-password style). */
  mask?: boolean;
  /** Accessible group label. */
  label?: string;
  /** autocomplete hint for the first cell (e.g. "one-time-code"). */
  autoComplete?: string;
  className?: string;
}

/**
 * PinInput — N-cell one-time-code entry. Paste-aware (paste into any cell
 * distributes across cells), auto-advances on entry, backspace walks back,
 * arrows move between cells. Each cell is its own <input> for native mobile
 * OTP autofill; the group carries `role="group"` + `aria-label`.
 */
export function PinInput({
  length = 6,
  value: valueProp,
  defaultValue = "",
  onChange,
  onComplete,
  disabled = false,
  type = "numeric",
  mask = false,
  label = "Verification code",
  autoComplete = "one-time-code",
  className = "",
}: PinInputProps) {
  const controlled = valueProp !== undefined;
  const [internal, setInternal] = React.useState<string>(defaultValue.slice(0, length));
  const value = (controlled ? (valueProp as string) : internal).slice(0, length);
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const completedFor = React.useRef<string | null>(null);

  const pattern = React.useMemo(
    () => (type === "numeric" ? /[^0-9]/g : /[^0-9a-zA-Z]/g),
    [type],
  );
  const chars = React.useMemo(() => {
    const arr = value.split("");
    return Array.from({ length }, (_, i) => arr[i] ?? "");
  }, [value, length]);

  const emit = React.useCallback(
    (next: string) => {
      const clean = next.replace(pattern, "").slice(0, length);
      if (!controlled) setInternal(clean);
      onChange?.(clean);
      if (clean.length === length && completedFor.current !== clean) {
        completedFor.current = clean;
        onComplete?.(clean);
      } else if (clean.length < length) {
        completedFor.current = null;
      }
    },
    [controlled, length, onChange, onComplete, pattern],
  );

  const focusCell = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const setCharAt = (index: number, ch: string) => {
    const arr = chars.slice();
    arr[index] = ch;
    return arr.join("");
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(pattern, "");
    if (cleaned.length === 0) {
      emit(setCharAt(index, ""));
      return;
    }
    if (cleaned.length === 1) {
      emit(setCharAt(index, cleaned));
      if (index < length - 1) focusCell(index + 1);
      return;
    }
    // Multiple chars typed/dropped into one cell — spill across from here.
    const arr = chars.slice();
    let cursor = index;
    for (const c of cleaned) {
      if (cursor >= length) break;
      arr[cursor] = c;
      cursor += 1;
    }
    emit(arr.join(""));
    focusCell(Math.min(cursor, length - 1));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (chars[index]) {
        emit(setCharAt(index, ""));
      } else if (index > 0) {
        e.preventDefault();
        emit(setCharAt(index - 1, ""));
        focusCell(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusCell(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusCell(index + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusCell(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusCell(length - 1);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(pattern, "");
    if (!pasted) return;
    const arr = chars.slice();
    let cursor = index;
    for (const c of pasted) {
      if (cursor >= length) break;
      arr[cursor] = c;
      cursor += 1;
    }
    emit(arr.join(""));
    focusCell(Math.min(cursor, length - 1));
  };

  return (
    <div role="group" aria-label={label} className={`flex items-center gap-2 ${className}`}>
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={mask ? "password" : "text"}
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete={i === 0 ? autoComplete : "off"}
          pattern={type === "numeric" ? "[0-9]*" : undefined}
          maxLength={1}
          disabled={disabled}
          value={ch}
          aria-label={`${label} digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className="ps-input focus-ring h-11 w-10 rounded-[var(--p-r-md,0.375rem)] text-center font-mono text-base tabular-nums"
        />
      ))}
    </div>
  );
}
