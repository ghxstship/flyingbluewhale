import Link from 'next/link';

const ME_NAV = [
  { href: '/me', label: 'Dashboard' },
  { href: '/me/profile', label: 'Profile' },
  { href: '/me/settings', label: 'Settings' },
  { href: '/me/notifications', label: 'Notifications' },
  { href: '/me/security', label: 'Security' },
  { href: '/me/tickets', label: 'Tickets' },
  { href: '/me/organizations', label: 'Organizations' },
];

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 border-r border-border bg-surface p-4 shrink-0 hidden md:block">
        <div className="mb-6">
          <span className="text-heading text-xs tracking-[0.2em] text-text-disabled">PERSONAL</span>
        </div>
        <nav className="flex flex-col gap-1">
          {ME_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-item text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
