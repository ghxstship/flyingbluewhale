'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface InvoiceSubNavProps {
  basePath?: string;
  className?: string;
}

const TABS = [
  { key: 'all', label: 'All Invoices', suffix: '' },
  { key: 'credit-notes', label: 'Credit Notes', suffix: '/credit-notes' },
  { key: 'recurring', label: 'Recurring', suffix: '/recurring' },
];

export default function InvoiceSubNav({
  basePath = '/app/invoices',
  className = '',
}: InvoiceSubNavProps) {
  const pathname = usePathname();

  function isActive(suffix: string) {
    if (suffix === '') {
      // "All Invoices" is active when exactly on the base path
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname.includes(suffix);
  }

  return (
    <div className={`flex items-center gap-1 border-b border-border ${className}`}>
      {TABS.map((tab) => {
        const active = isActive(tab.suffix);
        return (
          <Link
            key={tab.key}
            href={`${basePath}${tab.suffix}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'text-brand-primary border-brand-primary'
                : 'text-text-muted border-transparent hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
