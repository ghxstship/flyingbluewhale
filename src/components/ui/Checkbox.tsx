'use client';
import type { InputHTMLAttributes } from 'react';

/** Checkbox — styled checkbox input */
export function Checkbox({ className = '', indeterminate, ...props }: InputHTMLAttributes<HTMLInputElement> & { className?: string; indeterminate?: boolean }) {
  return (
    <input
      type="checkbox"
      className={`rounded border-border text-text-primary focus:ring-1 focus:ring-text-primary/20 ${className}`}
      ref={(el) => { if (el) el.indeterminate = !!indeterminate; }}
      {...props}
    />
  );
}
export default Checkbox;
