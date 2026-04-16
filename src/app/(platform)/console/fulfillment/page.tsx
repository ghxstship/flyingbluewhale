import { createClient } from '@/lib/supabase/server';
export const metadata = { title: 'Fulfillment -- GVTEWAY' };

export default async function FulfillmentPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any).from('fulfillment_orders').select(`*`).order('created_at', { ascending: false }).limit(50) as { data: Array<{ id: string; status: string; reference_number: string | null; type: string; destination: string | null; total_items: number }> | null };

  const columns = [
    { key: 'pending', label: 'Pending', fg: '#9CA3AF' }, { key: 'packing', label: 'Packing', fg: '#3B82F6' },
    { key: 'packed', label: 'Packed', fg: '#A855F7' }, { key: 'in_transit', label: 'In Transit', fg: '#6366F1' },
    { key: 'delivered', label: 'Delivered', fg: '#22C55E' }, { key: 'completed', label: 'Completed', fg: '#00E5FF' },
  ];
  const grouped = columns.map((c) => ({ ...c, orders: (orders ?? []).filter((o) => o.status === c.key) }));
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>Fulfillment</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{orders?.length ?? 0} orders · Pick → Pack → Ship → Deliver</p>
          </div>
          <button style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>New Fulfillment Order</button>
        </div>
      </header>
      <div style={{ padding: '2rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '1rem', minWidth: 1200 }}>
          {grouped.map((col) => (
            <div key={col.key} style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.fg }} />
                <span style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>{col.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>{col.orders.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {col.orders.length === 0 ? (
                  <div style={{ ...card, padding: '1rem', textAlign: 'center', borderStyle: 'dashed' }}><p style={{ color: 'var(--color-text-disabled)', fontSize: '0.75rem' }}>Empty</p></div>
                ) : col.orders.map((order) => {
                  return (
                    <div key={order.id} style={{ ...card, padding: '0.75rem', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-cyan)' }}>{order.reference_number || order.id.slice(0, 8)}</span>
                        <span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>{order.type}</span>
                      </div>
                      {order.destination && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.destination}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>
                        <span>{order.total_items} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
