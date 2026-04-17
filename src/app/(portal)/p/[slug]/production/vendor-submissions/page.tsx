import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { StatusBadge } from '@/components/data/StatusBadge';

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

  return (
    <>
      <ModuleHeader
        title="Vendor Submissions"
        subtitle="9 production deliverables. Each submission goes through approval workflow."
        backHref={`/${slug}/production`}
        backLabel="Production Portal"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <div className="flex flex-col gap-4">
          {deliverableTypes.map((d, i) => (
            <Link
              key={d.type}
              href={`/${slug}/production/vendor-submissions/${d.type.replace(/_/g, '-')}`}
              className="card p-6 flex items-center justify-between group animate-fade-in no-underline hover:border-cyan transition-colors"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-heading text-sm text-text-primary group-hover:text-cyan transition-colors">{d.label}</h3>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-xs text-text-tertiary">{d.description}</p>
              </div>
              <div className="text-text-disabled group-hover:text-cyan transition-colors text-lg ml-4">&rarr;</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
