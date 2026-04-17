import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GlobalProfileProvider } from '@/components/providers/GlobalProfileProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/* ═══════════════════════════════════════════════════════
   Portal Layout
   Wraps ALL /p/[slug]/* portal routes.
   Fetches project by slug once — prevents duplicated
   queries across 15+ portal page files.
   ═══════════════════════════════════════════════════════ */

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Business Logic: Strict SSR Role Invalidation (Gap 3 Closure)
  // Ensure the user actually has an active structural link to this specific project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!project) {
    redirect('/login?error=project_not_found');
  }

  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', project.id)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    // Eject stale token carriers whose project limits were revoked dynamically
    redirect('/login?error=unauthorized_or_revoked_access');
  }

  // Build typed global profile from authenticated user
  const typedProfile = {
    userId: user.id,
    email: user.email ?? null,
    orgId: null,
    orgName: null,
    orgSlug: null,
    orgTier: null,
    platformRole: null,
  };

  return (
    <GlobalProfileProvider globalProfile={typedProfile}>
      <div data-platform="gvteway" className="flex flex-col min-h-screen">
        {/* Global GVTEWAY Portal Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-surface shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-color)] [box-shadow:var(--brand-shadow)]" />
            <span className="text-heading text-sm tracking-[0.25em] text-text-primary">GVTEWAY</span>
            <span className="text-text-disabled text-xs tracking-widest pl-2 border-l border-border ml-2">// PORTAL</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-xs text-text-tertiary hidden sm:block">{user.email}</div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs text-text-secondary hover:text-[var(--brand-color)] transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </GlobalProfileProvider>
  );
}
