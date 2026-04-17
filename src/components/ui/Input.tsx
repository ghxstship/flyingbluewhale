import type { InputHTMLAttributes } from 'react';

/* ═══════════════════════════════════════════════════════
   Input — Canonical form input primitive
   Wraps globals.css .input with label + error support.
   ═══════════════════════════════════════════════════════ */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Unique ID; auto-generated from label if omitted */
  inputId?: string;
}

export function Input({ label, error, inputId, className = '', ...rest }: InputProps) {
  const id = inputId ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-label text-text-tertiary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input w-full ${error ? 'border-error' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}
