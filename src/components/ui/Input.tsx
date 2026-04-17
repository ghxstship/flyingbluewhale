import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  inputId?: string;
  hint?: string;
}

export function Input({ label, error, inputId, hint, className = "", ...rest }: InputProps) {
  const id = inputId ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input-base focus-ring ${error ? "border-[var(--color-error)]" : ""} ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-[var(--color-error)]">{error}</span>}
      {!error && hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
    </div>
  );
}
