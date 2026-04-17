'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   Tabs Component
   Accessible tab navigation
   ═══════════════════════════════════════════════════════ */

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export default function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  tabs,
  activeTab,
  onTabChange,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
  tabs?: { key: string; label: string; count?: number }[];
  activeTab?: string;
  onTabChange?: (tab: any) => void;
}) {
  const [tab, setTab] = useState(activeTab ?? value ?? defaultValue ?? '');

  const activeValue = activeTab !== undefined ? activeTab : (value !== undefined ? value : tab);

  const handleValueChange = (newVal: string) => {
    if (value === undefined && activeTab === undefined) setTab(newVal);
    onValueChange?.(newVal);
    onTabChange?.(newVal);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)}>
        {tabs ? (
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label} 
                {t.count !== undefined && (
                  <span className={cn(
                    "ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium leading-none",
                    activeValue === t.key ? "bg-foreground text-background" : "bg-bg-elevated text-text-muted"
                  )}>
                    {t.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : null}
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-surface p-1 text-text-muted border border-border-subtle',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  disabled = false,
}: {
  value: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-background text-foreground shadow-sm border border-border/50'
          : 'hover:text-foreground hover:bg-bg-elevated/50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
}
