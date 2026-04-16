import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Guest List -- ${slug} -- GVTEWAY` };
}

export default async function GuestListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('settings')
    .eq('slug', slug)
    .single();

  const gaCap = (project?.settings as Record<string, unknown>)?.guest_list_ga_cap as number ?? 10;
  const vipCap = (project?.settings as Record<string, unknown>)?.guest_list_vip_cap as number ?? 1;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${slug}/artist/advancing`} className="text-label text-cyan hover:text-cyan-bright transition-colors mb-2 block">&larr; Advancing</Link>
          <h1 className="text-display text-3xl text-text-primary">Guest List</h1>
          <p className="text-sm text-text-secondary mt-1">
            Submit your guest list. Caps: <strong className="text-cyan">{gaCap} GA</strong> + <strong className="text-cyan">{vipCap} VIP</strong>
          </p>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status */}
          <div className="card-elevated p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge border text-draft border-draft/30 bg-draft/10">Draft</span>
              <span className="text-xs text-text-tertiary">Deadline enforced at database level</span>
            </div>
            <button className="btn btn-primary text-xs py-2 px-6">Submit Guest List</button>
          </div>

          {/* VIP Guest */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">VIP Guest</h2>
              <span className="text-label text-text-disabled text-[0.5rem]">Max {vipCap}</span>
            </div>
            <div className="card p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label text-text-tertiary block mb-1">Full Name</label>
                  <input className="input w-full" placeholder="VIP guest full name" />
                </div>
                <div>
                  <label className="text-label text-text-tertiary block mb-1">Email</label>
                  <input className="input w-full" type="email" placeholder="email@example.com" />
                </div>
              </div>
              <p className="text-xs text-text-disabled mt-2">VIP guest must enter with you on arrival.</p>
            </div>
          </section>

          {/* GA Guests */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">GA Guests</h2>
              <span className="text-label text-text-disabled text-[0.5rem]">0 / {gaCap}</span>
            </div>

            <div className="space-y-2">
              {Array.from({ length: gaCap }, (_, i) => (
                <div key={i} className="card p-3 flex items-center gap-4">
                  <span className="text-mono text-xs text-text-disabled w-6">{i + 1}</span>
                  <input className="input flex-1" placeholder="Full name" />
                  <input className="input w-48" type="email" placeholder="Email (optional)" />
                </div>
              ))}
            </div>

            <p className="text-xs text-text-disabled mt-4">
              Guest list credentials will be provided at the Guestlist Entrance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
