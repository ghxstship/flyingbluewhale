import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';

/* ═══════════════════════════════════════════════════════
   Console Layout
   Wraps ALL /console/* routes with the persistent
   sidebar navigation + main content area.
   Previously the sidebar was inlined only in console/page.tsx.
   ═══════════════════════════════════════════════════════ */

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') ?? headersList.get('x-invoke-path') ?? '/console';

  return (
    <div className="console-shell">
      <Sidebar userEmail={user?.email} currentPath={pathname} />
      <div className="console-main">
        <div className="console-content">
          {children}
        </div>
      </div>
    </div>
  );
}
