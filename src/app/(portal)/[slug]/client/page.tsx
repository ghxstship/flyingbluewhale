import Link from 'next/link';

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-label text-cyan mb-2">Client Portal</div>
          <h1 className="text-display text-4xl text-text-primary">{slug.replace(/-/g, ' ').toUpperCase()}</h1>
        </div>
      </header>
      <div className="flex-1 px-8 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, i) => (
            <Link key={section.href} href={section.href} className="card p-6 flex items-start gap-4 group animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="w-8 h-8 rounded bg-cyan-subtle flex items-center justify-center text-cyan text-heading text-xs shrink-0 group-hover:bg-cyan/20 transition-colors">{section.label[0]}</div>
              <div>
                <h3 className="text-heading text-sm text-text-primary group-hover:text-cyan transition-colors">{section.label}</h3>
                <p className="text-xs text-text-tertiary mt-1">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
