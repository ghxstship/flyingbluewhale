import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Advancing -- ${slug} -- GVTEWAY`,
    description: `Talent advancing deliverables for ${slug}`,
  };
}

export default async function AdvancingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deliverableTypes = [
    {
      type: 'technical_rider',
      label: 'Technical Rider',
      description: 'Backline requirements. Confirm or override the default equipment for your set.',
      status: 'draft' as const,
    },
    {
      type: 'hospitality_rider',
      label: 'Hospitality Rider',
      description: 'Green room, dressing room, and catering requirements.',
      status: 'draft' as const,
    },
    {
      type: 'input_list',
      label: 'Input List',
      description: 'Audio inputs per act. Line-level for DJ, full channel list for live bands.',
      status: 'draft' as const,
    },
    {
      type: 'stage_plot',
      label: 'Stage Plot',
      description: 'Physical stage layout showing positions, monitors, and sight lines.',
      status: 'draft' as const,
    },
    {
      type: 'crew_list',
      label: 'Crew List',
      description: 'Touring party roster. Names, roles, credentials needed.',
      status: 'draft' as const,
    },
    {
      type: 'guest_list',
      label: 'Guest List',
      description: 'Submit your guest list. Caps enforced at the database level.',
      status: 'draft' as const,
    },
  ];

  const statusColors: Record<string, string> = {
    draft: 'text-draft border-draft/30 bg-draft/10',
    submitted: 'text-submitted border-submitted/30 bg-submitted/10',
    in_review: 'text-in-review border-in-review/30 bg-in-review/10',
    approved: 'text-approved border-approved/30 bg-approved/10',
    rejected: 'text-rejected border-rejected/30 bg-rejected/10',
    revision_requested: 'text-warning border-warning/30 bg-warning/10',
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">
            &larr; Artist Portal
          </Link>
          <h1 className="text-display text-3xl text-text-primary">Advancing</h1>
          <p className="text-sm text-text-secondary mt-1">
            Submit your deliverables below. Each form auto-saves as draft until you submit.
          </p>
        </div>
      </header>

      {/* Deliverable Cards */}
      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {deliverableTypes.map((d, i) => (
            <Link
              key={d.type}
              href={`/${slug}/artist/advancing/${d.type.replace(/_/g, '-')}`}
              className="card p-6 flex items-center justify-between group animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-heading text-sm text-text-primary group-hover:text-cyan transition-colors">
                    {d.label}
                  </h3>
                  <span className={`badge border ${statusColors[d.status]}`}>
                    {d.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary">{d.description}</p>
              </div>
              <div className="text-text-disabled group-hover:text-cyan transition-colors text-lg ml-4">
                &rarr;
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
