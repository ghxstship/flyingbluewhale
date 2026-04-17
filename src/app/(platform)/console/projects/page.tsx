import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EmptyState } from '@/components/data/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Projects -- GVTEWAY',
  description: 'Manage all advancing projects.',
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      spaces (id),
      acts (id),
      deliverables (id, status),
      locations!projects_venue_id_fkey (name, address)
    `)
    .order('created_at', { ascending: false });

  return (
    <>
      <ModuleHeader
        title="Projects"
        subtitle={`${projects?.length ?? 0} projects`}
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm" href="/projects/new">
          New Project
        </Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {(projects?.length ?? 0) === 0 ? (
          <EmptyState 
            title="No projects yet" 
            actionLabel="Create First Project"
            actionHref="/projects/new"
          />
        ) : (
          <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }}>
            {projects?.map((project) => {
              const loc = project.locations as { name: string; address: any } | null;
              const addr = loc?.address as { city?: string } | null;
              const deliverables = (project.deliverables ?? []) as { status: string }[];
              const approved = deliverables.filter((d) => d.status === 'approved').length;

              return (
                <Link key={project.id} href={`/${project.slug}/artist`} className="card p-6 flex flex-col group no-underline transition-colors hover:border-cyan">
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={project.status} />
                    <Badge variant="cyan">{project.type.replace(/_/g, ' ')}</Badge>
                  </div>
                  
                  <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors mb-1">
                    {project.name}
                  </h3>
                  
                  {loc?.name && (
                    <p className="text-xs text-text-tertiary">
                      {loc.name} {addr?.city ? `· ${addr.city}` : ''}
                    </p>
                  )}
                  
                  {project.start_date && (
                    <p className="font-mono text-xs text-text-disabled mt-1">
                      {project.start_date} — {project.end_date}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-auto pt-4 text-xs text-text-tertiary">
                    <span>{(project.spaces as unknown[])?.length ?? 0} spaces</span>
                    <span>{(project.acts as unknown[])?.length ?? 0} acts</span>
                    <span>{approved}/{deliverables.length} approved</span>
                  </div>
                </Link>
              );
            })}
          </ContentGrid>
        )}
      </div>
    </>
  );
}
