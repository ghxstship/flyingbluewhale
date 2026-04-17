import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ContentGrid } from '@/components/layout/ContentGrid';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Artist Portal -- ${slug} -- GVTEWAY`,
    description: `Talent advancing portal for ${slug}`,
  };
}

export default async function ArtistPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*, locations!projects_venue_id_fkey(name, address)')
    .eq('slug', slug)
    .single();

  const venueLoc = (project as any)?.locations as { name?: string; address?: { city?: string } } | null;

  const sections = [
    { href: `/${slug}/artist/show-details`, label: 'Show Details', description: 'Event info, venue, schedule' },
    { href: `/${slug}/artist/venue`, label: 'Venue', description: 'Capacity, site plan, amenities' },
    { href: `/${slug}/artist/schedule`, label: 'Schedule', description: 'Set times, soundcheck, call times' },
    { href: `/${slug}/artist/advancing`, label: 'Advancing', description: '6 deliverables: tech rider, hospitality, input list, stage plot, crew, guest list' },
    { href: `/${slug}/artist/payment`, label: 'Payment', description: 'Payment info, W-9 requirements' },
    { href: `/${slug}/artist/catering`, label: 'Catering', description: 'Meal plans, dietary preferences' },
    { href: `/${slug}/artist/contacts`, label: 'Contacts', description: 'Liaison, production office, emergency' },
    { href: `/${slug}/artist/faq`, label: 'FAQ', description: 'Frequently asked questions' },
  ];
  
  const venueSubtitle = venueLoc?.name 
    ? `${venueLoc.name}${venueLoc.address?.city ? ` · ${venueLoc.address.city}` : ''}`
    : undefined;

  return (
    <>
      <div className="border-b border-border bg-bg/50 backdrop-blur-md px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[0.6875rem] tracking-widest uppercase text-cyan mb-3 font-heading">Artist Portal</div>
          <h1 className="font-display text-4xl text-text-primary mb-2">
            {project?.name || slug.toUpperCase()}
          </h1>
          {venueSubtitle && (
            <p className="text-[0.9375rem] text-text-secondary">{venueSubtitle}</p>
          )}
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <ContentGrid columns={{ sm: 1, md: 2 }} gap="1rem">
          {sections.map((section, i) => (
            <Link
              key={section.href}
              href={section.href}
              className="card p-6 flex items-start gap-4 group no-underline transition-colors hover:border-cyan"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-8 h-8 rounded bg-cyan-subtle flex items-center justify-center text-cyan font-heading text-xs shrink-0 group-hover:bg-[rgba(0,229,255,0.2)] transition-colors">
                {section.label[0]}
              </div>
              <div>
                <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors">
                  {section.label}
                </h3>
                <p className="text-xs text-text-tertiary mt-1">{section.description}</p>
              </div>
            </Link>
          ))}
        </ContentGrid>
      </div>
    </>
  );
}
