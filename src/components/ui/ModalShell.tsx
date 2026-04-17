'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

/* ═══════════════════════════════════════════════════════
   Modal Shell Component
   Accessible overlay container for forms, dialogs, and editors.
   ═══════════════════════════════════════════════════════ */

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  description,
  children,
  footer,
  className,
  size = 'md',
}: ModalShellProps) {

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg sm:rounded-xl transition-all',
          size === 'sm' && 'max-w-sm',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-2xl',
          size === 'xl' && 'max-w-4xl',
          size === 'full' && 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col',
          className
        )}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="flex flex-col space-y-1">
            {title && <h2 className="text-lg font-semibold text-heading">{title}</h2>}
            {(description || subtitle) && <p className="text-sm text-text-secondary">{description || subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-bg-elevated hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        <div className={cn("p-6", size === 'full' ? 'flex-1 overflow-y-auto' : 'overflow-y-auto max-h-[calc(100vh-16rem)]')}>
          {children}
        </div>
        
        {footer && (
          <div className="flex items-center justify-end border-t border-border bg-surface/50 p-6 space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return null;
}
