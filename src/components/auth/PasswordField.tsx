"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  label?: string;
  error?: string;
  hint?: string;
  showStrength?: boolean;
};

/** Password input with show/hide toggle + optional strength meter. */
export function PasswordField({
  label = "Password",
  error,
  hint,
  showStrength,
  required,
  className = "",
  onChange,
  ...rest
}: Props) {
  const reactId = useId();
  const id = `${reactId}-pw`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const strengthId = `${id}-strength`;
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const score = scorePassword(value);

  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null, showStrength ? strengthId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-[var(--color-error)]">*</span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={rest.autoComplete ?? "current-password"}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`input-base focus-ring w-full pe-9 ${error ? "border-[var(--color-error)]" : ""} ${className}`}
          onChange={(e) => {
            setValue(e.currentTarget.value);
            onChange?.(e);
          }}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div id={strengthId} aria-live="polite" className="mt-1 space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < score
                    ? score <= 1
                      ? "bg-[var(--color-error)]"
                      : score <= 2
                        ? "bg-amber-500"
                        : score <= 3
                          ? "bg-yellow-500"
                          : "bg-emerald-500"
                    : "bg-[var(--border-color)]"
                }`}
              />
            ))}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">{labelForScore(score)}</div>
        </div>
      )}
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

/**
 * Lightweight password strength heuristic — 0..5.
 * 0 = empty/very weak, 5 = very strong.
 * Not zxcvbn; intentionally no dependency. For sensitive auth, swap in zxcvbn.
 */
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(5, score);
}

function labelForScore(s: number): string {
  switch (s) {
    case 0: return "";
    case 1: return "Very weak";
    case 2: return "Weak";
    case 3: return "Fair";
    case 4: return "Strong";
    case 5: return "Very strong";
    default: return "";
  }
}
