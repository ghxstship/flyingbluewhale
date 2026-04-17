'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

/* ═══════════════════════════════════════════════════════
   Tooltip Component
   Context-based accessible tooltip overlay.
   ═══════════════════════════════════════════════════════ */

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRect: DOMRect | null;
  setTriggerRect: (rect: DOMRect | null) => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRect, setTriggerRect }}>
      {children}
    </TooltipContext.Provider>
  );
}

export default function Tooltip({ children, delay = 200, label }: { children: React.ReactNode; delay?: number; label?: React.ReactNode }) {
  // If a label is provided, use the shorthand wrapper
  if (label !== undefined) {
    return (
      <TooltipProvider>
        <div className="inline-flex relative">
          <TooltipTrigger>{children}</TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </div>
      </TooltipProvider>
    );
  }

  // Otherwise, use the compound component pattern
  return (
    <TooltipProvider>
      <div className="inline-flex relative">
        {children}
      </div>
    </TooltipProvider>
  );
}

export function TooltipTrigger({ 
  children, 
  asChild = false 
}: { 
  children: React.ReactNode; 
  asChild?: boolean;
}) {
  const ctx = useContext(TooltipContext);
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        ctx?.setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
      ctx?.setOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    ctx?.setOpen(false);
  };

  const childProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
    'aria-describedby': 'tooltip',
    ref: triggerRef as any,
  };

  if (asChild && React.isValidElement(children)) {
    const childComponent = children as React.ReactElement<any>;
    return React.cloneElement(childComponent, {
      ...childComponent.props,
      ...childProps,
      // @ts-ignore
      ref: triggerRef
    });
  }

  return (
    <span {...childProps} className="cursor-help">
      {children}
    </span>
  );
}

export function TooltipContent({ 
  children,
  side = 'top'
}: { 
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const ctx = useContext(TooltipContext);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ctx?.open && ctx.triggerRect && contentRef.current) {
      const tg = ctx.triggerRect;
      const content = contentRef.current.getBoundingClientRect();
      const gap = 8;
      
      let top = 0;
      let left = 0;

      // Simplistic positioning for now
      if (side === 'top') {
        top = tg.top - content.height - gap;
        left = tg.left + (tg.width / 2) - (content.width / 2);
      } else if (side === 'bottom') {
        top = tg.bottom + gap;
        left = tg.left + (tg.width / 2) - (content.width / 2);
      }

      setStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 100000,
      });
    }
  }, [ctx?.open, ctx?.triggerRect, side]);

  if (!ctx?.open) return null;

  const content = (
    <div
      ref={contentRef}
      style={style}
      role="tooltip"
      className="z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 pointer-events-none"
    >
      {children}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  
  return null;
}
