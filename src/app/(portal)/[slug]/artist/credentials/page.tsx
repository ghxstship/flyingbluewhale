import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `Credentials -- ${slug} -- GVTEWAY` }; }

export default async function ArtistCredentialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = user ? await supabase.from('credential_orders').select(`*, credential_types (name, color)`).eq('user_id', user.id).order('created_at', { ascending: false }) : { data: null };
  const sc: Record<string, { bg: string; fg: string }> = { requested: { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6' }, approved: { bg: 'rgba(34,197,94,0.12)', fg: '#22C55E' }, denied: { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444' }, issued: { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' }, picked_up: { bg: 'rgba(0,229,255,0.1)', fg: '#00E5FF' }, revoked: { bg: 'rgba(156,163,175,0.12)', fg: '#9CA3AF' } };
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <Link href={`/${slug}/artist`} style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none' }}>&larr; Artist Portal</Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>Credentials</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Request and track your event credentials</p>
        </div>
      </header>
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <section style={{ ...card, padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Request Credential</h2>
            <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div><label style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '0.5rem' }}>Type</label><select style={{ width: '100%', padding: '0.5rem', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', color: 'var(--color-text-primary)', fontSize: '0.8125rem' }}><option>Artist</option><option>Crew</option><option>VIP</option></select></div>
              <div><label style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: '0.5rem' }}>Quantity</label><input type="number" defaultValue={1} min={1} style={{ width: '100%', padding: '0.5rem', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', color: 'var(--color-text-primary)', fontSize: '0.8125rem' }} /></div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}><button style={{ width: '100%', background: 'var(--color-cyan)', color: '#000', padding: '0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Request</button></div>
            </form>
          </section>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><div style={{ width: 3, height: 24, background: 'var(--color-cyan)', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>My Credentials</h2></div>
            {(orders?.length ?? 0) === 0 ? <div style={{ ...card, padding: '3rem', textAlign: 'center' }}><p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>No credentials yet</p></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders?.map((o) => { const ct = o.credential_types as { name: string; color: string } | null; const s = sc[o.status] || { bg: 'transparent', fg: '#9CA3AF' }; return (
                  <div key={o.id} style={{ ...card, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '0.875rem', background: (ct?.color || '#00E5FF') + '20', color: ct?.color || '#00E5FF' }}>{ct?.name?.[0] || '?'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{ct?.name || 'Credential'}</span><span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: s.bg, color: s.fg, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{o.status.replace(/_/g, ' ')}</span></div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Qty: {o.quantity} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    {o.status === 'issued' && <button style={{ background: 'transparent', color: 'var(--color-cyan)', padding: '0.25rem 0.75rem', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>Download Badge</button>}
                  </div>
                ); })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
