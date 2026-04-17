import Link from 'next/link';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Crew List -- ${slug} -- GVTEWAY` };
}

export default async function CrewListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const roles = ['Artist', 'Tour Manager', 'FOH Engineer', 'Monitor Engineer', 'Lighting Designer', 'VJ / Visuals', 'DJ Tech', 'Backline Tech', 'Photographer', 'Videographer', 'Security', 'Personal Assistant', 'Other'];

  return (
    <>
      <ModuleHeader
        title="Crew List"
        subtitle="Touring party roster. Names, roles, and credential requirements."
        backHref={`/${slug}/artist/advancing`}
        backLabel="Advancing"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <div className="card-elevated p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="muted">Draft</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">Add Person</Button>
            <Button variant="primary" size="sm">Submit</Button>
          </div>
        </div>

        {/* Crew member form */}
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="card p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Full Name</label>
                  <Input className="w-full" placeholder="Full name" />
                </div>
                <div>
                  <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Role</label>
                  <select className="input w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan">
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Email</label>
                  <Input className="w-full" type="email" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Phone</label>
                  <Input className="w-full" type="tel" placeholder="+1 (___) ___-____" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-disabled mt-4">
          Each crew member will be issued credentials based on their role. All persons must have valid photo ID for credential pickup.
        </p>
      </div>
    </>
  );
}
