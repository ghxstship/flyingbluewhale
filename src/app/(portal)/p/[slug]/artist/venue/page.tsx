import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { EmptyState } from '@/components/data/EmptyState';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Venue — ${slug} — GVTEWAY` };
}

export default async function ArtistVenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('*, locations!projects_venue_id_fkey(*)').eq('slug', slug).single();
  if (!project) notFound();

  const venueLocation = (project as any).locations as Record<string, any> | null;
  const venueName = venueLocation?.name;
  const addr = venueLocation?.address as Record<string, string> | null;
  const cap = venueLocation?.capacity as Record<string, number> | null;
  const meta = venueLocation?.metadata as Record<string, any> | null;

  const { data: spaces } = await supabase.from('spaces').select('*').eq('project_id', project.id).order('sort_order');

  return (
    <>
      <ModuleHeader
        title="Venue"
        subtitle={project.name}
        backHref={`/${slug}/artist`}
        backLabel="Artist Portal"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        {!venueName ? (
          <EmptyState title="Venue details will be available closer to the event" />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Venue Card */}
            <div className="card p-8 flex gap-6 items-start">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(236,72,153,0.12)] flex items-center justify-center text-[2rem] shrink-0">
                🏟️
              </div>
              <div>
                <h2 className="font-heading text-xl text-text-primary">{venueName}</h2>
                {addr?.city && (
                  <p className="text-sm text-text-tertiary mt-1">
                    {addr.street && `${addr.street}, `}{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip || ''}
                  </p>
                )}
                <div className="flex gap-4 mt-4 flex-wrap">
                  {cap && Object.entries(cap).map(([k, v]) => (
                    <div key={k} className="py-2 px-4 rounded-md bg-surface-raised border border-border-subtle inline-flex items-center">
                      <span className="font-display text-lg text-cyan">{v.toLocaleString()}</span>
                      <span className="text-[0.625rem] text-text-disabled ml-2 tracking-wider uppercase">{k.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {meta?.indoor_outdoor && (
                    <span className="py-2 px-4 rounded-md bg-[rgba(0,229,255,0.08)] text-[#00E5FF] text-[0.6875rem] font-semibold tracking-wider uppercase inline-flex items-center">
                      {meta.indoor_outdoor}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Parking */}
            {meta?.parking && (
              <div className="card p-6">
                <SectionHeading>🅿️ Parking & Arrival</SectionHeading>
                <p className="text-sm text-text-secondary leading-relaxed">{meta.parking}</p>
              </div>
            )}

            {/* Stages */}
            {(spaces ?? []).length > 0 && (
              <div className="card p-6">
                <SectionHeading>🎤 Stages</SectionHeading>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {spaces!.map((s) => (
                    <div key={s.id} className="p-4 rounded-lg border border-border-subtle bg-surface-raised">
                      <div className="font-heading text-sm text-text-primary mb-1 truncate">{s.name}</div>
                      {s.capacity && <div className="text-[0.625rem] text-text-disabled">{s.capacity} cap</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credential pickup / load-in */}
            {(project.settings as Record<string, any>)?.credential_pickup && (
              <div className="card p-6">
                <SectionHeading>🪪 Artist Check-in</SectionHeading>
                <p className="text-sm text-text-secondary leading-relaxed">{(project.settings as Record<string, any>).credential_pickup}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
