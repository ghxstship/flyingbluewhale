import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCATION_TYPE_ICONS, LOCATION_TYPE_LABELS, type LocationType } from '@/lib/supabase/types';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('locations').select('name').eq('id', id).single();
  return { title: `${data?.name || 'Location'} — GVTEWAY` };
}

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: location, error } = await supabase.from('locations').select('*').eq('id', id).single();
  if (error || !location) notFound();

  // Children
  const { data: children } = await supabase.from('locations').select('*').eq('parent_id', id).order('name');
  // Parent
  const { data: parent } = location.parent_id ? await supabase.from('locations').select('id, name, type').eq('id', location.parent_id).single() : { data: null };
  // Linked project
  const { data: project } = location.project_id ? await supabase.from('projects').select('id, name, slug').eq('id', location.project_id).single() : { data: null };
  // Assets at this location
  const { data: assets } = await supabase.from('asset_instances').select('id, asset_tag, status, condition, advance_items(name)').eq('location_id', id).limit(20);
  // Schedule entries
  const { data: scheduleEntries } = await supabase.from('schedule_entries').select('id, title, starts_at, ends_at, category, status, is_cancelled').eq('location_id', id).eq('is_cancelled', false).order('starts_at').limit(10);
  // Audit log
  const { data: auditEntries } = await supabase.from('audit_log').select('id, action, actor_id, created_at, old_state, new_state').eq('entity_type', 'location').eq('entity_id', id).order('created_at', { ascending: false }).limit(10);

  const addr = location.address as Record<string, string> | null;
  const cap = location.capacity as Record<string, number> | null;
  const contact = location.contact as Record<string, string> | null;
  const { data: opHours } = await supabase.from('schedule_entries')
    .select('id, title, rrule')
    .eq('location_id', id)
    .eq('category', 'hours_of_operation')
    .eq('is_cancelled', false);

  const tc = getTypeColor(location.type);
  const icon = LOCATION_TYPE_ICONS[location.type as LocationType] || '📌';
  const label = LOCATION_TYPE_LABELS[location.type as LocationType] || location.type;

  const card: React.CSSProperties = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' };
  const sectionTitle: React.CSSProperties = { fontFamily: 'var(--font-heading)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' };
  const kvLabel: React.CSSProperties = { fontSize: '0.5625rem', color: 'var(--color-text-disabled)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '0.125rem' };
  const kvValue: React.CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-primary)' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/console/locations" style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', textDecoration: 'none' }}>← Locations</Link>
            {parent && (
              <>
                <span style={{ color: 'var(--color-text-disabled)', fontSize: '0.75rem' }}>/</span>
                <Link href={`/console/locations/${parent.id}`} style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', textDecoration: 'none' }}>
                  {LOCATION_TYPE_ICONS[parent.type as LocationType] || '📌'} {parent.name}
                </Link>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '0.5rem', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{icon}</div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>{location.name}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.5rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: tc.bg, color: tc.fg, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
                  {!location.is_active && <span style={{ fontSize: '0.5rem', padding: '0.125rem 0.375rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Inactive</span>}
                  {project && <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-tertiary)' }}>📁 {project.name}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{ background: location.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: location.is_active ? '#EF4444' : '#22C55E', padding: '0.375rem 1rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {location.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Address */}
            {addr && Object.keys(addr).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>📍 Address</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {addr.street && <div style={{ gridColumn: '1 / -1' }}><div style={kvLabel}>Street</div><div style={kvValue}>{addr.street}</div></div>}
                  {addr.city && <div><div style={kvLabel}>City</div><div style={kvValue}>{addr.city}</div></div>}
                  {addr.state && <div><div style={kvLabel}>State</div><div style={kvValue}>{addr.state}</div></div>}
                  {addr.zip && <div><div style={kvLabel}>ZIP</div><div style={kvValue}>{addr.zip}</div></div>}
                  {addr.country && <div><div style={kvLabel}>Country</div><div style={kvValue}>{addr.country}</div></div>}
                </div>
              </section>
            )}

            {/* Capacity */}
            {cap && Object.keys(cap).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>👥 Capacity</h2>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  {Object.entries(cap).map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-cyan)' }}>{v.toLocaleString()}</div>
                      <div style={kvLabel}>{k.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sub-Locations */}
            {(children ?? []).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>🏗️ Sub-Locations <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-text-disabled)' }}>({children!.length})</span></h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {children!.map((child) => {
                    const cc = getTypeColor(child.type);
                    const ci = LOCATION_TYPE_ICONS[child.type as LocationType] || '📌';
                    return (
                      <Link key={child.id} href={`/console/locations/${child.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-subtle)', transition: 'border-color 0.15s' }}>
                        <span style={{ fontSize: '1rem' }}>{ci}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>{child.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.4375rem', padding: '0.0625rem 0.375rem', borderRadius: '9999px', background: cc.bg, color: cc.fg, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                          {LOCATION_TYPE_LABELS[child.type as LocationType] || child.type}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Schedule Entries */}
            {(scheduleEntries ?? []).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>📅 Upcoming Schedule</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {scheduleEntries!.map((se) => (
                    <div key={se.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border-subtle)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>{se.title}</div>
                      <div style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: 'var(--color-text-disabled)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(se.starts_at).toLocaleDateString()} {new Date(se.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Assets */}
            {(assets ?? []).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>📦 Assets at Location <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-text-disabled)' }}>({assets!.length})</span></h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>{['Asset Tag', 'Item', 'Status', 'Condition'].map((h) => <th key={h} style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.5625rem', color: 'var(--color-text-disabled)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                  <tbody>{assets!.map((a) => {
                    const item = a.advance_items as { name: string } | null;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-cyan)' }}>{a.asset_tag}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>{item?.name || '—'}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.625rem', color: 'var(--color-text-secondary)' }}>{a.status}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>{a.condition}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Contact */}
            {contact && Object.keys(contact).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>📞 Contact</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {contact.name && <div><div style={kvLabel}>Name</div><div style={kvValue}>{contact.name}</div></div>}
                  {contact.phone && <div><div style={kvLabel}>Phone</div><div style={kvValue}>{contact.phone}</div></div>}
                  {contact.email && <div><div style={kvLabel}>Email</div><div style={kvValue}>{contact.email}</div></div>}
                </div>
              </section>
            )}

            {/* Operating Hours */}
            {(opHours ?? []).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>🕐 Operating Hours</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {opHours!.map((oh) => (
                    <div key={oh.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{oh.title}</span>
                      {oh.rrule && (
                        <span style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', marginTop: '0.25rem', opacity: 0.8 }}>
                          {oh.rrule.replace('FREQ=', '')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Metadata */}
            <section style={{ ...card, padding: '1.25rem' }}>
              <h2 style={sectionTitle}>ℹ️ Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><div style={kvLabel}>Slug</div><div style={{ ...kvValue, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>{location.slug}</div></div>
                <div><div style={kvLabel}>Created</div><div style={{ ...kvValue, fontSize: '0.6875rem' }}>{new Date(location.created_at).toLocaleDateString()}</div></div>
                <div><div style={kvLabel}>Updated</div><div style={{ ...kvValue, fontSize: '0.6875rem' }}>{new Date(location.updated_at).toLocaleDateString()}</div></div>
              </div>
            </section>

            {/* Audit Log */}
            {(auditEntries ?? []).length > 0 && (
              <section style={{ ...card, padding: '1.25rem' }}>
                <h2 style={sectionTitle}>📝 Activity</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {auditEntries!.map((entry) => (
                    <div key={entry.id} style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', padding: '0.375rem', borderRadius: '0.25rem', background: 'var(--color-surface-raised)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{entry.action?.replace('location.', '')}</span>
                      <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--color-text-disabled)' }}>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTypeColor(type: string): { bg: string; fg: string } {
  const map: Record<string, { bg: string; fg: string }> = {
    warehouse: { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6' },
    site: { bg: 'rgba(34,197,94,0.12)', fg: '#22C55E' },
    dock: { bg: 'rgba(168,85,247,0.12)', fg: '#A855F7' },
    stage: { bg: 'rgba(0,229,255,0.12)', fg: '#00E5FF' },
    venue: { bg: 'rgba(236,72,153,0.12)', fg: '#EC4899' },
    office: { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' },
    room: { bg: 'rgba(20,184,166,0.12)', fg: '#14B8A6' },
    green_room: { bg: 'rgba(74,222,128,0.12)', fg: '#4ADE80' },
    kitchen: { bg: 'rgba(251,191,36,0.12)', fg: '#FBBF24' },
    bar: { bg: 'rgba(249,115,22,0.12)', fg: '#F97316' },
    dining: { bg: 'rgba(244,114,182,0.12)', fg: '#F472B6' },
    performance: { bg: 'rgba(192,132,252,0.12)', fg: '#C084FC' },
    backstage: { bg: 'rgba(34,211,238,0.12)', fg: '#22D3EE' },
  };
  return map[type] || { bg: 'rgba(156,163,175,0.12)', fg: '#9CA3AF' };
}
