'use client';
import type { SelectHTMLAttributes } from 'react';

/** FormSelect — styled select input */
export function FormSelect({ children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <select
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
export default FormSelect;
