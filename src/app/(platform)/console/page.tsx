import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Console -- GVTEWAY',
  description: 'GVTEWAY internal console: manage projects, catalog, deliverables, catering, and notifications.',
};

export default async function ConsolePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Placeholder data for initial render
  const stats = {
    projects: 0,
    catalogItems: 350,
    deliverables: 0,
    notifications: 0,
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-heading text-sm tracking-[0.2em]">GVTEWAY</span>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          <NavItem href="/console" label="Dashboard" active />
          <NavItem href="/console/projects" label="Projects" />

          <div className="text-label text-text-disabled mt-6 mb-2 px-3">Catalog</div>
          <NavItem href="/catalog" label="Browse Catalog" />
          <NavItem href="/catalog/inventory" label="Inventory" />
          <NavItem href="/catalog/import" label="Bulk Import" />

          <div className="text-label text-text-disabled mt-6 mb-2 px-3">Operations</div>
          <NavItem href="/console/deliverables" label="Deliverables" />
          <NavItem href="/catering" label="Catering" />
          <NavItem href="/notifications" label="Notifications" />

          <div className="text-label text-text-disabled mt-6 mb-2 px-3">Content</div>
          <NavItem href="/cms" label="CMS Pages" />
          <NavItem href="/templates" label="Templates" />

          <div className="text-label text-text-disabled mt-6 mb-2 px-3">System</div>
          <NavItem href="/console/users" label="Users & Roles" />
          <NavItem href="/console/audit" label="Audit Log" />
          <NavItem href="/api/v1/docs" label="API Docs" />
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-text-secondary text-heading">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-primary truncate">{user?.email || 'Not signed in'}</div>
              <div className="text-label text-text-disabled text-[0.5rem]">DEVELOPER</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8">
          <h1 className="text-heading text-sm text-text-primary">Console</h1>
          <div className="flex items-center gap-3">
            <Link href="/projects/new" className="btn btn-primary text-xs py-2 px-4">
              New Project
            </Link>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Active Projects" value={stats.projects} />
              <StatCard label="Catalog Items" value={stats.catalogItems} accent />
              <StatCard label="Open Deliverables" value={stats.deliverables} />
              <StatCard label="Notifications Sent" value={stats.notifications} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <QuickAction
                title="Create Project"
                description="Start a new talent or production advance project from scratch or a template."
                href="/projects/new"
                cta="New Project"
              />
              <QuickAction
                title="Browse Catalog"
                description="Explore 350+ items across 10 collections. Filter by role, category, or availability."
                href="/catalog"
                cta="Open Catalog"
              />
              <QuickAction
                title="Manage Templates"
                description="Create and edit project templates and submission templates for faster onboarding."
                href="/templates"
                cta="Templates"
              />
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <h2 className="text-heading text-sm text-text-primary">Recent Activity</h2>
                <span className="text-label text-text-disabled">All Projects</span>
              </div>
              <div className="p-16 text-center">
                <div className="text-text-tertiary text-sm mb-2">No activity yet</div>
                <p className="text-text-disabled text-xs max-w-md mx-auto">
                  Create your first project to start tracking deliverables, allocations, and notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={active ? 'nav-item nav-item-active' : 'nav-item'}
    >
      {label}
    </Link>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-label text-text-tertiary mb-2">{label}</div>
      <div className={`text-display text-3xl ${accent ? 'text-cyan' : 'text-text-primary'}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function QuickAction({ title, description, href, cta }: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="card p-6 flex flex-col">
      <h3 className="text-heading text-sm text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary flex-1 mb-4">{description}</p>
      <Link href={href} className="btn btn-secondary text-xs py-2 w-full">
        {cta}
      </Link>
    </div>
  );
}
