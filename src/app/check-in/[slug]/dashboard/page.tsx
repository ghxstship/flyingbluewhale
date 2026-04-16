import Link from 'next/link';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `Command Center -- ${slug} -- GVTEWAY` }; }

export default async function CommandCenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Link href={`/check-in/${slug}`} style={{ color: 'var(--color-cyan)', fontSize: '0.875rem', textDecoration: 'none' }}>&larr;</Link><span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Command Center</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--color-text-tertiary)' }}>LIVE</span></div>
      </header>
      <div style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            {[{ l: 'Credentials Issued', i: '🎫' }, { l: 'Meals Served', i: '🍽' }, { l: 'Equipment Out', i: '📦' }, { l: 'Active Check-Ins', i: '📍' }].map((s) => (
              <div key={s.l} style={{ ...card, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ fontSize: '1rem' }}>{s.i}</span><span style={{ fontSize: '0.625rem', color: 'var(--color-text-disabled)' }}>0/0</span></div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-cyan)' }}>0</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-tertiary)' }}>{s.l}</div>
                <div style={{ width: '100%', background: 'var(--color-surface-raised)', borderRadius: 4, height: 4, marginTop: '0.5rem' }}><div style={{ width: '0%', background: '#00E5FF', borderRadius: 4, height: 4 }} /></div>
              </div>
            ))}
          </div>
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}><div style={{ width: 3, height: 20, background: 'var(--color-cyan)', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Zone Headcount</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {['Backstage', 'FOH', 'BOH', 'VIP Lounge', 'Media Pit', 'All Access'].map((z) => <div key={z} style={{ ...card, padding: '0.75rem', textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>0</div><div style={{ fontSize: '0.5rem', color: 'var(--color-text-tertiary)' }}>{z}</div></div>)}
            </div>
          </section>
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}><div style={{ width: 3, height: 20, background: 'var(--color-cyan)', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Recent Activity</h2></div>
            <div style={{ ...card, padding: '1.5rem', textAlign: 'center' }}><p style={{ color: 'var(--color-text-disabled)', fontSize: '0.75rem' }}>Activity will appear here in real-time as check-ins occur</p></div>
          </section>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}><div style={{ width: 3, height: 20, background: '#EF4444', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Alerts</h2></div>
            <div style={{ ...card, padding: '1rem', borderColor: 'rgba(34,197,94,0.2)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} /><span style={{ fontSize: '0.75rem', color: '#22C55E' }}>No active alerts</span></div></div>
          </section>
        </div>
      </div>
    </div>
  );
}
