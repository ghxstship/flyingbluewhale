'use client';
import type { LabelHTMLAttributes } from 'react';

/** FormLabel — styled label */
export function FormLabel({ children, className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement> & { className?: string }) {
  return (
    <label className={`text-sm font-medium text-text-primary ${className}`} {...props}>
      {children}
    </label>
  );
}
export default FormLabel;
