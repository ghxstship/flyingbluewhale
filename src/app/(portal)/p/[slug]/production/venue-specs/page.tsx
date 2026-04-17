import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { LOCATION_TYPE_ICONS, LOCATION_TYPE_LABELS, type LocationType } from '@/lib/supabase/types';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Venue Specs — ${slug} — GVTEWAY` };
}

export default async function VenueSpecsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('*, locations!projects_venue_id_fkey(*)').eq('slug', slug).single();
  if (!project) notFound();

  // Get venue from FK
  const venueLocation = (project as any).locations as Record<string, any> | null;

  // Get child locations (stages, docks, rooms under venue)
  let children: any[] = [];
  if (venueLocation) {
    const { data } = await supabase.from('locations').select('*').eq('parent_id', venueLocation.id).eq('is_active', true).order('name');
    children = data ?? [];
  }

  // Get spaces as fallback
  const { data: spaces } = await supabase.from('spaces').select('*').eq('project_id', project.id).order('sort_order');

  // Resolve venue data from canonical
  const venueName = venueLocation?.name;
  const addr = venueLocation?.address as Record<string, string> | null;
  const cap = venueLocation?.capacity as Record<string, number> | null;
  const contact = venueLocation?.contact as Record<string, string> | null;
  const meta = venueLocation?.metadata as Record<string, any> | null;

  // Operating Hours from Schedule
  let opHours: any[] = [];
  if (venueLocation) {
    const { data: opData } = await supabase
      .from('schedule_entries')
      .select('id, title, rrule')
      .eq('location_id', venueLocation.id)
      .eq('category', 'hours_of_operation')
      .eq('is_cancelled', false)
      .order('starts_at');
    opHours = opData ?? [];
  }

  return (
    <>
      <ModuleHeader
        title="Venue Specs"
        subtitle={`${venueName || 'No venue configured'} — ${project.name}`}
        backHref={`/${slug}/production`}
        backLabel="Production Portal"
        maxWidth="6xl"
      />

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {!venueName ? (
          <div className="card p-16 text-center">
            <p className="text-text-tertiary text-sm">No venue has been configured for this project</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Venue Overview */}
              <section className="card p-6">
                <div className="flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-xl bg-[rgba(236,72,153,0.12)] flex items-center justify-center text-[1.75rem] shrink-0">
                    🏟️
                  </div>
                  <div>
                    <h2 className="font-heading text-lg text-text-primary">{venueName}</h2>
                    {addr?.city && (
                      <p className="text-[0.8125rem] text-text-tertiary mt-0.5">
                        {addr.street && `${addr.street}, `}{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip || ''}
                      </p>
                    )}
                    {meta?.indoor_outdoor && (
                      <span className="inline-block mt-2 text-[0.5rem] py-0.5 px-2 rounded-full bg-[rgba(0,229,255,0.12)] text-[#00E5FF] tracking-wider uppercase font-semibold">
                        {meta.indoor_outdoor}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Capacity */}
              {cap && (
                <section className="card p-6">
                  <SectionHeading>👥 Capacity</SectionHeading>
                  <div className="flex gap-8 flex-wrap">
                    {Object.entries(cap).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="font-display text-3xl text-cyan">{v.toLocaleString()}</div>
                        <div className="text-[0.5625rem] text-text-disabled tracking-wider uppercase mt-0.5">
                          {k.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Stages / Sub-locations */}
              <section className="card p-6">
                <SectionHeading>🎤 Stages & Areas</SectionHeading>
                {children.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {children.map((child) => {
                      const ci = LOCATION_TYPE_ICONS[child.type as LocationType] || '📌';
                      const cl = LOCATION_TYPE_LABELS[child.type as LocationType] || child.type;
                      const childCap = child.capacity as Record<string, number> | null;
                      return (
                        <div key={child.id} className="p-4 rounded-lg border border-border-subtle bg-surface-raised">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">{ci}</span>
                            <span className="font-heading text-xs text-text-primary">{child.name}</span>
                          </div>
                          <span className="text-[0.4375rem] py-0.5 px-1.5 rounded-full bg-[rgba(0,229,255,0.08)] text-[#00E5FF] tracking-wider uppercase font-semibold">
                            {cl}
                          </span>
                          {childCap && Object.entries(childCap).map(([k, v]) => (
                            <div key={k} className="text-[0.5625rem] text-text-disabled mt-1.5">{v} {k.replace(/_/g, ' ')}</div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (spaces ?? []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {spaces!.map((s) => (
                      <div key={s.id} className="p-4 rounded-lg border border-border-subtle bg-surface-raised">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">🎤</span>
                          <span className="font-heading text-xs text-text-primary">{s.name}</span>
                        </div>
                        <span className="text-[0.4375rem] py-0.5 px-1.5 rounded-full bg-[rgba(0,229,255,0.08)] text-[#00E5FF] tracking-wider uppercase font-semibold">
                          {s.type}
                        </span>
                        {s.capacity && (
                          <div className="text-[0.5625rem] text-text-disabled mt-1.5">{s.capacity} capacity</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-disabled text-xs">No stages or areas configured</p>
                )}
              </section>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="flex flex-col gap-6">
              {/* Contact */}
              {contact && Object.keys(contact).length > 0 && (
                <section className="card p-5">
                  <SectionHeading>📞 Venue Contact</SectionHeading>
                  <div className="flex flex-col gap-3">
                    {Object.entries(contact).map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[0.5625rem] text-text-disabled tracking-wider uppercase mb-0.5">{k}</div>
                        <div className="text-[0.8125rem] text-text-primary">{typeof v === 'string' ? v : JSON.stringify(v)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Day-of-Show contacts from legacy data */}
              {meta?.dos_contacts && (
                <section className="card p-5">
                  <SectionHeading>📱 Day-of-Show Contacts</SectionHeading>
                  <div className="flex flex-col gap-2">
                    {(meta.dos_contacts as { name: string; phone: string }[]).map((c: { name: string; phone: string }, i: number) => (
                      <div key={i} className="text-[0.8125rem] text-text-primary flex flex-col">
                        <span>{c.name}</span>
                        <span className="text-text-tertiary font-mono text-xs">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Operating Hours */}
              {opHours.length > 0 && (
                <section className="card p-5">
                  <SectionHeading>🕐 Operating Hours</SectionHeading>
                  <div className="flex flex-col gap-2">
                    {opHours.map((oh) => (
                      <div key={oh.id} className="flex flex-col pb-2 border-b border-border-subtle last:border-0 last:pb-0">
                        <span className="text-text-primary text-sm font-semibold">{oh.title}</span>
                        {oh.rrule && (
                          <span className="text-text-tertiary font-mono text-[0.6875rem] mt-0.5 opacity-80">
                            {oh.rrule.replace('FREQ=', '')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Parking / logistics */}
              {meta?.parking && (
                <section className="card p-5">
                  <SectionHeading>🅿️ Parking & Access</SectionHeading>
                  <p className="text-[0.8125rem] text-text-secondary">{meta.parking}</p>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
