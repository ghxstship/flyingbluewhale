import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { isInternalProjectRole, isInternalRole } from '@/lib/supabase/types';

export async function generateMetadata() {
  return {
    title: 'Dashboard -- Personal Hub',
    description: 'Personal unified dashboard across all projects and organizations.',
  };
}

export default async function PersonalDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Check roles so we can display the smart navigation cards
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = orgMember && isInternalRole(orgMember.role as any);

  const { data: projMembers } = await supabase
    .from('project_members')
    .select('project_id, role, projects(slug, name)')
    .eq('user_id', user.id);

  const activeProjects = projMembers?.map((pm: any) => ({
    slug: pm.projects?.slug,
    name: pm.projects?.name,
    role: pm.role,
  })) || [];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Global Dashboard Header */}
      <header className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border bg-surface shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3 mb-2 md:mb-0">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <span className="text-heading text-sm tracking-[0.25em] text-text-primary">UNIVERSAL DASHBOARD</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-text-tertiary">{user.email}</div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-xs text-text-secondary hover:text-cyan transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="font-display text-3xl mb-1 text-text-primary">Welcome back.</h1>
          <p className="text-sm text-text-secondary">Here is your consolidated operational overview.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Nav column */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h2 className="text-xs tracking-wider uppercase text-text-disabled mb-2 border-b border-border-subtle pb-2">Access Points</h2>
            
            {isAdmin && (
              <Link href="/console" className="card p-5 group transition-colors hover:border-cyan flex items-start gap-4 no-underline">
                <div className="w-8 h-8 rounded bg-cyan-subtle flex items-center justify-center text-cyan font-heading text-xs shrink-0 group-hover:bg-[rgba(0,229,255,0.2)] transition-colors">
                  A
                </div>
                <div>
                  <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors mb-1">ATLVS Console</h3>
                  <p className="text-xs text-text-tertiary">Platform management, organizations, and robust master schedule.</p>
                </div>
              </Link>
            )}

            {activeProjects.length > 0 ? (
              activeProjects.map((p: any, idx: number) => (
                <Link key={idx} href={`/${p.slug}/production`} className="card p-5 group transition-colors hover:border-cyan flex items-start gap-4 no-underline">
                  <div className="w-8 h-8 rounded bg-cyan-subtle flex items-center justify-center text-cyan font-heading text-xs shrink-0 group-hover:bg-[rgba(0,229,255,0.2)] transition-colors">
                    G
                  </div>
                  <div>
                    <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors mb-1">GVTEWAY: {p.name}</h3>
                    <p className="text-xs text-text-tertiary">Access your project portal as a {p.role}.</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="card p-5 border-dashed border-border-subtle bg-surface/50 text-center text-text-tertiary text-xs">
                No active project allocations found.
              </div>
            )}
            
            {/* Field App Button */}
            <Link href="/compvss" className="card p-5 group transition-colors hover:border-cyan flex items-start gap-4 no-underline mt-2">
              <div className="w-8 h-8 rounded bg-cyan-subtle flex items-center justify-center text-cyan font-heading text-xs shrink-0 group-hover:bg-[rgba(0,229,255,0.2)] transition-colors">
                C
              </div>
              <div>
                <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors mb-1">COMPVSS App</h3>
                <p className="text-xs text-text-tertiary">Field operations, scanning, tasks, and site navigation.</p>
              </div>
            </Link>
          </div>

          {/* Activity / Universal Hub Widgets */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-xs tracking-wider uppercase text-text-disabled mb-2 border-b border-border-subtle pb-2">Global Inbox & Tasks</h2>
            
            <div className="card p-8 text-center bg-surface/30 border-dashed border-border flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-full bg-border-subtle flex items-center justify-center text-text-tertiary mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              </div>
              <h3 className="text-sm font-medium text-text-secondary mb-1">You're all caught up!</h3>
              <p className="text-xs text-text-tertiary max-w-sm">
                No immediate notifications or unread messages across your projects.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
