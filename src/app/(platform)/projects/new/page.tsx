import Link from 'next/link';

export const metadata = {
  title: 'New Project -- GVTEWAY',
  description: 'Create a new project from scratch or a template.',
};

const steps = [
  { id: 'type', label: 'Project Type', description: 'Choose between talent advance, production advance, or hybrid.' },
  { id: 'details', label: 'Event Details', description: 'Name, dates, venue, and basic configuration.' },
  { id: 'features', label: 'Features', description: 'Select which modules to enable for this project.' },
  { id: 'spaces', label: 'Spaces', description: 'Define stages, rooms, and areas.' },
  { id: 'review', label: 'Review', description: 'Review configuration and create project.' },
];

const projectTypes = [
  {
    type: 'talent_advance',
    label: 'Talent Advance',
    description: 'Artist-facing advancing: tech riders, input lists, stage plots, crew lists, guest lists, hospitality.',
    features: ['6 talent deliverables', 'Backline from UAC', 'Guest list caps', 'Catering', 'CMS portal'],
  },
  {
    type: 'production_advance',
    label: 'Production Advance',
    description: 'Production-facing advancing: equipment pull lists, power plans, rigging, safety, comms, signage.',
    features: ['9 production deliverables', 'Full UAC catalog', 'Vendor management', 'Build schedules', 'Site plans'],
  },
  {
    type: 'hybrid',
    label: 'Hybrid',
    description: 'Combined talent and production advancing. Full platform capabilities.',
    features: ['All 15 deliverables', 'Full UAC access', 'Dual-track portals', 'All modules'],
  },
];

const featureModules = [
  { id: 'talent_advance', label: 'Talent Advancing', description: '6 deliverable types, backline UAC picker' },
  { id: 'production_advance', label: 'Production Advancing', description: '9 deliverable types, full equipment catalog' },
  { id: 'catering', label: 'Catering', description: 'Meal plans, dietary tracking, check-in' },
  { id: 'notifications', label: 'Notifications', description: 'Email/SMS templates, auto-triggers' },
  { id: 'cms', label: 'CMS Portal', description: 'Block-based content pages per track' },
  { id: 'sponsor', label: 'Sponsor Portal', description: 'Brand integration and activation tracking' },
  { id: 'guest', label: 'Guest Portal', description: 'Industry guest access and scheduling' },
  { id: 'client', label: 'Client Portal', description: 'Client reporting and deliverable tracking' },
];

export default function NewProjectPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/console" className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Console</Link>
          <h1 className="text-display text-3xl text-text-primary">New Project</h1>
          <p className="text-sm text-text-secondary mt-1">Create a new advancing project from scratch or a template.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-12">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-cyan text-bg text-heading font-bold' : 'bg-surface-raised text-text-disabled border border-border'}`}>
                  {i + 1}
                </div>
                <span className={`text-label text-xs ${i === 0 ? 'text-text-primary' : 'text-text-disabled'}`}>{step.label}</span>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 1: Project Type */}
          <section className="mb-12">
            <h2 className="text-heading text-sm text-text-primary mb-6">Choose Project Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projectTypes.map((pt) => (
                <button key={pt.type} className={`card p-6 text-left transition-all ${pt.type === 'hybrid' ? 'border-glow animate-pulse-glow' : ''}`}>
                  <h3 className="text-heading text-sm text-text-primary mb-2">{pt.label}</h3>
                  <p className="text-xs text-text-tertiary mb-4">{pt.description}</p>
                  <ul className="space-y-1">
                    {pt.features.map((f) => (
                      <li key={f} className="text-xs text-text-secondary flex items-center gap-1.5">
                        <span className="text-cyan text-xs">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Event Details */}
          <section className="mb-12">
            <h2 className="text-heading text-sm text-text-primary mb-6">Event Details</h2>
            <div className="card p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label text-text-tertiary block mb-1">Project Name</label>
                  <input className="input w-full" placeholder="e.g., iii Joints 2026" />
                </div>
                <div>
                  <label className="text-label text-text-tertiary block mb-1">Slug</label>
                  <input className="input w-full text-mono" placeholder="iii-joints-2026" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label text-text-tertiary block mb-1">Start Date</label>
                  <input className="input w-full" type="date" />
                </div>
                <div>
                  <label className="text-label text-text-tertiary block mb-1">End Date</label>
                  <input className="input w-full" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label text-text-tertiary block mb-1">Venue Name</label>
                  <input className="input w-full" placeholder="Factory Town" />
                </div>
                <div>
                  <label className="text-label text-text-tertiary block mb-1">City, State</label>
                  <input className="input w-full" placeholder="Miami, FL" />
                </div>
              </div>
              <div>
                <label className="text-label text-text-tertiary block mb-1">Capacity</label>
                <input className="input w-32" type="number" placeholder="5000" />
              </div>
            </div>
          </section>

          {/* Step 3: Features */}
          <section className="mb-12">
            <h2 className="text-heading text-sm text-text-primary mb-6">Enable Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featureModules.map((mod) => (
                <label key={mod.id} className="card p-4 flex items-start gap-3 cursor-pointer group hover:border-cyan/30">
                  <input type="checkbox" className="mt-1 accent-cyan-500" defaultChecked={['talent_advance', 'production_advance'].includes(mod.id)} />
                  <div>
                    <div className="text-sm text-text-primary group-hover:text-cyan transition-colors">{mod.label}</div>
                    <div className="text-xs text-text-tertiary">{mod.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/console" className="btn btn-ghost text-xs py-2 px-6">Cancel</Link>
            <button className="btn btn-primary text-xs py-2 px-8">Create Project</button>
          </div>
        </div>
      </div>
    </div>
  );
}
