import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Crew List -- ${slug} -- GVTEWAY` };
}

export default async function CrewListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const roles = ['Artist', 'Tour Manager', 'FOH Engineer', 'Monitor Engineer', 'Lighting Designer', 'VJ / Visuals', 'DJ Tech', 'Backline Tech', 'Photographer', 'Videographer', 'Security', 'Personal Assistant', 'Other'];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist/advancing`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Advancing</Link>
          <h1 className="text-display text-3xl text-text-primary">Crew List</h1>
          <p className="text-sm text-text-secondary mt-1">Touring party roster. Names, roles, and credential requirements.</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost text-xs py-2 px-4">Add Person</button>
              <button className="btn btn-primary text-xs py-2 px-6">Submit</button>
            </div>
          </div>

          {/* Crew member form */}
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-label text-text-tertiary block mb-1">Full Name</label>
                    <input className="input w-full text-sm py-1.5" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-label text-text-tertiary block mb-1">Role</label>
                    <select className="input w-full text-sm py-1.5">
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-label text-text-tertiary block mb-1">Email</label>
                    <input className="input w-full text-sm py-1.5" type="email" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-label text-text-tertiary block mb-1">Phone</label>
                    <input className="input w-full text-sm py-1.5" type="tel" placeholder="+1 (___) ___-____" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-disabled mt-4">
            Each crew member will be issued credentials based on their role. All persons must have valid photo ID for credential pickup.
          </p>
        </div>
      </div>
    </div>
  );
}
