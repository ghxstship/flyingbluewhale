'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './Input';

/* ═══════════════════════════════════════════════════════
   SearchInput Component
   Input with search icon and clear button.
   ═══════════════════════════════════════════════════════ */

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export default function SearchInput({
  className,
  value,
  onChange,
  onClear,
  ...props
}: SearchInputProps) {
  
  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={cn("relative flex items-center w-full min-w-[200px]", className)}>
      <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        className="pl-9 pr-9"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-0.5 text-text-muted hover:text-foreground hover:bg-bg-elevated rounded-sm transition-colors"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}
