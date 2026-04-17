'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ═══════════════════════════════════════════════════════
   Mobile Layout — Bottom Tab Bar Shell
   PWA-optimized layout for /m/* field operations.
   Bottom tab bar (max 5), offline indicator,
   separate from console sidebar.
   ═══════════════════════════════════════════════════════ */

const TABS = [
  { href: '/m', label: 'Home', icon: '🏠' },
  { href: '/m/check-in', label: 'Check-in', icon: '📱' },
  { href: '/m/tasks', label: 'Tasks', icon: '✅' },
  { href: '/m/inventory/scan', label: 'Scan', icon: '📦' },
  { href: '/m/settings', label: 'Me', icon: '👤' },
];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div data-platform="compvss" className="flex flex-col min-h-screen bg-background">
      {/* Status bar */}
      <header className="px-4 py-3 flex items-center justify-between bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--brand-color)] [box-shadow:var(--brand-shadow)]" />
          <span className="text-heading text-xs tracking-[0.2em] text-text-primary">COMPVSS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.6rem] text-emerald-400 font-mono">● ONLINE</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] shrink-0">
        <div className="flex items-center justify-around h-14">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href ||
              (tab.href !== '/m' && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-[var(--brand-color)]'
                    : 'text-text-disabled hover:text-text-secondary'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[0.6rem] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
