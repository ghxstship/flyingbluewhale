import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Vendor Submissions -- ${slug} -- GVTEWAY` };
}

export default async function VendorSubmissionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const deliverableTypes = [
    { type: 'equipment_pull_list', label: 'Equipment Pull List', description: 'Complete equipment allocation from the UAC. Audio, lighting, video, staging, power, site infrastructure.', status: 'draft' },
    { type: 'power_plan', label: 'Power Plan', description: 'Generator sizing, distribution layout, feeder runs, panel schedules.', status: 'draft' },
    { type: 'rigging_plan', label: 'Rigging Plan', description: 'Hoist positions, trim heights, weight loads, beam clamp locations.', status: 'draft' },
    { type: 'site_plan', label: 'Site Plan', description: 'Venue layout with zones, infrastructure, ingress/egress, utility runs.', status: 'draft' },
    { type: 'build_schedule', label: 'Build Schedule', description: 'Phased timeline: advance load, main load-in, show day, strike.', status: 'draft' },
    { type: 'vendor_package', label: 'Vendor Package', description: 'Complete vendor submittal: COI, W-9, labor manifests, equipment lists.', status: 'draft' },
    { type: 'safety_compliance', label: 'Safety & Compliance', description: 'Fire marshal, ADA compliance, emergency action plans, crowd management.', status: 'draft' },
    { type: 'comms_plan', label: 'Communications Plan', description: 'Radio channels, code words, chain of command, emergency protocols.', status: 'draft' },
    { type: 'signage_grid', label: 'Signage Grid', description: 'Wayfinding, emergency, regulatory, branding — quantities and placement.', status: 'draft' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'text-draft border-draft/30 bg-draft/10',
    submitted: 'text-submitted border-submitted/30 bg-submitted/10',
    in_review: 'text-in-review border-in-review/30 bg-in-review/10',
    approved: 'text-approved border-approved/30 bg-approved/10',
    rejected: 'text-rejected border-rejected/30 bg-rejected/10',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/production`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Production Portal</Link>
          <h1 className="text-display text-3xl text-text-primary">Vendor Submissions</h1>
          <p className="text-sm text-text-secondary mt-1">9 production deliverables. Each submission goes through approval workflow.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {deliverableTypes.map((d, i) => (
            <Link
              key={d.type}
              href={`/${slug}/production/vendor-submissions/${d.type.replace(/_/g, '-')}`}
              className="card p-6 flex items-center justify-between group animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-heading text-sm text-text-primary group-hover:text-cyan transition-colors">{d.label}</h3>
                  <span className={`badge border ${statusColors[d.status]}`}>{d.status}</span>
                </div>
                <p className="text-xs text-text-tertiary">{d.description}</p>
              </div>
              <div className="text-text-disabled group-hover:text-cyan transition-colors text-lg ml-4">&rarr;</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
