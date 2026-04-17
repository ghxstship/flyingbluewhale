import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LOCATION_TYPES, LOCATION_TYPE_LABELS, LOCATION_TYPE_ICONS, type LocationType } from '@/lib/supabase/types';

export const metadata = { title: 'New Location — GVTEWAY' };

export default async function NewLocationPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase.from('locations').select('id, name, type, parent_id').eq('is_active', true).order('name');
  const { data: projects } = await supabase.from('projects').select('id, name, slug').order('name');

  const card: React.CSSProperties = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-text-primary)',
    fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: '0.375rem' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <Link href="/console/locations" style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-block', marginBottom: '0.5rem' }}>← Locations</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>New Location</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Add a venue, warehouse, stage, room, or any physical location.</p>
        </div>
      </header>

      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <form action="/api/v1/locations" method="POST">
            {/* Basic Info */}
            <section style={{ ...card, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Basic Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Name *</label>
                  <input name="name" required placeholder="e.g., Factory Town, Warehouse A, Main Stage" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type *</label>
                  <select name="type" required style={{ ...inputStyle, cursor: 'pointer' }}>
                    {LOCATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LOCATION_TYPE_ICONS[t]} {LOCATION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Parent Location</label>
                  <select name="parent_id" style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">— None (top-level) —</option>
                    {(locations ?? []).filter((l) => !l.parent_id).map((l) => {
                      const icon = LOCATION_TYPE_ICONS[l.type as LocationType] || '📌';
                      return <option key={l.id} value={l.id}>{icon} {l.name}</option>;
                    })}
                  </select>
                </div>
              </div>
            </section>

            {/* Address */}
            <section style={{ ...card, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Address</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Street</label>
                  <input name="address_street" placeholder="4800 NW 37th Ave" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div><label style={labelStyle}>City</label><input name="address_city" placeholder="Miami" style={inputStyle} /></div>
                  <div><label style={labelStyle}>State</label><input name="address_state" placeholder="FL" style={inputStyle} /></div>
                  <div><label style={labelStyle}>ZIP</label><input name="address_zip" placeholder="33142" style={inputStyle} /></div>
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <input name="address_country" placeholder="US" defaultValue="US" style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Capacity + Contact */}
            <section style={{ ...card, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Capacity &amp; Contact</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Total Capacity</label>
                  <input name="capacity_total" type="number" placeholder="5000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Seated Capacity</label>
                  <input name="capacity_seated" type="number" placeholder="3000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Name</label>
                  <input name="contact_name" placeholder="John Doe" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input name="contact_phone" placeholder="+1 (555) 123-4567" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Contact Email</label>
                  <input name="contact_email" type="email" placeholder="contact@venue.com" style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Project Binding */}
            <section style={{ ...card, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Project Binding</h2>
              <div>
                <label style={labelStyle}>Linked Project (optional)</label>
                <select name="project_id" style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Org-wide (no project) —</option>
                  {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <p style={{ fontSize: '0.625rem', color: 'var(--color-text-disabled)', marginTop: '0.375rem' }}>Leave blank for org-wide locations (warehouses, offices). Select a project for project-specific venues and stages.</p>
              </div>
            </section>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/console/locations" style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', textDecoration: 'none' }}>Cancel</Link>
              <button type="submit" style={{ background: 'var(--color-cyan)', color: '#000', padding: '0.5rem 2rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Create Location</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
