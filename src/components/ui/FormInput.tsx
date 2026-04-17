'use client';
import type { InputHTMLAttributes } from 'react';

/** FormInput — styled text input */
export function FormInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary ${className}`}
      {...props}
    />
  );
}
export default FormInput;
