import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/data/StatCard';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';
import { ContentGrid } from '@/components/layout/ContentGrid';

/* ═══════════════════════════════════════════════════════
   Console Dashboard
   Sidebar is now provided by console/layout.tsx.
   This page is a thin data-fetching orchestrator.
   ═══════════════════════════════════════════════════════ */

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
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-8">
        <h1 className="text-heading text-sm text-text-primary">Console</h1>
        <Button variant="primary" size="md" href="/projects/new">
          New Project
        </Button>
      </header>

      {/* Dashboard Grid */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <ContentGrid columns={{ sm: 1, md: 2, lg: 4 }} className="mb-8">
            <StatCard label="Active Projects" value={stats.projects} />
            <StatCard label="Catalog Items" value={stats.catalogItems} accent />
            <StatCard label="Open Deliverables" value={stats.deliverables} />
            <StatCard label="Notifications Sent" value={stats.notifications} />
          </ContentGrid>

          {/* Quick Actions */}
          <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="1.5rem" className="mb-8">
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
          </ContentGrid>

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
      <Button variant="secondary" size="sm" href={href} className="w-full">
        {cta}
      </Button>
    </div>
  );
}
