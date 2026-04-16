import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Templates -- GVTEWAY',
  description: 'Manage project and submission templates.',
};

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Templates</h1>
            <p className="text-sm text-text-secondary mt-1">Project blueprints and submission form templates</p>
          </div>
          <button className="btn btn-primary text-xs py-2 px-4">New Template</button>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Project Templates */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">Project Templates</h2>
              <span className="text-label text-text-disabled text-[0.5rem]">{systemProjectTemplates.length} Templates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemProjectTemplates.map((tpl) => (
                <div key={tpl.id} className="card p-6 flex flex-col">
                  <h3 className="text-heading text-xs text-text-primary mb-2">{tpl.name}</h3>
                  <p className="text-xs text-text-tertiary flex-1 mb-4">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tpl.features.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded text-[0.5rem] text-cyan bg-cyan-subtle border border-cyan/10" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  <Link href={`/projects/new?template=${tpl.id}`} className="btn btn-secondary text-xs py-1.5 w-full">
                    Use Template
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Submission Templates */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">Submission Templates</h2>
              <span className="text-label text-text-disabled text-[0.5rem]">{systemSubmissionTemplates.length} Templates</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {systemSubmissionTemplates.map((tpl, i) => (
                  <tr key={i}>
                    <td>
                      <span className="badge border text-cyan border-cyan/20 bg-cyan-subtle">
                        {tpl.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-text-primary">{tpl.name}</td>
                    <td className="text-text-tertiary text-xs">{tpl.description}</td>
                    <td>
                      <button className="btn btn-ghost text-xs py-1 px-3">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
