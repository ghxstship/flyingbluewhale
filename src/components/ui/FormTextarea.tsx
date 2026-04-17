'use client';
import type { TextareaHTMLAttributes } from 'react';

/** FormTextarea — styled textarea */
export function FormTextarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary ${className}`}
      {...props}
    />
  );
}
export default FormTextarea;
