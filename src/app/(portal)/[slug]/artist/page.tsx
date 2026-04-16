import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
    .select('*')
    .eq('slug', slug)
    .single();

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Portal Header */}
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-label text-cyan mb-2">Artist Portal</div>
          <h1 className="text-display text-4xl text-text-primary">
            {project?.name || slug.toUpperCase()}
          </h1>
          {project?.venue && (
            <p className="text-sm text-text-secondary mt-2">
              {(project.venue as { name?: string })?.name} &middot; {(project.venue as { city?: string })?.city}
            </p>
          )}
        </div>
      </header>

      {/* Navigation Grid */}
      <div className="flex-1 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, i) => (
              <Link
                key={section.href}
                href={section.href}
                className="card p-6 flex items-start gap-4 group animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-8 h-8 rounded bg-cyan-subtle flex items-center justify-center text-cyan text-heading text-xs shrink-0 group-hover:bg-cyan/20 transition-colors">
                  {section.label[0]}
                </div>
                <div>
                  <h3 className="text-heading text-sm text-text-primary group-hover:text-cyan transition-colors">
                    {section.label}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-1">{section.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
