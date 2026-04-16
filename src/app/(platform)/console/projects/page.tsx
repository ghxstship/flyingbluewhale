import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
      deliverables (id, status)
    `)
    .order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    draft: 'text-draft border-draft/30 bg-draft/10',
    active: 'text-approved border-approved/30 bg-approved/10',
    completed: 'text-info border-info/30 bg-info/10',
    archived: 'text-text-disabled border-border bg-surface-raised',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Projects</h1>
            <p className="text-sm text-text-secondary mt-1">{projects?.length ?? 0} projects</p>
          </div>
          <Link href="/projects/new" className="btn btn-primary text-xs py-2 px-4">New Project</Link>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {(projects?.length ?? 0) === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-text-tertiary text-sm mb-4">No projects yet</p>
              <Link href="/projects/new" className="btn btn-primary text-xs py-2 px-6">Create First Project</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map((project) => {
                const venue = project.venue as { name?: string; city?: string } | null;
                const deliverables = (project.deliverables ?? []) as { status: string }[];
                const approved = deliverables.filter((d) => d.status === 'approved').length;

                return (
                  <Link key={project.id} href={`/${project.slug}/artist`} className="card p-6 flex flex-col group">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`badge border ${statusColors[project.status] ?? statusColors.draft}`}>{project.status}</span>
                      <span className="badge border text-cyan border-cyan/20 bg-cyan-subtle">{project.type.replace(/_/g, ' ')}</span>
                    </div>
                    <h3 className="text-heading text-sm text-text-primary group-hover:text-cyan transition-colors mb-1">{project.name}</h3>
                    {venue?.name && <p className="text-xs text-text-tertiary">{venue.name} &middot; {venue.city}</p>}
                    {project.start_date && (
                      <p className="text-mono text-xs text-text-disabled mt-1">{project.start_date} — {project.end_date}</p>
                    )}
                    <div className="flex items-center gap-4 mt-auto pt-4 text-xs text-text-tertiary">
                      <span>{(project.spaces as unknown[])?.length ?? 0} spaces</span>
                      <span>{(project.acts as unknown[])?.length ?? 0} acts</span>
                      <span>{approved}/{deliverables.length} approved</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
