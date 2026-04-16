import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Approval Queue -- GVTEWAY' };

export default async function ApprovalQueuePage() {
  const supabase = await createClient();
  const { data: pending } = await supabase.from('deliverables').select(`*, projects (name, slug), acts (name, artist_name)`).in('status', ['submitted', 'in_review']).order('deadline', { ascending: true, nullsFirst: false }).order('updated_at', { ascending: false });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/console/deliverables" style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>&larr; All Deliverables</Link>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>Approval Queue</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{pending?.length ?? 0} awaiting review</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Bulk Approve</button>
            <button style={{ background: 'transparent', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>Bulk Reject</button>
          </div>
        </div>
      </header>
      <div style={{ flex: 1, padding: '2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          {(pending?.length ?? 0) === 0 ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '4rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#22C55E' }}>✓</p>
              <p style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>Queue Empty</p>
              <p style={{ color: 'var(--color-text-disabled)', fontSize: '0.75rem' }}>All deliverables reviewed</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pending?.map((d) => {
                const project = d.projects as { name: string; slug: string } | null;
                const act = d.acts as { name: string; artist_name: string } | null;
                const isUrgent = d.deadline && new Date(d.deadline).getTime() - Date.now() < 86400000 * 3;
                return (
                  <Link key={d.id} href={`/console/deliverables/${d.id}`} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                    <input type="checkbox" style={{ accentColor: '#00E5FF', flexShrink: 0 }} onClick={(e) => e.stopPropagation()} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{d.title || d.type.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: 'rgba(59,130,246,0.12)', color: '#3B82F6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{d.status}</span>
                        {isUrgent && <span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.12)', color: '#EF4444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Urgent</span>}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{project?.name} {act ? `· ${act.artist_name}` : ''} · v{d.version}</p>
                    </div>
                    {d.deadline && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isUrgent ? '#EF4444' : 'var(--color-text-tertiary)' }}>{new Date(d.deadline).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>deadline</div>
                      </div>
                    )}
                    <span style={{ color: 'var(--color-text-disabled)', fontSize: '1rem' }}>&rarr;</span>
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
