import Link from 'next/link';
import { ContentGrid } from '@/components/layout/ContentGrid';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Guest Portal -- ${slug} -- GVTEWAY` };
}

export default async function GuestPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const sections = [
    { href: `/${slug}/guest/event-info`, label: 'Event Information', description: 'Dates, times, dress code, what to expect' },
    { href: `/${slug}/guest/credentials`, label: 'Your Credentials', description: 'Credential status and pickup instructions' },
    { href: `/${slug}/guest/schedule`, label: 'Schedule', description: 'Full event schedule with must-see sets' },
    { href: `/${slug}/guest/transportation`, label: 'Transportation', description: 'Parking, rideshare, shuttle, directions' },
    { href: `/${slug}/guest/hospitality`, label: 'Hospitality', description: 'VIP areas, food & beverage, amenities' },
    { href: `/${slug}/guest/contacts`, label: 'Contacts', description: 'Your host, venue contacts, emergency' },
  ];

  return (
    <>
      <div className="border-b border-border bg-bg/50 backdrop-blur-md px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[0.6875rem] tracking-widest uppercase text-cyan mb-3 font-heading">Industry Guest Portal</div>
          <h1 className="font-display text-4xl text-text-primary mb-2">
            {slug.replace(/-/g, ' ').toUpperCase()}
          </h1>
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
