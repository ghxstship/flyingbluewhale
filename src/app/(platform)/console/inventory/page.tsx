import { createClient } from '@/lib/supabase/server';
export const metadata = { title: 'Inventory -- GVTEWAY' };

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: inventory } = await supabase.from('catalog_item_inventory').select(`*, advance_items (id, name, manufacturer, model, sku, unit, daily_rate, advance_subcategories (name, advance_categories (name, advance_category_groups (name))))`).order('updated_at', { ascending: false });

  const totalOwned = (inventory ?? []).reduce((s, i) => s + i.quantity_owned, 0);
  const totalAvailable = (inventory ?? []).reduce((s, i) => s + i.quantity_available, 0);
  const lowStockItems = (inventory ?? []).filter((i) => i.quantity_available <= Math.ceil(i.quantity_owned * 0.1));
  const card = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>Inventory</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{inventory?.length ?? 0} tracked items</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Import CSV</button>
            <button style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Export</button>
          </div>
        </div>
      </header>
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[{ l: 'Total Owned', v: totalOwned, c: 'var(--color-text-primary)' }, { l: 'Available', v: totalAvailable, c: '#22C55E' }, { l: 'Allocated', v: totalOwned - totalAvailable, c: 'var(--color-cyan)' }, { l: 'Low Stock', v: lowStockItems.length, c: lowStockItems.length > 0 ? '#EF4444' : '#22C55E' }].map((s) => (
              <div key={s.l} style={{ ...card, padding: '1rem', textAlign: 'center' }}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: s.c }}>{s.v}</div><div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{s.l}</div></div>
            ))}
          </div>
          {lowStockItems.length > 0 && (
            <div style={{ ...card, padding: '1rem', marginBottom: '1.5rem', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
              <div style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EF4444', marginBottom: '0.5rem' }}>Low Stock Alerts</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {lowStockItems.slice(0, 10).map((item) => {
                  const ai = item.advance_items as { name: string } | null;
                  return <span key={item.id} style={{ fontSize: '0.5625rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>{ai?.name} ({item.quantity_available}/{item.quantity_owned})</span>;
                })}
              </div>
            </div>
          )}
          {(inventory?.length ?? 0) === 0 ? (
            <div style={{ ...card, padding: '4rem', textAlign: 'center' }}><p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>No inventory data</p></div>
          ) : (
            <div style={{ ...card, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Item', 'Category', 'SKU', 'Owned', 'Available', 'Allocated', 'Utilization', 'Warehouse', 'Rate'].map((h) => <th key={h} style={{ padding: '0.75rem 1rem', textAlign: h === 'Owned' || h === 'Available' || h === 'Allocated' ? 'right' : 'left', color: 'var(--color-text-tertiary)', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>{inventory?.map((inv) => {
                  type InvItem = { name: string; manufacturer: string | null; model: string | null; sku: string | null; unit: string; daily_rate: number | null; advance_subcategories: { name: string; advance_categories: { name: string; advance_category_groups: { name: string } } } };
                  const it = inv.advance_items as InvItem | null;
                  const u = inv.quantity_owned > 0 ? Math.round(((inv.quantity_owned - inv.quantity_available) / inv.quantity_owned) * 100) : 0;
                  const isLow = inv.quantity_available <= Math.ceil(inv.quantity_owned * 0.1);
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: isLow ? 'rgba(239,68,68,0.04)' : undefined }}>
                      <td style={{ padding: '0.5rem 1rem' }}><div style={{ color: 'var(--color-text-primary)' }}>{it?.name}</div><div style={{ fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>{it?.manufacturer} {it?.model}</div></td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-tertiary)' }}>{it?.advance_subcategories?.advance_categories?.advance_category_groups?.name}</td>
                      <td style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{it?.sku || '-'}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{inv.quantity_owned}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: isLow ? '#EF4444' : '#22C55E' }}>{inv.quantity_available}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>{inv.quantity_owned - inv.quantity_available}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 64, background: 'var(--color-surface-raised)', borderRadius: 4, height: 6 }}><div style={{ width: `${u}%`, borderRadius: 4, height: 6, background: u > 90 ? '#EF4444' : u > 70 ? '#EAB308' : '#00E5FF' }} /></div>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{u}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--color-text-tertiary)' }}>{inv.warehouse_location || '-'}</td>
                      <td style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>{it?.daily_rate ? `$${it.daily_rate}/d` : '-'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
