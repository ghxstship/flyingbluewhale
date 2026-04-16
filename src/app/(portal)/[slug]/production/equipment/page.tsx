import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `Equipment -- ${slug} -- GVTEWAY` }; }

export default async function ProductionEquipmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: allocations } = await supabase.from('catalog_item_allocations').select(`*, advance_items (name, manufacturer, model, unit), spaces (name)`).order('created_at', { ascending: false }).limit(100);
  const states = ['reserved', 'confirmed', 'in_transit', 'on_site', 'checked_out', 'returned', 'maintenance'];
  const stateColors: Record<string, { bg: string; fg: string }> = { reserved: { bg: 'rgba(156,163,175,0.12)', fg: '#9CA3AF' }, confirmed: { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6' }, in_transit: { bg: 'rgba(168,85,247,0.12)', fg: '#A855F7' }, on_site: { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' }, checked_out: { bg: 'rgba(234,179,8,0.12)', fg: '#EAB308' }, returned: { bg: 'rgba(34,197,94,0.12)', fg: '#22C55E' }, maintenance: { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444' } };
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <Link href={`/${slug}/production`} style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none' }}>&larr; Production Portal</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-text-primary)' }}>Equipment</h1><p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Allocation tracking & fulfillment status</p></div>
            <Link href={`/${slug}/production/vendor-submissions/equipment-pull-list`} style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>Add from Catalog</Link>
          </div>
        </div>
      </header>
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
            {states.map((s) => { const count = (allocations ?? []).filter((a) => a.state === s).length; return <div key={s} style={{ ...card, padding: '0.75rem', textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>{count}</div><div style={{ fontSize: '0.5rem', color: count > 0 ? 'var(--color-cyan)' : 'var(--color-text-disabled)' }}>{s.replace(/_/g, ' ')}</div></div>; })}
          </div>
          {(allocations?.length ?? 0) === 0 ? (
            <div style={{ ...card, padding: '4rem', textAlign: 'center' }}><p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>No equipment allocated yet</p><Link href={`/${slug}/production/vendor-submissions/equipment-pull-list`} style={{ color: 'var(--color-cyan)', fontSize: '0.75rem' }}>Open Equipment Pull List →</Link></div>
          ) : (
            <div style={{ ...card, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Item', 'Space', 'Qty', 'State', 'Updated', ''].map((h) => <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-tertiary)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>{allocations?.map((a) => { const it = a.advance_items as { name: string; manufacturer: string | null; model: string | null; unit: string } | null; const sp = a.spaces as { name: string } | null; const sc2 = stateColors[a.state] || { bg: 'transparent', fg: '#9CA3AF' }; return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '0.5rem 1rem' }}><div style={{ color: 'var(--color-text-primary)' }}>{it?.name}</div><div style={{ fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>{it?.manufacturer} {it?.model}</div></td>
                    <td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-tertiary)' }}>{sp?.name || '-'}</td>
                    <td style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{a.quantity} {it?.unit}</td>
                    <td style={{ padding: '0.5rem 1rem' }}><span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: sc2.bg, color: sc2.fg, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{a.state.replace(/_/g, ' ')}</span></td>
                    <td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-tertiary)' }}>{new Date(a.updated_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem 1rem' }}>{a.state === 'reserved' && <button style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.625rem', cursor: 'pointer' }}>Confirm</button>}{a.state === 'on_site' && <button style={{ background: 'none', border: 'none', color: '#EAB308', fontSize: '0.625rem', cursor: 'pointer' }}>Checkout</button>}{a.state === 'checked_out' && <button style={{ background: 'none', border: 'none', color: '#22C55E', fontSize: '0.625rem', cursor: 'pointer' }}>Return</button>}</td>
                  </tr>); })}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
