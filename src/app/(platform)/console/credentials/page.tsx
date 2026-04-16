import { createClient } from '@/lib/supabase/server';
export const metadata = { title: 'Credentials -- GVTEWAY' };

export default async function CredentialManagerPage() {
  const supabase = await createClient();
  const { count: typesCount } = await supabase.from('credential_types').select('*', { count: 'exact', head: true });
  const { count: zonesCount } = await supabase.from('credential_zones').select('*', { count: 'exact', head: true });
  const { count: ordersCount } = await supabase.from('credential_orders').select('*', { count: 'exact', head: true });
  const { data: orders } = await supabase.from('credential_orders').select(`*, credential_types (name, color)`).order('created_at', { ascending: false }).limit(50);

  const pendingOrders = (orders ?? []).filter((o) => o.status === 'requested');
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };
  const statCard = { ...card, padding: '1rem', textAlign: 'center' as const };
  const statusColors: Record<string, { bg: string; fg: string }> = {
    requested: { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6' }, approved: { bg: 'rgba(34,197,94,0.12)', fg: '#22C55E' },
    denied: { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444' }, issued: { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' },
    picked_up: { bg: 'rgba(0,229,255,0.1)', fg: '#00E5FF' }, revoked: { bg: 'rgba(156,163,175,0.12)', fg: '#9CA3AF' },
  };
  const credTypes = ['Executive', 'Production', 'Management', 'Crew', 'Staff', 'Talent', 'VIP', 'Vendor', 'Sponsor', 'Press', 'Guest', 'Attendee'];
  const zones = ['Backstage', 'FOH', 'BOH', 'VIP Lounge', 'Media Pit', 'All Access'];
  const matrixDefaults: Record<string, string[]> = { Artist: ['Backstage', 'FOH', 'VIP Lounge'], Crew: ['Backstage', 'BOH'], Staff: ['Backstage', 'FOH', 'BOH', 'VIP Lounge', 'All Access'], VIP: ['FOH', 'VIP Lounge'], Media: ['FOH', 'Media Pit'] };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>Credential Manager</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{typesCount ?? 0} types · {zonesCount ?? 0} zones · {ordersCount ?? 0} orders</p>
        </div>
      </header>
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
            {[{ l: 'Credential Types', v: typesCount ?? 0 }, { l: 'Zones Defined', v: zonesCount ?? 0 }, { l: 'Pending Approval', v: pendingOrders.length }, { l: 'Total Orders', v: ordersCount ?? 0 }].map((s) => (
              <div key={s.l} style={statCard}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-cyan)' }}>{s.v}</div><div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{s.l}</div></div>
            ))}
          </div>
          {/* Types */}
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: 3, height: 24, background: 'var(--color-cyan)', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Credential Types</h2></div>
              <button style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add Type</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {credTypes.map((t) => (
                <div key={t} style={{ ...card, padding: '0.75rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00E5FF' }} /><span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{t}</span></div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>0 issued</span>
                </div>
              ))}
            </div>
          </section>
          {/* Zone Matrix */}
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: 3, height: 24, background: 'var(--color-cyan)', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Zone Access Matrix</h2></div>
              <button style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Add Zone</button>
            </div>
            <div style={{ ...card, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}><th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-tertiary)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Type / Zone</th>{zones.map((z) => <th key={z} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{z}</th>)}</tr></thead>
                <tbody>{credTypes.slice(0, 6).map((t) => <tr key={t} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}><td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-primary)' }}>{t}</td>{zones.map((z) => <td key={z} style={{ textAlign: 'center', padding: '0.5rem' }}><input type="checkbox" defaultChecked={(matrixDefaults[t] || []).includes(z)} style={{ accentColor: '#00E5FF' }} /></td>)}</tr>)}</tbody>
              </table>
            </div>
          </section>
          {/* Orders */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: 3, height: 24, background: 'var(--color-cyan)', borderRadius: 4 }} /><h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Credential Orders</h2></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Bulk Approve</button>
                <button style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Generate Badges</button>
              </div>
            </div>
            {(orders?.length ?? 0) === 0 ? (
              <div style={{ ...card, padding: '3rem', textAlign: 'center' }}><p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>No credential orders yet</p></div>
            ) : (
              <div style={{ ...card, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['', 'Type', 'Group / Person', 'Qty', 'Status', 'Requested', ''].map((h) => <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-tertiary)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                  <tbody>{orders?.map((o) => { const ct = o.credential_types as { name: string; color: string } | null; const sc = statusColors[o.status] || { bg: 'transparent', fg: '#9CA3AF' }; return (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '0.5rem 1rem' }}><input type="checkbox" style={{ accentColor: '#00E5FF' }} /></td>
                      <td style={{ padding: '0.5rem 1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: ct?.color || '#00E5FF' }} /><span style={{ color: 'var(--color-text-primary)' }}>{ct?.name || '?'}</span></div></td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>{o.group_name || o.user_id?.slice(0, 8) || '-'}</td>
                      <td style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{o.quantity}</td>
                      <td style={{ padding: '0.5rem 1rem' }}><span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: sc.bg, color: sc.fg, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{o.status}</span></td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-tertiary)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{o.status === 'requested' && <div style={{ display: 'flex', gap: '0.25rem' }}><button style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button><button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button></div>}</td>
                    </tr>); })}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
