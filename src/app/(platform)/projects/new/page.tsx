import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ContentGrid } from '@/components/layout/ContentGrid';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'New Project -- GVTEWAY',
  description: 'Create a new project from scratch or a template.',
};

const steps = [
  { id: 'type', label: 'Project Type', description: 'Choose between talent advance, production advance, or hybrid.' },
  { id: 'details', label: 'Event Details', description: 'Name, dates, location, and basic configuration.' },
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
  { id: 'talent', label: 'Talent Portal', description: 'Artist/speaker advancing and deliverable submission' },
  { id: 'crew', label: 'Crew Portal', description: 'Build & strike crew and day-of-show operations' },
  { id: 'sponsor', label: 'Sponsor Portal', description: 'Brand integration and activation tracking' },
  { id: 'press', label: 'Press Portal', description: 'Media credentials, press kit access' },
  { id: 'guest', label: 'Guest Portal', description: 'Guest access and scheduling' },
  { id: 'attendee', label: 'Attendee Portal', description: 'Attendee check-in and event info' },
  { id: 'client', label: 'Client Portal', description: 'Client reporting and deliverable tracking' },
];

export default function NewProjectPage() {
  return (
    <>
      <ModuleHeader
        title="New Project"
        subtitle="Create a new advancing project from scratch or a template."
        backHref="/console/projects"
        backLabel="Projects"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-12 flex-wrap">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-cyan text-[#000] font-heading font-bold' : 'bg-surface-raised text-text-disabled border border-border'}`}>
                {i + 1}
              </div>
              <span className={`text-[0.625rem] tracking-wider uppercase ${i === 0 ? 'text-text-primary' : 'text-text-disabled'}`}>{step.label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Project Type */}
        <section className="mb-12">
          <SectionHeading>Choose Project Type</SectionHeading>
          <ContentGrid columns={{ sm: 1, md: 3 }} gap="1rem">
            {projectTypes.map((pt) => (
              <button key={pt.type} className={`card p-6 text-left transition-all bg-transparent cursor-pointer hover:border-cyan/50 ${pt.type === 'hybrid' ? 'border-glow animate-pulse-glow shadow-[0_0_15px_rgba(0,229,255,0.15)]' : ''}`}>
                <h3 className="font-heading text-sm text-text-primary mb-2">{pt.label}</h3>
                <p className="text-xs text-text-tertiary mb-4">{pt.description}</p>
                <ul className="space-y-1 list-none p-0 m-0">
                  {pt.features.map((f) => (
                    <li key={f} className="text-xs text-text-secondary flex items-center gap-1.5">
                      <span className="text-cyan text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </ContentGrid>
        </section>

         {/* Step 2: Event Details */}
        <section className="mb-12">
          <SectionHeading>Event Details</SectionHeading>
          <div className="card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-1">Project Name</label>
                <Input className="w-full" placeholder="e.g., iii Joints 2026" />
              </div>
              <div>
                <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-1">Slug</label>
                <Input className="w-full font-mono text-cyan" placeholder="iii-joints-2026" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-1">Start Date</label>
                <Input className="w-full" type="date" />
              </div>
              <div>
                <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-1">End Date</label>
                <Input className="w-full" type="date" />
              </div>
            </div>

            {/* Canonical Venue Selector */}
            <div>
              <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-1">Location</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="venue_id" className="input w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan" style={{ cursor: 'pointer' }}>
                  <option value="">Select existing location…</option>
                  {/* Populated from server — venues loaded at render time */}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-text-disabled text-xs tracking-wider uppercase">or</span>
                  <Link href="/console/locations/new" className="text-cyan text-xs hover:underline no-underline">+ Create new location</Link>
                </div>
              </div>
              <p className="text-text-disabled text-[0.5625rem] mt-1.5">Select from existing locations or create a new location in the Locations module.</p>
            </div>

            <div>
              <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-1">Capacity</label>
              <Input className="w-32 font-mono" type="number" placeholder="5000" />
            </div>
          </div>
        </section>

        {/* Step 3: Features */}
        <section className="mb-12">
          <SectionHeading>Enable Features</SectionHeading>
          <ContentGrid columns={{ sm: 1, md: 2 }} gap="0.75rem">
            {featureModules.map((mod) => (
              <label key={mod.id} className="card p-4 flex items-start gap-3 cursor-pointer group hover:border-cyan/30 transition-colors">
                <input type="checkbox" className="mt-1 accent-cyan shrink-0 w-4 h-4" defaultChecked={['talent_advance', 'production_advance'].includes(mod.id)} />
                <div>
                  <div className="text-sm text-text-primary font-heading group-hover:text-cyan transition-colors">{mod.label}</div>
                  <div className="text-xs text-text-tertiary mt-0.5">{mod.description}</div>
                </div>
              </label>
            ))}
          </ContentGrid>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button variant="ghost" size="sm" href="/console/projects">Cancel</Button>
          <Button variant="primary" size="lg" className="px-8 font-heading tracking-wider uppercase">Create Project</Button>
        </div>
      </div>
    </>
  );
}
