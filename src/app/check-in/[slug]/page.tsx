import Link from 'next/link';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `Check-In -- ${slug} -- GVTEWAY` }; }

export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const modes = [
    { id: 'credentials', label: 'Credentials', desc: 'Scan QR → verify identity → mark picked up', icon: '🎫' },
    { id: 'catering', label: 'Catering', desc: 'Scan or search → verify meal allocation → check in', icon: '🍽' },
    { id: 'equipment', label: 'Equipment', desc: 'Scan barcode → checkout or return → condition report', icon: '📦' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E5FF' }} /><span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', letterSpacing: '0.15em' }}>GVTEWAY</span></div>
        <Link href={`/check-in/${slug}/dashboard`} style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.25rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', textDecoration: 'none' }}>Dashboard</Link>
      </header>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--color-text-primary)', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{slug.replace(/-/g, ' ')}</h1>
        <p style={{ fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '2rem' }}>On-Site Check-In</p>
        <div style={{ width: '100%', maxWidth: 448, marginBottom: '2.5rem' }}>
          <input type="text" placeholder="Scan QR / barcode or search by name..." autoFocus style={{ width: '100%', padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-text-primary)', fontSize: '1rem', outline: 'none' }} />
          <p style={{ textAlign: 'center', fontSize: '0.5625rem', color: 'var(--color-text-disabled)', marginTop: '0.5rem' }}>Focus here and scan — results appear automatically</p>
        </div>
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {modes.map((m) => (
            <button key={m.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <span style={{ fontSize: '1.75rem' }}>{m.icon}</span>
              <div style={{ flex: 1 }}><h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{m.label}</h3><p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>{m.desc}</p></div>
              <span style={{ color: 'var(--color-text-disabled)' }}>&rarr;</span>
            </button>
          ))}
        </div>
        <div style={{ width: '100%', maxWidth: 448, marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[{ l: 'Credentials', s: 'issued' }, { l: 'Catering', s: 'checked in' }, { l: 'Equipment', s: 'checked out' }].map((st) => (
            <div key={st.l} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-cyan)' }}>—</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--color-text-disabled)' }}>{st.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
