import Link from 'next/link';
import { ContentGrid } from '@/components/layout/ContentGrid';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Client Portal -- ${slug} -- GVTEWAY` };
}

export default async function ClientPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const sections = [
    { href: `/${slug}/client/overview`, label: 'Project Overview', description: 'Status, timeline, key milestones' },
    { href: `/${slug}/client/deliverables`, label: 'Deliverables', description: 'Review submitted deliverables and approve' },
    { href: `/${slug}/client/budget`, label: 'Budget & Costs', description: 'Cost tracking, PO status, invoice history' },
    { href: `/${slug}/client/reports`, label: 'Reports', description: 'Progress reports, attendance, post-event recap' },
    { href: `/${slug}/client/documents`, label: 'Documents', description: 'Contracts, COIs, permits, shared files' },
    { href: `/${slug}/client/contacts`, label: 'Contacts', description: 'Account manager, production lead, support' },
  ];

  return (
    <>
      <div className="border-b border-border bg-bg/50 backdrop-blur-md px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[0.6875rem] tracking-widest uppercase text-cyan mb-3 font-heading">Client Portal</div>
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
