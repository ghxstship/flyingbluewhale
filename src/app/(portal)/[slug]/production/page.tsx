import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Production Portal -- ${slug} -- GVTEWAY`,
    description: `Production advancing portal for ${slug}`,
  };
}

export default async function ProductionPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  const sections = [
    { href: `/${slug}/production/venue-specs`, label: 'Venue Specs', description: 'Dimensions, capacity, utilities, restrictions' },
    { href: `/${slug}/production/site-plan`, label: 'Site Plan', description: 'Layout, zones, ingress/egress, utility runs' },
    { href: `/${slug}/production/build-schedule`, label: 'Build Schedule', description: 'Phased timeline: load-in through strike' },
    { href: `/${slug}/production/equipment`, label: 'Equipment', description: 'Full UAC catalog -- pull lists, allocations, procurement' },
    { href: `/${slug}/production/vendor-submissions`, label: 'Vendor Submissions', description: '9 production deliverables: power, rigging, safety, comms, signage' },
    { href: `/${slug}/production/comms`, label: 'Communications', description: 'Radio channels, code words, chain of command' },
    { href: `/${slug}/production/contacts`, label: 'Contacts', description: 'Production office, venue, emergency, utilities' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Portal Header */}
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-label text-cyan mb-2">Production Portal</div>
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
