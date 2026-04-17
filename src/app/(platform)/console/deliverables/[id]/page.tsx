import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DetailPanel } from '@/components/modules/DetailPanel';
import { SectionHeading } from '@/components/data/SectionHeading';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EmptyState } from '@/components/data/EmptyState';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: 'Deliverable Review -- GVTEWAY' };
}

export default async function DeliverableReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select(`*, projects (name, slug), acts (name, artist_name), deliverable_comments (id, body, created_at, user_id), deliverable_history (id, version, data, changed_at, changed_by)`)
    .eq('id', id)
    .single();

  if (!deliverable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <EmptyState title="Deliverable not found" />
      </div>
    );
  }

  const project = deliverable.projects as { name: string; slug: string } | null;
  const act = deliverable.acts as { name: string; artist_name: string } | null;
  const comments = (deliverable.deliverable_comments ?? []) as { id: string; body: string; created_at: string; user_id: string }[];
  const history = (deliverable.deliverable_history ?? []) as { id: string; version: number; data: Record<string, unknown>; changed_at: string }[];
  const data = deliverable.data as Record<string, unknown>;
  const canReview = deliverable.status === 'submitted' || deliverable.status === 'in_review';

  return (
    <>
      <ModuleHeader
        title={deliverable.title || deliverable.type.replace(/_/g, ' ')}
        subtitle={`${project?.name} ${act ? `· ${act.artist_name}` : ''} · v${deliverable.version}`}
        backHref="/console/deliverables"
        backLabel="All Deliverables"
        maxWidth="64rem"
      >
        <StatusBadge status={deliverable.status} className="mr-2" />
        {canReview && (
          <>
             <form action={`/api/v1/deliverables/${id}/approve`} method="POST">
               <Button type="submit" variant="primary" size="sm">Approve</Button>
             </form>
             <Button variant="danger" size="sm">Reject</Button>
             <Button variant="secondary" size="sm" className="border-warning text-warning hover:bg-warning hover:text-[#000]">
               Request Revision
             </Button>
          </>
        )}
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '64rem' }}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
          
          <div className="flex flex-col gap-6">
            <section className="card p-6">
              <SectionHeading>Submission Data</SectionHeading>
              <div className="bg-surface-raised rounded-lg p-4 max-h-[400px] overflow-auto">
                <pre className="font-mono text-xs text-text-secondary whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </section>

            <section className="card p-6">
              <SectionHeading>Comments ({comments.length})</SectionHeading>
              {comments.length === 0 ? (
                <p className="text-text-disabled text-xs">No comments yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((c) => (
                    <div key={c.id} className="bg-surface-raised rounded-lg p-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[0.625rem] text-text-tertiary tracking-wider uppercase">
                          {c.user_id.slice(0, 8)}
                        </span>
                        <span className="font-mono text-[0.5625rem] text-text-disabled">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[0.8125rem] text-text-secondary">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <DetailPanel 
              title="Details"
              fields={[
                { label: 'Type', value: deliverable.type.replace(/_/g, ' ') },
                { label: 'Version', value: `v${deliverable.version}` },
                { label: 'Deadline', value: deliverable.deadline ? new Date(deliverable.deadline).toLocaleDateString() : '—' },
                { label: 'Updated', value: new Date(deliverable.updated_at).toLocaleDateString() },
              ]}
            />

            <div className="detail-card">
              <h3 className="text-[0.625rem] tracking-wider uppercase text-text-tertiary mb-3">
                Version History ({history.length})
              </h3>
              {history.length === 0 ? (
                <p className="text-text-disabled text-xs">No history</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.sort((a, b) => b.version - a.version).map((h) => (
                    <div key={h.id} className="flex justify-between py-1 border-b border-border-subtle last:border-0">
                      <span className="font-mono text-xs text-cyan">v{h.version}</span>
                      <span className="font-mono text-[0.5625rem] text-text-disabled">
                        {new Date(h.changed_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
