import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Deliverables -- GVTEWAY',
  description: 'Track all deliverables across projects.',
};

export default async function DeliverablesPage() {
  const supabase = await createClient();

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select(`
      *,
      projects (name, slug),
      acts (name, artist_name)
    `)
    .order('updated_at', { ascending: false })
    .limit(100);

  const statusColors: Record<string, string> = {
    draft: 'text-draft border-draft/30 bg-draft/10',
    submitted: 'text-submitted border-submitted/30 bg-submitted/10',
    in_review: 'text-in-review border-in-review/30 bg-in-review/10',
    approved: 'text-approved border-approved/30 bg-approved/10',
    rejected: 'text-rejected border-rejected/30 bg-rejected/10',
    revision_requested: 'text-warning border-warning/30 bg-warning/10',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Deliverables</h1>
            <p className="text-sm text-text-secondary mt-1">{deliverables?.length ?? 0} deliverables across all projects</p>
          </div>
          <div className="flex gap-2">
            <select className="input text-xs py-1.5">
              <option>All Types</option>
              <option>Technical Rider</option>
              <option>Hospitality Rider</option>
              <option>Input List</option>
              <option>Stage Plot</option>
              <option>Crew List</option>
              <option>Guest List</option>
              <option>Equipment Pull List</option>
              <option>Power Plan</option>
              <option>Rigging Plan</option>
              <option>Site Plan</option>
              <option>Build Schedule</option>
              <option>Vendor Package</option>
              <option>Safety Compliance</option>
              <option>Comms Plan</option>
              <option>Signage Grid</option>
            </select>
            <select className="input text-xs py-1.5">
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Submitted</option>
              <option>In Review</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {(deliverables?.length ?? 0) === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-text-tertiary text-sm mb-2">No deliverables yet</p>
              <p className="text-text-disabled text-xs">Deliverables appear here as talent and vendors submit through their portals</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Project</th>
                  <th>Artist / Act</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Updated</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {deliverables?.map((d) => {
                  const project = d.projects as { name: string; slug: string } | null;
                  const act = d.acts as { name: string; artist_name: string } | null;

                  return (
                    <tr key={d.id}>
                      <td><span className="badge border text-cyan border-cyan/20 bg-cyan-subtle">{d.type.replace(/_/g, ' ')}</span></td>
                      <td className="text-text-primary">{project?.name || '-'}</td>
                      <td className="text-text-secondary">{act?.artist_name || act?.name || '-'}</td>
                      <td><span className={`badge border ${statusColors[d.status] ?? ''}`}>{d.status.replace(/_/g, ' ')}</span></td>
                      <td className="text-mono text-text-tertiary text-xs">v{d.version}</td>
                      <td className="text-text-tertiary text-xs">{new Date(d.updated_at).toLocaleDateString()}</td>
                      <td><button className="btn btn-ghost text-xs py-1 px-3">Review</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
