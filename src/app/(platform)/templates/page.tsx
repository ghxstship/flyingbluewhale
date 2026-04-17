import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Templates -- GVTEWAY',
  description: 'Manage project and submission templates.',
};

type SubmissionTplRow = {
  type: string;
  name: string;
  description: string;
};

const SUBMISSION_COLUMNS: DataTableColumn<SubmissionTplRow>[] = [
  {
    key: 'type',
    header: 'Type',
    render: (tpl) => <Badge variant="cyan">{tpl.type.replace(/_/g, ' ')}</Badge>,
  },
  {
    key: 'name',
    header: 'Name',
    render: (tpl) => <span className="text-text-primary">{tpl.name}</span>,
  },
  {
    key: 'description',
    header: 'Description',
    render: (tpl) => <span className="text-text-tertiary text-xs">{tpl.description}</span>,
  },
  {
    key: 'actions',
    header: 'Action',
    align: 'right',
    render: () => <Button variant="ghost" size="sm">Edit</Button>,
  },
];

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: projectTemplates } = await supabase
    .from('project_templates')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: submissionTemplates } = await supabase
    .from('submission_templates')
    .select('*')
    .order('deliverable_type');

  // System templates (hardcoded seeds until DB is connected)
  const systemProjectTemplates = [
    { id: 'tpl-1', name: 'Multi-Stage Outdoor Festival', description: 'Full-scale outdoor festival with multiple stages, vendor villages, and VIP areas.', features: ['talent_advance', 'production_advance', 'catering', 'notifications'] },
    { id: 'tpl-2', name: 'Immersive Experience / Activation', description: 'Boutique immersive dining, theatrical, or brand activation experience.', features: ['production_advance', 'sponsor', 'catering'] },
    { id: 'tpl-3', name: 'Single-Show Club Night', description: 'One-off club show with single stage and minimal production.', features: ['talent_advance', 'notifications'] },
    { id: 'tpl-4', name: 'Brand Activation - Pop-Up', description: 'Temporary brand pop-up with sponsor integration and experiential elements.', features: ['production_advance', 'sponsor'] },
    { id: 'tpl-5', name: 'Tour Stop', description: 'Single tour date with standardized tech rider and advancing workflow.', features: ['talent_advance', 'catering'] },
  ];

  const systemSubmissionTemplates = [
    { type: 'technical_rider', name: 'DJ Standard', description: '4x CDJ-3000 + DJM-V10 default, confirm/override workflow' },
    { type: 'technical_rider', name: 'DJ + Vocalist', description: 'DJ setup + wireless mic, IEM, monitor wedge' },
    { type: 'technical_rider', name: '4-Piece Band', description: 'Full backline: drums, bass, keys, guitar + PA requirements' },
    { type: 'technical_rider', name: 'Headliner Production', description: 'Custom lighting, video, pyro, and sound requirements' },
    { type: 'input_list', name: 'DJ (Line Level)', description: '2-channel stereo from mixer' },
    { type: 'input_list', name: 'Full Band', description: '16-32 channel input list with drum sub-snake' },
    { type: 'hospitality_rider', name: 'Standard Green Room', description: 'Water, towels, snacks, private space' },
    { type: 'hospitality_rider', name: 'Day-Of Requirements', description: 'Meals, transportation, accommodation' },
    { type: 'crew_list', name: 'Solo DJ', description: '1 person: artist only' },
    { type: 'crew_list', name: 'DJ + Tour Manager', description: '2 persons: artist + TM' },
    { type: 'crew_list', name: 'Full Band', description: '4-8 persons with roles' },
    { type: 'guest_list', name: '10 GA + 1 VIP', description: 'Standard guest list with caps' },
    { type: 'equipment_pull_list', name: 'DJ Stage', description: 'Standard DJ stage pull: backline, monitors, booth lighting' },
    { type: 'equipment_pull_list', name: 'Immersive Dining', description: 'Full F&B + hospitality pull list' },
    { type: 'equipment_pull_list', name: 'Festival Main Stage', description: 'PA, lighting, video, staging, rigging, power' },
    { type: 'safety_compliance', name: 'Indoor Venue', description: 'Fire marshal, capacity, exits, emergency plan' },
    { type: 'safety_compliance', name: 'Outdoor Festival', description: 'Weather, crowd density, medical, evacuation' },
  ];

  return (
    <>
      <ModuleHeader
        title="Templates"
        subtitle="Project blueprints and submission form templates"
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">New Template</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {/* Project Templates */}
        <section className="mb-12">
          <SectionHeading>
            Project Templates
            <span className="ml-3 badge text-[0.5rem] tracking-wider uppercase bg-surface-raised text-text-disabled border border-border">
              {systemProjectTemplates.length} Templates
            </span>
          </SectionHeading>

          <ContentGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="1rem">
            {systemProjectTemplates.map((tpl) => (
              <div key={tpl.id} className="card p-6 flex flex-col">
                <h3 className="font-heading text-xs text-text-primary mb-2">{tpl.name}</h3>
                <p className="text-xs text-text-tertiary flex-1 mb-4">{tpl.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.features.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded text-[0.5rem] text-cyan bg-cyan-subtle border border-cyan/10 font-heading tracking-wider uppercase">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="w-full" href={`/projects/new?template=${tpl.id}`}>
                  Use Template
                </Button>
              </div>
            ))}
          </ContentGrid>
        </section>

        {/* Submission Templates */}
        <section>
          <SectionHeading>
            Submission Templates
            <span className="ml-3 badge text-[0.5rem] tracking-wider uppercase bg-surface-raised text-text-disabled border border-border">
              {systemSubmissionTemplates.length} Templates
            </span>
          </SectionHeading>

          <DataTable
            columns={SUBMISSION_COLUMNS}
            data={systemSubmissionTemplates}
            emptyText="No submission templates"
          />
        </section>
      </div>
    </>
  );
}
