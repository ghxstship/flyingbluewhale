import Link from 'next/link';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `Catering -- ${slug} -- GVTEWAY` }; }

export default async function ArtistCateringPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const opts = [{ id: 'vegan', l: 'Vegan' }, { id: 'vegetarian', l: 'Vegetarian' }, { id: 'gluten_free', l: 'Gluten Free' }, { id: 'halal', l: 'Halal' }, { id: 'kosher', l: 'Kosher' }, { id: 'dairy_free', l: 'Dairy Free' }, { id: 'nut_free', l: 'Nut Free' }];
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <Link href={`/${slug}/artist`} style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none' }}>&larr; Artist Portal</Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>Catering Preferences</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Set dietary requirements for your team</p>
        </div>
      </header>
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section style={{ ...card, padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Dietary Requirements</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {opts.map((o) => <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-surface-raised)', borderRadius: '0.5rem', padding: '0.75rem', cursor: 'pointer' }}><input type="checkbox" name={o.id} style={{ accentColor: '#00E5FF' }} /><span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{o.l}</span></label>)}
              </div>
            </section>
            <section style={{ ...card, padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Allergies & Notes</h2>
              <textarea rows={3} placeholder="List any specific allergies or dietary notes..." style={{ width: '100%', padding: '0.75rem', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', color: 'var(--color-text-primary)', fontSize: '0.8125rem', resize: 'vertical' }} />
            </section>
            <section style={{ ...card, padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>Head Count</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>How many people in your party need meals?</p>
              <input type="number" defaultValue={1} min={1} style={{ width: 96, padding: '0.5rem', textAlign: 'center', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }} />
            </section>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="submit" style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.625rem 1.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Save Preferences</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
