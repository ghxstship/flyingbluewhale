import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { StatusBadge } from '@/components/data/StatusBadge';

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

  return (
    <>
      <ModuleHeader
        title="Advancing"
        subtitle="Submit your deliverables below. Each form auto-saves as draft until you submit."
        backHref={`/${slug}/artist`}
        backLabel="Artist Portal"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <div className="flex flex-col gap-4">
          {deliverableTypes.map((d, i) => (
            <Link
              key={d.type}
              href={`/${slug}/artist/advancing/${d.type.replace(/_/g, '-')}`}
              className="card p-6 flex items-center justify-between group animate-fade-in no-underline hover:border-cyan transition-colors"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors">
                    {d.label}
                  </h3>
                  <StatusBadge status={d.status} />
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
    </>
  );
}
