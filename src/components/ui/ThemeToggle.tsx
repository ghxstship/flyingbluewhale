'use client';

import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-full p-1 w-min">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
          theme === 'light' ? 'bg-[var(--brand-active-bg)] text-[var(--brand-color)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        LGT
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
          theme === 'system' ? 'bg-[var(--brand-active-bg)] text-[var(--brand-color)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        SYS
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
          theme === 'dark' ? 'bg-[var(--brand-active-bg)] text-[var(--brand-color)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        DRK
      </button>
    </div>
  );
}
