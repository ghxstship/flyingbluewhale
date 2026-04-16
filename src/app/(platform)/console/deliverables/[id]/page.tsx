import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[var(--color-text-tertiary)]">Deliverable not found</p></div>;
  }

  const statusBg: Record<string, string> = {
    draft: 'rgba(156,163,175,0.12)', submitted: 'rgba(59,130,246,0.12)', in_review: 'rgba(168,85,247,0.12)',
    approved: 'rgba(34,197,94,0.12)', rejected: 'rgba(239,68,68,0.12)', revision_requested: 'rgba(234,179,8,0.12)',
  };
  const statusColor: Record<string, string> = {
    draft: '#9CA3AF', submitted: '#3B82F6', in_review: '#A855F7',
    approved: '#22C55E', rejected: '#EF4444', revision_requested: '#EAB308',
  };

  const project = deliverable.projects as { name: string; slug: string } | null;
  const act = deliverable.acts as { name: string; artist_name: string } | null;
  const comments = (deliverable.deliverable_comments ?? []) as { id: string; body: string; created_at: string; user_id: string }[];
  const history = (deliverable.deliverable_history ?? []) as { id: string; version: number; data: Record<string, unknown>; changed_at: string }[];
  const data = deliverable.data as Record<string, unknown>;
  const canReview = deliverable.status === 'submitted' || deliverable.status === 'in_review';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <Link href="/console/deliverables" style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>&larr; All Deliverables</Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>{deliverable.title || deliverable.type.replace(/_/g, ' ')}</h1>
                <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: statusBg[deliverable.status], color: statusColor[deliverable.status], letterSpacing: '0.1em', textTransform: 'uppercase' }}>{deliverable.status.replace(/_/g, ' ')}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{project?.name} {act ? `· ${act.artist_name}` : ''} · v{deliverable.version}</p>
            </div>
            {canReview && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <form action={`/api/v1/deliverables/${id}/approve`} method="POST">
                  <button type="submit" style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Approve</button>
                </form>
                <button style={{ background: 'transparent', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>Reject</button>
                <button style={{ background: 'transparent', color: '#EAB308', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid rgba(234,179,8,0.3)', cursor: 'pointer' }}>Request Revision</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ flex: 1, padding: '2rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 3, height: 24, background: 'var(--color-cyan)', borderRadius: 4 }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Submission Data</h2>
              </div>
              <div style={{ background: 'var(--color-surface-raised)', borderRadius: '0.5rem', padding: '1rem', maxHeight: 400, overflow: 'auto' }}>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
              </div>
            </section>

            <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 3, height: 24, background: 'var(--color-cyan)', borderRadius: 4 }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Comments ({comments.length})</h2>
              </div>
              {comments.length === 0 ? <p style={{ color: 'var(--color-text-disabled)', fontSize: '0.75rem' }}>No comments yet</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ background: 'var(--color-surface-raised)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.user_id.slice(0, 8)}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>Details</h3>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                {[
                  ['Type', deliverable.type.replace(/_/g, ' ')],
                  ['Version', `v${deliverable.version}`],
                  ['Deadline', deliverable.deadline ? new Date(deliverable.deadline).toLocaleDateString() : '—'],
                  ['Updated', new Date(deliverable.updated_at).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <dt style={{ color: 'var(--color-text-disabled)' }}>{k}</dt>
                    <dd style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>Version History ({history.length})</h3>
              {history.length === 0 ? <p style={{ color: 'var(--color-text-disabled)', fontSize: '0.75rem' }}>No history</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {history.sort((a, b) => b.version - a.version).map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-cyan)' }}>v{h.version}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>{new Date(h.changed_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
