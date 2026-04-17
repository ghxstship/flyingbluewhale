import Link from 'next/link';

export function MobileFieldOpsLayout({
  children,
  userEmail,
  currentPath
}: {
  children: React.ReactNode;
  userEmail?: string;
  currentPath: string;
}) {
  const tabs = [
    { name: 'Tasks', href: '/console/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'Schedule', href: '/console/master-schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Scan', href: '/console/check-in', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v-4h-4M5 12H3m6-6H5v4' },
    { name: 'L&F', href: '/console/lost-found', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
  ];

  return (
    <div data-platform="compvss" className="flex flex-col h-screen bg-[var(--color-bg-base)]">
      {/* Mobile Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="font-display font-bold text-xl tracking-widest text-[var(--color-text-primary)] flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-color)] [box-shadow:var(--brand-shadow)]" />
          COMPVSS
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-sm font-medium border border-[var(--color-border)]">
          {userEmail?.charAt(0).toUpperCase() || 'U'}
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto pb-20 p-4">
        {children}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="fixed bottom-0 w-full bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] pb-safe z-50">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const isActive = currentPath.startsWith(tab.href);
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                className={`flex flex-col items-center py-3 px-2 flex-1 transition-colors ${isActive ? 'text-[var(--brand-color)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={tab.icon} />
                </svg>
                <span className="text-[10px] uppercase font-medium tracking-wider">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
